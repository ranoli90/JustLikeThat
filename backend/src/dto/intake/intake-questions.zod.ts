import { z } from 'zod';

// Career Goals
export const careerGoalsSchema = z.object({
  shortTermGoal: z.string()
    .min(20, 'Short-term goal must be at least 20 characters')
    .max(500, 'Short-term goal must not exceed 500 characters'),
  longTermGoal: z.string()
    .min(20, 'Long-term goal must be at least 20 characters')
    .max(500, 'Long-term goal must not exceed 500 characters'),
  targetRole: z.string()
    .min(2, 'Target role must be at least 2 characters')
    .max(100, 'Target role must not exceed 100 characters'),
  targetIndustry: z.string()
    .min(2, 'Target industry must be at least 2 characters')
    .max(100, 'Target industry must not exceed 100 characters'),
  desiredImpact: z.string()
    .min(20, 'Desired impact must be at least 20 characters')
    .max(500, 'Desired impact must not exceed 500 characters'),
});

// Skills Assessment
export const skillsSchema = z.object({
  technicalSkills: z.array(z.string()
    .min(1, 'Skill name is required')
    .max(50, 'Skill name must not exceed 50 characters'))
    .min(1, 'At least one technical skill is required'),
  softSkills: z.array(z.string()
    .min(1, 'Skill name is required')
    .max(50, 'Skill name must not exceed 50 characters'))
    .min(1, 'At least one soft skill is required'),
  technicalSkillLevels: z.record(z.string(), z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']))
    .optional(),
  softSkillLevels: z.record(z.string(), z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']))
    .optional(),
});

// Constraints
export const constraintsSchema = z.object({
  salaryRange: z.object({
    min: z.number()
      .min(0, 'Minimum salary must be non-negative')
      .optional(),
    max: z.number()
      .min(0, 'Maximum salary must be non-negative')
      .optional(),
  }).optional(),
  locationPreferences: z.array(z.string()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must not exceed 100 characters'))
    .optional(),
  remoteWorkPreference: z.enum(['REMOTE_ONLY', 'HYBRID_ONLY', 'ONSITE_ONLY', 'FLEXIBLE'])
    .default('FLEXIBLE'),
  visaRequirements: z.enum(['NONE', 'SPONSORSHIP_REQUIRED', 'TRANSFER_REQUIRED']).default('NONE'),
  workAuthorization: z.boolean().default(true),
  minimumExperienceLevel: z.enum(['JUNIOR', 'MID', 'SENIOR', 'LEAD'])
    .optional(),
});

// Preferences
export const preferencesSchema = z.object({
  companySize: z.array(z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']))
    .optional(),
  companyCulture: z.array(z.enum(['INNOVATIVE', 'TRADITIONAL', 'COLLABORATIVE', 'COMPETITIVE', 'RELAXED']))
    .optional(),
  workLifeBalance: z.enum(['BALANCED', 'WORK_FOCUSED', 'LIFE_FOCUSED'])
    .default('BALANCED'),
  professionalDevelopment: z.enum(['HIGH_PRIORITY', 'MODERATE', 'LOW_PRIORITY'])
    .default('MODERATE'),
  compensationStructure: z.array(z.enum(['BASE_SALARY', 'BONUS', 'EQUITY', 'BENEFITS']))
    .optional(),
  commuteTime: z.number()
    .min(0, 'Commute time must be non-negative')
    .max(120, 'Commute time must not exceed 120 minutes')
    .optional(),
  projectType: z.array(z.enum(['PRODUCT_DEVELOPMENT', 'RESEARCH', 'MAINTENANCE', 'CONSULTING', 'STARTUP']))
    .optional(),
});

// Risk Tolerance
export const riskToleranceSchema = z.object({
  jobSecurity: z.enum(['HIGH', 'MODERATE', 'LOW'])
    .default('MODERATE'),
  financialRisk: z.enum(['HIGH', 'MODERATE', 'LOW'])
    .default('MODERATE'),
  careerRisk: z.enum(['HIGH', 'MODERATE', 'LOW'])
    .default('MODERATE'),
  willingnessToRelocate: z.enum(['YES', 'NO', 'MAYBE'])
    .default('MAYBE'),
  willingnessToTravel: z.enum(['NONE', 'OCCASIONAL', 'FREQUENT'])
    .default('OCCASIONAL'),
});

// Complete Intake Form
export const intakeFormSchema = z.object({
  careerGoals: careerGoalsSchema,
  skills: skillsSchema,
  constraints: constraintsSchema,
  preferences: preferencesSchema,
  riskTolerance: riskToleranceSchema,
});

// Derived Profile Schema
export const derivedProfileSchema = z.object({
  candidateType: z.enum(['NEW_GRAD', 'MID_CAREER_SWITCHER', 'EXPERIENCED_PROFESSIONAL']),
  careerStage: z.enum(['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'EXECUTIVE']),
  skillsGraph: z.object({
    technical: z.record(z.string(), z.number().min(0).max(1)),
    soft: z.record(z.string(), z.number().min(0).max(1)),
  }),
  constraints: z.object({
    salary: z.object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    }).optional(),
    locations: z.array(z.string()).optional(),
    remoteWork: z.enum(['REMOTE_ONLY', 'HYBRID_ONLY', 'ONSITE_ONLY', 'FLEXIBLE']).default('FLEXIBLE'),
    visa: z.enum(['NONE', 'SPONSORSHIP_REQUIRED', 'TRANSFER_REQUIRED']).default('NONE'),
  }),
  preferences: z.object({
    companySize: z.array(z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'])).optional(),
    companyCulture: z.array(z.enum(['INNOVATIVE', 'TRADITIONAL', 'COLLABORATIVE', 'COMPETITIVE', 'RELAXED'])).optional(),
    workLifeBalance: z.enum(['BALANCED', 'WORK_FOCUSED', 'LIFE_FOCUSED']).default('BALANCED'),
    professionalDevelopment: z.enum(['HIGH_PRIORITY', 'MODERATE', 'LOW_PRIORITY']).default('MODERATE'),
  }),
  riskProfile: z.object({
    jobSecurity: z.enum(['HIGH', 'MODERATE', 'LOW']).default('MODERATE'),
    financialRisk: z.enum(['HIGH', 'MODERATE', 'LOW']).default('MODERATE'),
    careerRisk: z.enum(['HIGH', 'MODERATE', 'LOW']).default('MODERATE'),
  }),
  fairnessFlags: z.array(z.object({
    field: z.string(),
    flagType: z.enum(['DISCRIMINATORY', 'EXCLUSIONARY', 'BIAS_RISK']),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    description: z.string(),
  })).optional(),
});

// Type definitions
export type CareerGoals = z.infer<typeof careerGoalsSchema>;
export type Skills = z.infer<typeof skillsSchema>;
export type Constraints = z.infer<typeof constraintsSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type RiskTolerance = z.infer<typeof riskToleranceSchema>;
export type IntakeFormData = z.infer<typeof intakeFormSchema>;
export type DerivedProfile = z.infer<typeof derivedProfileSchema>;
