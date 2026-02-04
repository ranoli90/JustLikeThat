import { z } from 'zod';

export const uploadResumeSchema = z.object({
  file: z.any()
    .refine(value => value && value.buffer, 'File is required'),
  fileName: z.string()
    .min(1, { message: 'File name is required' })
    .max(255, { message: 'File name must not exceed 255 characters' }),
  mimeType: z.string()
    .refine(value => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(value), {
      message: 'Only PDF and Word documents are supported',
    }),
  fileSize: z.number()
    .max(10 * 1024 * 1024, { message: 'File size must not exceed 10MB' }),
});

export type UploadResumeDto = z.infer<typeof uploadResumeSchema>;
