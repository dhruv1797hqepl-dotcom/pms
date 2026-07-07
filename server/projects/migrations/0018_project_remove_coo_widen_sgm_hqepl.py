# Removes assigned_coo FK from Project (added in 0016, now removed — COO goes
# into assigned_sgm/assigned_hqepl instead).
# Also widens limit_choices_to on assigned_sgm and assigned_hqepl to include COO,
# and makes assigned_sgm properly optional (blank=True).

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        # Adjust to match your actual latest projects migration number
        ("projects", "0017_alter_project_external_lead"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Remove the separate assigned_coo FK (no longer needed)
        migrations.RemoveField(
            model_name="project",
            name="assigned_coo",
        ),

        # Make assigned_sgm optional (blank=True) and widen to COO
        migrations.AlterField(
            model_name="project",
            name="assigned_sgm",
            field=models.ForeignKey(
                blank=True,
                limit_choices_to={"role__in": ["SGM", "COO"]},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="assigned_projects",
                to=settings.AUTH_USER_MODEL,
            ),
        ),

        # Widen assigned_hqepl to also accept COO
        migrations.AlterField(
            model_name="project",
            name="assigned_hqepl",
            field=models.ForeignKey(
                blank=True,
                limit_choices_to={"role__in": ["HQEPL", "COO"]},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="hqepl_projects",
                to=settings.AUTH_USER_MODEL,
            ),
        ),

        # Widen created_by to also accept COO
        migrations.AlterField(
            model_name="project",
            name="created_by",
            field=models.ForeignKey(
                limit_choices_to={"role__in": ["ADMIN", "HQEPL", "MLS", "SGM", "COO"]},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="created_projects",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]