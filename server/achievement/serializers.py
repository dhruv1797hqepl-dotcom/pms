from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Achievement

User = get_user_model()


class AchievementSerializer(serializers.ModelSerializer):
    employeeId = serializers.PrimaryKeyRelatedField(
        source="employee",
        queryset=User.objects.filter(role=User.EMPLOYEE),
    )
    employeeName = serializers.SerializerMethodField()
    employeeEmail = serializers.EmailField(source="employee.email", read_only=True)
    assignedByRole = serializers.CharField(source="assigned_by.role", read_only=True)
    assignedBy = serializers.SerializerMethodField()
    tokenShared = serializers.BooleanField(source="token_shared", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Achievement
        fields = [
            "id",
            "employeeId",
            "employeeName",
            "employeeEmail",
            "title",
            "description",
            "assignedByRole",
            "assignedBy",
            "tokenShared",
            "createdAt",
        ]
        read_only_fields = [
            "id",
            "employeeName",
            "employeeEmail",
            "assignedByRole",
            "assignedBy",
            "tokenShared",
            "createdAt",
        ]

    def validate_employee(self, value):
        if value.role != User.EMPLOYEE:
            raise serializers.ValidationError(
                "Achievement can only be assigned to users with EMPLOYEE role."
            )
        return value

    def get_employeeName(self, obj):
        full_name = f"{obj.employee.first_name} {obj.employee.last_name}".strip()
        return full_name or obj.employee.username or obj.employee.email

    def get_assignedBy(self, obj):
        full_name = f"{obj.assigned_by.first_name} {obj.assigned_by.last_name}".strip()
        return full_name or obj.assigned_by.email or obj.assigned_by.username


class AchievementTokenUpdateSerializer(serializers.ModelSerializer):
    tokenShared = serializers.BooleanField(source="token_shared")

    class Meta:
        model = Achievement
        fields = ["tokenShared"]
