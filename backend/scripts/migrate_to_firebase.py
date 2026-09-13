"""One-time migration from the existing Django database to Firebase.

Required environment variables:
- GOOGLE_APPLICATION_CREDENTIALS: local path to a Firebase Admin service-account JSON
- FIREBASE_STORAGE_BUCKET: Firebase Storage bucket name, if resume files should be copied

This script never copies Django password hashes. Existing users must use Firebase
password-reset onboarding after their Auth accounts are created.
"""

import os
from pathlib import Path

import django
import firebase_admin
from firebase_admin import auth, credentials, firestore

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "portal.settings")
django.setup()

from django.contrib.auth.models import User  # noqa: E402
from applications.models import Application, Company, EmployerProfile, Internship, StudentProfile  # noqa: E402


def firebase_client():
    credential = credentials.Certificate(os.environ["GOOGLE_APPLICATION_CREDENTIALS"])
    if not firebase_admin._apps:
        firebase_admin.initialize_app(credential, {"storageBucket": os.environ.get("FIREBASE_STORAGE_BUCKET")})
    return firestore.client()


def user_profile(user):
    student = getattr(user, "student_profile", None)
    employer = getattr(user, "employer_profile", None)
    role = "student" if student else "employer" if employer else "admin"
    return {
        "uid": "",
        "username": user.username,
        "email": user.email,
        "fullName": f"{user.first_name} {user.last_name}".strip(),
        "role": role,
        "studentProfile": {
            "university": student.university,
            "course": student.course,
            "year_of_study": student.year_of_study,
            "skills": student.skills,
            "resume_url": student.resume_url,
        } if student else None,
        "employerProfile": {
            "company_name": employer.company_name,
            "designation": employer.designation,
            "phone": employer.phone,
            "is_approved": employer.is_approved,
        } if employer else None,
    }


def main():
    db = firebase_client()
    uid_by_user_id = {}
    for user in User.objects.all():
        try:
            firebase_user = auth.get_user_by_email(user.email) if user.email else None
        except auth.UserNotFoundError:
            firebase_user = None
        if not firebase_user:
            firebase_user = auth.create_user(email=user.email, display_name=f"{user.first_name} {user.last_name}".strip())
        uid_by_user_id[user.id] = firebase_user.uid
        profile = user_profile(user)
        profile["uid"] = firebase_user.uid
        db.collection("users").document(firebase_user.uid).set(profile, merge=True)

    company_ids = {}
    for company in Company.objects.all():
        ref = db.collection("companies").document(str(company.id))
        ref.set({"companyName": company.company_name, "description": company.description, "website": company.website, "location": company.location, "industry": company.industry})
        company_ids[company.id] = ref.id

    internship_ids = {}
    for internship in Internship.objects.select_related("company", "posted_by"):
        ref = db.collection("internships").document(str(internship.id))
        ref.set({"title": internship.title, "description": internship.description, "requirements": internship.requirements, "location": internship.location, "industry": internship.industry, "duration": internship.duration, "stipend": internship.stipend, "deadline": internship.deadline.isoformat(), "isActive": internship.is_active, "postedBy": uid_by_user_id[internship.posted_by_id], "companyName": internship.company.company_name if internship.company else "", "companyLocation": internship.company.location if internship.company else internship.location})
        internship_ids[internship.id] = ref.id

    for application in Application.objects.select_related("student", "internship"):
        db.collection("applications").document(str(application.id)).set({"studentId": uid_by_user_id[application.student_id], "studentUsername": application.student.username, "studentName": f"{application.student.first_name} {application.student.last_name}".strip() or application.student.username, "internshipId": internship_ids[application.internship_id], "internshipTitle": application.internship.title, "internshipCompany": application.internship.company.company_name if application.internship.company else "", "coverLetter": application.cover_letter, "status": application.status, "appliedAt": application.applied_at, "resumePath": None, "resumeUrl": None})

    print(f"Migrated {len(uid_by_user_id)} users, {len(company_ids)} companies, {len(internship_ids)} internships, and {Application.objects.count()} applications.")
    print("Password hashes were not copied. Send Firebase password-reset onboarding to existing users.")


if __name__ == "__main__":
    main()
