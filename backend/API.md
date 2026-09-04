# Placement Portal API

The API runs from `backend/` and is prefixed with `/api/`. Protected endpoints
use `Authorization: Bearer <access-token>`.

## Setup

1. Create a virtual environment and install `requirements.txt`.
2. Copy the repository `.env.example` to `.env` and configure PostgreSQL with
   `DATABASE_URL` (or PostgreSQL `DB_*` variables), a production
   `DJANGO_SECRET_KEY`, allowed hosts, and HTTPS origins.
3. Run `python manage.py migrate`.
4. Start Django with `python manage.py runserver`.

The OpenAPI schema is available at `/api/schema/` and interactive Swagger
documentation at `/api/docs/`.

`GET /api/health/` is public and returns the application and database status.
It returns `200` when the configured database is reachable and `503` when the
database is unavailable.

## Authentication

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register/` | Public | Register a student or employer |
| POST | `/api/auth/login/` | Public | Email/password login |
| POST | `/api/auth/token/` | Public | Standard SimpleJWT token pair |
| POST | `/api/auth/token/refresh/` | Public | Refresh an access token |
| POST | `/api/auth/logout/` | JWT | Blacklist a refresh token |

## Resources

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET/PATCH | `/api/users/me/` | JWT | Read/update the current profile |
| GET | `/api/admin/users/` | Admin | List users |
| GET/POST | `/api/companies/` | Public GET/Admin POST | Search and manage companies |
| GET/PATCH/PUT/DELETE | `/api/companies/<id>/` | JWT GET/Admin mutation | Company detail |
| GET | `/api/internships/` | Public | Search and filter active internships |
| POST | `/api/internships/` | Approved employer | Create an internship |
| GET/PATCH/PUT/DELETE | `/api/internships/<id>/` | JWT | Read or manage an owned listing |
| GET/POST | `/api/applications/` | JWT | List owned/received or submit an application |
| PATCH | `/api/applications/<id>/update_status/` | Owner employer/Admin | Advance an application status |
| GET | `/api/applications/<id>/resume/` | Applicant/owner employer/Admin | Download a resume securely |
| GET | `/api/notifications/` | JWT | List the current user's notifications |
| GET/PATCH/PUT | `/api/notifications/<id>/` | Owner JWT | Read or mark a notification as read |
| GET/PATCH | `/api/notifications/<id>/read/` | Owner JWT | Compatibility mark-read endpoint |

Dashboard endpoints are `/api/dashboard/student/`, `/api/dashboard/employer/`,
and `/api/dashboard/admin/`. Reports are available at `/api/reports/` for
administrators. Employer approval is `/api/admin/employers/<user-id>/approve/`.

## Query parameters

Internships support `search`, `location`, `industry`, `duration`, `is_active`,
`ordering` (`deadline`, `posted_date`, `title`, or `stipend`), `page`, and
`page_size` up to 100. Companies support `search`, `industry`, `location`, and
safe `ordering` fields. List responses use `{count, next, previous, results}`.

## Verification

```text
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

Create an administrator with `python manage.py createsuperuser`.

For production, serve the WSGI application with Gunicorn rather than
`runserver`:

```text
gunicorn portal.wsgi:application --bind 0.0.0.0:$PORT
```