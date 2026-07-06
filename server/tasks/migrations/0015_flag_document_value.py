from django.db import migrations, models


def convert_task_flag_discuss_to_document(apps, schema_editor):
    Task = apps.get_model('tasks', 'Task')
    Task.objects.filter(flag='discuss').update(flag='document')


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0014_task_flag'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='flag',
            field=models.CharField(
                blank=True,
                choices=[
                    ('none', 'None'),
                    ('document', 'Document'),
                    ('training', 'Training'),
                    ('resource', 'Resource'),
                ],
                default='none',
                max_length=20,
            ),
        ),
        migrations.RunPython(convert_task_flag_discuss_to_document, migrations.RunPython.noop),
    ]
