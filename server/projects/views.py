from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.exceptions import ValidationError

from .models import Project
from .serializers import ProjectSerializer
from django.contrib.auth import get_user_model
User = get_user_model()


# -----------------------------
# Project ViewSet
# -----------------------------

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # 1. Admin & HQEPL → All projects
        if user.role in ['ADMIN', 'HQEPL']:
            return Project.objects.all().distinct()

        # 2. SGM → Projects they lead
        if user.role == 'SGM':
            return Project.objects.filter(
                internal_lead=user
            ).distinct()

        # 3. Employee → Projects assigned to them
        if user.role == 'EMPLOYEE':
            return Project.objects.filter(
                team_members=user
            ).distinct()

        # 4. External → Projects where they are involved
        if user.role == 'EXTERNAL':
            return Project.objects.filter(
                Q(external_lead=user) | Q(team_members=user)
            ).distinct()

        # 5. Client → Projects of their organization
        if user.role == 'CLIENT' and hasattr(user, 'client_profile'):
            return Project.objects.filter(
                client_org=user.client_profile
            ).distinct()

        return Project.objects.none()

    def perform_create(self, serializer):
        user = self.request.user

    # Admin / HQEPL → must provide client_org
        if user.role in ['ADMIN', 'HQEPL']:
            if not serializer.validated_data.get('client_org'):
                raise ValidationError({
                    "client_org": "client_org is required for Admin/HQEPL"
                })
            serializer.save()
            return

    # Client → auto assign own organization
        if user.role == 'CLIENT' and hasattr(user, 'client_profile'):
            serializer.save(client_org=user.client_profile)
            return

        raise PermissionDenied("You do not have permission to create projects.")


    def perform_update(self, serializer):
        user = self.request.user
        project = self.get_object()

        # Admin / HQEPL → Full control
        if user.role in ['ADMIN', 'HQEPL']:
            serializer.save()
            return

        # SGM → Only own projects
        if user.role == 'SGM':
            if project.internal_lead != user:
                raise PermissionDenied(
                    "You can only update projects assigned to you."
                )
            serializer.save()
            return

        # Client → Only own organization projects
        if user.role == 'CLIENT':
            if not hasattr(user, 'client_profile') or project.client_org != user.client_profile:
                raise PermissionDenied(
                    "You cannot modify projects outside your organization."
                )
            serializer.save()
            return

        # ❌ Employee & External cannot update project
        raise PermissionDenied("You do not have permission to update this project.")



# -----------------------------
# SubTask ViewSet
# -----------------------------
# class SubTaskViewSet(viewsets.ModelViewSet):
#     serializer_class = SubTaskSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def get_queryset(self):
#         user = self.request.user

#         # Admin/HQEPL → All subtasks
#         if user.role in ['ADMIN', 'HQEPL']:
#             return SubTask.objects.all()

#         # SGM → Subtasks under their projects
#         if user.role == 'SGM':
#             return SubTask.objects.filter(project__internal_lead=user)

#         # Employee → Subtasks assigned to them
#         if user.role == 'EMPLOYEE':
#             return SubTask.objects.filter(assigned_to=user)

#         # Client → Subtasks under their projects
#         if user.role == 'CLIENT' and hasattr(user, 'client_profile'):
#             return SubTask.objects.filter(project__client_org=user.client_profile)

#         return SubTask.objects.none()

#     def perform_create(self, serializer):
#         user = self.request.user
#         project = serializer.validated_data.get('project')

#         # Only SGM, Admin, HQEPL can create subtasks
#         if user.role not in ['ADMIN', 'HQEPL', 'SGM']:
#             raise PermissionDenied("You don't have permission to create tasks.")

#         # SGM can only create subtasks for projects they lead
#         if user.role == 'SGM' and project.internal_lead != user:
#             raise PermissionDenied("You can only create tasks for projects you lead.")

#         serializer.save()

#     def perform_update(self, serializer):
#         user = self.request.user
#         subtask = self.get_object()
#         project = subtask.project

#         # Employee cannot update subtasks directly
#         if user.role == 'EMPLOYEE':
#             raise PermissionDenied("You cannot modify subtasks directly.")

#         # SGM can update subtasks only for their projects
#         if user.role == 'SGM' and project.internal_lead != user:
#             raise PermissionDenied("You can only update subtasks for projects you lead.")

#         serializer.save()
