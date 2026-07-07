# Generated manually — adds assigned_coos M2M field to Client,
# mirroring assigned_sgms / assigned_hqepls.

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0012_client_assigned_hqepls"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="client",
            name="assigned_coos",
            field=models.ManyToManyField(
                blank=True,
                limit_choices_to={"role": "COO"},
                related_name="assigned_coo_clients",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]