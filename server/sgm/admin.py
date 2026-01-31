from django.contrib import admin
from .models import ProjectTeam

@admin.register(ProjectTeam)
class ProjectTeamAdmin(admin.ModelAdmin):
    list_display = ('project', 'employee', 'assigned_at')
    search_fields = ('project__name', 'employee__username', 'employee__email')
    list_filter = ('project', 'assigned_at')
