from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    AdminUserListView, RegisterView, UserDetailView,
    AdminOnlyView, HQEPLOnlyView, SGMOnlyView, EmployeeOnlyView,
    MyTokenObtainPairView, AdmincreateuserView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', MyTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserDetailView.as_view(), name='user_detail'),

    path('admin/createuser/', AdmincreateuserView.as_view(), name='admin_create_user'),
    path('admin/userlist/', AdminUserListView.as_view(), name='admin_user_list'),

    # Role-based endpoints
    path('admin/', AdminOnlyView.as_view(), name='admin_only'),
    path('hqepl/', HQEPLOnlyView.as_view(), name='hq_epl_only'),
    path('sgm/', SGMOnlyView.as_view(), name='sgm_only'),
    path('employee/', EmployeeOnlyView.as_view(), name='employee_only'),
]
