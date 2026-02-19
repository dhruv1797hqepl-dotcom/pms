from rest_framework import viewsets, permissions
from django.db import models
from .models import BigTask
from .serializers import BigTaskSerializer

class BigTaskViewSet(viewsets.ModelViewSet):
    serializer_class = BigTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = BigTask.objects.all()
        project_id = self.request.query_params.get('project_id')
        client_id = self.request.query_params.get('client_id')

        if project_id and project_id != 'undefined':
            try:
                # Ensure project_id is an integer to avoid 500 error
                project_id_int = int(project_id)
                queryset = queryset.filter(project_id=project_id_int)
            except ValueError:
                # If project_id is not a valid integer, return empty or ignore
                return BigTask.objects.none()
        
        if client_id and client_id != 'undefined':
            try:
                client_id_int = int(client_id)
                queryset = queryset.filter(project__client__id=client_id_int)
            except ValueError:
                return BigTask.objects.none()

        # Monthly Filtering
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')

        if month and year:
            try:
                import calendar
                from datetime import date
                m = int(month)
                y = int(year)
                # Last day of the month
                _, last_day = calendar.monthrange(y, m)
                month_start = date(y, m, 1)
                month_end = date(y, m, last_day)

                # DEBUG LOG
                try:
                    with open('debug_view.log', 'a') as f:
                        f.write(f"\n--- Request: m={m}, y={y} ---\n")
                        f.write(f"Filter: Start <= {month_end} AND Target >= {month_start}\n")
                        count_before = queryset.count()
                        f.write(f"Total Tasks Before Filter: {count_before}\n")
                        
                        # Check each task manually for debug
                        for t in queryset:
                            start_cond = t.start_date <= month_end
                            target_cond = t.target_date >= month_start
                            f.write(f"Task {t.id} '{t.title}': {t.start_date} to {t.target_date}. Overlaps? {start_cond and target_cond}\n")

                except Exception as e:
                    pass

                # Filter: Task overlaps with the month
                # Logic: Task Start <= Month End AND Task End >= Month Start
                # Note: target_date is used as end date
                queryset = queryset.filter(
                    start_date__lte=month_end,
                    target_date__gte=month_start
                )
            except (ValueError, TypeError):
                pass # Ignore invalid month/year
        
        # DEBUG LOGGING FOR BIG TASKS
        import logging
        logging.basicConfig(filename='debug_bigtasks.log', level=logging.INFO)
        logging.info(f"User: {self.request.user} | ClientID: {client_id} | Month: {month} | Year: {year} | Count: {queryset.count()}")

        return queryset

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(f"Error creating BigTask: {e}")
            from rest_framework.response import Response
            from rest_framework import status
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


from .models import DDTMESubmission, DDTMEAdditionalTask, ManDayEntry, DDTMEMonthlyObjective
from .serializers import DDTMESubmissionSerializer, DDTMEAdditionalTaskSerializer, ManDayEntrySerializer, DDTMEMonthlyObjectiveSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

class DDTMESubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = DDTMESubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = DDTMESubmission.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        client_id = self.request.query_params.get('client_id')
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')

        if client_id:
            queryset = queryset.filter(client_id=client_id)
        if month:
            queryset = queryset.filter(month=month)
        if year:
            queryset = queryset.filter(year=year)
        
        # DEBUG LOGGING FOR SUBMISSIONS
        import logging
        logging.basicConfig(filename='debug_submissions.log', level=logging.INFO)
        logging.info(f"SubReq: User={self.request.user} | Role={getattr(self.request.user, 'role', 'N/A')} | CID={client_id} | M={month} | Y={year} | Count={queryset.count()}")
        if queryset.exists():
            logging.info(f"Sub Found: {queryset.first()}")

        return queryset

    @action(detail=False, methods=['post'])
    def submit(self, request):
        client_id = request.data.get('client_id')
        month = request.data.get('month')
        year = request.data.get('year')
        
        if not (client_id and month and year):
            return Response({"error": "Missing client_id, month, or year"}, status=status.HTTP_400_BAD_REQUEST)

        submission, created = DDTMESubmission.objects.get_or_create(
            client_id=client_id, month=month, year=year
        )
        
        submission.status = 'Submitted'
        submission.submitted_by = request.user
        submission.save()
        
        return Response(self.get_serializer(submission).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        submission = self.get_object()
        # Ensure user can approve (SGM or Admin) - assuming permission check is handled elsewhere or minimally here
        # user_role = request.user.role # Simplified check
        
        submission.status = 'Approved'
        submission.approved_by = request.user
        submission.save()
        return Response(self.get_serializer(submission).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        submission = self.get_object()
        remarks = request.data.get('remarks', '')
        
        submission.status = 'Rejected'
        submission.remarks = remarks
        submission.save()
        return Response(self.get_serializer(submission).data)


class DDTMEMonthlyObjectiveViewSet(viewsets.ModelViewSet):
    serializer_class = DDTMEMonthlyObjectiveSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = DDTMEMonthlyObjective.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        client_id = self.request.query_params.get('client_id')
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')

        if client_id:
            queryset = queryset.filter(client_id=client_id)
        if month:
            queryset = queryset.filter(month=month)
        if year:
            queryset = queryset.filter(year=year)
            
        return queryset.order_by('created_at')


class DDTMEAdditionalTaskViewSet(viewsets.ModelViewSet):
    serializer_class = DDTMEAdditionalTaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = DDTMEAdditionalTask.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        client_id = self.request.query_params.get('client_id')
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')

        if client_id:
            queryset = queryset.filter(client_id=client_id)
        if month:
            queryset = queryset.filter(month=month)
        if year:
            queryset = queryset.filter(year=year)
        return queryset


class ManDayEntryViewSet(viewsets.ModelViewSet):
    serializer_class = ManDayEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = ManDayEntry.objects.all()
    pagination_class = None

    def list(self, request, *args, **kwargs):
        print("\n=== ManDayEntry LIST called ===")
        print(f"Pagination class: {self.pagination_class}")
        response = super().list(request, *args, **kwargs)
        print(f"Response type: {type(response.data)}")
        print(f"Response data (first 5): {response.data[:5] if isinstance(response.data, list) else response.data}")
        print("=== End LIST ===\n")
        return response

    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by client/month/year via relations if needed, but basic params support is good
        client_id = self.request.query_params.get('client_id')
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        employee_id = self.request.query_params.get('employee_id')

        print(f"\n=== ManDayEntry Query Debug ===")
        print(f"User: {self.request.user} | Role: {getattr(self.request.user, 'role', 'N/A')}")
        print(f"Client ID: {client_id} | Month: {month} | Year: {year} | Employee ID: {employee_id}")
        print(f"Initial queryset count: {queryset.count()}")

        if client_id:
            queryset = queryset.filter(
                models.Q(big_task__project__client__id=client_id) |
                models.Q(additional_task__client_id=client_id)
            )
            print(f"After client filter, count: {queryset.count()}")
        
        if month: 
            queryset = queryset.filter(month=month)
            print(f"After month filter, count: {queryset.count()}")
            
        if year: 
            queryset = queryset.filter(year=year)
            print(f"After year filter, count: {queryset.count()}")
            
        if employee_id: 
            queryset = queryset.filter(employee_id=employee_id)
            print(f"After employee filter, count: {queryset.count()}")
        
        print(f"Final queryset count: {queryset.count()}")
        print(f"Sample entries: {list(queryset[:3].values())}")
        print("=== End Debug ===\n")
        
        return queryset

    @action(detail=False, methods=['post'])
    def bulk_update_hours(self, request):
        entries = request.data.get('entries', [])
        # Entry format: { task_id, task_type ('big' or 'additional'), employee_id, month, year, plan_hours, off_hours }
        
        results = []
        errors = []
        for entry in entries:
            try:
                emp_id = entry.get('employee_id')
                month = entry.get('month')
                year = entry.get('year')
                plan = entry.get('plan_hours', 0)
                off = entry.get('off_hours', 0)
                
                task_type = entry.get('task_type') # 'big' or 'additional'
                task_id = entry.get('task_id')
                
                kwargs = {
                    'employee_id': emp_id,
                    'month': month,
                    'year': year
                }
                
                if task_type == 'big':
                    kwargs['big_task_id'] = task_id
                    kwargs['additional_task'] = None
                else:
                    kwargs['additional_task_id'] = task_id
                    kwargs['big_task'] = None
                
                obj, created = ManDayEntry.objects.update_or_create(
                    defaults={'plan_hours': plan, 'off_hours': off},
                    **kwargs
                )
                results.append(obj.id)
            except Exception as e:
                errors.append({
                    "entry": entry,
                    "error": str(e)
                })
                print(f"Error saving entry: {e} | entry={entry}")
                
        if errors:
            return Response({"updated": len(results), "ids": results, "failed": errors}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"updated": len(results), "ids": results, "failed": []})

