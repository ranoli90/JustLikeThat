
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

- Node.js 18+ and npm
- PostgreSQL
- AWS account (for S3 storage)
- Email provider (SMTP server)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SimpleAsThat
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Create database and run migrations
npm run prisma:migrate

# Start development server
npm run start:dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

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
