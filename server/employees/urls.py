from django.urls import path
from .views import (
    EmployeeMyProjectsView,
    EmployeeClientListView,
    EmployeeProjectDetailView
)

urlpatterns = [
    path("my-projects/", EmployeeMyProjectsView.as_view()),
    path("clients/", EmployeeClientListView.as_view()),
    path("projects/<int:project_id>/", EmployeeProjectDetailView.as_view()),
]
