from rest_framework import serializers

from .models import MCTCEntry, MCTCEntryHistory


class MCTCEntrySerializer(serializers.ModelSerializer):
    linked_task_status = serializers.ReadOnlyField(source='linked_task.status')
    linked_task_priority = serializers.ReadOnlyField(source='linked_task.priority')
    linked_task_completion_date = serializers.ReadOnlyField(source='linked_task.completion_date')

    class Meta:
        model = MCTCEntry
        fields = [
            'id',
            'entry_date',
            'label',
            'entry_type',
            'linked_task',
            'linked_task_status',
            'linked_task_priority',
            'linked_task_completion_date',
            'half_type',
            'original_date',
            'revision_count',
            'last_revision_date',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'original_date',
            'revision_count',
            'last_revision_date',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        entry_date = attrs.get('entry_date') or getattr(self.instance, 'entry_date', None)
        if entry_date and entry_date.weekday() == 6:
            raise serializers.ValidationError({
                'entry_date': 'No task can be created for Sunday.'
            })

        linked_task = attrs.get('linked_task')
        request = self.context.get('request')

        if linked_task and request and request.user:
            user_id = request.user.id
            if linked_task.assigned_to_id != user_id and linked_task.assigned_by_id != user_id:
                raise serializers.ValidationError({
                    'linked_task': 'You can only link tasks assigned to you or created by you.'
                })

        return attrs


class MCTCEntryMoveSerializer(serializers.Serializer):
    """Validates drag-drop move requests."""

    new_date = serializers.DateField()
    new_half = serializers.ChoiceField(choices=MCTCEntry.HALF_CHOICES)

    def validate_new_date(self, value):
        if value.weekday() == 6:
            raise serializers.ValidationError('Cannot move to a Sunday.')
        return value


class MCTCEntryHistorySerializer(serializers.ModelSerializer):
    moved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = MCTCEntryHistory
        fields = [
            'id',
            'old_date',
            'new_date',
            'old_half',
            'new_half',
            'moved_by',
            'moved_by_name',
            'moved_at',
        ]
        read_only_fields = fields

    def get_moved_by_name(self, obj):
        if obj.moved_by:
            return obj.moved_by.get_full_name() or obj.moved_by.username
        return None
