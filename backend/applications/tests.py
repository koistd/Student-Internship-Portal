from datetime import date, timedelta

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Application, EmployerProfile, Internship, Notification


class ApiTestMixin:
    def register(self, username, email, role):
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": username,
                "email": email,
                "password": "StrongPass123!",
                "full_name": username.title(),
                "role": role,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return response.data["user"], response.data["access"]


class AuthenticationApiTests(ApiTestMixin, APITestCase):
    def test_health_check_reports_database_status(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "ok")

    def test_register_and_login_return_jwt_without_password(self):
        user, access = self.register("student1", "student1@example.com", "student")
        self.assertNotIn("password", user)
        self.assertTrue(access)

        response = self.client.post(
            "/api/auth/login/",
            {"email": "student1@example.com", "password": "StrongPass123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_protected_profile_requires_authentication(self):
        response = self.client.get("/api/users/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PermissionAndValidationApiTests(ApiTestMixin, APITestCase):
    def setUp(self):
        self.student, _ = self.register("student2", "student2@example.com", "student")
        self.employer, _ = self.register("employer1", "employer1@example.com", "employer")
        self.employer_user = User.objects.get(username="employer1")
        self.internship = Internship.objects.create(
            posted_by=self.employer_user,
            title="API Internship",
            location="Remote",
            duration="3 months",
            stipend="$1000",
            deadline=date.today() + timedelta(days=30),
        )

    def test_employer_cannot_self_approve_through_profile_api(self):
        self.client.force_authenticate(self.employer_user)
        response = self.client.patch(
            "/api/users/me/",
            {"employer_profile": {"is_approved": True}},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(EmployerProfile.objects.get(user=self.employer_user).is_approved)

    def test_only_approved_employers_can_create_internships(self):
        self.client.force_authenticate(self.employer_user)
        response = self.client.post(
            "/api/internships/",
            {
                "title": "Blocked Internship",
                "location": "Remote",
                "duration": "3 months",
                "stipend": "$1000",
                "deadline": str(date.today() + timedelta(days=30)),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_can_apply_once_with_pdf_before_deadline(self):
        student_user = User.objects.get(username="student2")
        self.client.force_authenticate(student_user)
        resume = SimpleUploadedFile("resume.pdf", b"%PDF-1.4 test", content_type="application/pdf")
        payload = {
            "internship": self.internship.id,
            "cover_letter": "I am a strong candidate.",
            "resume": resume,
        }
        response = self.client.post("/api/applications/", payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Application.objects.count(), 1)

        duplicate = self.client.post("/api/applications/", payload, format="multipart")
        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)


class ListingAndNotificationApiTests(ApiTestMixin, APITestCase):
    def setUp(self):
        self.user, _ = self.register("student3", "student3@example.com", "student")
        self.other_user, _ = self.register("student4", "student4@example.com", "student")
        employer = User.objects.create_user("employer2", "employer2@example.com", "StrongPass123!")
        EmployerProfile.objects.create(user=employer, company_name="Searchable Co", is_approved=True)
        for index in range(3):
            Internship.objects.create(
                posted_by=employer,
                title=f"Python Internship {index}",
                location="Remote",
                industry="Engineering",
                duration="3 months",
                stipend="$1000",
                deadline=date.today() + timedelta(days=index + 1),
            )
        self.notification = Notification.objects.create(user=User.objects.get(username="student3"), message="Hello", type="general")

    def test_public_listing_supports_search_ordering_and_pagination(self):
        response = self.client.get("/api/internships/?search=Python&ordering=-deadline&page_size=2")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 3)
        self.assertLessEqual(len(response.data["results"]), 2)

    def test_notification_is_private_and_can_be_marked_read(self):
        self.client.force_authenticate(User.objects.get(username="student3"))
        response = self.client.patch(f"/api/notifications/{self.notification.id}/", {"is_read": True}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

        self.client.force_authenticate(User.objects.get(username="student4"))
        forbidden = self.client.get(f"/api/notifications/{self.notification.id}/")
        self.assertEqual(forbidden.status_code, status.HTTP_404_NOT_FOUND)