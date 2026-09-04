from django.db import models
from django.contrib.auth.models import User


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    university = models.CharField(max_length=200, blank=True)
    course = models.CharField(max_length=200, blank=True)
    year_of_study = models.PositiveSmallIntegerField(null=True, blank=True)
    skills = models.TextField(blank=True)
    resume_url = models.URLField(blank=True)

    def __str__(self):
        return f"Student: {self.user.username}"


class EmployerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="employer_profile")
    company_name = models.CharField(max_length=200, blank=True)
    designation = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return f"Employer: {self.user.username}"


class Company(models.Model):
    company_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    industry = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return self.company_name


class Internship(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="internships", null=True, blank=True)
    posted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="listings")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    requirements = models.TextField(blank=True)
    location = models.CharField(max_length=200)
    industry = models.CharField(max_length=200, blank=True)
    duration = models.CharField(max_length=100)
    stipend = models.CharField(max_length=100)
    posted_date = models.DateField(auto_now_add=True)
    deadline = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} @ {self.posted_by.employer_profile.company_name if hasattr(self.posted_by, 'employer_profile') else 'N/A'}"


class Application(models.Model):
    STATUS_CHOICES = [
        ("submitted",          "Submitted"),
        ("under_review",       "Under Review"),
        ("shortlisted",        "Shortlisted"),
        ("interview_scheduled","Interview Scheduled"),
        ("accepted",           "Accepted"),
        ("rejected",           "Rejected"),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="applications")
    internship = models.ForeignKey(Internship, on_delete=models.CASCADE, related_name="applications")
    cover_letter = models.TextField()
    resume = models.FileField(upload_to="resumes/")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="submitted")
    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "internship")

    def __str__(self):
        return f"{self.student.username} → {self.internship.title}"


class Notification(models.Model):
    TYPE_CHOICES = [
        ("application", "Application"),
        ("status_update", "Status Update"),
        ("general", "General"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="general")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message[:40]}"
