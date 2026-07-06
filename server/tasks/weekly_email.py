"""
weekly_email.py
───────────────
Generates the weekly performance score PDF and sends it via email.
Also supports custom date range PDF generation for downloading.

PDF Layout:
  - Page 1: Employee Performance Scores
  - Page 2: Client Performance Scores
"""

import io
import math
from datetime import date, timedelta

from django.conf import settings
from django.core.mail import EmailMessage
from django.contrib.auth import get_user_model

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, HRFlowable, PageBreak,
)

from .models import Task
from clients.models import Client
from projects.models import Project

User = get_user_model()


# ─────────────────────────────────────────────────────────────────────────────
# Score computation
# ─────────────────────────────────────────────────────────────────────────────

def _truncate1(value):
    return math.trunc(value * 10) / 10


def compute_scores_for_tasks(tasks):
    total = len(tasks)
    if total == 0:
        return ('-', '-')

    def get_status(t):
        return t.status if hasattr(t, 'status') else t.get('status', '')

    def get_ats_score(t):
        val = t.ats_score if hasattr(t, 'ats_score') else t.get('ats_score', 0)
        try:
            return float(val or 0)
        except (TypeError, ValueError):
            return 0.0

    in_progress = sum(1 for t in tasks if get_status(t) == 'In Progress')
    denominator = total - in_progress
    if denominator == 0:
        return ('-', '-')

    on_time     = sum(1 for t in tasks if get_status(t) in ('On Time', 'Completed'))
    delayed_sum = sum(get_ats_score(t) for t in tasks if get_status(t) == 'Delayed')

    ats_val = round(((on_time * 100 + delayed_sum) / denominator) * 10) / 10
    otc_val = _truncate1((on_time / denominator) * 100)

    return (f'{ats_val:.1f}%', f'{otc_val:.1f}%')


def _get_week_bounds(ref_date=None):
    if ref_date is None:
        ref_date = date.today()
    monday_this_week = ref_date - timedelta(days=ref_date.weekday())
    monday = monday_this_week - timedelta(weeks=1)
    saturday = monday + timedelta(days=5) # Monday to Saturday
    return monday, saturday


def get_weeks_in_month(year, month):
    import calendar
    weeks = []
    first_day = date(year, month, 1)
    start = first_day
    if start.weekday() == 6: # Sunday
        start = date(year, month, 2)

    last_day_num = calendar.monthrange(year, month)[1]
    last_day = date(year, month, last_day_num)

    week_count = 1
    cursor = start
    while cursor <= last_day:
        end = cursor
        if week_count == 1:
            days_to_sunday = 6 - cursor.weekday()
            if days_to_sunday < 0:
                days_to_sunday = 0
            end = cursor + timedelta(days=days_to_sunday)
        else:
            end = cursor + timedelta(days=6)

        if end > last_day:
            end = last_day

        display_end = end
        if display_end.weekday() == 6: # Sunday
            display_end = display_end - timedelta(days=1) # Saturday

        weeks.append({
            'label': f"W{week_count} ({cursor.strftime('%d')}-{display_end.strftime('%d/%m')})",
            'start_date': cursor,
            'end_date': display_end,
            'header_label': 'ATS'
        })

        cursor = end + timedelta(days=1)
        week_count += 1
    return weeks


def compute_overall_from_period_scores(period_scores):
    def get_average(key):
        values = []
        for item in period_scores:
            val_str = str(item.get(key) or '').replace('%', '').strip()
            try:
                values.append(float(val_str))
            except ValueError:
                pass
        if not values:
            return '-'
        return f'{sum(values) / len(values):.1f}%'

    return {
        'ats': get_average('ats'),
        'otc': get_average('otc')
    }


def _score_color(val_str):
    try:
        v = float(val_str.replace('%', ''))
        if v >= 80: return colors.HexColor('#16a34a')
        if v >= 60: return colors.HexColor('#d97706')
        return colors.HexColor('#dc2626')
    except Exception:
        return colors.grey


# ─────────────────────────────────────────────────────────────────────────────
# PDF Builder
# ─────────────────────────────────────────────────────────────────────────────

def build_weekly_score_pdf(start_date: date, end_date: date, title_prefix: str = "Week Wise") -> bytes:
    """
    Builds the landscape PDF report.
    - Page 1: Single Employee Performance table (excluding MLS/ADMIN/SENIOR/EXTERNAL).
    - Page 2: Client Performance Scores.
    - Page 3: Project Performance Scores.
    """
    today = date.today()

    is_all_over = (end_date - start_date).days > 366

    if is_all_over:
        display_periods = []
    else:
        # Standard monthly weeks report
        display_periods = get_weeks_in_month(end_date.year, end_date.month)

    # Fetch all tasks
    if is_all_over:
        tasks_qs = Task.objects.all()
    else:
        # Filter tasks matching the month bounds
        month_start = date(end_date.year, end_date.month, 1)
        import calendar
        last_day = calendar.monthrange(end_date.year, end_date.month)[1]
        month_end = date(end_date.year, end_date.month, last_day)
        tasks_qs = Task.objects.filter(
            target_date__gte=month_start,
            target_date__lte=month_end,
        )

    # Maps
    emp_tasks = {}
    client_tasks = {}
    project_tasks = {}

    for task in tasks_qs:
        if task.assigned_to_id:
            emp_tasks.setdefault(task.assigned_to_id, []).append(task)
        if task.client_org_id:
            client_tasks.setdefault(task.client_org_id, []).append(task)
        if task.project_id:
            project_tasks.setdefault(task.project_id, []).append(task)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=1.0*cm, rightMargin=1.0*cm,
        topMargin=1.0*cm, bottomMargin=1.0*cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle', parent=styles['Title'],
        fontSize=18, spaceAfter=4, textColor=colors.HexColor('#1e3a5f'),
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle', parent=styles['Normal'],
        fontSize=10, textColor=colors.grey, spaceAfter=10,
    )
    page_header_style = ParagraphStyle(
        'PageHeader', parent=styles['Heading1'],
        fontSize=16, spaceBefore=6, spaceAfter=8,
        textColor=colors.HexColor('#0f172a'),
    )

    elements = []
    date_label = "All Over" if is_all_over else f"{end_date.strftime('%B %Y')}"

    # ─────────────────────────────────────────────────────────────────────────
    # Helper to calculate periods + overall scores for a given task list
    # ─────────────────────────────────────────────────────────────────────────
    def get_row_scores(tasks):
        period_data = []
        for period in display_periods:
            if period['start_date'] > today:
                # Future week
                period_data.append({'ats': '-', 'otc': '-'})
            else:
                # Filter tasks in range
                pts = [
                    t for t in tasks
                    if t.target_date and period['start_date'] <= t.target_date <= period['end_date']
                ]
                ats, otc = compute_scores_for_tasks(pts)
                period_data.append({'ats': ats, 'otc': otc})

        if is_all_over:
            overall = compute_scores_for_tasks(tasks)
            overall_dict = {'ats': overall[0], 'otc': overall[1]}
        else:
            valid_scores = [pd for pd in period_data if pd['ats'] != '-' or pd['otc'] != '-']
            overall_dict = compute_overall_from_period_scores(valid_scores)

        return period_data, overall_dict

    # ─────────────────────────────────────────────────────────────────────────
    # Table layout and style builder
    # ─────────────────────────────────────────────────────────────────────────
    N = len(display_periods)
    
    # Dynamic column widths calculation for A4 portrait page
    # A4 width is 595.27. Margins are 1.0*cm each, printable width is 538.59
    printable_width = 538.59
    sr_no_width = 15
    score_col_width = 30
    total_score_cols_width = 2 * (N + 1) * score_col_width
    name_col_width = max(80, printable_width - sr_no_width - total_score_cols_width)
    
    col_widths = [sr_no_width, name_col_width]
    for _ in range(N + 1):
        col_widths.extend([score_col_width, score_col_width])

    # Paragraph style for name cells to wrap onto a second line
    cell_name_style = ParagraphStyle(
        'CellNameStyle', parent=styles['Normal'],
        fontSize=7.5, leading=9, textColor=colors.HexColor('#0f172a'),
    )

    def generate_pdf_table(header_name, data_rows, theme_color_hex):
        # 1. Build headers
        row1 = ['#', header_name]
        row2 = ['', '']
        for period in display_periods:
            row1.extend([period['label'], ''])
            row2.extend(['ATS', 'OTC'])
        
        row1.extend(['Overall Avg.', ''])
        row2.extend(['ATS', 'OTC'])

        table_data = [row1, row2]

        # 2. Append row values
        import html
        for idx, item in enumerate(data_rows, 1):
            name_p = Paragraph(html.escape(str(item['name'] or '')), cell_name_style)
            row = [str(idx), name_p]
            for p_score in item['period_data']:
                row.extend([p_score['ats'], p_score['otc']])
            row.extend([item['overall']['ats'], item['overall']['otc']])
            table_data.append(row)

        # 3. Apply styles and spans
        theme_color = colors.HexColor(theme_color_hex)
        tbl_style = TableStyle([
            ('BACKGROUND',     (0, 0), (-1, 1), theme_color),
            ('TEXTCOLOR',      (0, 0), (-1, 1), colors.white),
            ('FONTNAME',       (0, 0), (-1, 1), 'Helvetica-Bold'),
            ('FONTSIZE',       (0, 0), (-1, 1), 7.5),
            ('ALIGN',          (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN',         (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID',           (0, 0), (-1, -1), 0.5, colors.HexColor('#94a3b8')),
            ('ROWBACKGROUNDS', (0, 2), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('FONTSIZE',       (0, 2), (-1, -1), 7.5),
            ('LEFTPADDING',    (1, 0), (1, -1), 6),
            ('ALIGN',          (1, 0), (1, -1), 'LEFT'),
            ('SPAN',           (0, 0), (0, 1)), # Sr No
            ('SPAN',           (1, 0), (1, 1)), # Name
            ('LEFTPADDING',    (2, 0), (-1, -1), 2),
            ('RIGHTPADDING',   (2, 0), (-1, -1), 2),
            ('TOPPADDING',     (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING',  (0, 0), (-1, -1), 4),
        ])

        # Merge week headers horizontally
        for i in range(N):
            c = 2 + i * 2
            tbl_style.add('SPAN', (c, 0), (c + 1, 0))
            # Highlight weekly OTC column body cells with a slightly darker background
            tbl_style.add('BACKGROUND', (c + 1, 2), (c + 1, -1), colors.HexColor('#e2e8f0'))
        
        # Merge Overall Avg header horizontally
        c_overall = 2 + N * 2
        tbl_style.add('SPAN', (c_overall, 0), (c_overall + 1, 0))
        # Highlight overall average OTC column body cells with a slightly darker background
        tbl_style.add('BACKGROUND', (c_overall + 1, 2), (c_overall + 1, -1), colors.HexColor('#e2e8f0'))

        # Color ATS/OTC score values
        for r_idx in range(2, len(table_data)):
            # Periods
            for i in range(N):
                c = 2 + i * 2
                ats_val, otc_val = table_data[r_idx][c], table_data[r_idx][c+1]
                if ats_val != '-':
                    tbl_style.add('TEXTCOLOR', (c, r_idx), (c, r_idx), _score_color(ats_val))
                    tbl_style.add('FONTNAME',  (c, r_idx), (c, r_idx), 'Helvetica-Bold')
                if otc_val != '-':
                    tbl_style.add('TEXTCOLOR', (c+1, r_idx), (c+1, r_idx), _score_color(otc_val))
                    tbl_style.add('FONTNAME',  (c+1, r_idx), (c+1, r_idx), 'Helvetica-Bold')
            # Overall Avg
            ats_val, otc_val = table_data[r_idx][c_overall], table_data[r_idx][c_overall+1]
            if ats_val != '-':
                tbl_style.add('TEXTCOLOR', (c_overall, r_idx), (c_overall, r_idx), _score_color(ats_val))
                tbl_style.add('FONTNAME',  (c_overall, r_idx), (c_overall, r_idx), 'Helvetica-Bold')
            if otc_val != '-':
                tbl_style.add('TEXTCOLOR', (c_overall+1, r_idx), (c_overall+1, r_idx), _score_color(otc_val))
                tbl_style.add('FONTNAME',  (c_overall+1, r_idx), (c_overall+1, r_idx), 'Helvetica-Bold')

        tbl = Table(table_data, colWidths=col_widths, repeatRows=2)
        tbl.setStyle(tbl_style)
        return tbl

    # ─────────────────────────────────────────────────────────────────────────
    # PAGE 1: Single Employee Table (excl. MLS, ADMIN, SENIOR, EXTERNAL)
    # ─────────────────────────────────────────────────────────────────────────
    elements.append(Paragraph(f'HQEPL PMS — {title_prefix} Performance Report', title_style))
    elements.append(Paragraph(f'Period: {date_label}', subtitle_style))
    elements.append(HRFlowable(width='100%', thickness=1.5, color=colors.HexColor('#1e3a5f')))
    elements.append(Spacer(1, 0.4*cm))
    elements.append(Paragraph('1. Employee Performance Scores', page_header_style))

    # Fetch and custom-sort users
    def get_user_sort_key(user):
        first_name_lower = (user.first_name or '').lower().strip()
        email_lower = (user.email or '').lower().strip()
        username_lower = (user.username or '').lower().strip()
        
        custom_order = [
            'sameep',
            'harshil',
            'ronit',
            'supratim',
            'akash',
            'pratmesh',
            'jaimin',
            'meet',
            'bhim',
            'mittal',
            'priyank',
            'shyam'
        ]
        
        # Check patterns for the custom order
        for index, pattern in enumerate(custom_order):
            if pattern == 'sameep' and ('sameep' in first_name_lower or 'sameep' in email_lower or 'sameep' in username_lower):
                return (index, first_name_lower, (user.last_name or '').lower(), username_lower)
            if pattern == 'harshil' and ('harshil' in first_name_lower or 'harshil' in email_lower):
                return (index, first_name_lower, (user.last_name or '').lower(), username_lower)
            if pattern == 'ronit' and ('ronit' in first_name_lower or 'rnoti' in first_name_lower or 'ronit' in email_lower or 'rnoti' in email_lower):
                return (index, first_name_lower, (user.last_name or '').lower(), username_lower)
            if pattern == 'supratim' and ('supratim' in first_name_lower or 'supratim' in email_lower or 'supratim' in username_lower):
                return (index, first_name_lower, (user.last_name or '').lower(), username_lower)
            if pattern == 'akash' and ('akash' in first_name_lower or 'akash' in email_lower):
                return (index, first_name_lower, (user.last_name or '').lower(), username_lower)
            if pattern == 'pratmesh' and ('pratmesh' in first_name_lower or 'prathmesh' in first_name_lower or 'pratmesh' in email_lower or 'prathmesh' in email_lower):
                return (index, first_name_lower, (user.last_name or '').lower(), username_lower)
            if pattern == 'jaimin' and ('jaimin' in first_name_lower or 'jamin' in first_name_lower or 'jaimin' in email_lower or 'jamin' in email_lower):
                return (index, first_name_lower, (user.last_name or '').lower(), username_lower)
            if pattern == 'meet' and ('meet' in first_name_lower or 'meetsir' in first_name_lower or 'meet' in email_lower or 'meetsir' in email_lower):
                return (index, first_name_lower, (user.last_name or '').lower(), username_lower)
            if pattern == 'bhim' and ('bhim' in first_name_lower or 'bhim' in email_lower):
                return (index, first_name_lower, (user.last_name or '').lower(), username_lower)
            if pattern == 'mittal' and ('mittal' in first_name_lower or 'mital' in first_name_lower or 'mittal' in email_lower or 'mital' in email_lower):
                return (index, first_name_lower, (user.last_name or '').lower(), username_lower)
            if pattern == 'priyank' and ('priyank' in first_name_lower or 'priyak' in first_name_lower or 'priyank' in email_lower or 'priyak' in email_lower):
                return (index, first_name_lower, (user.last_name or '').lower(), username_lower)
            if pattern == 'shyam' and ('shyam' in first_name_lower or 'shyam' in email_lower or 'shyam' in username_lower):
                return (index, first_name_lower, (user.last_name or '').lower(), username_lower)
                
        return (len(custom_order), first_name_lower, (user.last_name or '').lower(), username_lower)

    eligible_users = list(User.objects.filter(is_active=True, role__in=['SGM', 'EMPLOYEE', 'HQEPL']))
    eligible_users.sort(key=get_user_sort_key)

    employee_rows = []
    for user in eligible_users:
        tasks = emp_tasks.get(user.id, [])
        name = f'{user.first_name or ""} {user.last_name or ""}'.strip() or user.username
        p_scores, overall = get_row_scores(tasks)
        employee_rows.append({
            'name': name,
            'period_data': p_scores,
            'overall': overall
        })

    if employee_rows:
        tbl = generate_pdf_table("Name", employee_rows, '#1e3a5f')
        elements.append(tbl)
    else:
        elements.append(Paragraph("No employee records found.", subtitle_style))

    # ─────────────────────────────────────────────────────────────────────────
    # PAGE 2: Clients
    # ─────────────────────────────────────────────────────────────────────────
    elements.append(PageBreak())
    elements.append(Paragraph(f'HQEPL PMS — {title_prefix} Performance Report', title_style))
    elements.append(Paragraph(f'Period: {date_label}', subtitle_style))
    elements.append(HRFlowable(width='100%', thickness=1.5, color=colors.HexColor('#0284c7')))
    elements.append(Spacer(1, 0.4*cm))
    elements.append(Paragraph('2. Client Performance Scores', page_header_style))

    clients_qs = list(Client.objects.all())
    
    def get_client_sort_key(c):
        name_lower = (c.company_name or '').lower()
        
        custom_sequence = [
            'sainest',
            'nakoda',
            'freeze drying',
            'indo',
            'jacaco',
            'ratna',
            'shree india',
            'driplex',
            'airro',
            'operations',
            'lean',
            'gj01',
            'jajoo',
            'holistic',
            'digital marketing',
            'digital tools',
            'iot',
            'sales & marketing'
        ]
        
        for index, pattern in enumerate(custom_sequence):
            if pattern in name_lower:
                return (index, name_lower)
                
        return (len(custom_sequence), name_lower)

    clients_qs.sort(key=get_client_sort_key)
    client_rows = []
    for client in clients_qs:
        tasks = client_tasks.get(client.id, [])
        p_scores, overall = get_row_scores(tasks)
        client_rows.append({
            'name': client.company_name,
            'period_data': p_scores,
            'overall': overall
        })

    if client_rows:
        tbl = generate_pdf_table("Client Name", client_rows, '#0284c7')
        elements.append(tbl)
    else:
        elements.append(Paragraph("No client records found.", subtitle_style))

    doc.build(elements)
    return buf.getvalue()


# ─────────────────────────────────────────────────────────────────────────────
# Email sender
# ─────────────────────────────────────────────────────────────────────────────

def send_weekly_score_email(week_start: date = None, week_end: date = None, recipients: list = None):
    if week_start is None or week_end is None:
        week_start, week_end = _get_week_bounds()

    if recipients is None:
        recipients = getattr(settings, 'WEEKLY_SCORE_EMAIL_RECIPIENTS', [])

    if not recipients:
        return {'success': False, 'message': 'No recipients configured.', 'week': str(week_start)}

    try:
        # Standard reports default to "Monthly" layout format mapping
        pdf_bytes = build_weekly_score_pdf(week_start, week_end, "Week Wise")
    except Exception as exc:
        import traceback
        traceback.print_exc()
        return {'success': False, 'message': f'PDF generation failed: {exc}', 'week': str(week_start)}

    week_label    = f"{week_start.strftime('%d/%m/%Y')} – {week_end.strftime('%d/%m/%Y')}"
    start_str     = week_start.strftime('%d-%b-%Y')
    end_str       = week_end.strftime('%d-%b-%Y')
    filename      = f"HQEPL_Weekly_Report.pdf"
    subject       = f'Week Wise Performance Analytics Report — HQEPL PMS'
    body_html = f"""
    <html>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f7f6;">
        <div style="max-width: 600px; margin: 30px auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: #1e3a5f; padding: 25px; text-align: center; border-bottom: 4px solid #0284c7;">
            <h2 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.5px;">Weekly Performance Analytics</h2>
          </div>
          
          <!-- Content -->
          <div style="padding: 35px 30px;">
            <p style="font-size: 16px; margin-top: 0; color: #1e293b; font-weight: 500;">Respected Sir,</p>
            <p style="font-size: 15px; color: #475569; margin-bottom: 25px;">
              Please find attached the <strong style="color: #0284c7;">Weekly Performance Score Report</strong> for the recent period.
            </p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #0f172a; font-weight: 600;">Report Contents:</h3>
              <ul style="margin: 0; padding-left: 22px; color: #334155; font-size: 14px;">
                <li style="margin-bottom: 8px;"><span style="color: #475569;">Employee Performance Scores</span></li>
                <li><span style="color: #475569;">Client Performance Scores</span></li>
              </ul>
            </div>
            
            <p style="font-size: 15px; color: #475569; margin-top: 25px;">
              Kindly review the attached PDF for detailed insights and performance analytics.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #334155;">Project Management System</p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #64748b; font-weight: 500;">HQEPL</p>
          </div>
        </div>
      </body>
    </html>
    """

    try:
        email = EmailMessage(
            subject=subject,
            body=body_html,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=recipients,
        )
        email.content_subtype = "html"
        email.attach(filename, pdf_bytes, 'application/pdf')
        email.send(fail_silently=False)
        return {'success': True, 'message': f'Email sent to {", ".join(recipients)}', 'week': week_label}
    except Exception as exc:
        import traceback
        traceback.print_exc()
        return {'success': False, 'message': f'Email sending failed: {exc}', 'week': week_label}
