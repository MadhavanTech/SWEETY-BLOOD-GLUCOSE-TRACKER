# Sweety – Blood Glucose Tracker

Sweety is a full-stack glucose-reading tracker built for a junior full-stack developer assessment. Users can register, record and manage readings, review trends, and generate downloadable reports. It is an informational tracking tool, not a medical device or a substitute for professional care.

## Features

- JWT-based registration, login, and protected account data.
- Create, edit, list, and delete glucose readings.
- Reading validation: whole-number values from 40 to 600 mg/dL, no future dates, one reading per time slot per day, and at most four readings per day.
- Dashboard summaries and reading history.
- Daily, month-to-date, and previous-month reports with PDF export.
- PostgreSQL constraints and triggers back up reading validation at the database layer.

## Technology

- Frontend: React 19, React Router, Vite, Recharts, and jsPDF.
- Backend: Node.js, Express, Zod, JWT, and bcrypt.
- Database: PostgreSQL.
- Tests: Jest and Supertest.

## Repository layout

```text
Backend/
  db/schema.sql             Idempotent schema and reading constraints/triggers
  scripts/migrate.js        Apply the database schema
  scripts/seed.js           Create the demo account and sample readings
  src/                      Express routes, controllers, services, and validation
  tests/api.test.js         API tests
Frended/
  src/                      React application, pages, components, and styles
  .env.example              Frontend API URL template
README.md                   Setup, API, test, and demo documentation
```

## Prerequisites

- Node.js 20 or newer and npm.
- PostgreSQL 14 or newer, with a database and a role that can create tables, indexes, functions, and triggers.

## Installation and database setup

Create a database and a role with access to it using your PostgreSQL tools. For example, from `psql` as a database administrator:

```sql
CREATE ROLE sweety_app LOGIN PASSWORD 'replace-with-a-local-password';
CREATE DATABASE sweety_glucose_tracker OWNER sweety_app;
```

Use your own local credentials; do not commit them. From the repository root, install each app's dependencies:

```powershell
cd Backend
npm install
Copy-Item .env.example .env
```

Edit `Backend/.env` with your local PostgreSQL connection details and a new JWT secret. `Backend/.env.example` contains the required variable names and safe placeholders. Do not commit `.env`.

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend port; defaults to `5000`. |
| `DATABASE_URL` | PostgreSQL connection string. |
| `JWT_SECRET` | Private signing secret for access tokens. Use a long, random value. |
| `JWT_EXPIRES_IN` | Token lifetime; defaults to `1d`. |
| `CLIENT_URL` | Exact frontend origin allowed by CORS, normally `http://localhost:5173`. |
| `APP_TIME_ZONE` | Time zone for report boundaries and reading-date validation, for example `Asia/Kolkata`. |

Apply the schema and create the demo account:

```powershell
npm run migrate
npm run seed
```

The migration is safe to rerun. It does not remove existing readings. If legacy duplicate slots exist, the database trigger prevents new duplicates; after manually resolving any legacy duplicates, rerun the migration to add the matching unique constraint.

## Start the application

Run the backend in one terminal:

```powershell
cd Backend
npm run dev
```

Run the frontend in a second terminal:

```powershell
cd Frended
npm install
Copy-Item .env.example .env
npm run dev
```

The frontend defaults to `http://localhost:5000/api`; set `VITE_API_URL` in `Frended/.env` only if the backend uses another URL. Open the Vite URL shown in the frontend terminal (normally `http://localhost:5173`).

## Demo login

After running `npm run seed`, sign in with:

- Email: `demo@sweety.local`
- Password: `SweetyDemo2026!`

The seed script hashes the password with bcrypt before storing it. Rerunning the seed resets the demo account password to this documented value and adds only sample readings that do not already exist. Set `DEMO_EMAIL` or `DEMO_PASSWORD` before running the seed command to use alternate demo credentials. Change or remove the demo credentials before using a deployed environment.

## API overview

All endpoints are prefixed with `/api`. Except for health and authentication endpoints, send `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Check API and database availability. |
| `POST` | `/auth/register` | Register a user. |
| `POST` | `/auth/login` | Sign in and receive a JWT. |
| `GET` | `/auth/me` | Get the authenticated user. |
| `GET` | `/readings` | List the authenticated user's readings; optional `startDate` and `endDate`. |
| `POST` | `/readings` | Create a reading. |
| `GET` | `/readings/:id` | Get one of the authenticated user's readings. |
| `PUT` | `/readings/:id` | Update one of the authenticated user's readings. |
| `DELETE` | `/readings/:id` | Delete one of the authenticated user's readings. |
| `GET` | `/dashboard` | Get the authenticated user's dashboard data. |
| `GET` | `/reports/daily?date=YYYY-MM-DD` | Generate a daily report. |
| `GET` | `/reports/month-to-date` | Generate the current month's report. |
| `GET` | `/reports/previous-month` | Generate the previous calendar month's report. |
| `GET` | `/reports?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | Query a report range. |
| `GET` | `/users/me` | Get the authenticated user's profile. |
| `PATCH` | `/users/me` | Update the authenticated user's profile. |
| `PATCH` | `/users/me/password` | Change the authenticated user's password. |

Reading request bodies use `date` (`YYYY-MM-DD`), `time` (`HH:mm`), `category` (`morning_fasting`, `after_breakfast`, `after_lunch`, or `after_dinner`), and `value` (integer mg/dL).

## Tests and production build

Run backend API tests:

```powershell
cd Backend
npm test
```

Run frontend lint and production build:

```powershell
cd Frended
npm run lint
npm run build
```

The API tests use a mocked PostgreSQL pool and do not require a live database. `npm run migrate` applies the real schema; use a disposable PostgreSQL database when manually exercising persistence constraints.

## 2–3 minute demo recording

1. Start PostgreSQL, run the migration and seed commands, then start the backend and frontend.
2. Log in using the demo account and show the dashboard and existing sample readings.
3. Add a valid reading, then briefly show that a decimal, out-of-range value, future date, duplicate time slot, or fifth daily reading is rejected.
4. Open history, edit a reading, and delete one.
5. Show daily and monthly reports, including an empty period if available, then download a PDF.

Capture the screen with the recording tool available on your operating system. Avoid recording real user data, passwords, `.env` files, or tokens.

## Notes and assumptions

- The four allowed categories are the four daily time slots; one reading per category therefore also caps a day at four readings.
- Existing data is preserved during migration. Database triggers protect future writes even if legacy duplicate rows prevent installing a unique constraint immediately.
- Readings and reports are informational and should not be used to diagnose or change treatment.
- Production deployment should use managed secret storage, HTTPS, a restricted database role, regular backups, and a dedicated versioned migration process.
