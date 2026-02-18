from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import models
from django.db.models import Q, Avg
from django.utils import timezone
from django.contrib.auth import get_user_model
import tempfile
import os
from .models import Task
from .serializers import TaskSerializer
from .excel_utils import ExcelTaskImporter

User = get_user_model()

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Handles the 3 tables: Returns tasks where user is the receiver or assigner.
        """
        user = self.request.user
        assigned_to = self.request.query_params.get('assigned_to')

        if assigned_to and user.role in [User.SGM]:
            try:
                assigned_to_id = int(assigned_to)
            except (TypeError, ValueError):
                assigned_to_id = None

            if assigned_to_id:
                return Task.objects.filter(assigned_to_id=assigned_to_id).order_by('-id')

        return Task.objects.filter(Q(assigned_to=user) | Q(assigned_by=user)).order_by('-id')

    def perform_create(self, serializer):
        """
        Automatically sets the assigner (Employee, SGM, or Admin).
        """
        serializer.save(assigned_by=self.request.user)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        Calculates OTC and ATS based on your handwritten formulas.
        """
        user = request.user
        my_tasks = Task.objects.filter(assigned_to=user)
        
        total = my_tasks.count()
        # total_completed = my_tasks.filter(status='Completed').count()
        in_progress = my_tasks.filter(status='In Progress').count()
        on_time_completed = my_tasks.filter(status='Completed', completion_date__lte=models.F('target_date')).count()
        delayed_completed = my_tasks.filter(status='Delayed').count()
        overdue = my_tasks.filter(status='Overdue').count()
        
        # OTC Logic from your notes: On-Time Completed / (Total - In-Progress)
        denominator = total - in_progress
        otc_val = 0
        if denominator > 0:
            otc_val = round((on_time_completed / denominator) * 100, 1)

        # ATS Logic: Average of all relevant tasks (Completed + Overdue)
        # In Progress marked as None (skipped by Avg), Overdue marked as 0 (included in Avg)
        # Safe filter: status inside ['Completed', 'Overdue'] or ats_score not None
        relevant_for_ats = my_tasks.filter(status__in=['Completed', 'Delayed', 'Overdue'])
        ats_avg = relevant_for_ats.aggregate(Avg('ats_score'))['ats_score__avg']
        if ats_avg is None: ats_avg = 0

        return Response({
            "total_tasks": total,
            "on_time_count": on_time_completed,
            "otc_score": f"{otc_val}%",
            "ats_score": f"{round(ats_avg, 1)}%",
            "chart_data": [
                {"name": "On Time", "value": on_time_completed, "color": "#22c55e"},
                {"name": "In Progress", "value": in_progress, "color": "#3b82f6"},
                {"name": "Delayed", "value": delayed_completed, "color": "#facc15"},
                {"name": "Overdue", "value": overdue, "color": "#ef4444"},
            ]
        })

    @action(detail=False, methods=['post'], parser_classes=(MultiPartParser, FormParser))
    def import_tasks_from_excel(self, request):
        """
        Handle bulk task creation from Excel (.xlsx) file upload.
        
        Expected request format:
        - POST /api/tasks/import_tasks_from_excel/
        - Body (multipart/form-data): 'file' key with .xlsx file
        
        Response:
        {
            "success": true/false,
            "tasks_created": int,
            "task_ids": [int, ...],
            "errors": [{"row": int, "message": str}, ...],
            "warnings": [{"row": int, "message": str}, ...]
        }
        """
        try:
            # Debug: Log files and request details
            print(f"DEBUG: request.FILES keys: {list(request.FILES.keys())}")
            print(f"DEBUG: request.POST keys: {list(request.POST.keys())}")
            
            # Get the uploaded file
            uploaded_file = request.FILES.get('file')
            if not uploaded_file:
                print(f"DEBUG: No file found in request.FILES")
                return Response(
                    {"success": False, "error": "No file provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"DEBUG: File received: {uploaded_file.name}, Size: {uploaded_file.size}")
            
            # Validate file extension
            if not uploaded_file.name.endswith('.xlsx'):
                return Response(
                    {"success": False, "error": "Only .xlsx files are supported"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Save to temporary file
            temp_file_path = None
            try:
                # Create temp directory if needed
                import tempfile
                temp_dir = tempfile.gettempdir()
                temp_file_path = os.path.join(temp_dir, uploaded_file.name)
                
                print(f"DEBUG: Saving file to temp: {temp_file_path}")
                
                # Write uploaded file to temp location
                with open(temp_file_path, 'wb+') as temp_file:
                    for chunk in uploaded_file.chunks():
                        temp_file.write(chunk)
                
                print(f"DEBUG: File saved successfully")
                
                # Process Excel file
                importer = ExcelTaskImporter()
                result = importer.import_tasks(
                    temp_file_path,
                    assigned_by=request.user
                )
                
                print(f"DEBUG: Import result: {result}")
                
                # Return result with appropriate status
                response_status = status.HTTP_201_CREATED if result['success'] else status.HTTP_400_BAD_REQUEST
                return Response(result, status=response_status)
                
            finally:
                # Clean up temp file
                if temp_file_path and os.path.exists(temp_file_path):
                    try:
                        os.remove(temp_file_path)
                    except Exception as e:
                        print(f"Warning: Could not delete temp file {temp_file_path}: {str(e)}")
        
        except Exception as e:
            print(f"DEBUG: Exception in import_tasks_from_excel: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {
                    "success": False,
                    "error": f"Server error processing Excel file: {str(e)}"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )