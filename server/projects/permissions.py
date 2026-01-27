from rest_framework.permissions import BasePermission

# --------------------------------------
# Only Admins or SGM (internal managers) can access
# --------------------------------------
class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'SGM']


# --------------------------------------
# Client users or internal managers (SGM/HQEPL/Admin) can access
# --------------------------------------
class IsClientOrManager(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['CLIENT', 'SGM', 'HQEPL', 'ADMIN']


# --------------------------------------
# Only HQEPL (CEO/MD) can access
# --------------------------------------
class IsHQEPL(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'HQEPL'


# --------------------------------------
# Only Employees can access
# --------------------------------------
class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'EMPLOYEE'
