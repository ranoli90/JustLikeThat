import { z } from 'zod';

export const traceabilityMappingSchema = z.object({
  originalContent: z.string(),
  tailoredContent: z.string(),
  reason: z.string(),
  source: z.enum(['PERSONA', 'JOB_POSTING', 'COMBINED']),
  confidence: z.number().min(0).max(1),
});

export const tailoredDocumentResponseSchema = z.object({
  id: z.string().uuid(),
  personaId: z.string().uuid(),
  jobPostingId: z.string().uuid(),
  documentType: z.enum(['RESUME', 'COVER_LETTER']),
  originalContent: z.string(),
  tailoredContent: z.string(),
  traceabilityMapping: z.array(traceabilityMappingSchema),
  tone: z.enum(['PROFESSIONAL', 'INNOVATIVE', 'TRADITIONAL', 'ENTHUSIASTIC']),
  jobLevel: z.enum(['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'EXECUTIVE']),
  atsScore: z.number().min(0).max(1),
  cost: z.number().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TailoredDocumentResponse = z.infer<typeof tailoredDocumentResponseSchema>;
export type TraceabilityMapping = z.infer<typeof traceabilityMappingSchema>;
