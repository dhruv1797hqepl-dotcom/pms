# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from .models import CustomUser


# @receiver(post_save, sender=CustomUser)
# def create_employee_profile(sender, instance, created, **kwargs):
#     """
#     Automatically create EmployeeProfile
#     for company users when admin creates them.
#     """
#     if not created:
#         return

#     if instance.role in ['HQEPL', 'SGM', 'EMPLOYEE']:
#         EmployeeProfile.objects.create(user=instance)
