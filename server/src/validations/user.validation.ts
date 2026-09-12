import { z } from 'zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum([Role.ADMIN, Role.PM, Role.DEVELOPER, 'Admin', 'PM', 'Developer'] as any).transform((val: string) => {
    const upper = val.toUpperCase();
    if (upper === 'ADMIN') return Role.ADMIN;
    if (upper === 'PM') return Role.PM;
    return Role.DEVELOPER;
  }),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum([Role.ADMIN, Role.PM, Role.DEVELOPER, 'Admin', 'PM', 'Developer'] as any).transform((val: string) => {
    if (!val) return undefined;
    const upper = val.toUpperCase();
    if (upper === 'ADMIN') return Role.ADMIN;
    if (upper === 'PM') return Role.PM;
    return Role.DEVELOPER;
  }).optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

export const userQuerySchema = z.object({
  role: z.string().optional(),
});
