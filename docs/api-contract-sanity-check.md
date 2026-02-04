# API Contract Sanity Check Checklist

## 1. Authentication & Authorization ✅

- [ ] All endpoints require appropriate authentication (JWT/NextAuth)
- [ ] Unauthenticated requests return 401 with standard error format
- [ ] Token storage and invalidation mechanisms are secure
- [ ] No sensitive data is logged
- [ ] Refresh token endpoint works correctly
- [ ] Password reset flow is implemented with email verification

## 2. Validation ✅

- [ ] All endpoints have ≥3 validation rules per endpoint using Zod
- [ ] Invalid inputs return 400 with detailed error messages
- [ ] Validation errors include field names and error descriptions
- [ ] File upload validation (type, size, format) is implemented
- [ ] Email format validation with proper error messages
- [ ] Password complexity requirements are enforced

## 3. Error Handling ✅

- [ ] Standard error format: {error_code, message, details, request_id}
- [ ] Error codes are consistent across all endpoints
- [ ] Request IDs are unique for each error response
- [ ] Error messages are user-friendly and not ambiguous
- [ ] Stack traces are not exposed to clients
- [ ] All error cases are properly documented

## 4. Pagination & Filtering ✅

- [ ] All list endpoints support pagination (page/size parameters)
- [ ] Pagination defaults are reasonable (page=1, size=10)
- [ ] Maximum page size is limited (100 items)
- [ ] Filtering parameters are validated
- [ ] Sorting parameters (sortBy, sortOrder) are supported
- [ ] Pagination response includes total count and page information

## 5. Response Formats ✅

- [ ] All responses follow JSON API format
- [ ] List responses include data and pagination objects
- [ ] Single resource responses are properly nested
- [ ] Dates are returned in ISO 8601 format
- [ ] Empty states are handled gracefully
- [ ] Success responses include appropriate status codes

## 6. Endpoint Coverage ✅

### Auth Endpoints
- [ ] POST /api/auth/signup (email verify)
- [ ] POST /api/auth/login (JWT/NextAuth)
- [ ] POST /api/auth/refresh (token refresh)
- [ ] POST /api/auth/reset-password (password reset)
- [ ] POST /api/auth/update-password (password change)
- [ ] POST /api/auth/verify-email (email verification)
- [ ] GET /api/auth/me (get profile)

### Profile Endpoints
- [ ] GET /api/profiles/me (get current user profile)
- [ ] PUT /api/profiles/me (update profile)
- [ ] GET /api/profiles/resumes (get resumes with pagination)
- [ ] GET /api/profiles/resumes/:id (get resume by ID)
- [ ] POST /api/profiles/resumes (upload resume)
- [ ] DELETE /api/profiles/resumes/:id (delete resume)
- [ ] POST /api/profiles/resumes/:id/parse (parse resume)
- [ ] GET /api/profiles/personas (get personas with pagination)
- [ ] GET /api/profiles/personas/:id (get persona by ID)
- [ ] POST /api/profiles/personas (create persona)
- [ ] PUT /api/profiles/personas/:id (update persona)
- [ ] DELETE /api/profiles/personas/:id (delete persona)

### Job Endpoints
- [ ] GET /api/jobs/sources (get job sources with pagination)
- [ ] GET /api/jobs/sources/:id (get job source by ID)
- [ ] POST /api/jobs/sources (create job source)
- [ ] PUT /api/jobs/sources/:id (update job source)
- [ ] DELETE /api/jobs/sources/:id (delete job source)
- [ ] GET /api/jobs/postings (get job postings with pagination/filtering)
- [ ] GET /api/jobs/postings/:id (get job posting by ID)
- [ ] POST /api/jobs/ingest (ingest jobs)
- [ ] GET /api/jobs/ingestion-status (get ingestion status)

### Application Endpoints
- [ ] GET /api/applications (get applications with pagination/filtering)
- [ ] GET /api/applications/:id (get application by ID)
- [ ] POST /api/applications (create application)
- [ ] PUT /api/applications/:id (update application)
- [ ] DELETE /api/applications/:id (delete application)
- [ ] POST /api/applications/:id/submit (submit application)
- [ ] GET /api/applications/stats/summary (get application stats)

### Automation Endpoints
- [ ] GET /api/automation/configs (get automation configs with pagination)
- [ ] GET /api/automation/configs/:id (get automation config by ID)
- [ ] POST /api/automation/configs (create automation config)
- [ ] PUT /api/automation/configs/:id (update automation config)
- [ ] DELETE /api/automation/configs/:id (delete automation config)
- [ ] POST /api/automation/configs/:id/toggle (toggle automation config)
- [ ] GET /api/automation/configs/:id/preview (preview automation config)

### Notification Endpoints
- [ ] GET /api/notifications (get notifications with pagination)
- [ ] GET /api/notifications/:id (get notification by ID)
- [ ] PUT /api/notifications/:id/read (mark as read)
- [ ] PUT /api/notifications/read-all (mark all as read)
- [ ] DELETE /api/notifications/:id (delete notification)
- [ ] DELETE /api/notifications/clear (clear notifications)
- [ ] GET /api/notifications/unread-count (get unread count)

## 7. Documentation ✅

- [ ] Swagger/OpenAPI documentation is available at /api/docs
- [ ] All endpoints are documented with summaries and descriptions
- [ ] Request/response examples are provided
- [ ] Required headers and parameters are documented
- [ ] Error responses are documented
- [ ] Authentication requirements are documented

## 8. Security ✅

- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] CSRF protection is implemented
- [ ] Input sanitization is performed
- [ ] Sensitive data is encrypted
- [ ] Rate limiting is implemented

## 9. Performance ✅

- [ ] Responses are compressed
- [ ] Caching headers are set
- [ ] Database queries are optimized
- [ ] File uploads are handled asynchronously
- [ ] Background processing for long-running tasks

## 10. Testing ✅

- [ ] Each endpoint has valid and 2+ invalid test examples
- [ ] Integration tests cover all endpoints
- [ ] Edge cases are tested
- [ ] Load testing is performed
- [ ] Security testing is performed

## Validation Examples

### Signup Endpoint (POST /api/auth/signup)
- **Valid**: {"email": "test@example.com", "password": "Password123!", "firstName": "John", "lastName": "Doe"}
- **Invalid 1**: {"email": "invalid-email", "password": "weak", "firstName": "J", "lastName": "D"}
- **Invalid 2**: {"email": "test@example.com", "password": "password", "firstName": "", "lastName": ""}

### Login Endpoint (POST /api/auth/login)
- **Valid**: {"email": "test@example.com", "password": "Password123!"}
- **Invalid 1**: {"email": "invalid-email", "password": "wrongpassword"}
- **Invalid 2**: {"email": "nonexistent@example.com", "password": "Password123!"}

### Profile Update Endpoint (PUT /api/profiles/me)
- **Valid**: {"headline": "Senior Software Engineer", "summary": "10+ years of experience in web development", "skills": ["JavaScript", "TypeScript", "Node.js"]}
- **Invalid 1**: {"headline": "A", "summary": "Too short", "skills": []}
- **Invalid 2**: {"headline": "".repeat(256), "summary": "".repeat(2001), "skills": [""]}

### Resume Upload Endpoint (POST /api/profiles/resumes)
- **Valid**: File: resume.pdf (PDF, 2MB)
- **Invalid 1**: File: resume.txt (TXT, 5MB)
- **Invalid 2**: File: resume.exe (EXE, 15MB)

### Persona Creation Endpoint (POST /api/profiles/personas)
- **Valid**: {"name": "Frontend Developer", "jobTitle": "Frontend Developer", "experienceLevel": "SENIOR", "skills": ["React", "Vue", "TypeScript"], "summary": "5+ years of frontend development experience"}
- **Invalid 1**: {"name": "F", "jobTitle": "J", "experienceLevel": "INVALID", "skills": [], "summary": "Too short"}
- **Invalid 2**: {"name": "".repeat(101), "jobTitle": "".repeat(101), "experienceLevel": "SENIOR", "skills": ["a".repeat(101)], "summary": "".repeat(2001)}
