from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0015_flag_document_value'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='priority',
            field=models.CharField(
                choices=[('HIGH', 'High'), ('MEDIUM', 'Medium'), ('LOW', 'Low')],
                default='LOW',
                max_length=10,
            ),
        ),
    ]
