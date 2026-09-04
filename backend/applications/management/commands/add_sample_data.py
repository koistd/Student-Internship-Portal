from datetime import date, timedelta
import os
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from applications.models import Application, Company, EmployerProfile, Internship, StudentProfile


class Command(BaseCommand):
    help = "Create repeatable demo companies, users, internships, and applications."

    def handle(self, *args, **options):
        password = os.environ.get("SAMPLE_DATA_PASSWORD")
        if not password:
            raise CommandError("Set SAMPLE_DATA_PASSWORD before creating sample data.")
        companies = [
            ("Tech Corp", "Technology", "Bangalore"),
            ("Data Solutions", "Analytics", "Hyderabad"),
            ("Marketing Pro", "Marketing", "Mumbai"),
        ]
        company_objects = [Company.objects.update_or_create(company_name=name, defaults={"industry": industry, "location": location})[0] for name, industry, location in companies]
        employers = []
        for index, company in enumerate(company_objects, 1):
            user, _ = User.objects.get_or_create(username=f"employer{index}", defaults={"email": f"employer{index}@test.com", "first_name": company.company_name})
            user.email = f"employer{index}@test.com"
            user.set_password(password)
            user.save()
            EmployerProfile.objects.update_or_create(user=user, defaults={"company_name": company.company_name, "designation": "Hiring Manager", "is_approved": True})
            employers.append(user)
        students = []
        for index in range(1, 6):
            user, _ = User.objects.get_or_create(username=f"student{index}", defaults={"email": f"student{index}@test.com", "first_name": f"Student {index}"})
            user.email = f"student{index}@test.com"
            user.set_password(password)
            user.save()
            StudentProfile.objects.get_or_create(user=user, defaults={"university": "City University", "course": "Computer Science", "year_of_study": 3, "skills": "Python, React, SQL"})
            students.append(user)
        internships = []
        titles = ["Software Engineering Intern", "Data Analyst Intern", "Product Design Intern", "Backend Developer Intern", "Marketing Intern", "QA Automation Intern", "Cloud Operations Intern", "Business Analyst Intern", "Frontend Developer Intern", "Machine Learning Intern"]
        for index, title in enumerate(titles):
            internship, _ = Internship.objects.update_or_create(title=title, posted_by=employers[index % 3], defaults={"company": company_objects[index % 3], "description": f"Work with the {company_objects[index % 3].company_name} team on real products.", "requirements": "Curiosity, communication, and relevant coursework.", "location": company_objects[index % 3].location, "industry": company_objects[index % 3].industry, "duration": f"{3 + index % 4} months", "stipend": f"{25000 + index * 1500}/month", "deadline": date.today() + timedelta(days=30 + index), "is_active": True})
            internships.append(internship)
        pdf_bytes = b"%PDF-1.4\nDemo resume\n%%EOF"
        statuses = ["submitted", "under_review", "shortlisted", "interview_scheduled", "accepted", "rejected"]
        Application.objects.filter(student__username__startswith="student", cover_letter="I am excited to contribute to this team.").delete()
        for index in range(15):
            if index < 10:
                student = students[index % 5]
                internship = internships[index]
            else:
                student = students[(index - 9) % 5]
                internship = internships[index - 10]
            application, created = Application.objects.get_or_create(student=student, internship=internship, defaults={"cover_letter": "I am excited to contribute to this team.", "status": statuses[index % len(statuses)]})
            if created:
                application.resume.save(f"sample-resume-{index}.pdf", ContentFile(pdf_bytes), save=True)
        self.stdout.write(self.style.SUCCESS("Sample data created."))
