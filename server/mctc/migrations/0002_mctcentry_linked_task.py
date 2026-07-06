from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('tasks', '0001_initial'),
        ('mctc', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='mctcentry',
            name='linked_task',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='linked_mctc_entries',
                to='tasks.task',
            ),
        ),
    ]
