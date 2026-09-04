from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("applications", "0002_company_internship_description_internship_industry_and_more")]

    operations = [
        migrations.AddField(
            model_name="employerprofile",
            name="is_approved",
            field=models.BooleanField(default=False),
        ),
    ]