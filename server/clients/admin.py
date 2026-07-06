from django.contrib import admin
from .models import Client
from .models import ExternalTeam

@admin.register(ExternalTeam)
class ExternalTeamAdmin(admin.ModelAdmin):
    list_display = ("user", "client_org", "created_at")


admin.site.register(Client)