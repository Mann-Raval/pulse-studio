"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectQuerySchema = exports.projectIdParamSchema = exports.updateProjectSchema = exports.createProjectSchema = void 0;
const zod_1 = require("zod");
exports.createProjectSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'Project name is required'),
    clientId: zod_1.z.string().trim().min(1, 'Client ID is required'),
});
exports.updateProjectSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'Project name cannot be empty').optional(),
    clientId: zod_1.z.string().trim().min(1, 'Client ID cannot be empty').optional(),
});
exports.projectIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().trim().min(1, 'Project ID is required'),
});
exports.projectQuerySchema = zod_1.z.object({
    status: zod_1.z.string().trim().optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10).optional(),
});
