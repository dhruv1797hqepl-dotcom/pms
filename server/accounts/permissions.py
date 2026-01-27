from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "ADMIN"
    
class IsHQEPL(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'HQEPL'

class IsSGM(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'SGM'

class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'employee'
