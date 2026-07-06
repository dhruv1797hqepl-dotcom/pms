from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AchievementViewSet

router = DefaultRouter()
router.register(r"achievements", AchievementViewSet, basename="achievement")

urlpatterns = [
    path("", include(router.urls)),
]
