"""
DDTME Excel upload utility.
Reads an .xlsx file, applies a user-supplied column mapping,
fuzzy-matches Client/Project names, and creates DDTMEAdditionalTask entries.
"""

import pandas as pd
from datetime import datetime
from django.utils import timezone

from clients.models import Client
from projects.models import Project
from .models import DDTMEAdditionalTask


class DDTMEExcelImporter:
    """
    Handles reading an uploaded DDTME Excel file and creating
    DDTMEAdditionalTask rows from it.
    """

    # ------------------------------------------------------------------ #
    #  Utility helpers                                                     #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _normalize(value):
        """Collapse whitespace and casefold for comparison."""
        return ' '.join(str(value or '').strip().split()).casefold()

    @staticmethod
    def _edit_distance(s1, s2):
        s1, s2 = s1.lower(), s2.lower()
        if len(s1) < len(s2):
            return DDTMEExcelImporter._edit_distance(s2, s1)
        if len(s2) == 0:
            return len(s1)
        previous = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current = [i + 1]
            for j, c2 in enumerate(s2):
                current.append(min(
                    previous[j + 1] + 1,   # insert
                    current[j] + 1,         # delete
                    previous[j] + (c1 != c2)  # replace
                ))
            previous = current
        return previous[-1]

    # ------------------------------------------------------------------ #
    #  Step 1: Read headers from uploaded file                             #
    # ------------------------------------------------------------------ #

    @classmethod
    def read_headers(cls, file_obj):
        """
        Read the first sheet of an uploaded Excel file and return
        the list of header column names (strings).
        """
        try:
            df = pd.read_excel(file_obj, sheet_name=0, nrows=0)
            headers = [str(h).strip() for h in df.columns.tolist()]
            return headers
        except Exception as e:
            raise ValueError(f"Failed to read Excel file: {e}")

    # ------------------------------------------------------------------ #
    #  Step 2: Preview rows (optional – for frontend table preview)        #
    # ------------------------------------------------------------------ #

    @classmethod
    def read_preview_rows(cls, file_obj, max_rows=5):
        """Return up to *max_rows* rows as list-of-dicts for a preview."""
        try:
            df = pd.read_excel(file_obj, sheet_name=0, nrows=max_rows)
            df = df.fillna('')
            return df.astype(str).to_dict(orient='records')
        except Exception as e:
            raise ValueError(f"Failed to read Excel preview: {e}")

    # ------------------------------------------------------------------ #
    #  Fuzzy matching                                                      #
    # ------------------------------------------------------------------ #

    @classmethod
    def _find_client(cls, raw_name):
        """Resolve a raw client name to a Client object (or None)."""
        if not raw_name or pd.isna(raw_name):
            return None, None

        name = str(raw_name).strip()
        norm = cls._normalize(name)
        if not norm:
            return None, None

        # Exact (case-insensitive)
        exact = list(Client.objects.filter(company_name__iexact=name))
        if len(exact) == 1:
            return exact[0], None
        if len(exact) > 1:
            return exact[0], None  # pick first

        # Normalized exact
        for client in Client.objects.all():
            if cls._normalize(client.company_name) == norm:
                return client, None

        # Fuzzy (tolerance = 1)
        best, best_d = None, float('inf')
        for client in Client.objects.all():
            d = cls._edit_distance(norm, cls._normalize(client.company_name))
            if d < best_d:
                best, best_d = client, d
        if best and best_d <= 1:
            return best, f"Fuzzy-matched client '{name}' → '{best.company_name}'"
        return None, f"Client '{name}' not found"

    @classmethod
    def _find_project(cls, raw_name, client_obj=None):
        """Resolve a raw project name to a Project object (or None)."""
        if not raw_name or pd.isna(raw_name):
            return None, None

        name = str(raw_name).strip()
        norm = cls._normalize(name)
        if not norm:
            return None, None

        qs = Project.objects.all()
        if client_obj:
            qs = qs.filter(client=client_obj)

        # Exact
        exact = list(qs.filter(name__iexact=name))
        if len(exact) == 1:
            return exact[0], None
        if len(exact) > 1:
            return exact[0], None

        # Normalized exact
        for project in qs:
            if cls._normalize(project.name) == norm:
                return project, None

        # Fuzzy (tolerance = 1)
        best, best_d = None, float('inf')
        for project in qs:
            d = cls._edit_distance(norm, cls._normalize(project.name))
            if d < best_d:
                best, best_d = project, d
        if best and best_d <= 1:
            return best, f"Fuzzy-matched project '{name}' → '{best.name}'"
        return None, f"Project '{name}' not found" + (f" under client '{client_obj.company_name}'" if client_obj else '')

    @staticmethod
    def _safe_date(raw_value):
        """Convert a raw cell value to datetime.date or None."""
        if raw_value is None or (isinstance(raw_value, float) and pd.isna(raw_value)):
            return None
        if isinstance(raw_value, str):
            raw_value = raw_value.strip()
            if not raw_value:
                return None
        if hasattr(raw_value, 'date'):
            return raw_value.date() if callable(getattr(raw_value, 'date')) else raw_value.date
        if isinstance(raw_value, datetime):
            return raw_value.date()
        if isinstance(raw_value, str):
            for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y'):
                try:
                    return datetime.strptime(raw_value, fmt).date()
                except ValueError:
                    continue
        return None

    # ------------------------------------------------------------------ #
    #  Step 3: Import rows using the mapping                               #
    # ------------------------------------------------------------------ #

    @classmethod
    def import_rows(cls, file_obj, column_mapping, client_id, month, year):
        """
        Import rows from Excel into DDTMEAdditionalTask.

        Args:
            file_obj:        Uploaded file (InMemoryUploadedFile / TemporaryUploadedFile)
            column_mapping:  dict mapping DDTME field → Excel column name, e.g.
                             { "deliverable": "Task Name", "project": "Project", "client": "Org", "target_date": "Due" }
            client_id:       The current DDTME client context (int)
            month:           int 1-12
            year:            int

        Returns:
            dict with keys: created, skipped, errors, warnings
        """
        try:
            df = pd.read_excel(file_obj, sheet_name=0)
        except Exception as e:
            raise ValueError(f"Failed to read Excel file: {e}")

        if df.empty:
            return {'created': 0, 'skipped': 0, 'errors': ['Excel file has no data rows'], 'warnings': []}

        # Resolve the context client (the page-level client)
        context_client = None
        if client_id:
            try:
                context_client = Client.objects.get(id=int(client_id))
            except Client.DoesNotExist:
                pass

        # Column name → index lookup
        excel_cols = [str(c).strip() for c in df.columns.tolist()]
        col_idx = {name: idx for idx, name in enumerate(excel_cols)}

        # Resolve which excel column to use for each DDTME field
        deliverable_col = column_mapping.get('deliverable')
        project_col = column_mapping.get('project')
        client_col = column_mapping.get('client')
        target_date_col = column_mapping.get('target_date')

        created = 0
        skipped = 0
        errors = []
        warnings = []

        for row_num, row in df.iterrows():
            excel_row = row_num + 2  # 1-indexed, +1 for header
            try:
                # ----- Deliverable (required) -----
                title = ''
                if deliverable_col and deliverable_col in col_idx:
                    raw = row.iloc[col_idx[deliverable_col]]
                    if not pd.isna(raw):
                        title = str(raw).strip()
                if not title:
                    skipped += 1
                    continue  # skip rows with empty deliverable

                # ----- Client -----
                resolved_client = context_client  # default to page client
                if client_col and client_col in col_idx:
                    raw_client = row.iloc[col_idx[client_col]]
                    if not pd.isna(raw_client) and str(raw_client).strip():
                        matched_client, client_note = cls._find_client(raw_client)
                        if matched_client:
                            resolved_client = matched_client
                            if client_note:
                                warnings.append(f"Row {excel_row}: {client_note}")
                        else:
                            # Fall back to context client but warn
                            if client_note:
                                warnings.append(f"Row {excel_row}: {client_note}. Using page client instead.")

                if not resolved_client:
                    errors.append(f"Row {excel_row}: No client could be resolved for '{title}'")
                    skipped += 1
                    continue

                # ----- Project -----
                resolved_project = None
                if project_col and project_col in col_idx:
                    raw_project = row.iloc[col_idx[project_col]]
                    if not pd.isna(raw_project) and str(raw_project).strip():
                        matched_project, project_note = cls._find_project(raw_project, client_obj=resolved_client)
                        if matched_project:
                            resolved_project = matched_project
                            if project_note:
                                warnings.append(f"Row {excel_row}: {project_note}")
                        else:
                            if project_note:
                                warnings.append(f"Row {excel_row}: {project_note}")

                # ----- Target Date -----
                resolved_date = None
                if target_date_col and target_date_col in col_idx:
                    raw_date = row.iloc[col_idx[target_date_col]]
                    resolved_date = cls._safe_date(raw_date)

                # ----- Create AdditionalTask -----
                DDTMEAdditionalTask.objects.create(
                    client=resolved_client,
                    project=resolved_project,
                    month=int(month),
                    year=int(year),
                    title=title[:500],
                    target_date=resolved_date,
                )
                created += 1

            except Exception as e:
                errors.append(f"Row {excel_row}: {str(e)}")
                skipped += 1

        return {
            'created': created,
            'skipped': skipped,
            'errors': errors,
            'warnings': warnings,
        }
