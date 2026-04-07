from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mctc', '0003_rename_mctc_mctcen_user_id_7f4f53_idx_mctc_mctcen_user_id_42671c_idx'),
    ]

    operations = [
        migrations.AddField(
            model_name='mctcentry',
            name='source_module',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
    ]