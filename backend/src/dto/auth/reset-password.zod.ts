import { z } from 'zod';

export const resetPasswordSchema = z.object({
  email: z.string()
    .email({ message: 'Invalid email format' })
    .min(5, { message: 'Email must be at least 5 characters' })
    .max(255, { message: 'Email must not exceed 255 characters' }),
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

export const updatePasswordSchema = z.object({
  token: z.string()
    .min(1, { message: 'Reset token is required' }),
  newPassword: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128, { message: 'Password must not exceed 128 characters' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
    }),
  confirmPassword: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128, { message: 'Password must not exceed 128 characters' }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type UpdatePasswordDto = z.infer<typeof updatePasswordSchema>;
