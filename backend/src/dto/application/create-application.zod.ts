import { z } from 'zod';

export const createApplicationSchema = z.object({
  jobPostingId: z.string()
    .min(1, { message: 'Job posting ID is required' }),
  personaId: z.string().optional(),
  applicationData: z.record(z.string(), z.any()).optional(),
});

export type CreateApplicationDto = z.infer<typeof createApplicationSchema>;

export const updateApplicationSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'REJECTED', 'INTERVIEWING', 'OFFER']).optional(),
  personaId: z.string().optional(),
  tailoredResumeUrl: z.string().url().optional(),
  coverLetterUrl: z.string().url().optional(),
  applicationData: z.record(z.string(), z.any()).optional(),
});

export type UpdateApplicationDto = z.infer<typeof updateApplicationSchema>;
