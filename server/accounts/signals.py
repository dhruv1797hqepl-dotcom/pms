from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from employees.models import Employee

User = get_user_model()

@receiver(post_save, sender=User)
def create_employee_profile(sender, instance, created, **kwargs):
    if created and instance.role == "EMPLOYEE":
        Employee.objects.create(user=instance)

@receiver(post_save, sender=User)
def ensure_employee_profile(sender, instance, **kwargs):
    if instance.role == "EMPLOYEE":
        Employee.objects.get_or_create(user=instance)

