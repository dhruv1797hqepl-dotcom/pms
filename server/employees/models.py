from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Employee(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="employee_profile"
    )
    designation = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.user.email
