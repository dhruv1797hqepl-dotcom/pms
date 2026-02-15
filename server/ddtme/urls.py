from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BigTaskViewSet, DDTMESubmissionViewSet, DDTMEAdditionalTaskViewSet, ManDayEntryViewSet, DDTMEMonthlyObjectiveViewSet

router = DefaultRouter()
router.register(r'big-tasks', BigTaskViewSet, basename='big-tasks')
router.register(r'submissions', DDTMESubmissionViewSet, basename='submissions')
router.register(r'additional-tasks', DDTMEAdditionalTaskViewSet, basename='additional-tasks')
router.register(r'man-day-entries', ManDayEntryViewSet, basename='man-day-entries')
router.register(r'monthly-objectives', DDTMEMonthlyObjectiveViewSet, basename='monthly-objectives')


urlpatterns = [
    path('', include(router.urls)),
]
