from rest_framework import serializers
from .models import Project
from django.contrib.auth import get_user_model
from sgm.models import ProjectTeam  # Import ProjectTeam

User = get_user_model()


class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source="client.company_name")
    assigned_sgm_email = serializers.ReadOnlyField(source="assigned_sgm.email")

    external_lead = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="EXTERNAL"),
        required=False,
        allow_null=True
    )

    external_team = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="EXTERNAL"),
        many=True,
        required=False
    )

    external_lead_email = serializers.ReadOnlyField(source="external_lead.email")
    external_team_emails = serializers.SerializerMethodField()
    external_team_details = serializers.SerializerMethodField()
    team_members_details = serializers.SerializerMethodField()  # Add field
    created_by_email = serializers.ReadOnlyField(source="created_by.email")

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",

            "client",
            "client_name",

            "assigned_sgm",
            "assigned_sgm_email",

            "external_lead",
            "external_lead_email",

            "external_team",
            "external_team_emails",

            "status",
            "start_date",
            "end_date",

            "created_by",
            "created_by_email",
            "created_at",
            "updated_at",
            "external_team_details",
            "team_members_details",  # Add to fields
        ]

        read_only_fields = ("created_by", "created_at", "updated_at")

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
                "id": u.id,
                "username": u.username,
                "email": u.email
            }
            for u in obj.external_team.all()
        ]

    def get_external_team_emails(self, obj):
        return [u.email for u in obj.external_team.all()]
