# InternLink

InternLink is a React application for student internships, employer listings,
applications, notifications, and administrator approval. The active data layer
is Firebase Authentication, Cloud Firestore, and Firebase Storage. Django is
retained temporarily for the one-time data migration and rollback path.

## Architecture

```text
React/Vite frontend -> Firebase Authentication/Firestore/Storage
```

JWT access and refresh tokens protect authenticated API requests. Refresh
tokens are blacklisted during logout.

## Firebase setup

1. Create a Firebase project at https://console.firebase.google.com.
2. Register a Web App and copy its configuration values into
	`frontend/.env` using [frontend/.env.example](frontend/.env.example).
3. Enable Email/Password under **Authentication > Sign-in method**.
4. Create a Cloud Firestore database in production mode.
5. Enable Firebase Storage for resume uploads.
6. Install the Firebase CLI and authenticate:

```text
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes,storage
```

The web configuration is not an Admin SDK credential. Never commit a Firebase
service-account JSON file.

Firebase Admin claims are required for the admin UI. Set an `admin: true`
custom claim using a protected server-side Admin SDK procedure, then make the
admin sign in again so the claim appears in the ID token.

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

Create `frontend/.env` from `frontend/.env.example`, fill in the Firebase Web
App values, then run `npm run dev`. The frontend no longer requires Axios or a
Django API for normal application flows.

## Environment variables

The root [.env.example](.env.example) documents Firebase Web App variables and
the optional migration variables. Never commit `.env`, Firebase service-account
JSON, or real credentials.

The optional `add_sample_data` command is development-only. It requires a
local `SAMPLE_DATA_PASSWORD` environment variable and is not part of production
database initialization.

## Data migration

The existing local database contains development data. Before removing Django
or PostgreSQL, install the migration-only dependency and run:

```text
cd backend
pip install -r migration_requirements.txt
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\secure\firebase-service-account.json"
$env:FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
python scripts/migrate_to_firebase.py
```

The script migrates users, companies, internships, and applications. Password
hashes are never copied; existing users must complete Firebase password-reset
onboarding. Resume file bytes require a separate Storage copy after verifying
the Firestore records.

Do not remove the Django database until this migration and a Firebase data
verification pass are complete.

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

The repository also includes [backend/Procfile](backend/Procfile). The normal
frontend flow uses Firebase directly, so the Django API does not need to be
publicly deployed for the website to work. Deploy the repository as a Vercel
project using the root `vercel.json` (or set the Vercel Root Directory to
`frontend`) and set all `VITE_FIREBASE_*` variables from
`frontend/.env.example` before building:

```text
cd frontend
npm ci
npm run build
```

Before the first production launch, deploy and verify the Firestore and Storage
rules, enable Email/Password Authentication, create the required indexes if
Firebase prompts for them, and configure an `admin: true` custom claim for at
least one administrator. Test registration, login, internship posting,
application submission, employer application review, resume download, and
admin approval against the production Firebase project.

Firebase replaces the normal API health endpoint. Verify Authentication,
Firestore rules, Storage rules, and the frontend build before deploying to
Vercel.

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