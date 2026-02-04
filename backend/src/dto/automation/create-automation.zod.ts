import { z } from 'zod';

export const createAutomationSchema = z.object({
  name: z.string()
    .min(3, { message: 'Configuration name must be at least 3 characters' })
    .max(100, { message: 'Configuration name must not exceed 100 characters' }),
  minMatchScore: z.number()
    .min(0.5, { message: 'Minimum match score must be at least 0.5' })
    .max(1, { message: 'Minimum match score must not exceed 1' })
    .default(0.8),
  autoApply: z.boolean().default(false),
  timezone: z.string()
    .min(1, { message: 'Timezone is required' })
    .default('UTC'),
  schedule: z.object({
    days: z.array(z.number().min(0).max(6)).optional(),
    times: z.array(z.string()).optional(),
  }).optional(),
  antiSpamSettings: z.object({
    maxApplicationsPerDay: z.number().min(1).max(100).optional(),
    timeBetweenApplications: z.number().min(60).max(3600).optional(),
    useProxy: z.boolean().optional(),
  }).optional(),
});

export type CreateAutomationDto = z.infer<typeof createAutomationSchema>;

export const updateAutomationSchema = createAutomationSchema.partial();

export type UpdateAutomationDto = z.infer<typeof updateAutomationSchema>;
