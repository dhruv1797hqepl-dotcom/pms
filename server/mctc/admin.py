from django.contrib import admin

from .models import MCTCEntry, MCTCEntryHistory


@admin.register(MCTCEntry)
class MCTCEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'entry_date', 'half_type', 'entry_type', 'label', 'revision_count', 'original_date', 'created_at')
    list_filter = ('entry_type', 'half_type', 'entry_date')
    search_fields = ('label', 'user__email', 'user__username')


@admin.register(MCTCEntryHistory)
class MCTCEntryHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'entry', 'old_date', 'new_date', 'old_half', 'new_half', 'moved_by', 'moved_at')
    list_filter = ('moved_at',)
    search_fields = ('entry__label',)
    raw_id_fields = ('entry', 'moved_by')
