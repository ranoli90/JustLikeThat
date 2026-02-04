import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .email({ message: 'Invalid email format' })
    .min(5, { message: 'Email must be at least 5 characters' })
    .max(255, { message: 'Email must not exceed 255 characters' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128, { message: 'Password must not exceed 128 characters' }),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginDto = z.infer<typeof loginSchema>;
