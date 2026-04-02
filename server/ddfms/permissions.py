from rest_framework.permissions import IsAuthenticated


class DDFMSPermission(IsAuthenticated):
    allowed_roles = {'SGM', 'EMPLOYEE'}

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        role = str(getattr(request.user, 'role', '') or '').upper()
        return role in self.allowed_roles
