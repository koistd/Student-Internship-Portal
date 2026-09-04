from django.contrib import admin
from .models import StudentProfile, EmployerProfile, Company, Internship, Application, Notification

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
	list_display = ("user", "university", "course", "year_of_study")


@admin.register(EmployerProfile)
class EmployerProfileAdmin(admin.ModelAdmin):
	list_display = ("user", "company_name", "designation", "is_approved")
	list_filter = ("is_approved",)
	list_editable = ("is_approved",)


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
	list_display = ("company_name", "industry", "location")
	search_fields = ("company_name", "industry")


@admin.register(Internship)
class InternshipAdmin(admin.ModelAdmin):
	list_display = ("title", "posted_by", "location", "deadline", "is_active")
	list_filter = ("is_active", "industry")
	search_fields = ("title", "location", "industry")


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
	list_display = ("student", "internship", "status", "applied_at")
	list_filter = ("status",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
	list_display = ("user", "type", "is_read", "created_at")
	list_filter = ("type", "is_read")
