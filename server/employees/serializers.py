from rest_framework import serializers
from projects.models import Project

class EmployeeProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.company_name", read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "status",
            "client",
            "client_name",
            "start_date",
            "end_date",
        ]
