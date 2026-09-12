"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userQuerySchema = exports.userIdParamSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    role: zod_1.z.enum([client_1.Role.ADMIN, client_1.Role.PM, client_1.Role.DEVELOPER, 'Admin', 'PM', 'Developer']).transform((val) => {
        const upper = val.toUpperCase();
        if (upper === 'ADMIN')
            return client_1.Role.ADMIN;
        if (upper === 'PM')
            return client_1.Role.PM;
        return client_1.Role.DEVELOPER;
    }),
});
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: zod_1.z.string().email('Invalid email address').optional(),
    role: zod_1.z.enum([client_1.Role.ADMIN, client_1.Role.PM, client_1.Role.DEVELOPER, 'Admin', 'PM', 'Developer']).transform((val) => {
        if (!val)
            return undefined;
        const upper = val.toUpperCase();
        if (upper === 'ADMIN')
            return client_1.Role.ADMIN;
        if (upper === 'PM')
            return client_1.Role.PM;
        return client_1.Role.DEVELOPER;
    }).optional(),
});
exports.userIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid user ID format'),
});
exports.userQuerySchema = zod_1.z.object({
    role: zod_1.z.string().optional(),
});
