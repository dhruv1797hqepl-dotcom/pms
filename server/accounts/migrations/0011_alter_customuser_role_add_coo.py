# Generated manually — adds COO role choice to CustomUser

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0010_alter_customuser_phone_number"),
    ]

    operations = [
        migrations.AlterField(
            model_name="customuser",
            name="role",
            field=models.CharField(
                choices=[
                    ("ADMIN", "Admin"),
                    ("HQEPL", "HQEPL"),
                    ("MLS", "MLS"),
                    ("SGM", "SGM"),
                    ("EMPLOYEE", "Employee"),
                    ("CLIENT", "Client"),
                    ("EXTERNAL", "External"),
                    ("SENIOR", "Senior"),
                    ("COO", "COO"),
                ],
                default="EMPLOYEE",
                max_length=20,
            ),
        ),
    ]