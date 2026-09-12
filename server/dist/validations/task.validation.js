"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskQuerySchema = exports.taskIdParamSchema = exports.projectTaskParamsSchema = exports.updateTaskStatusSchema = exports.updateTaskSchema = exports.createTaskSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1, 'Task title is required'),
    description: zod_1.z.string().trim().optional().nullable(),
    assignedToId: zod_1.z.string().trim().optional().nullable(),
    priority: zod_1.z
        .nativeEnum(client_1.TaskPriority, {
        errorMap: () => ({ message: 'Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL' }),
    })
        .default(client_1.TaskPriority.MEDIUM),
    dueDate: zod_1.z
        .string()
        .datetime({ offset: true })
        .or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/))
        .optional()
        .nullable(),
    status: zod_1.z
        .nativeEnum(client_1.TaskStatus, {
        errorMap: () => ({ message: 'Status must be one of: TODO, IN_PROGRESS, IN_REVIEW, DONE' }),
    })
        .default(client_1.TaskStatus.TODO)
        .optional(),
});
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1, 'Task title cannot be empty').optional(),
    description: zod_1.z.string().trim().optional().nullable(),
    assignedToId: zod_1.z.string().trim().optional().nullable(),
    priority: zod_1.z
        .nativeEnum(client_1.TaskPriority, {
        errorMap: () => ({ message: 'Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL' }),
    })
        .optional(),
    dueDate: zod_1.z
        .string()
        .datetime({ offset: true })
        .or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/))
        .optional()
        .nullable(),
    status: zod_1.z
        .nativeEnum(client_1.TaskStatus, {
        errorMap: () => ({ message: 'Status must be one of: TODO, IN_PROGRESS, IN_REVIEW, DONE' }),
    })
        .optional(),
});
exports.updateTaskStatusSchema = zod_1.z
    .object({
    status: zod_1.z.nativeEnum(client_1.TaskStatus, {
        errorMap: () => ({ message: 'Status must be one of: TODO, IN_PROGRESS, IN_REVIEW, DONE' }),
    }),
})
    .strict({
    message: 'Only the status field is permitted when updating task status',
});
exports.projectTaskParamsSchema = zod_1.z.object({
    projectId: zod_1.z.string().trim().min(1, 'Project ID is required'),
});
exports.taskIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().trim().min(1, 'Task ID is required'),
});
exports.taskQuerySchema = zod_1.z.object({
    status: zod_1.z
        .nativeEnum(client_1.TaskStatus, {
        errorMap: () => ({ message: 'Invalid status filter' }),
    })
        .optional(),
    priority: zod_1.z
        .nativeEnum(client_1.TaskPriority, {
        errorMap: () => ({ message: 'Invalid priority filter' }),
    })
        .optional(),
    dueBefore: zod_1.z.string().optional(),
    dueAfter: zod_1.z.string().optional(),
    assignedToId: zod_1.z.string().trim().optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20).optional(),
});
