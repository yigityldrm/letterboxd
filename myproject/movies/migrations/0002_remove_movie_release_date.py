# Generated by Django 4.2.15 on 2024-09-05 11:41

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('movies', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='movie',
            name='release_date',
        ),
    ]
