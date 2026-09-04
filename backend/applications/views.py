from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import FileResponse
from django.db import connection
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q

from .models import Application, Company, Internship, Notification, EmployerProfile
from .serializers import (
    RegisterSerializer, UserProfileSerializer,
    InternshipSerializer, ApplicationSerializer,
    ApplicationStatusSerializer, CompanySerializer, NotificationSerializer,
)


def is_employer(user):
    return hasattr(user, "employer_profile")


def is_approved_employer(user):
    return is_employer(user) and user.employer_profile.is_approved


def is_student(user):
    return hasattr(user, "student_profile")


class HealthView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            connection.ensure_connection()
        except Exception:
            return Response({"status": "degraded", "database": "unavailable"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"status": "ok", "database": "ok"})


# ── Auth ──────────────────────────────────────────────────────────────────────
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserProfileSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip()
        password = request.data.get("password", "")

        try:
            username = User.objects.get(email=email).username
        except User.DoesNotExist:
            return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(username=username, password=password)
        if not user:
            return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        profile = UserProfileSerializer(user).data
        return Response({
            "user": profile,
            "role": profile["role"],
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })


class LogoutView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception:
                pass
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── User Profile ──────────────────────────────────────────────────────────────
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class AdminUsersView(generics.ListAPIView):
    serializer_class = UserProfileSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAdminUser]
    queryset = User.objects.all().order_by("-date_joined")


class CompanyListCreateView(generics.ListCreateAPIView):
    serializer_class = CompanySerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    queryset = Company.objects.all().order_by("company_name")
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["company_name", "industry", "location"]
    filterset_fields = ["industry", "location"]
    ordering_fields = ["company_name", "industry", "location"]

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class CompanyDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CompanySerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAdminUser]
    queryset = Company.objects.all()


# ── Dashboard APIs ────────────────────────────────────────────────────────────
class StudentDashboardView(APIView):
    """GET /api/dashboard/student/ — KPI stats + recent applications."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not is_student(request.user):
            return Response({"detail": "Student access required."}, status=status.HTTP_403_FORBIDDEN)
        apps = Application.objects.filter(
            student=request.user
        ).select_related("internship", "internship__company")

        stats = {
            "applications_submitted": apps.count(),
            "interviews_scheduled":   apps.filter(status="interview_scheduled").count(),
            "offers_received":        apps.filter(status="accepted").count(),
            "placement_status":       "Placed" if apps.filter(status="accepted").exists() else "Pending",
        }
        recent = ApplicationSerializer(apps.order_by("-applied_at")[:5], many=True).data
        return Response({"stats": stats, "recent_applications": recent})


class EmployerDashboardView(APIView):
    """GET /api/dashboard/employer/ — KPI stats + recent applications."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not is_employer(request.user):
            return Response({"detail": "Employer access required."}, status=status.HTTP_403_FORBIDDEN)
        internships = Internship.objects.filter(posted_by=request.user)
        apps = Application.objects.filter(
            internship__in=internships
        ).select_related("student", "internship")

        stats = {
            "active_listings":    internships.filter(is_active=True).count(),
            "total_applications": apps.count(),
            "shortlisted":        apps.filter(status="shortlisted").count(),
            "hired":              apps.filter(status="accepted").count(),
        }
        recent = ApplicationSerializer(apps.order_by("-applied_at")[:5], many=True).data
        return Response({"stats": stats, "recent_applications": recent})


class EmployerApprovalView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        try:
            profile = EmployerProfile.objects.get(user_id=pk)
        except EmployerProfile.DoesNotExist:
            return Response({"detail": "Employer not found."}, status=status.HTTP_404_NOT_FOUND)
        profile.is_approved = request.data.get("approved", True)
        profile.save(update_fields=["is_approved"])
        return Response(UserProfileSerializer(profile.user).data)


class AdminDashboardView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        return Response({
            "stats": {
                "total_students": User.objects.filter(student_profile__isnull=False).count(),
                "total_employers": User.objects.filter(employer_profile__isnull=False).count(),
                "active_listings": Internship.objects.filter(is_active=True).count(),
                "pending_approvals": EmployerProfile.objects.filter(is_approved=False).count(),
            },
            "recent_users": UserProfileSerializer(User.objects.order_by("-date_joined")[:10], many=True).data,
            "pending_employers": UserProfileSerializer(User.objects.filter(employer_profile__is_approved=False), many=True).data,
        })


class ReportsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        return Response({
            "total_applications": Application.objects.count(),
            "accepted": Application.objects.filter(status="accepted").count(),
            "rejected": Application.objects.filter(status="rejected").count(),
            "active_listings": Internship.objects.filter(is_active=True).count(),
        })


# ── Internship APIs ───────────────────────────────────────────────────────────
class InternshipListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/internships/ — list active internships with search & filters
    POST /api/internships/ — create internship (employer only)

    Query params: search, location, industry, duration
    """
    serializer_class = InternshipSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["title", "industry", "location", "company__company_name", "posted_by__employer_profile__company_name"]
    filterset_fields = ["location", "industry", "duration", "is_active"]
    ordering_fields = ["deadline", "posted_date", "title", "stipend"]
    ordering = ["deadline"]

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        if self.request.user.is_authenticated and is_employer(self.request.user):
            qs = Internship.objects.filter(posted_by=self.request.user).select_related("company", "posted_by")
        elif self.request.user.is_authenticated and self.request.user.is_staff:
            qs = Internship.objects.all().select_related("company", "posted_by")
        else:
            qs = Internship.objects.filter(is_active=True).select_related("company", "posted_by")
        return qs

    def perform_create(self, serializer):
        if not is_approved_employer(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only employers can post internships.")
        serializer.save(posted_by=self.request.user)


class InternshipDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/internships/{id}/ — internship details
    PUT    /api/internships/{id}/ — update (employer/owner only)
    DELETE /api/internships/{id}/ — delete (employer/owner only)
    """
    serializer_class = InternshipSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    queryset = Internship.objects.all()

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method in ("PUT", "PATCH", "DELETE") and obj.posted_by != request.user and not request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only modify your own listings.")
        if request.method in ("PUT", "PATCH", "DELETE") and is_employer(request.user) and not is_approved_employer(request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Your employer account must be approved first.")


# ── Application APIs ──────────────────────────────────────────────────────────
class ApplicationListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/applications/ — students see own, employers see theirs
    POST /api/applications/ — submit application (student only)
    """
    serializer_class = ApplicationSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Application.objects.all().select_related("student", "internship")
        if is_employer(user):
            return Application.objects.filter(
                internship__posted_by=user
            ).select_related("student", "internship")
        return Application.objects.filter(
            student=user
        ).select_related("internship", "internship__company")

    def perform_create(self, serializer):
        if not is_student(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only students can submit applications.")
        app = serializer.save()
        Notification.objects.create(
            user=app.internship.posted_by,
            message=f"New application received for '{app.internship.title}'.",
            type="application",
        )


class ApplicationStatusUpdateView(generics.UpdateAPIView):
    """PATCH /api/applications/{id}/update_status/ — employer updates status."""
    serializer_class = ApplicationStatusSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    queryset = Application.objects.all()
    http_method_names = ["patch"]

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if obj.internship.posted_by != request.user:
            if not request.user.is_staff:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only update applications for your own internships.")
        if is_employer(request.user) and not is_approved_employer(request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Your employer account must be approved first.")

    def perform_update(self, serializer):
        app = serializer.save()
        Notification.objects.create(
            user=app.student,
            message=f"Your application for '{app.internship.title}' is now: {app.get_status_display()}",
            type="status_update",
        )


class ApplicationResumeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            application = Application.objects.select_related("internship").get(pk=pk)
        except Application.DoesNotExist:
            return Response({"detail": "Application not found."}, status=status.HTTP_404_NOT_FOUND)
        is_student = application.student_id == request.user.id
        is_employer = application.internship.posted_by_id == request.user.id
        if not (is_student or is_employer or request.user.is_staff):
            return Response({"detail": "You cannot access this resume."}, status=status.HTTP_403_FORBIDDEN)
        if not application.resume:
            return Response({"detail": "Resume not found."}, status=status.HTTP_404_NOT_FOUND)
        return FileResponse(
            application.resume.open("rb"),
            as_attachment=True,
            filename=application.resume.name.rsplit("/", 1)[-1],
        )


# ── Notifications ─────────────────────────────────────────────────────────────
class NotificationListView(generics.ListAPIView):
    """GET /api/notifications/ — list unread notifications for logged-in user."""
    serializer_class = NotificationSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user
        ).order_by("-created_at")


class NotificationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "put"]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationReadView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        updated = Notification.objects.filter(pk=pk, user=request.user).update(is_read=True)
        if not updated:
            return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"is_read": True})
