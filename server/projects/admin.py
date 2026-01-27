from django.contrib import admin
from .models import Project

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'name',
        'client_org',
        'internal_lead',
        'external_lead',
        'status',
        'created_at',
    )

    list_filter = ('status', 'client_org')
    search_fields = ('name', 'client_org__company_name')
