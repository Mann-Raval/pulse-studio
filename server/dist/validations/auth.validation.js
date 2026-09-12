"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
});
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, 'Name must be at least 2 characters long'),
    email: zod_1.z.string().trim().toLowerCase().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters long'),
    role: zod_1.z.nativeEnum(client_1.Role, {
        errorMap: () => ({ message: 'Role must be one of: ADMIN, PM, DEVELOPER' }),
    }),
});
