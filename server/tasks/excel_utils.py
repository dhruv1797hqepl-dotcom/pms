"""
Excel file processing utility for bulk task imports.
Uses pandas and openpyxl for reading xlsx files with dynamic column mapping.
"""

import pandas as pd
from datetime import datetime
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from projects.models import Project
from clients.models import Client
from .models import Task

User = get_user_model()


class ExcelTaskImporter:
    """
    Handles reading Excel files and mapping columns to Task model fields.
    Supports flexible column ordering and extra columns.
    """

    FIELD_MAPPINGS = {
        'task': ['task', 'title', 'task_name', 'task_title', 'task name', 'task title'],
        'client': ['client', 'client_name', 'client_org', 'organization', 'client name', 'client org'],
        'project': ['project', 'project_name', 'project_title', 'project name', 'project title'],
        'assigned_to': ['assigned_to', 'assigned_to_email', 'assignee', 'assignee_email', 'email', 'assigned to', 'assigned to email'],
        'target_date': ['target_date', 'due_date', 'deadline', 'duedate', 'date', 'target date', 'due date'],
        'description': ['description', 'remarks', 'notes', 'comment'],
    }

    REQUIRED_FIELDS = ['task']  

    def __init__(self):
        self.errors = []
        self.warnings = []
        self.created_tasks = []

    @staticmethod
    def calculate_edit_distance(s1, s2):
        """
        Calculate Levenshtein distance between two strings.
        Returns the minimum number of single-character edits needed.
        """
        s1 = s1.lower()
        s2 = s2.lower()
        
        if len(s1) < len(s2):
            return ExcelTaskImporter.calculate_edit_distance(s2, s1)
        
        if len(s2) == 0:
            return len(s1)
        
        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        
        return previous_row[-1]

    def find_best_client_match(self, client_name):
        """
        Find the best matching client using fuzzy matching (Levenshtein distance).
        Returns (client_object, distance) if match found, else (None, float('inf'))
        Tolerance: max 1 character difference
        """
        if not client_name:
            return None, float('inf')
        
        best_match = None
        best_distance = float('inf')
        
        for client in Client.objects.all():
            distance = self.calculate_edit_distance(client_name, client.company_name)
            if distance < best_distance:
                best_distance = distance
                best_match = client
        
        # Only return match if within tolerance (1 char difference)
        if best_distance <= 1:
            return best_match, best_distance
        
        return None, best_distance

    def find_best_project_match(self, project_name):
        """
        Find the best matching project using fuzzy matching (Levenshtein distance).
        Returns (project_object, distance) if match found, else (None, float('inf'))
        Tolerance: max 1 character difference
        """
        if not project_name:
            return None, float('inf')
        
        best_match = None
        best_distance = float('inf')
        
        for project in Project.objects.all():
            distance = self.calculate_edit_distance(project_name, project.name)
            if distance < best_distance:
                best_distance = distance
                best_match = project
        
        # Only return match if within tolerance (1 char difference)
        if best_distance <= 1:
            return best_match, best_distance
        
        return None, best_distance

    @staticmethod
    def normalize_header(header):
        """
        Normalize Excel header: strip whitespace, convert to lowercase.
        """
        if not isinstance(header, str):
            return str(header).strip().lower()
        return header.strip().lower()

    def find_column_mapping(self, excel_headers):
        """
        Dynamically map Excel headers to Task model fields.
        Returns a dict: {field_name: excel_column_index}
        
        Returns:
            dict: Mapping of field names to column indices
            
        Throws:
            ValueError: If required 'task' column is missing
        """
        normalized_headers = [self.normalize_header(h) for h in excel_headers]
        column_mapping = {}

        # Find each field's column
        for field, aliases in self.FIELD_MAPPINGS.items():
            for col_idx, excel_header in enumerate(normalized_headers):
                if excel_header in aliases:
                    column_mapping[field] = col_idx
                    break

        # Validate required fields
        for required_field in self.REQUIRED_FIELDS:
            if required_field not in column_mapping:
                raise ValueError(
                    f"Required column '{required_field}' not found. "
                    f"Available columns: {', '.join(excel_headers)}"
                )

        return column_mapping

    @staticmethod
    def safe_to_datetime(date_value):
        """
        Safely convert date values to datetime.date object.
        Handles various formats: datetime objects, strings, pandas Timestamp, etc.
        
        Returns:
            datetime.date or None if conversion fails
        """
        if pd.isna(date_value) or date_value is None:
            return None

        try:
            # If it's already a datetime object
            if isinstance(date_value, datetime):
                return date_value.date()
            
            # If it's a pandas Timestamp
            if hasattr(date_value, 'date'):  # pd.Timestamp has .date() method
                return date_value.date()
            
            # If it's a string, try parsing
            if isinstance(date_value, str):
                # Try common date formats
                for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y', '%Y/%m/%d']:
                    try:
                        return datetime.strptime(date_value.strip(), fmt).date()
                    except ValueError:
                        continue
                # If no format matched, raise error
                raise ValueError(f"Could not parse date: {date_value}")
            
            return None
        except Exception as e:
            raise ValueError(f"Date conversion error for '{date_value}': {str(e)}")

    def read_excel(self, file_path):
        """
        Read Excel file and return DataFrame.
        
        Args:
            file_path: Path to .xlsx file
            
        Returns:
            pandas.DataFrame or raises error
        """
        try:
            df = pd.read_excel(file_path, sheet_name=0)
            if df.empty:
                raise ValueError("Excel file is empty")
            return df
        except Exception as e:
            raise ValueError(f"Failed to read Excel file: {str(e)}")

    def get_or_find_user(self, email_or_identifier):
        """
        Find user by multiple strategies with fallback.
        Tries (in order):
        1. Exact email match (case-insensitive)
        2. Exact username match
        3. Fuzzy match on email (max 1 char difference)
        4. Fuzzy match on username (max 1 char difference)
        5. Fuzzy match on first_name + last_name combination
        
        Args:
            email_or_identifier: Email, username, or name identifier
            
        Returns:
            User object or None if not found
        """
        if not email_or_identifier or pd.isna(email_or_identifier):
            return None

        identifier = str(email_or_identifier).strip()
        identifier_lower = identifier.lower()
        
        all_users = list(User.objects.all())
        
        # Debug: Show all available users on first lookup only (once per import)
        if not hasattr(self, '_users_logged'):
            print(f"DEBUG: Available users in system:")
            for u in all_users:
                print(f"  - {u.email} (username: {u.username}, name: {u.first_name} {u.last_name})")
            self._users_logged = True
        
        print(f"DEBUG: Looking up user: '{identifier}'")
        
        # Strategy 1: Exact email match (case-insensitive)
        for user in all_users:
            if user.email and user.email.lower() == identifier_lower:
                print(f"DEBUG: ✓ Found exact email match: {user.email}")
                return user
        
        # Strategy 2: Exact username match
        for user in all_users:
            if user.username and user.username.lower() == identifier_lower:
                print(f"DEBUG: ✓ Found exact username match: {user.username}")
                return user
        
        # Strategy 3: Fuzzy match on email
        best_user = None
        best_distance = float('inf')
        
        for user in all_users:
            if user.email:
                distance = self.calculate_edit_distance(identifier_lower, user.email.lower())
                if distance <= 1 and distance < best_distance:
                    best_distance = distance
                    best_user = user
                    print(f"DEBUG: Fuzzy email match: '{identifier}' ~> {user.email} (distance: {distance})")
        
        if best_user:
            return best_user
        
        # Strategy 4: Fuzzy match on username
        best_user = None
        best_distance = float('inf')
        
        for user in all_users:
            if user.username:
                distance = self.calculate_edit_distance(identifier_lower, user.username.lower())
                if distance <= 1 and distance < best_distance:
                    best_distance = distance
                    best_user = user
                    print(f"DEBUG: ✓ Fuzzy username match: '{identifier}' ~> {user.username} (distance: {distance})")
        
        if best_user:
            return best_user
        
        # Strategy 5: Fuzzy match on full name (first_name + last_name)
        best_user = None
        best_distance = float('inf')
        
        for user in all_users:
            fullname = f"{user.first_name} {user.last_name}".strip().lower()
            if fullname:
                distance = self.calculate_edit_distance(identifier_lower, fullname)
                if distance <= 1 and distance < best_distance:
                    best_distance = distance
                    best_user = user
                    print(f"DEBUG: ✓ Fuzzy fullname match: '{identifier}' ~> {fullname} (distance: {distance})")
        
        if best_user:
            return best_user
        
        print(f"DEBUG: ✗ No user match found for '{identifier}'")
        return None

    def get_or_find_project(self, project_name):
        """
        Find project by name. First tries exact match, then fuzzy matching.
        Handles None/empty values gracefully.
        """
        if not project_name or pd.isna(project_name):
            return None

        project_name = str(project_name).strip()
        
        # Try exact match first
        try:
            return Project.objects.get(name__iexact=project_name)
        except Project.DoesNotExist:
            pass
        
        # Try fuzzy matching
        best_match, distance = self.find_best_project_match(project_name)
        if best_match:
            print(f"DEBUG: Fuzzy matched project '{project_name}' to '{best_match.name}' (distance: {distance})")
            return best_match
        
        # No match found
        raise ValueError(f"Project '{project_name}' not found (no similar matches)")

    def get_or_find_client(self, client_name):
        """
        Find client by company_name. First tries exact match, then fuzzy matching.
        Handles None/empty values gracefully.
        """
        if not client_name or pd.isna(client_name):
            return None

        client_name = str(client_name).strip()
        
        # Try exact match first
        try:
            return Client.objects.get(company_name__iexact=client_name)
        except Client.DoesNotExist:
            pass
        
        # Try fuzzy matching
        best_match, distance = self.find_best_client_match(client_name)
        if best_match:
            print(f"DEBUG: Fuzzy matched client '{client_name}' to '{best_match.company_name}' (distance: {distance})")
            return best_match
        
        # No match found
        raise ValueError(f"Client '{client_name}' not found (no similar matches)")

    def process_row(self, row, column_mapping, row_number, assigned_by):
        """
        Process a single row from Excel and create Task object (not saved yet).
        
        Args:
            row: pandas Series (Excel row)
            column_mapping: dict mapping field names to column indices
            row_number: Excel row number (for error reporting)
            assigned_by: User who created this task
            
        Returns:
            Task object (not saved) or raises error
        """
        try:
            print(f"DEBUG Row {row_number}: Starting to process")
            print(f"DEBUG Row {row_number}: column_mapping = {column_mapping}")
            print(f"DEBUG Row {row_number}: row data = {row.to_dict()}")
            
            # Extract and validate task title (required)
            task_title_col = column_mapping.get('task')
            if task_title_col is None:
                raise ValueError("Task title column not found")
            
            task_title = str(row.iloc[task_title_col]).strip()
            print(f"DEBUG Row {row_number}: task_title = {task_title}")
            if not task_title or pd.isna(task_title):
                raise ValueError("Task title is empty")

            # Extract optional fields
            client_name = None
            client_obj = None
            project_obj = None
            project_name = None
            assigned_to_user = None
            target_date = None
            description = ""
            
            print(f"DEBUG Row {row_number}: Extracting optional fields...")

            # Client (optional)
            if 'client' in column_mapping:
                try:
                    client_val = row.iloc[column_mapping['client']]
                    print(f"DEBUG Row {row_number}: client value = {client_val}")
                    client_obj = self.get_or_find_client(client_val)
                    if client_obj:
                        client_name = client_obj.company_name
                        print(f"DEBUG Row {row_number}: Found client = {client_name}")
                except Exception as e:
                    print(f"DEBUG Row {row_number}: Client error - {str(e)}")
                    self.warnings.append(f"Row {row_number}: Client error - {str(e)}")

            # Project (optional)
            if 'project' in column_mapping:
                try:
                    project_val = row.iloc[column_mapping['project']]
                    print(f"DEBUG Row {row_number}: project value = {project_val}")
                    project_obj = self.get_or_find_project(project_val)
                    if project_obj:
                        project_name = project_obj.name
                        print(f"DEBUG Row {row_number}: Found project = {project_name}")
                except Exception as e:
                    print(f"DEBUG Row {row_number}: Project error - {str(e)}")
                    self.warnings.append(f"Row {row_number}: Project error - {str(e)}")

            # Assigned To (optional, defaults to assigned_by)
            if 'assigned_to' in column_mapping:
                assignee_val = row.iloc[column_mapping['assigned_to']]
                is_empty = pd.isna(assignee_val) or (isinstance(assignee_val, str) and assignee_val.strip() == '')
                is_nan = pd.isna(assignee_val)
                
                print(f"\nDEBUG Row {row_number}: ===== ASSIGNED TO PROCESSING =====")
                print(f"  Raw value: {repr(assignee_val)}")
                print(f"  Is NaN: {is_nan}")
                print(f"  Is empty string: {isinstance(assignee_val, str) and assignee_val.strip() == ''}")
                print(f"  Is empty (overall): {is_empty}")
                
                if not is_empty:
                    assignee_str = str(assignee_val).strip()
                    print(f"  Processed value: '{assignee_str}'")
                    print(f"  Looking up user...")
                    assigned_to_user = self.get_or_find_user(assignee_str)
                    if assigned_to_user:
                        print(f"  ✓ SUCCESS: Found user = {assigned_to_user.email} (ID: {assigned_to_user.id})")
                    else:
                        # Email was provided but user not found - this is an ERROR
                        print(f"  ✗ ERROR: User not found for '{assignee_str}'")
                        raise ValueError(f"User with email '{assignee_str}' not found in system")
                else:
                    print(f"  Column exists but is empty/NaN - will use default (assigned_by)")
            else:
                print(f"\nDEBUG Row {row_number}: ===== ASSIGNED TO PROCESSING =====")
                print(f"  'assigned_to' column NOT found in mapping")
            
            if not assigned_to_user:
                print(f"  Using default: current user (assigned_by) = {assigned_by.email} (ID: {assigned_by.id})")
                assigned_to_user = assigned_by
            
            # Final verification
            print(f"\nDEBUG Row {row_number}: FINAL ASSIGNMENT")
            print(f"  Task assigned TO:   {assigned_to_user.email} (ID: {assigned_to_user.id})")
            print(f"  Task assigned BY:   {assigned_by.email} (ID: {assigned_by.id})")
            print(f"  Same person: {assigned_to_user.id == assigned_by.id}")
            print(f"========================================\n")

            # Target Date (optional, defaults to today)
            if 'target_date' in column_mapping:
                try:
                    date_val = row.iloc[column_mapping['target_date']]
                    target_date = self.safe_to_datetime(date_val)
                except Exception as e:
                    self.warnings.append(f"Row {row_number}: Date error - {str(e)}")
            
            if not target_date:
                target_date = datetime.now().date()

            # Description (optional)
            if 'description' in column_mapping:
                desc_val = row.iloc[column_mapping['description']]
                if not pd.isna(desc_val):
                    description = str(desc_val).strip()

            # Create Task object (not saved yet)
            task = Task(
                title=task_title,
                description=description,
                project=project_obj,
                client_org=client_obj if 'client' in column_mapping else None,
                assigned_to=assigned_to_user,
                assigned_by=assigned_by,
                target_date=target_date,
                status='In Progress',
                is_repeatable=False,
                source_module='EXCEL_IMPORT'
            )

            return task

        except Exception as e:
            raise ValueError(f"Row {row_number} error: {str(e)}")

    def import_tasks(self, file_path, assigned_by, column_mapping=None):
        """
        Main import function: Read Excel file and create tasks.
        
        Args:
            file_path: Path to .xlsx file
            assigned_by: Django User object who is creating the tasks
            column_mapping: Optional manual mapping from frontend 
                           Format: {column_index: field_name} or {field_name: column_index}
            
        Returns:
            dict with:
                - 'success': bool
                - 'tasks_created': int
                - 'errors': list
                - 'warnings': list
        """
        self.errors = []
        self.warnings = []
        self.created_tasks = []

        try:
            # Read Excel file
            df = self.read_excel(file_path)

            # Find column mapping
            if column_mapping:
                # Use provided mapping from frontend
                print(f"DEBUG: Using provided column mapping: {column_mapping}")
                
                # Convert mapping format if needed
                # Frontend sends: { 0: 'task', 1: 'assigned_to', 2: 'target_date' }
                # We need: { 'task': 0, 'assigned_to': 1, 'target_date': 2 }
                provided_mapping = column_mapping
                field_to_idx = {}
                
                for key, value in provided_mapping.items():
                    # Check if key is string (already field_name) or int (column_index)
                    try:
                        col_idx = int(key)
                        # key is column index, value is field name
                        if value:  # Skip if value is empty/None/Skip
                            field_to_idx[value] = col_idx
                    except (ValueError, TypeError):
                        # key is field name, value is column index
                        if value is not None:
                            field_to_idx[key] = value
                
                # Validate required field 'task'
                if 'task' not in field_to_idx:
                    return {
                        'success': False,
                        'tasks_created': 0,
                        'errors': ["Required 'Task' column not mapped"],
                        'warnings': []
                    }
                
                column_mapping = field_to_idx
            else:
                # Auto-detect column mapping
                try:
                    column_mapping = self.find_column_mapping(df.columns.tolist())
                except ValueError as e:
                    return {
                        'success': False,
                        'tasks_created': 0,
                        'errors': [str(e)],
                        'warnings': []
                    }

            # Process each row
            for idx, (row_idx, row) in enumerate(df.iterrows(), start=2):  # Start at row 2 (skip header)
                try:
                    task = self.process_row(row, column_mapping, row_idx, assigned_by)
                    task.save()  # Save the task
                    self.created_tasks.append(task)
                    print(f"✓ Row {idx}: Task created successfully - {task.title}")
                except Exception as e:
                    error_msg = f"Row {idx}: {str(e)}"
                    self.errors.append(error_msg)
                    print(f"✗ {error_msg}")

            # Determine success: true if at least some tasks were created
            # (even if some rows had errors - it's a partial import)
            success = len(self.created_tasks) > 0

            return {
                'success': success,
                'tasks_created': len(self.created_tasks),
                'errors': self.errors,
                'warnings': self.warnings,
                'task_ids': [t.task_id for t in self.created_tasks]
            }

        except Exception as e:
            return {
                'success': False,
                'tasks_created': 0,
                'errors': [f"Import failed: {str(e)}"],
                'warnings': self.warnings
            }
