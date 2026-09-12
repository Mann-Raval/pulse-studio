import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required'),
  description: z.string().trim().optional().nullable(),
  assignedToId: z.string().trim().optional().nullable(),
  priority: z
    .nativeEnum(TaskPriority, {
      errorMap: () => ({ message: 'Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL' }),
    })
    .default(TaskPriority.MEDIUM),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/))
    .optional()
    .nullable(),
  status: z
    .nativeEnum(TaskStatus, {
      errorMap: () => ({ message: 'Status must be one of: TODO, IN_PROGRESS, IN_REVIEW, DONE' }),
    })
    .default(TaskStatus.TODO)
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title cannot be empty').optional(),
  description: z.string().trim().optional().nullable(),
  assignedToId: z.string().trim().optional().nullable(),
  priority: z
    .nativeEnum(TaskPriority, {
      errorMap: () => ({ message: 'Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL' }),
    })
    .optional(),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/))
    .optional()
    .nullable(),
  status: z
    .nativeEnum(TaskStatus, {
      errorMap: () => ({ message: 'Status must be one of: TODO, IN_PROGRESS, IN_REVIEW, DONE' }),
    })
    .optional(),
});

export const updateTaskStatusSchema = z
  .object({
    status: z.nativeEnum(TaskStatus, {
      errorMap: () => ({ message: 'Status must be one of: TODO, IN_PROGRESS, IN_REVIEW, DONE' }),
    }),
  })
  .strict({
    message: 'Only the status field is permitted when updating task status',
  });

export const projectTaskParamsSchema = z.object({
  projectId: z.string().trim().min(1, 'Project ID is required'),
});

export const taskIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Task ID is required'),
});

export const taskQuerySchema = z.object({
  projectId: z.string().trim().optional(),
  status: z
    .nativeEnum(TaskStatus, {
      errorMap: () => ({ message: 'Invalid status filter' }),
    })
    .optional(),
  priority: z
    .nativeEnum(TaskPriority, {
      errorMap: () => ({ message: 'Invalid priority filter' }),
    })
    .optional(),
  isOverdue: z.string().optional(),
  dueBefore: z.string().optional(),
  dueAfter: z.string().optional(),
  assignedToId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
