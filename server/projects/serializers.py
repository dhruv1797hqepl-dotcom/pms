from rest_framework import serializers
from .models import Project
from clients.models import ExternalTeam
from django.contrib.auth import get_user_model
User = get_user_model()

# -----------------------------
# SubTask Serializer
# -----------------------------
# class SubTaskSerializer(serializers.ModelSerializer):
#     assigned_to_email = serializers.ReadOnlyField(source='assigned_to.email')  # display email instead of username

#     class Meta:
#         model = SubTask
#         fields = [
#             'id', 'title', 'description', 'status', 'assigned_to', 'assigned_to_email',
#             'duration', 'deadline', 'created_at', 'updated_at'
#         ]


# -----------------------------
# Project Serializer
# -----------------------------
class ProjectSerializer(serializers.ModelSerializer):
    client_org_name = serializers.ReadOnlyField(source='client_org.company_name')
    internal_lead_email = serializers.ReadOnlyField(source='internal_lead.email')
    external_lead_email = serializers.ReadOnlyField(source='external_lead.email')

    # Nested subtasks
    # subtasks = SubTaskSerializer(many=True, read_only=True)

    # Detailed team member info for frontend
    team_member_details = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id',
            'name', 
            'description',
            'client_org', 
            'client_org_name',
            'internal_lead', 
            'internal_lead_email',
            'external_lead', 
            'external_lead_email',
            'team_members', 
            'team_member_details',
            'status', 
            'overall_progress',
            'start_date', 
            'end_date',
            'created_at', 
            'updated_at'
        ]
        extra_kwargs = {
            'team_members': {'required': False},
            'client_org': {'required': False},
            'internal_lead': {'required': False},
            'external_lead': {'required': False},
        }
    # 🔐 ROLE VALIDATIONS (UPDATED)
    def validate_internal_lead(self, value):
        if value is None:
            return value  # allow blank
        if value.role != 'SGM':
            raise serializers.ValidationError("Internal lead must have SGM role.")
        return value
    
    def validate_external_lead(self, value):
        if value is None:
            return value  # allow blank
        if value.role != 'EXTERNAL':
            raise serializers.ValidationError(
                "External lead must belong to external team."
            )
        return value

    def validate(self, data):
        client = data.get('client_org')
        external = data.get('external_lead')

        if external:
            try:
                external_team = ExternalTeam.objects.get(user=external)
            except ExternalTeam.DoesNotExist:
                raise serializers.ValidationError(
                    "External lead is not part of any client organization."
                )

            if client and external_team.client_org != client:
                raise serializers.ValidationError(
                    "External lead must belong to the same client."
                )

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None

        # Auto-assign client_org if user is client
        if 'client_org' not in validated_data and user and user.role == 'CLIENT' and hasattr(user, 'client_profile'):
            validated_data['client_org'] = user.client_profile

        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        user = request.user if request else None

        # Clients cannot change client_org
        if user and user.role == 'CLIENT':
            validated_data.pop('client_org', None)

        return super().update(instance, validated_data)

    def get_team_member_details(self, obj):
        """Provide detailed team info for frontend avatars/roster"""
        return [
            {
                "id": u.id,
                "email": u.email,
                "role": getattr(u, 'role', 'EMPLOYEE'),
                "initial": u.email[0].upper() if u.email else "?"
            }
            for u in obj.team_members.all()
        ]
