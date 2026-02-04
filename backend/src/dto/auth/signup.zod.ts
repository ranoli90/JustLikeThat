import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string()
    .email({ message: 'Invalid email format' })
    .min(5, { message: 'Email must be at least 5 characters' })
    .max(255, { message: 'Email must not exceed 255 characters' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128, { message: 'Password must not exceed 128 characters' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
    }),
  firstName: z.string()
    .min(2, { message: 'First name must be at least 2 characters' })
    .max(100, { message: 'First name must not exceed 100 characters' })
    .regex(/^[a-zA-Z '-]*$/, { 
      message: 'First name can only contain letters, spaces, hyphens, and apostrophes' 
    }),
  lastName: z.string()
    .min(2, { message: 'Last name must be at least 2 characters' })
    .max(100, { message: 'Last name must not exceed 100 characters' })
    .regex(/^[a-zA-Z '-]*$/, { 
      message: 'Last name can only contain letters, spaces, hyphens, and apostrophes' 
    }),
  tenantName: z.string()
    .min(2, { message: 'Tenant name must be at least 2 characters' })
    .max(255, { message: 'Tenant name must not exceed 255 characters' })
    .optional(),
});

export type SignupDto = z.infer<typeof signupSchema>;
