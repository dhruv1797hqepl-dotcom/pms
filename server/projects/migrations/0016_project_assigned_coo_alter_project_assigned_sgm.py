# Generated manually — adds assigned_coo FK, makes assigned_sgm optional,
# allows COO in created_by limit_choices_to, and makes external_team blank=True
# so projects can be created without assigning an SGM or external team upfront.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0015_actiontask_priority"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="assigned_coo",
            field=models.ForeignKey(
                blank=True,
                limit_choices_to={"role": "COO"},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="coo_projects",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="project",
            name="assigned_sgm",
            field=models.ForeignKey(
                blank=True,
                limit_choices_to={"role": "SGM"},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="assigned_projects",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="project",
            name="external_team",
            field=models.ManyToManyField(
                blank=True,
                limit_choices_to={"role": "EXTERNAL"},
                related_name="projects",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
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