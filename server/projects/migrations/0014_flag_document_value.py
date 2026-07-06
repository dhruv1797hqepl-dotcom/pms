from django.db import migrations, models


def convert_actiontask_flag_discuss_to_document(apps, schema_editor):
    ActionTask = apps.get_model('projects', 'ActionTask')
    ActionTask.objects.filter(flag='discuss').update(flag='document')


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0013_actiontask_flag'),
    ]

    operations = [
        migrations.AlterField(
            model_name='actiontask',
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
        migrations.RunPython(convert_actiontask_flag_discuss_to_document, migrations.RunPython.noop),
    ]
