from django.conf import settings
from django.db import models
from tasks.models import Task


class MCTCEntry(models.Model):
    TYPE_NORMAL = 'normal'
    TYPE_TASK = 'task'

    TYPE_CHOICES = [
        (TYPE_NORMAL, 'Normal'),
        (TYPE_TASK, 'Task'),
    ]

    HALF_FIRST = 'first_half'
    HALF_SECOND = 'second_half'

    HALF_CHOICES = [
        (HALF_FIRST, 'First Half'),
        (HALF_SECOND, 'Second Half'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mctc_entries'
    )
    entry_date = models.DateField(db_index=True)
    label = models.CharField(max_length=255)
    entry_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default=TYPE_NORMAL)
    linked_task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='linked_mctc_entries'
    )

    # Half-day support
    half_type = models.CharField(
        max_length=15,
        choices=HALF_CHOICES,
        default=HALF_FIRST,
    )

    # Revision tracking
    original_date = models.DateField(null=True, blank=True)
    revision_count = models.IntegerField(default=0)
    last_revision_date = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['entry_date', 'id']
        indexes = [
            models.Index(fields=['user', 'entry_date']),
        ]

    def save(self, *args, **kwargs):
        # Set original_date on first creation only
        if not self.pk and not self.original_date:
            self.original_date = self.entry_date
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user_id} | {self.entry_date} | {self.half_type} | {self.label}"


class MCTCEntryHistory(models.Model):
    """Audit trail for drag-drop moves of MCTC entries."""

    entry = models.ForeignKey(
        MCTCEntry,
        on_delete=models.CASCADE,
        related_name='move_history',
    )
    old_date = models.DateField()
    new_date = models.DateField()
    old_half = models.CharField(max_length=15)
    new_half = models.CharField(max_length=15)
    moved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    moved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['moved_at']

    def __str__(self):
        return f"Entry {self.entry_id}: {self.old_date}({self.old_half}) → {self.new_date}({self.new_half})"
