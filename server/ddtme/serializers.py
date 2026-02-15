from rest_framework import serializers
from .models import BigTask, DDTMESubmission, DDTMEAdditionalTask, ManDayEntry, DDTMEMonthlyObjective

class BigTaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = BigTask
        fields = ['id', 'project', 'project_name', 'title', 'start_date', 'target_date', 'status', 'type', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        # Resolve values for Create vs Update
        instance = self.instance
        
        # Get new values or fallback to existing
        project = data.get('project')
        start_date = data.get('start_date')
        target_date = data.get('target_date')

        if instance:
            # If update, fallback to instance values if not provided
            project = project or instance.project
            start_date = start_date if 'start_date' in data else instance.start_date
            target_date = target_date if 'target_date' in data else instance.target_date

        # If we still don't have a project (unlikely for valid BigTask), skip
        if not project:
            return data

        try:
            if project.start_date and start_date and start_date < project.start_date:
                raise serializers.ValidationError({
                    "start_date": f"Task cannot start before the project start date ({project.start_date})"
                })
            
            if project.end_date and target_date and target_date > project.end_date:
                raise serializers.ValidationError({
                    "target_date": f"Task cannot end after the project end date ({project.end_date})"
                })
                
            if start_date and target_date and start_date > target_date:
                raise serializers.ValidationError({"non_field_errors": ["Start date cannot be after target date."]})

        except TypeError as e:
            # Catch defensive coding errors (e.g. date vs None comparison) and return 400
            raise serializers.ValidationError({"non_field_errors": [f"Date validation error: {str(e)}"]})

        return data


class DDTMESubmissionSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    submitted_by_name = serializers.CharField(source='submitted_by.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)

    class Meta:
        model = DDTMESubmission
        fields = ['id', 'client', 'client_name', 'month', 'year', 'status', 'remarks', 'submitted_by', 'submitted_by_name', 'approved_by', 'approved_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class DDTMEAdditionalTaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = DDTMEAdditionalTask
        fields = ['id', 'client', 'project', 'project_name', 'month', 'year', 'title', 'target_date', 'created_at']
        read_only_fields = ['id', 'created_at']


class DDTMEMonthlyObjectiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = DDTMEMonthlyObjective
        fields = ['id', 'client', 'month', 'year', 'objective', 'is_completed', 'created_at']
        read_only_fields = ['id', 'created_at']


class ManDayEntrySerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    big_task_title = serializers.CharField(source='big_task.title', read_only=True)
    additional_task_title = serializers.CharField(source='additional_task.title', read_only=True)

    class Meta:
        model = ManDayEntry
        fields = ['id', 'employee', 'employee_name', 'month', 'year', 'big_task', 'big_task_title', 'additional_task', 'additional_task_title', 'plan_hours', 'off_hours']
        read_only_fields = ['id']

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"

