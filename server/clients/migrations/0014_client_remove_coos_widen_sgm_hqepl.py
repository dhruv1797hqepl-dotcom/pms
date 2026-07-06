# Removes assigned_coos M2M field from Client (added in 0013, now removed).
# Also widens limit_choices_to on assigned_sgms and assigned_hqepls to include COO.
# limit_choices_to changes are metadata-only (no DB ALTER needed).

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        # If 0013_client_assigned_coos was applied, depend on it so we can remove it.
        # If it was never applied (you didn't run it), change this to ("clients", "0012_client_assigned_hqepls")
        ("clients", "0013_client_assigned_coos"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Remove assigned_coos (no longer needed — COO goes into assigned_sgms/assigned_hqepls)
        migrations.RemoveField(
            model_name="client",
            name="assigned_coos",
        ),

        # Widen assigned_sgms to accept COO role (metadata only, no DB change)
        migrations.AlterField(
            model_name="client",
            name="assigned_sgms",
            field=models.ManyToManyField(
                blank=True,
                limit_choices_to={"role__in": ["SGM", "COO"]},
                related_name="assigned_clients",
                to=settings.AUTH_USER_MODEL,
            ),
        ),

        # Widen assigned_hqepls to accept COO role (metadata only, no DB change)
        migrations.AlterField(
            model_name="client",
            name="assigned_hqepls",
            field=models.ManyToManyField(
                blank=True,
                limit_choices_to={"role__in": ["HQEPL", "COO"]},
                related_name="assigned_hqepl_clients",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]