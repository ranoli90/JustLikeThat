# Sprint 1 Summary Snapshot: Apply-as-a-Service V1

## 1. Production-Grade Multi-Tenant SaaS Architecture

### High-Level Architecture Overview
The Apply-as-a-Service (AaS) platform is built as a multi-tenant SaaS application with the following core components:

```
┌───────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                          │
│  - Dashboard (Role Discovery, Application Tracking)          │
│  - Onboarding Flow (Profile, Preferences, Interview)         │
│  - Admin Portal (Tenant Management, Audit)                   │
└───────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────┐
│                     NestJS Backend                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐     │
│  │  AuthModule  │ │ProfileModule │ │JobIngestionModule│     │
│  └──────────────┘ └──────────────┘ └──────────────────┘     │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐ │
│  │ MatchingModule   │ │ ApplicationOrch  │ │NotificationM │ │
│  └──────────────────┘ └──────────────────┘ └──────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐     │
│  │ ConfigModule │ │ AuditModule  │ │ CredentialVault  │     │
│  └──────────────┘ └──────────────┘ └──────────────────┘     │
└───────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────┐
│              PostgreSQL (Prisma ORM + pgvector)               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐     │
│  │  Core Entities│ │  Relations   │ │  Vector Storage │     │
│  └──────────────┘ └──────────────┘ └──────────────────┘     │
└───────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────┐
│                     Background Processing                     │
│  - BullMQ for Job Ingestion & Matching                       │
│  - Redis for Queue Management & Caching                      │
│  - LLM Integration (GPT-4o Mini, Llama 3.1)                  │
└───────────────────────────────────────────────────────────────┘
```

### NestJS Module Architecture

#### 1. AuthModule
- **Purpose**: Handles user authentication, authorization, and tenant scoping
- **Key Controllers**: `AuthController` (login, signup, refresh token)
- **Services**: `AuthService`, `JwtStrategy`
- **Models Used**: `User`, `Tenant`, `CredentialVaultEntry`
- **Frontend Integration**: Login, signup, password recovery pages

#### 2. ProfileModule
- **Purpose**: Manages candidate profiles and personas
- **Key Controllers**: `ProfileController` (CRUD operations, profile completeness)
- **Services**: `ProfileService`, `CanonicalProfileBuilder`
- **Models Used**: `CanonicalProfile`, `Persona`, `User`
- **Frontend Integration**: Profile builder, resume upload, persona management

#### 3. JobIngestionModule
- **Purpose**: Handles job discovery, parsing, and storage
- **Key Controllers**: `JobIngestionController` (source management, ingestion status)
- **Services**: `JobIngestionService`, `JobParserService`
- **Models Used**: `JobSource`, `JobPosting`, `AutomationConfig`
- **Background Processing**: BullMQ for async job discovery and parsing
- **Frontend Integration**: Job source configuration, ingestion status dashboard

#### 4. MatchingModule
- **Purpose**: Scores and matches profiles with job postings
- **Key Controllers**: `MatchingController` (match query, scoring configuration)
- **Services**: `MatchingService`, `ScoringService`, `EmbeddingService`
- **Models Used**: `JobPosting`, `CanonicalProfile`, `Persona`
- **Background Processing**: BullMQ for async matching with pgvector similarity
- **Frontend Integration**: Match results, scoring explanations, filter configuration

#### 5. ApplicationOrchestratorModule
- **Purpose**: Manages end-to-end application process
- **Key Controllers**: `ApplicationController` (submission, tracking, status)
- **Services**: `ApplicationOrchestrator`, `ResumeTailorService`
- **Models Used**: `Application`, `JobPosting`, `CanonicalProfile`, `AutomationConfig`
- **Background Processing**: BullMQ for async application submission
- **Frontend Integration**: Application tracking, submission history, anti-spam settings

#### 6. NotificationModule
- **Purpose**: Handles user notifications and alerts
- **Key Controllers**: `NotificationController` (CRUD operations, preferences)
- **Services**: `NotificationService`, `EmailService`, `PushNotificationService`
- **Models Used**: `Notification`, `User`
- **Frontend Integration**: Notification center, preference settings

#### 7. ConfigModule
- **Purpose**: Manages system and tenant-specific configurations
- **Key Controllers**: `ConfigController` (configuration management)
- **Services**: `ConfigService`
- **Models Used**: `Config`
- **Frontend Integration**: Admin portal, tenant settings

#### 8. AuditModule
- **Purpose**: Tracks system and user activities
- **Key Controllers**: `AuditController` (log retrieval, reporting)
- **Services**: `AuditService`
- **Models Used**: `AuditLog`
- **Frontend Integration**: Audit dashboard, compliance reporting

## 2. Core Entities & Prisma Models

### 1. Tenant
- **Purpose**: Represents a multi-tenant organization or individual user group
- **Key Fields**:
  - `id` (UUID): Primary identifier
  - `name` (String): Tenant name
  - `slug` (String): Unique slug for subdomain routing
  - `plan` (Enum): Subscription plan (free, pro, enterprise)
  - `status` (Enum): Active, suspended, trial
  - `createdAt` (DateTime): Creation timestamp
  - `updatedAt` (DateTime): Last update timestamp
- **Relations**:
  - `@relation("TenantUsers", fields: [id], references: [tenantId])`: One-to-many with User
  - `@relation("TenantJobSources", fields: [id], references: [tenantId])`: One-to-many with JobSource
  - `@relation("TenantApplications", fields: [id], references: [tenantId])`: One-to-many with Application
- **Tenant Scoping**: All related entities include `tenantId` foreign key

### 2. User
- **Purpose**: Represents a platform user with authentication and profile information
- **Key Fields**:
  - `id` (UUID): Primary identifier
  - `tenantId` (UUID): Tenant foreign key
  - `email` (String): Unique email (per tenant)
  - `passwordHash` (String): Hashed password
  - `firstName` (String): First name
  - `lastName` (String): Last name
  - `avatarUrl` (String, nullable): Avatar image URL
  - `onboardingCompleted` (Boolean): Onboarding status
  - `createdAt` (DateTime): Creation timestamp
  - `updatedAt` (DateTime): Last update timestamp
- **Relations**:
  - `@relation("UserProfile", fields: [id], references: [userId])`: One-to-one with CanonicalProfile
  - `@relation("UserPreferences", fields: [id], references: [userId])`: One-to-one with UserPreferences
  - `@relation("UserApplications", fields: [id], references: [userId])`: One-to-many with Application
- **Tenant Scoping**: `tenantId` field for isolation

### 3. CanonicalProfile
- **Purpose**: Represents the structured candidate profile with parsed resume data and interview insights
- **Key Fields**:
  - `id` (UUID): Primary identifier
  - `tenantId` (UUID): Tenant foreign key
  - `userId` (UUID): User foreign key
  - `headline` (String, nullable): Professional headline
  - `summary` (Text, nullable): Professional summary
  - `experiences` (JSONB): Work experience entries
  - `education` (JSONB): Education history
  - `skills` (JSONB): Technical and soft skills
  - `certifications` (JSONB, nullable): Professional certifications
  - `projects` (JSONB, nullable): Portfolio projects
  - `languages` (JSONB, nullable): Language proficiency
  - `completenessScore` (Float): Profile completeness (0-100)
  - `createdAt` (DateTime): Creation timestamp
  - `updatedAt` (DateTime): Last update timestamp
- **Relations**:
  - `@relation("ProfilePersonas", fields: [id], references: [profileId])`: One-to-many with Persona
- **Tenant Scoping**: `tenantId` field for isolation

### 4. Persona
- **Purpose**: Role-specific profile variations for targeted applications
- **Key Fields**:
  - `id` (UUID): Primary identifier
  - `tenantId` (UUID): Tenant foreign key
  - `profileId` (UUID): Canonical profile foreign key
  - `name` (String): Persona name (e.g., "Senior Software Engineer")
  - `jobTitle` (String): Target job title
  - `experienceLevel` (Enum): Junior, Mid, Senior, Lead
  - `skills` (JSONB): Role-specific skills
  - `summary` (Text, nullable): Role-specific summary
  - `embedding` (Vector, 1536 dimensions): Pinecone vector embedding
  - `createdAt` (DateTime): Creation timestamp
  - `updatedAt` (DateTime): Last update timestamp
- **Relations**:
  - `@relation("PersonaApplications", fields: [id], references: [personaId])`: One-to-many with Application
- **Tenant Scoping**: `tenantId` field for isolation

### 5. JobSource
- **Purpose**: Represents job board or ATS integration configuration
- **Key Fields**:
  - `id` (UUID): Primary identifier
  - `tenantId` (UUID): Tenant foreign key
  - `name` (String): Source name (LinkedIn, Indeed, Glassdoor)
  - `type` (Enum): API, scraping, ATS
  - `riskLevel` (Enum): Low, Medium, High (based on scraping complexity)
  - `credentials` (JSONB): Authentication credentials
  - `isActive` (Boolean): Activation status
  - `rateLimit` (Int, nullable): API rate limits
  - `createdAt` (DateTime): Creation timestamp
  - `updatedAt` (DateTime): Last update timestamp
- **Relations**:
  - `@relation("JobSourcePostings", fields: [id], references: [jobSourceId])`: One-to-many with JobPosting
- **Tenant Scoping**: `tenantId` field for isolation

### 6. JobPosting
- **Purpose**: Represents a parsed job posting with structured data
- **Key Fields**:
  - `id` (UUID): Primary identifier
  - `tenantId` (UUID): Tenant foreign key
  - `jobSourceId` (UUID): Job source foreign key
  - `externalId` (String, nullable): External job board identifier
  - `title` (String): Job title
  - `company` (String): Company name
  - `location` (String): Job location
  - `remotePreference` (Enum): Remote, Hybrid, Onsite
  - `jobType` (Enum): FullTime, PartTime, Contract, Internship
  - `salaryRange` (JSONB, nullable): Salary information
  - `description` (Text): Job description
  - `requirements` (JSONB): Key requirements
  - `skills` (JSONB): Required skills
  - `experiences` (JSONB): Experience requirements
  - `applyUrl` (String): Direct application URL
  - `embedding` (Vector, 1536 dimensions): Pinecone vector embedding
  - `isExpired` (Boolean): Expiration status
  - `createdAt` (DateTime): Creation timestamp
  - `updatedAt` (DateTime): Last update timestamp
- **Relations**:
  - `@relation("JobApplications", fields: [id], references: [jobPostingId])`: One-to-many with Application
- **Tenant Scoping**: `tenantId` field for isolation

### 7. Application
- **Purpose**: Tracks the entire application process for a job posting
- **Key Fields**:
  - `id` (UUID): Primary identifier
  - `tenantId` (UUID): Tenant foreign key
  - `userId` (UUID): User foreign key
  - `jobPostingId` (UUID): Job posting foreign key
  - `personaId` (UUID, nullable): Persona used for application
  - `status` (Enum): Draft, Submitted, Rejected, Interviewing, Offer
  - `submissionDate` (DateTime, nullable): When application was submitted
  - `tailoredResumeUrl` (String, nullable): URL to tailored resume
  - `coverLetterUrl` (String, nullable): URL to generated cover letter
  - `applicationData` (JSONB, nullable): Form data and answers
  - `antiSpamScore` (Float): Anti-spam compliance score (0-100)
  - `createdAt` (DateTime): Creation timestamp
  - `updatedAt` (DateTime): Last update timestamp
- **Tenant Scoping**: `tenantId` field for isolation

### 8. AutomationConfig
- **Purpose**: Defines automation rules for job applications
- **Key Fields**:
  - `id` (UUID): Primary identifier
  - `tenantId` (UUID): Tenant foreign key
  - `userId` (UUID): User foreign key
  - `name` (String): Configuration name
  - `minMatchScore` (Float): Minimum match score to apply
  - `autoApply` (Boolean): Auto-apply enabled
  - `timezone` (String): Application timezone
  - `schedule` (JSONB, nullable): Application schedule
  - `antiSpamSettings` (JSONB): Anti-spam guardrail configuration
  - `createdAt` (DateTime): Creation timestamp
  - `updatedAt` (DateTime): Last update timestamp
- **Tenant Scoping**: `tenantId` field for isolation

### 9. CredentialVaultEntry
- **Purpose**: Securely stores user credentials for job boards and ATS
- **Key Fields**:
  - `id` (UUID): Primary identifier
  - `tenantId` (UUID): Tenant foreign key
  - `userId` (UUID): User foreign key
  - `provider` (String): Credential provider (LinkedIn, Indeed, etc.)
  - `encryptedData` (Text): Encrypted credential data
  - `lastUsedAt` (DateTime, nullable): Last usage timestamp
  - `expiresAt` (DateTime, nullable): Expiration timestamp
  - `isActive` (Boolean): Activation status
  - `createdAt` (DateTime): Creation timestamp
  - `updatedAt` (DateTime): Last update timestamp
- **Tenant Scoping**: `tenantId` field for isolation

### 10. Config
- **Purpose**: Stores system and tenant-specific configuration settings
- **Key Fields**:
  - `id` (UUID): Primary identifier
  - `tenantId` (UUID, nullable): Tenant foreign key (null for system-wide)
  - `key` (String): Configuration key
  - `value` (Text): Configuration value
  - `description` (String, nullable): Configuration description
  - `isSecret` (Boolean): Secret flag (encrypts value)
  - `createdAt` (DateTime): Creation timestamp
  - `updatedAt` (DateTime): Last update timestamp
- **Tenant Scoping**: `tenantId` field for isolation (nullable for system config)

### 11. AuditLog
- **Purpose**: Tracks system and user activities for compliance
- **Key Fields**:
  - `id` (UUID): Primary identifier
  - `tenantId` (UUID, nullable): Tenant foreign key (null for system events)
  - `userId` (UUID, nullable): User foreign key (null for system events)
  - `action` (String): Event type (CREATE, UPDATE, DELETE, LOGIN, etc.)
  - `resourceType` (String): Target resource type
  - `resourceId` (String, nullable): Target resource identifier
  - `details` (JSONB, nullable): Event details
  - `ipAddress` (String, nullable): Client IP address
  - `createdAt` (DateTime): Creation timestamp
- **Tenant Scoping**: `tenantId` field for isolation (nullable for system events)

### 12. Notification
- **Purpose**: Tracks user notifications and alerts
- **Key Fields**:
  - `id` (UUID): Primary identifier
  - `tenantId` (UUID): Tenant foreign key
  - `userId` (UUID): User foreign key
  - `type` (Enum): Email, Push, InApp
  - `title` (String): Notification title
  - `content` (Text): Notification content
  - `isRead` (Boolean): Read status
  - `priority` (Enum): Low, Medium, High
  - `expiresAt` (DateTime, nullable): Expiration timestamp
  - `createdAt` (DateTime): Creation timestamp
- **Tenant Scoping**: `tenantId` field for isolation

## 3. Textual Architecture Diagram

```
Frontend Pages ←→ NestJS Controllers ←→ Services ←→ Repositories ←→ Prisma Models
──────────────────────────────────────────────────────────────────────────────────

1. Dashboard (Next.js)
   ↓
   ApplicationController ← ApplicationOrchestratorModule
   ↓
   ApplicationService ←→ ApplicationRepository ←→ Application Model
   MatchingController ← MatchingModule
   ↓
   MatchingService ←→ JobPostingRepository, CandidateProfileRepository
   ↓
   JobPosting Model, CanonicalProfile Model, Persona Model

2. Profile Builder (Next.js)
   ↓
   ProfileController ← ProfileModule
   ↓
   ProfileService ←→ CanonicalProfileRepository, PersonaRepository
   ↓
   CanonicalProfile Model, Persona Model, User Model

3. Job Sources (Next.js)
   ↓
   JobIngestionController ← JobIngestionModule
   ↓
   JobIngestionService ←→ JobSourceRepository, JobPostingRepository
   ↓
   JobSource Model, JobPosting Model

4. Settings (Next.js)
   ↓
   AuthController ← AuthModule
   UserController ← UserModule
   ↓
   AuthService, UserService ←→ UserRepository, CredentialVaultRepository
   ↓
   User Model, CredentialVaultEntry Model, Config Model

5. Notifications (Next.js)
   ↓
   NotificationController ← NotificationModule
   ↓
   NotificationService ←→ NotificationRepository
   ↓
   Notification Model

6. Admin Portal (Next.js)
   ↓
   ConfigController ← ConfigModule
   AuditController ← AuditModule
   ↓
   ConfigService, AuditService ←→ ConfigRepository, AuditLogRepository
   ↓
   Config Model, AuditLog Model, Tenant Model
```

## 4. Gaps/Missing Fields

### Current Entity Gaps

1. **Tenant Entity**: Missing from current implementation
2. **Persona Entity**: Missing from current implementation
3. **JobSource Entity**: Missing from current implementation  
4. **JobPosting Entity**: Missing from current implementation
5. **Application Entity**: Missing from current implementation
6. **AutomationConfig Entity**: Missing from current implementation
7. **CredentialVaultEntry Entity**: Missing from current implementation
8. **Config Entity**: Missing from current implementation
9. **AuditLog Entity**: Missing from current implementation
10. **Notification Entity**: Missing from current implementation

### Existing Entity Improvements

1. **User Entity**: Add `tenantId` field for multi-tenancy
2. **CandidateProfile Entity**: Add `tenantId`, `completenessScore`, and `userId` fields
3. **UserPreferences Entity**: Add `tenantId` field and restructure to JSONB for flexibility

### Prisma Integration

- Switch from TypeORM to Prisma for better type safety and developer experience
- Implement pgvector for vector storage and similarity searches
- Add soft delete support for all entities
- Implement row-level security (RLS) for tenant isolation

## 5. Assumptions for Human Review

### Technical Assumptions
1. **Prisma ORM Migration**: Existing TypeORM entities will be migrated to Prisma schema
2. **pgvector Integration**: PostgreSQL with pgvector extension will handle vector storage
3. **BullMQ for Queues**: Job ingestion, matching, and application processing will use BullMQ
4. **Redis for Caching**: Redis will handle session storage and application caching
5. **Multi-Tenant Architecture**: All entities will be tenant-scoped with `tenantId` field
6. **API Rate Limiting**: Job board APIs will allow reasonable rate limits for scraping
7. **LLM Performance**: GPT-4o Mini will provide acceptable parsing and tailoring at scale
8. **Security Measures**: Encryption at rest and in transit will protect sensitive data

### Business Assumptions
1. **User Onboarding**: Users will complete persona creation during onboarding
2. **Anti-Spam Effectiveness**: Rate limiting and CAPTCHA-solving will prevent account bans
3. **Job Board Compatibility**: Major job boards will have scraping-friendly policies or APIs
4. **Application Quality**: AI-generated resumes will meet 85/100 quality standards
5. **Cost Optimization**: Infrastructure + LLM costs will stay < $5/active user/month
6. **Compliance**: The platform will comply with US labor laws and anti-spam regulations

## 6. Sprint 1 Summary Snapshot

### Project Overview
The Apply-as-a-Service platform is being refactored into a production-grade multi-tenant SaaS application with NestJS backend, Prisma ORM, and Next.js frontend. This architecture supports automated job applications through resume parsing, conversational interviews, and AI-powered role matching.

### Sprint 1 Key Deliverables

#### 1. Multi-Tenant Architecture Design
- Tenant isolation with `tenantId` field across all entities
- Subdomain-based routing for tenant access
- Role-based access control (RBAC) implementation

#### 2. Prisma Schema Migration
- Migration from TypeORM to Prisma ORM
- Implementation of all core entities with relations
- Integration of pgvector extension for embeddings

#### 3. NestJS Module Architecture
- Creation of 8 specialized NestJS modules
- Implementation of services, controllers, and repositories
- Configuration of BullMQ for background processing

#### 4. Database Architecture
- PostgreSQL database design with tenant isolation
- Vector storage for semantic search capabilities
- Audit logging and compliance tracking

#### 5. Background Processing System
- BullMQ integration for job ingestion and matching
- Redis setup for queue management and caching
- Error handling and retry mechanisms

#### 6. Security & Compliance
- Encryption at rest and in transit for all user data
- Role-based access control (RBAC) implementation
- Audit logging for compliance requirements

#### 7. Frontend Architecture
- Next.js app router implementation
- Tenant-scoped API calls and data management
- Dashboard and application tracking features

### Current Project State
The project has completed Sprint 0 planning and is now in Sprint 1 implementation phase with:
- Existing frontend foundation using Next.js 14
- Existing backend foundation using NestJS
- Current TypeORM entities being migrated to Prisma
- New architecture documentation completed
- Module and service structure defined

### Sprint 1 Timeline & Goals
- **Week 1**: Prisma schema migration and NestJS module setup
- **Week 2**: Database implementation and background processing system
- **Week 3**: Tenant isolation and security measures
- **Week 4**: Frontend integration and initial testing

### Launch Strategy
After Sprint 1 completion, the platform will enter alpha testing with 20-50 users for feedback and validation of the multi-tenant architecture and core features.
