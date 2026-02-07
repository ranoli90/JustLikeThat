# JustLikeThat — Job Application Platform

A full-stack job application platform that helps candidates find, match, and apply to jobs with automation support.

## Tech Stack

- **Backend:** NestJS 11, Prisma ORM, PostgreSQL, JWT Auth, Zod validation
- **Frontend:** Next.js, React 18, Tailwind CSS, Axios
- **Infrastructure:** Docker Compose, MailHog (dev email)

## Features (MVP)

- User signup/login with JWT authentication and email verification
- Candidate profile & persona management
- Resume upload and storage
- Job listing, search, and filtering
- Weighted job matching algorithm (skills, experience, salary, location)
- Application CRUD with state machine (Draft → Submitted → Interviewing → Offer → Accepted)
- Automation rules for auto-applying to matching jobs
- In-app and email notifications
- Onboarding intake flow

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### 1. Clone and configure

```bash
git clone <repo-url> && cd JustLikeThat
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Start with Docker Compose

```bash
docker-compose up -d
```

This starts:
- **Backend** at http://localhost:3001
- **Frontend** at http://localhost:3000
- **PostgreSQL** at localhost:5432
- **MailHog** UI at http://localhost:8025

### 3. Run database migrations and seed

```bash
cd backend
npm ci
npx prisma migrate dev --name init
npm run prisma:seed
```

### 4. Demo credentials

After seeding:
- **Email:** demo@justlikethat.app
- **Password:** password123

## Development (without Docker)

```bash
# Backend
cd backend
npm ci
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev

# Frontend (separate terminal)
cd frontend
npm ci
npm run dev
```

## API Documentation

Swagger UI available at http://localhost:3001/docs when the backend is running.

## Project Structure

```
├── backend/
│   ├── prisma/           # Schema, migrations, seed
│   ├── src/
│   │   ├── modules/      # NestJS feature modules
│   │   │   ├── auth/         # JWT authentication
│   │   │   ├── user/         # User management
│   │   │   ├── profile/      # Candidate profile & personas
│   │   │   ├── resume/       # Resume upload/storage
│   │   │   ├── job-ingestion/# Job listings & search
│   │   │   ├── matching/     # Job matching algorithm
│   │   │   ├── application/  # Application CRUD & state machine
│   │   │   ├── automation/   # Auto-apply rules
│   │   │   ├── notification/ # Email & in-app notifications
│   │   │   ├── intake/       # Onboarding flow
│   │   │   └── prisma/       # Prisma service (global)
│   │   ├── dto/          # Zod validation schemas
│   │   ├── guards/       # JWT auth guard
│   │   ├── pipes/        # Zod validation pipe
│   │   └── filters/      # HTTP exception filter
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   ├── components/   # React components
│   │   ├── context/      # Auth context provider
│   │   └── services/     # API service layer
│   └── Dockerfile
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | (required) |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_REFRESH_SECRET` | Refresh token secret | (required) |
| `PORT` | Server port | `3001` |
| `FRONTEND_URL` | Frontend URL for CORS/emails | `http://localhost:3000` |
| `SMTP_HOST` | SMTP server host | `localhost` |
| `SMTP_PORT` | SMTP server port | `1025` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001` |

## Scripts

### Backend

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start in watch mode |
| `npm run build` | Build for production |
| `npm run test` | Run all tests |
| `npm run test:unit` | Run unit tests |
| `npm run lint` | Lint and fix |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:seed` | Seed database with demo data |
| `npm run prisma:studio` | Open Prisma Studio GUI |

## License

Proprietary — All rights reserved.
