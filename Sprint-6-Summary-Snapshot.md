# Sprint 6 Summary Snapshot

## Objective

Implement the Application State Machine in NestJS to manage the complete lifecycle of job applications, from draft to submission, with state transitions, autonomy modes, concurrency controls, and prevention rules.

## Key Features

### 1. Application Lifecycle States and Transitions

Defined comprehensive state machine with 8 states:

- **DRAFT**: Initial state for new applications
- **PENDING_TAILORING**: Waiting for resume/cover letter tailoring
- **TAILORED**: Documents have been tailored to job requirements
- **PENDING_APPLICATION**: Ready for submission
- **SUBMITTED**: Application sent to employer
- **ACCEPTED**: Employer accepted the application
- **REJECTED**: Employer rejected the application
- **WITHDRAWN**: User withdrew the application

### 2. State Transition Service with Validation Logic

[`application.state-machine.ts`](backend/src/modules/application/application.state-machine.ts) provides:
- Valid transition checking
- Transition execution with validation
- Terminal state detection
- Modification permission checking

### 3. Autonomy Modes

Three levels of automation:
- **0: Manual**: User controls all aspects of the application
- **1: Semi-Automatic**: System assists with tailoring and submission
- **2: Fully Automatic**: Complete end-to-end automation

### 4. Concurrency Controls and Caps

- Concurrency cap: 20 active applications per user
- Prevents excessive application creation
- Checks active applications before new creation

### 5. Mid-Stream Changes

Allows users to:
- **Pause**: Return application to DRAFT state from active states
- **Modify**: Update application details in modifiable states
- **Cancel**: Withdraw application at any state

### 6. Validation: State Transition Scenarios

| Current State       | Valid Target States                          | Reason                                                                 |
|---------------------|----------------------------------------------|----------------------------------------------------------------------|
| DRAFT               | PENDING_TAILORING, WITHDRAWN                 | Start tailoring or cancel application                                |
| PENDING_TAILORING   | TAILORED, DRAFT, WITHDRAWN                   | Complete tailoring, pause, or cancel                                 |
| TAILORED            | PENDING_APPLICATION, PENDING_TAILORING, WITHDRAWN | Ready for submission, re-tailor, or cancel                           |
| PENDING_APPLICATION | SUBMITTED, TAILORED, WITHDRAWN                | Submit, re-tailor, or cancel                                         |
| SUBMITTED           | ACCEPTED, REJECTED, WITHDRAWN                 | Employer decision or user withdrawal                                  |
| ACCEPTED            |                                               | Terminal state                                                       |
| REJECTED            |                                               | Terminal state                                                       |
| WITHDRAWN           |                                               | Terminal state                                                       |

### 7. Prevention Rules

[`application-prevention.service.ts`](backend/src/modules/application/application-prevention.service.ts) implements:

#### Duplicate Application Check
- Prevents duplicate applications to the same job
- Ignores withdrawn or rejected applications

#### Rate Limiting
- 50 applications per hour per user
- Prevents rapid application creation

#### Spam Detection
- Detects rapid application patterns (10+ applications in 1 minute)
- Blocks potential spam applications

### 8. Assumptions for Human Review

1. **State Transitions**: Valid transitions are predefined and based on standard application workflows
2. **Concurrency Limits**: 20 active applications per user is a reasonable default
3. **Rate Limiting**: 50 applications per hour prevents spam while allowing active job seekers
4. **Spam Detection**: Rapid application patterns indicate potential spam behavior
5. **Duplicate Check**: Only active applications (not withdrawn/rejected) count as duplicates
6. **Autonomy Modes**: Users understand and accept the level of automation they choose
7. **Terminal States**: Once accepted/rejected/withdrawn, applications cannot be modified
8. **Mid-Stream Changes**: Pausing and canceling are valid user actions at most states

## Implementation Details

### NestJS ApplicationModule

#### Entity: [`application.entity.ts`](backend/src/entities/application.entity.ts)
- Stores application data with state and autonomy mode
- Links to User and JobPosting entities
- Tracks submission and withdrawal times
- Supports metadata for additional information

#### Service: [`application.service.ts`](backend/src/modules/application/application.service.ts)
- `getApplications()`: Returns user's applications with pagination
- `createApplication()`: Creates new application with prevention checks
- `updateApplication()`: Updates application in modifiable states
- `deleteApplication()`: Deletes application in early states
- `submitApplication()`: Submits application to employer
- `transitionState()`: Validates and transitions states
- `pauseApplication()`: Sets application to draft state
- `cancelApplication()`: Withdraws application
- `setAutonomyMode()`: Updates automation level
- `getApplicationStats()`: Returns user's application statistics

#### Controller: [`application.controller.ts`](backend/src/modules/application/application.controller.ts)
- `GET /api/applications`: Returns user's applications
- `GET /api/applications/:id`: Returns specific application
- `POST /api/applications`: Creates new application
- `PUT /api/applications/:id`: Updates application
- `DELETE /api/applications/:id`: Deletes application
- `POST /api/applications/:id/submit`: Submits application
- `POST /api/applications/:id/transition`: Transitions application state
- `POST /api/applications/:id/pause`: Pauses application
- `POST /api/applications/:id/cancel`: Cancels application
- `PUT /api/applications/:id/autonomy`: Sets autonomy mode
- `GET /api/applications/stats/summary`: Returns application statistics

#### State Machine: [`application.state-machine.ts`](backend/src/modules/application/application.state-machine.ts)
- Validates transitions between states
- Prevents invalid state changes
- Provides terminal state and modification permission checks

#### Prevention Service: [`application-prevention.service.ts`](backend/src/modules/application/application-prevention.service.ts)
- `checkDuplicate()`: Checks for duplicate applications
- `checkRateLimit()`: Ensures rate limits are not exceeded
- `checkSpam()`: Detects rapid application patterns
- `checkAll()`: Comprehensive prevention check

#### Module: [`application.module.ts`](backend/src/modules/application/application.module.ts)
- Imports TypeOrmModule for Application entity
- Exports ApplicationService for module dependencies
- Provides state machine and prevention service

### Architecture Changes

#### Database Entities
- Added Application entity with state and autonomy mode fields
- Updated TypeORM configuration to include new entity

#### Module Dependencies
- Added ApplicationModule to AppModule imports
- ApplicationModule uses TypeOrmModule for feature injection

## Next Steps

1. Implement integration with Matching Engine for automated application decisions
2. Add integration with Tailoring Engine for document generation
3. Develop real-time application tracking and notifications
4. Enhance prevention rules with machine learning-based spam detection
5. Implement advanced analytics for application success rates
6. Develop dashboard for managing applications and viewing state transitions

## Technical Debt

- Current implementation uses simplified prevention rules
- Concurrency limits are hardcoded and not configurable
- No integration with external job boards for application submission
- State transitions are synchronous and not asynchronous

## Conclusion

Sprint 6 successfully delivered a robust Application State Machine that manages the complete lifecycle of job applications. The implementation includes:

- Comprehensive state management with validation
- Three levels of automation (manual, semi-automatic, fully automatic)
- Concurrency controls and prevention rules
- Support for mid-stream changes (pause, modify, cancel)
- Detailed validation scenarios and assumptions for human review

The Application State Machine provides the foundation for a complete job application management system, integrating with existing Matching and Tailoring Engines to enable both manual and automated application processes.
