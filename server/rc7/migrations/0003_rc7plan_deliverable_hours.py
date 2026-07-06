from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rc7', '0002_rc7submission'),
    ]

    operations = [
        migrations.AddField(
            model_name='rc7plan',
            name='deliverable_hours',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
