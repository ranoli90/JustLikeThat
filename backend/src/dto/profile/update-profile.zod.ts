import { z } from 'zod';

export const updateProfileSchema = z.object({
  headline: z.string()
    .min(5, { message: 'Headline must be at least 5 characters' })
    .max(255, { message: 'Headline must not exceed 255 characters' })
    .optional(),
  summary: z.string()
    .min(20, { message: 'Summary must be at least 20 characters' })
    .max(2000, { message: 'Summary must not exceed 2000 characters' })
    .optional(),
  experiences: z.array(z.object({
    id: z.string().optional(),
    company: z.string().min(1, 'Company name is required'),
    jobTitle: z.string().min(1, 'Job title is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    id: z.string().optional(),
    school: z.string().min(1, 'School name is required'),
    degree: z.string().min(1, 'Degree is required'),
    fieldOfStudy: z.string().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional(),
  })).optional(),
  skills: z.array(z.string().min(1, 'Skill name is required')).optional(),
  certifications: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Certification name is required'),
    issuingOrganization: z.string().optional(),
    issueDate: z.string().optional(),
    expirationDate: z.string().optional(),
    credentialId: z.string().optional(),
  })).optional(),
  projects: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Project name is required'),
    description: z.string().optional(),
    technologies: z.array(z.string()).optional(),
    githubUrl: z.string().url().optional(),
    liveUrl: z.string().url().optional(),
  })).optional(),
  languages: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Language name is required'),
    proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'FLUENT', 'NATIVE']).default('INTERMEDIATE'),
  })).optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
