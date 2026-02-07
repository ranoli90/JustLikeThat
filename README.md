
# Apply-as-a-Service V1

A modern platform for job application automation and management.

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **Authentication**: NextAuth.js

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **Authentication**: JWT
- **Email**: Nodemailer
- **File Storage**: AWS S3

## Project Structure

```
SimpleAsThat/
├── frontend/             # Next.js application
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   ├── components/  # React components
│   │   ├── services/    # API services
│   │   ├── models/      # TypeScript interfaces
│   │   ├── utils/       # Utility functions
│   │   └── hooks/       # Custom React hooks
│   └── ...
├── backend/              # NestJS application
│   ├── src/
│   │   ├── app/         # Main app module
│   │   ├── modules/     # Feature modules
│   │   ├── controllers/ # API controllers
│   │   ├── services/    # Business logic
│   │   ├── repositories/ # Data access
│   │   ├── entities/    # Database entities
│   │   ├── dto/         # Data transfer objects
│   │   ├── guards/      # Auth guards
│   │   ├── decorators/  # Custom decorators
│   │   └── interfaces/  # TypeScript interfaces
│   └── ...
├── shared/              # Shared code between frontend/backend
│   ├── interfaces/
│   ├── dto/
│   └── constants/
└── docs/               # Documentation
```

## Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js 18+** and npm
- **PostgreSQL 13+** database server
- **Redis** (optional, for caching and sessions)
- **ClickHouse** (optional, for analytics)
- **Docker & Docker Compose** (for local development with all services)

## Environment Configuration

### Frontend Environment Variables

Copy the example environment file and configure it:

```bash
cd frontend
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:3001`)

### Backend Environment Variables

Copy the example environment file and configure it:

```bash
cd backend
cp .env.example .env
```

**Required variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret (minimum 32 characters)
- `JWT_REFRESH_SECRET`: Refresh token signing secret (minimum 32 characters)
- `ENCRYPTION_KEY`: Data encryption key (minimum 32 characters)
- `ENCRYPTION_SALT`: Encryption salt string
- `MFA_ENCRYPTION_KEY`: MFA encryption key (minimum 32 characters)

**Database setup:**
```bash
# Create PostgreSQL database
createdb simpleasthat

# Run Prisma migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate
```

**Optional services:**
- **Redis**: For session storage and caching
- **ClickHouse**: For advanced analytics
- **AWS S3**: For file storage
- **SMTP**: For email notifications

## Setup Instructions

### Option 1: Docker Compose (Recommended for Development)

```bash
# Start all services
docker-compose up -d

# The application will be available at:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Database: localhost:5432
# Redis: localhost:6379
# ClickHouse: localhost:8123
```

### Option 2: Manual Setup

#### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database and service configurations

# Database setup
npm run prisma:migrate
npm run prisma:generate

# Start development server
npm run start:dev
```

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API URL

# Start development server
npm run dev
```

## Development

### Available Scripts

#### Backend
```bash
npm run start:dev      # Development server with hot reload
npm run start:prod     # Production server
npm run build          # Build for production
npm run test           # Run tests
npm run prisma:studio  # Open Prisma Studio for database management
npm run prisma:migrate # Apply database migrations
```

#### Frontend
```bash
npm run dev            # Development server
npm run build          # Build for production
npm run start          # Production server
npm run lint           # Run ESLint
npm run test           # Run tests
```

## API Documentation

- **Swagger UI**: `http://localhost:3001/api`
- **API Schema**: `http://localhost:3001/api-json`

## Database Management

Use Prisma Studio for database management:

```bash
cd backend
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555` for viewing and editing data.

## Development

### Backend Commands

```bash
npm run start:dev    # Start development server
npm run build        # Build production version
npm run start        # Start production server
npm run prisma:migrate # Create and apply migrations
npm run prisma:studio # Open Prisma Studio
```

### Frontend Commands

```bash
npm run dev          # Start development server
npm run build        # Build production version
npm run start        # Start production server
npm run lint         # Run ESLint
```

## API Documentation

Backend API documentation is available at:
- Swagger UI: `http://localhost:3001/api`
- API Schema: `http://localhost:3001/api-json`

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License.
