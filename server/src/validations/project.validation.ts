import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required'),
  clientId: z.string().trim().min(1, 'Client ID is required'),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name cannot be empty').optional(),
  clientId: z.string().trim().min(1, 'Client ID cannot be empty').optional(),
});

export const projectIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Project ID is required'),
});

export const projectQuerySchema = z.object({
  status: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectQueryInput = z.infer<typeof projectQuerySchema>;
