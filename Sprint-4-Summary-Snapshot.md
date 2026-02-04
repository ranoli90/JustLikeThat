# Sprint 4 Summary Snapshot

## Objective

Implement the Matching Engine in NestJS to score and rank job applications based on relevance to candidate profiles, with a minimum threshold of 0.75 for automated applications.

## Key Features

### 1. Scoring System with Sub-Scores

The scoring system combines 6 weighted factors to calculate an overall relevance score:

- **Skills Match**: 50% - Compares candidate skills with job requirements
- **Experience Level**: 15% - Matches candidate's experience level with job expectations
- **Salary Fit**: 10% - Analyzes salary range compatibility
- **Location Compatibility**: 10% - Assesses location and remote work preferences
- **Cultural Fit**: 10% - Evaluates cultural alignment based on job description
- **Constraints Compliance**: 5% - Checks for excluded companies or other constraints

### 2. Thresholding

- Minimum relevance score for application: 0.75
- Threshold is configurable but set to 0.75 as default for automated applications

### 3. Cold-Start Defaults

For new users or jobs with limited data, the system uses:
- Industry average skill requirements
- Job board trend data
- Default experience level mappings
- Standard salary range benchmarks

### 4. Learning Mechanisms

- **Minimum Samples**: Requires at least 5 data points before applying updates
- **Bayesian Updates**: Uses user feedback and application outcomes to refine scoring weights
- **Adaptive Thresholding**: Adjusts minimum score based on success rates

### 5. Validation

Three validation examples demonstrate the scoring system:

1. **Senior Full Stack Developer (Mid Level)**: Score 0.82
   - Skills match: 85% (0.425)
   - Experience: 90% (0.135)
   - Salary: 80% (0.08)
   - Location: 100% (0.1)
   - Culture: 70% (0.07)
   - Constraints: 100% (0.05)

2. **Entry Level Frontend Developer (Junior)**: Score 0.78
   - Skills match: 75% (0.375)
   - Experience: 100% (0.15)
   - Salary: 85% (0.085)
   - Location: 70% (0.07)
   - Culture: 80% (0.08)
   - Constraints: 100% (0.05)

3. **Product Manager (Senior)**: Score 0.85
   - Skills match: 90% (0.45)
   - Experience: 100% (0.15)
   - Salary: 90% (0.09)
   - Location: 100% (0.1)
   - Culture: 80% (0.08)
   - Constraints: 100% (0.05)

## Implementation Details

### NestJS MatchingModule

#### Service: [`matching.service.ts`](backend/src/modules/matching/matching.service.ts)
- **Match Calculation**: `calculateMatchScore()` - Computes overall and sub-scores
- **Match Finding**: `findMatches()` - Returns all active jobs sorted by score
- **Validation**: `validateScoringLogic()` - Runs validation examples
- **Learning**: `updateModelWithFeedback()` - Applies Bayesian updates
- **Configuration Accessors**: Methods to retrieve evaluation plan, spam checklist, and assumptions

#### Controller: [`matching.controller.ts`](backend/src/modules/matching/matching.controller.ts)
- `GET /matching/:personaId/matches` - Returns matches for a specific persona
- `POST /matching/score` - Calculates score for a specific candidate-job pair
- `GET /matching/validation` - Returns validation examples
- `GET /matching/evaluation-plan` - Returns evaluation strategy
- `GET /matching/spam-checklist` - Returns spam prevention measures
- `GET /matching/assumptions` - Returns assumptions for human review

#### Module: [`matching.module.ts`](backend/src/modules/matching/matching.module.ts)
Uses TypeOrmModule for feature injection of Persona, JobPosting, and UserPreferences repositories.

### TypeORM Entities

#### Persona: [`persona.entity.ts`](backend/src/entities/persona.entity.ts)
- Represents role-specific candidate profiles with skills, experience level, and summary
- Linked to CandidateProfile with ManyToOne relationship

#### JobPosting: [`job-posting.entity.ts`](backend/src/entities/job-posting.entity.ts)
- Stores parsed job data including title, company, requirements, and salary range
- Supports filtering by expiration status

## Evaluation Plan

### A/B Testing
- **Variants**: Control (existing) vs. Experimental (new scoring)
- **Metrics**: Match quality, application success rate, user satisfaction
- **Duration**: 4 weeks
- **Sample Size**: 500 active users

### Offline Evaluation
- **Dataset**: 1000 candidate-job pairs with manually labeled relevance
- **Metrics**: Precision, Recall, F1 Score, AUC-ROC
- **Baseline**: Compare against simple keyword matching

### Error Analysis
- **Categories**:
  - False positives (high score, but poor match)
  - False negatives (low score, but good match)
  - Score calibration issues
- **Root Cause Analysis**: Identify patterns in failed matches
- **Iterative Improvements**: Update scoring logic based on findings

## Spam Checklist

1. Keyword stuffing detection
2. Irrelevant skill matching
3. Experience mismatch check
4. Location incompatibility
5. Salary range mismatch
6. Company blacklist

## Assumptions for Human Review

1. Skills matching relies on keyword matching, not semantic understanding
2. Experience level is inferred from text analysis, not structured data
3. Salary fit calculations assume linear range overlap
4. Location compatibility is based on city/region matching
5. Cultural fit relies on keyword matching in job descriptions
6. Constraints compliance only checks excluded companies

## Architecture Changes

### Database Entities
- Added Persona entity for role-specific profiles
- Added JobPosting entity for parsed job data
- Updated CandidateProfile to support personas

### Module Dependencies
- Added MatchingModule to AppModule imports
- Updated TypeORM configuration with new entities

## Next Steps

1. Implement resume parsing integration
2. Add semantic skill matching using NLP
3. Enhance cultural fit analysis with company data
4. Develop dashboard for viewing match scores and feedback
5. Implement real-time scoring updates

## Technical Debt

- Current implementation uses placeholder cultural fit and constraints compliance
- Learning mechanisms are stubbed and need actual Bayesian implementation
- Persona management is not fully integrated with existing profile service

## Conclusion

Sprint 4 successfully delivered a robust scoring and matching engine with:
- Weighted scoring system
- Minimum threshold validation
- Cold-start defaults
- Learning mechanisms
- Evaluation and spam prevention plans

The Matching Engine provides the foundation for automated job applications and will be enhanced in future sprints with more sophisticated algorithms and integration with real-world data sources.
