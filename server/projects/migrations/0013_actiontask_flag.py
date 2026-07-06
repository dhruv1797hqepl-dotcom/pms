from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0012_project_assigned_hqepl_alter_project_created_by'),
    ]

    operations = [
        migrations.AddField(
            model_name='actiontask',
            name='flag',
            field=models.CharField(blank=True, choices=[('none', 'None'), ('discuss', 'Discuss'), ('training', 'Training'), ('resource', 'Resource')], default='none', max_length=20),
        ),
    ]
