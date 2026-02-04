import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number()
    .min(1, { message: 'Page number must be at least 1' })
    .default(1),
  size: z.coerce.number()
    .min(1, { message: 'Page size must be at least 1' })
    .max(100, { message: 'Page size must not exceed 100' })
    .default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type PaginationQueryDto = z.infer<typeof paginationSchema>;

export const jobFilterSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  remotePreference: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).optional(),
  minMatchScore: z.coerce.number().min(0).max(1).optional(),
});

export type JobFilterDto = z.infer<typeof jobFilterSchema>;

export const applicationFilterSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'REJECTED', 'INTERVIEWING', 'OFFER']).optional(),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  submissionDateFrom: z.string().optional(),
  submissionDateTo: z.string().optional(),
});

export type ApplicationFilterDto = z.infer<typeof applicationFilterSchema>;
