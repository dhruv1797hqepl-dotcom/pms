from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0013_alter_task_repeat_day_alter_task_repeat_frequency_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='flag',
            field=models.CharField(blank=True, choices=[('none', 'None'), ('discuss', 'Discuss'), ('training', 'Training'), ('resource', 'Resource')], default='none', max_length=20),
        ),
    ]
