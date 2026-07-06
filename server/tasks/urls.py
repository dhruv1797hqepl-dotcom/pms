from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, WeeklyScoreEmailView, WeeklyScorePDFDownloadView

# Create a router and register the TaskViewSet
# This creates endpoints like /api/tasks/ and /api/tasks/dashboard_stats/
router = DefaultRouter()
router.register(r'', TaskViewSet, basename='task')

urlpatterns = [
    path('send-weekly-score-email/', WeeklyScoreEmailView.as_view(), name='send-weekly-score-email'),
    path('download-weekly-score-pdf/', WeeklyScorePDFDownloadView.as_view(), name='download-weekly-score-pdf'),
    path('', include(router.urls)),
]