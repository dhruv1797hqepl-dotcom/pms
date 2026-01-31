from rest_framework import serializers
from .models import ProjectTeam
from projects.models import Project
from clients.models import Client
from django.contrib.auth import get_user_model

User = get_user_model()

# -----------------------------
# Client Serializer (for /clients/)
# -----------------------------
class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            "id",
            "company_name",
            "contact_email",
            "phone",
            "website",
            "address"
        ]


# -----------------------------
# Project Serializer (includes client)
# -----------------------------
# -----------------------------
# Project Serializer (includes client)
# -----------------------------
class ProjectSerializer(serializers.ModelSerializer):
    client = ClientSerializer()  # nested client info
    team_members_details = serializers.SerializerMethodField()
    external_team_details = serializers.SerializerMethodField()
    overall_progress = serializers.IntegerField(default=0)


    assigned_sgm_email = serializers.ReadOnlyField(source="assigned_sgm.email")
    external_lead_email = serializers.ReadOnlyField(source="external_lead.email")

    class Meta:
        model = Project
        fields = [
            "id", "name", "description", "status", 
            "start_date", "end_date", "overall_progress",
            "client", "assigned_sgm", "assigned_sgm_email", 
            "external_lead_email", "team_members_details", "external_team_details",
            "external_team",
        ]

    def get_team_members_details(self, obj):
        # Fetch internal employees assigned via ProjectTeam
        team_members = ProjectTeam.objects.filter(project=obj)
        return [
            {
                "id": tm.employee.id,
                "username": tm.employee.username,
                "email": tm.employee.email
            }
            for tm in team_members
        ]

    def get_external_team_details(self, obj):
        return [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
            for user in obj.external_team.all()
        ]


# -----------------------------
# Employee Serializer
# -----------------------------
class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


# -----------------------------
# Assign Internal Team Serializer
# -----------------------------
class ProjectTeamAssignSerializer(serializers.Serializer):
    employees = serializers.ListField(
        child=serializers.IntegerField()
    )
