import { z } from 'zod';

export const createTailoringRequestSchema = z.object({
  personaId: z.string().uuid(),
  jobPostingId: z.string().uuid(),
  documentType: z.enum(['RESUME', 'COVER_LETTER']),
  tone: z.enum(['PROFESSIONAL', 'INNOVATIVE', 'TRADITIONAL', 'ENTHUSIASTIC']).optional(),
  jobLevel: z.enum(['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'EXECUTIVE']).optional(),
});

export type CreateTailoringRequest = z.infer<typeof createTailoringRequestSchema>;
