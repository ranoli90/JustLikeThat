import { z } from 'zod';

export const createPersonaSchema = z.object({
  name: z.string()
    .min(3, { message: 'Persona name must be at least 3 characters' })
    .max(100, { message: 'Persona name must not exceed 100 characters' }),
  jobTitle: z.string()
    .min(3, { message: 'Job title must be at least 3 characters' })
    .max(100, { message: 'Job title must not exceed 100 characters' }),
  experienceLevel: z.enum(['JUNIOR', 'MID', 'SENIOR', 'LEAD']),
  skills: z.array(z.string().min(1, 'Skill name is required'))
    .min(1, { message: 'At least one skill is required' }),
  summary: z.string()
    .min(20, { message: 'Summary must be at least 20 characters' })
    .max(2000, { message: 'Summary must not exceed 2000 characters' })
    .optional(),
});

export type CreatePersonaDto = z.infer<typeof createPersonaSchema>;

export const updatePersonaSchema = createPersonaSchema.partial();

export type UpdatePersonaType = z.infer<typeof updatePersonaSchema>;
