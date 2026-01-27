from django.db import models
from django.conf import settings
from clients.models import Client  # Client app model

# -----------------------------
# Project Model
# -----------------------------
class Project(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('on_hold', 'On Hold'),
        ('cancelled', 'Cancelled')
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    
    # Link to client
    client_org = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='projects'
    )

    # Internal company lead (HQEPL/SGM)
    internal_lead = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sgm_projects',
        limit_choices_to={'role':'SGM'}
    )

    # Optional client-side lead
    external_lead = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='external_lead_projects',
        limit_choices_to={'role':'EXTERNAL'}
    )

    # Team members assigned to this project (Employees only)
    team_members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='project_teams',
        limit_choices_to={'role__in':['EMPLOYEE','EXTERNAL']},
        blank=True
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    overall_progress = models.IntegerField(default=0)  # 0 to 100%
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.client_org.company_name})"

# -----------------------------
# SubTask Model
# -----------------------------
# class SubTask(models.Model):
#     STATUS_CHOICES = [
#         ('todo', 'To Do'),
#         ('in_progress', 'In Progress'),
#         ('review', 'In Review'),
#         ('done', 'Done'),
#         ('blocked', 'Blocked')
#     ]

#     project = models.ForeignKey(
#         Project,
#         on_delete=models.CASCADE,
#         related_name='subtasks'
#     )
#     title = models.CharField(max_length=255)
#     description = models.TextField(blank=True, null=True)
    
#     # Assigned employee
#     assigned_to = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name='assigned_subtasks'
#     )

#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
#     duration = models.CharField(max_length=50, blank=True, null=True)
#     deadline = models.DateField(null=True, blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     def __str__(self):
#         return f"{self.title} ({self.project.name})"
