# InternLink

InternLink is a React and Django REST application for student internships,
employer listings, applications, notifications, and administrator approval.

## Architecture

```text
React/Vite frontend -> Django REST API -> PostgreSQL
```

JWT access and refresh tokens protect authenticated API requests. Refresh
tokens are blacklisted during logout.

## Local development

### Backend

```text
cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The local settings default to SQLite and development mode when `DJANGO_ENV`
is not set. To use PostgreSQL locally, set `DATABASE_URL` or the `DB_*`
variables before running migrations.

### Frontend

```text
cd frontend
npm ci
npm run dev
```

Set `VITE_API_URL` in `frontend/.env` when the API is not at the default local
development URL. See [frontend/.env.example](frontend/.env.example).

## Environment variables

The root [.env.example](.env.example) documents production variables,
including `DJANGO_SECRET_KEY`, `DJANGO_ENV`, `DJANGO_ALLOWED_HOSTS`,
`DATABASE_URL`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `VITE_API_URL`,
`STATIC_ROOT`, and `MEDIA_ROOT`. Never commit `.env` or real credentials.

The optional `add_sample_data` command is development-only. It requires a
local `SAMPLE_DATA_PASSWORD` environment variable and is not part of production
database initialization.

## Production deployment

1. Provision PostgreSQL and create a private database URL.
2. Set the production variables from `.env.example` in the hosting platform.
3. Install backend dependencies with `pip install -r backend/requirements.txt`.
4. Run from `backend/`:

```text
python manage.py check --deploy
python manage.py migrate --noinput
python manage.py collectstatic --noinput
gunicorn portal.wsgi:application --bind 0.0.0.0:$PORT
```

The repository also includes [backend/Procfile](backend/Procfile). Put the
React `frontend/dist` directory behind a static host or web server configured
with an SPA fallback to `index.html`, and set `VITE_API_URL` to the HTTPS API
origin before building:

```text
cd frontend
npm ci
npm run build
```

The API health endpoint is `GET /api/health/`. It returns `200` only when the
Django process can connect to its configured database.

Uploaded resumes use `MEDIA_ROOT`; production hosting must provide persistent
storage for that directory or replace it with persistent object storage before
deploying.

## Administration and verification

Create an administrator securely on the deployment host:

```text
cd backend
python manage.py createsuperuser
```

Run the checks locally before deployment:

```text
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

API documentation is available at `/api/docs/` and the OpenAPI schema at
`/api/schema/`.