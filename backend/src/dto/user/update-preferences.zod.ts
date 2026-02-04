import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  jobPreferences: z.object({
    jobTypes: z.array(z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'])).optional(),
    remotePreferences: z.array(z.enum(['REMOTE', 'HYBRID', 'ONSITE'])).optional(),
    locations: z.array(z.string().min(1)).optional(),
    salaryRange: z.object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    }).optional(),
    industries: z.array(z.string().min(1)).optional(),
    experienceLevels: z.array(z.enum(['JUNIOR', 'MID', 'SENIOR', 'LEAD'])).optional(),
  }).optional(),
  notificationPreferences: z.object({
    email: z.object({
      jobMatches: z.boolean().optional(),
      applicationUpdates: z.boolean().optional(),
      systemAnnouncements: z.boolean().optional(),
    }).optional(),
    push: z.object({
      jobMatches: z.boolean().optional(),
      applicationUpdates: z.boolean().optional(),
      systemAnnouncements: z.boolean().optional(),
    }).optional(),
    inApp: z.object({
      jobMatches: z.boolean().optional(),
      applicationUpdates: z.boolean().optional(),
      systemAnnouncements: z.boolean().optional(),
    }).optional(),
  }).optional(),
  privacySettings: z.object({
    profileVisibility: z.enum(['PUBLIC', 'PRIVATE', 'CONNECTIONS']).optional(),
    dataSharing: z.boolean().optional(),
    marketingEmails: z.boolean().optional(),
  }).optional(),
});

export type UpdatePreferencesDto = z.infer<typeof updatePreferencesSchema>;
