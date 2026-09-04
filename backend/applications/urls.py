from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, LoginView, LogoutView, UserProfileView,
    StudentDashboardView, EmployerDashboardView,
    AdminDashboardView, ReportsView, EmployerApprovalView,
    InternshipListCreateView, InternshipDetailView,
    ApplicationListCreateView, ApplicationStatusUpdateView,
    ApplicationResumeView,
    NotificationListView,
    NotificationReadView,
    NotificationDetailView,
    AdminUsersView,
    CompanyListCreateView, CompanyDetailView,
    HealthView,
)

urlpatterns = [
    path("health/",                            HealthView.as_view(),                 name="health"),
    # Auth
    path("auth/register/",                      RegisterView.as_view(),               name="register"),
    path("auth/login/",                         LoginView.as_view(),                  name="login"),
    path("auth/token/",                         TokenObtainPairView.as_view(),       name="token_obtain_pair"),
    path("auth/logout/",                        LogoutView.as_view(),                 name="logout"),
    path("auth/token/refresh/",                 TokenRefreshView.as_view(),           name="token_refresh"),

    # Profile
    path("users/profile/",                      UserProfileView.as_view(),            name="user-profile"),
    path("users/me/",                           UserProfileView.as_view(),            name="user-me"),
    path("profile/",                            UserProfileView.as_view(),            name="profile"),
    path("admin/users/",                        AdminUsersView.as_view(),             name="admin-users"),

    # Dashboards
    path("dashboard/student/",                  StudentDashboardView.as_view(),       name="student-dashboard"),
    path("dashboard/employer/",                 EmployerDashboardView.as_view(),      name="employer-dashboard"),
    path("dashboard/admin/",                    AdminDashboardView.as_view(),         name="admin-dashboard"),
    path("reports/",                            ReportsView.as_view(),                name="reports"),
    path("admin/employers/<int:pk>/approve/",   EmployerApprovalView.as_view(),       name="employer-approval"),

    # Companies
    path("companies/",                          CompanyListCreateView.as_view(),     name="company-list-create"),
    path("companies/<int:pk>/",                 CompanyDetailView.as_view(),          name="company-detail"),

    # Internships
    path("internships/",                        InternshipListCreateView.as_view(),   name="internship-list-create"),
    path("internships/<int:pk>/",               InternshipDetailView.as_view(),       name="internship-detail"),

    # Applications
    path("applications/",                       ApplicationListCreateView.as_view(),  name="application-list-create"),
    path("applications/<int:pk>/update_status/",ApplicationStatusUpdateView.as_view(),name="application-status"),
    path("applications/<int:pk>/resume/",        ApplicationResumeView.as_view(),    name="application-resume"),

    # Notifications
    path("notifications/",                      NotificationListView.as_view(),       name="notifications"),
    path("notifications/<int:pk>/",             NotificationDetailView.as_view(),     name="notification-detail"),
    path("notifications/<int:pk>/read/",       NotificationReadView.as_view(),       name="notification-read"),
]
