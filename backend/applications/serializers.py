from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.reverse import reverse
from .models import Application, Internship, Company, StudentProfile, EmployerProfile, Notification


class ProtectedResumeField(serializers.FileField):
    def to_representation(self, value):
        if not value:
            return None
        request = self.context.get("request")
        return reverse("application-resume", kwargs={"pk": self.parent.instance.pk}, request=request)


# ── Auth ─────────────────────────────────────────────────────────────────────
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=["student", "employer"], write_only=True)
    full_name = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "full_name", "role"]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        role = validated_data.pop("role")
        full_name = validated_data.pop("full_name")
        parts = full_name.split(" ", 1)
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=parts[0],
            last_name=parts[1] if len(parts) > 1 else "",
        )
        if role == "student":
            StudentProfile.objects.create(user=user)
        else:
            EmployerProfile.objects.create(user=user)
        return user


# ── Profiles ─────────────────────────────────────────────────────────────────
class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ["university", "course", "year_of_study", "skills", "resume_url"]


class EmployerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployerProfile
        fields = ["company_name", "designation", "phone", "is_approved"]
        read_only_fields = ["is_approved"]


class UserProfileSerializer(serializers.ModelSerializer):
    student_profile = StudentProfileSerializer(read_only=True)
    employer_profile = EmployerProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "full_name", "role", "student_profile", "employer_profile"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_role(self, obj):
        if hasattr(obj, "student_profile"):
            return "student"
        if hasattr(obj, "employer_profile"):
            return "employer"
        return "admin"

    def update(self, instance, validated_data):
        profile_key = "student_profile" if hasattr(instance, "student_profile") else "employer_profile"
        profile_data = self.initial_data.get(profile_key)
        if profile_data:
            profile = getattr(instance, "student_profile", None) or getattr(instance, "employer_profile", None)
            if profile:
                profile_serializer = (
                    StudentProfileSerializer(profile, data=profile_data, partial=True)
                    if hasattr(instance, "student_profile")
                    else EmployerProfileSerializer(profile, data=profile_data, partial=True)
                )
                profile_serializer.is_valid(raise_exception=True)
                profile_serializer.save()
        return super().update(instance, validated_data)


# ── Company ───────────────────────────────────────────────────────────────────
class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ["id", "company_name", "description", "website", "location", "industry"]


# ── Internship ────────────────────────────────────────────────────────────────
class InternshipSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(queryset=Company.objects.all(), required=False, allow_null=True)
    company_name = serializers.SerializerMethodField()
    company_location = serializers.SerializerMethodField()

    class Meta:
        model = Internship
        fields = [
            "id", "company", "title", "company_name", "company_location", "description",
            "requirements", "location", "industry", "duration", "stipend",
            "posted_date", "deadline", "is_active",
        ]
        read_only_fields = ["id", "posted_date"]

    def get_company_name(self, obj):
        if obj.company:
            return obj.company.company_name
        if hasattr(obj.posted_by, "employer_profile"):
            return obj.posted_by.employer_profile.company_name
        return ""

    def get_company_location(self, obj):
        return obj.company.location if obj.company else obj.location

    def create(self, validated_data):
        validated_data["posted_by"] = self.context["request"].user
        return super().create(validated_data)


# ── Application ───────────────────────────────────────────────────────────────
class ApplicationSerializer(serializers.ModelSerializer):
    resume = ProtectedResumeField()
    internship_title = serializers.CharField(source="internship.title", read_only=True)
    internship_company = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    student_username = serializers.CharField(source="student.username", read_only=True)

    class Meta:
        model = Application
        fields = [
            "id", "internship", "internship_title", "internship_company",
            "cover_letter", "resume", "status", "applied_at",
            "student_name", "student_username",
        ]
        read_only_fields = ["id", "status", "applied_at", "student_name", "student_username"]

    def get_internship_company(self, obj):
        if obj.internship.company:
            return obj.internship.company.company_name
        if hasattr(obj.internship.posted_by, "employer_profile"):
            return obj.internship.posted_by.employer_profile.company_name
        return ""

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip() or obj.student.username

    def validate_internship(self, value):
        if not value.is_active:
            raise serializers.ValidationError("This internship is no longer active.")
        if value.deadline < timezone.localdate():
            raise serializers.ValidationError("The application deadline has passed.")
        return value

    def validate_cover_letter(self, value):
        if not value.strip():
            raise serializers.ValidationError("Cover letter cannot be empty.")
        return value

    def validate_resume(self, value):
        if not value.name.lower().endswith(".pdf"):
            raise serializers.ValidationError("Resume must be a PDF file.")
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Resume must be smaller than 5 MB.")
        if value.content_type not in (None, "application/pdf"):
            raise serializers.ValidationError("Resume must be a PDF file.")
        return value

    def validate(self, attrs):
        student = self.context["request"].user
        internship = attrs.get("internship")
        if Application.objects.filter(student=student, internship=internship).exists():
            raise serializers.ValidationError(
                {"internship": "You have already applied for this internship."}
            )
        return attrs

    def create(self, validated_data):
        validated_data["student"] = self.context["request"].user
        return super().create(validated_data)


class ApplicationStatusSerializer(serializers.ModelSerializer):
    VALID_TRANSITIONS = {
        "submitted":           ["under_review", "rejected"],
        "under_review":        ["shortlisted", "rejected"],
        "shortlisted":         ["interview_scheduled", "rejected"],
        "interview_scheduled": ["accepted", "rejected"],
        "accepted":            [],
        "rejected":            [],
    }

    class Meta:
        model = Application
        fields = ["id", "status"]

    def validate_status(self, value):
        current = self.instance.status
        allowed = self.VALID_TRANSITIONS.get(current, [])
        if value not in allowed:
            raise serializers.ValidationError(
                f"Cannot transition from '{current}' to '{value}'. Allowed: {allowed}"
            )
        return value


# ── Notification ──────────────────────────────────────────────────────────────
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "message", "type", "is_read", "created_at"]
        read_only_fields = ["id", "message", "type", "created_at"]
