"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.createUser = exports.listUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma_js_1 = require("../lib/prisma.js");
const listUsers = async (req, res, next) => {
    try {
        const userRole = req.user.role;
        const { role } = req.query;
        // ADMIN can view all users or filtered users.
        // PM can view with ?role=DEVELOPER (for task assignment).
        // DEVELOPER is forbidden from listing all users.
        if (userRole === client_1.Role.DEVELOPER) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied. Requires one of the following roles: ADMIN, PM',
                },
            });
            return;
        }
        if (userRole === client_1.Role.PM && !role) {
            // If PM requests full user list without filter, restrict to DEVELOPERs
            const users = await prisma_js_1.prisma.user.findMany({
                where: { role: client_1.Role.DEVELOPER },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                },
                orderBy: { name: 'asc' },
            });
            res.status(200).json({ users });
            return;
        }
        const where = {};
        if (role) {
            const upper = String(role).toUpperCase();
            if (upper === 'ADMIN' || upper === 'PM' || upper === 'DEVELOPER') {
                where.role = upper;
            }
        }
        const users = await prisma_js_1.prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({ users });
    }
    catch (error) {
        next(error);
    }
};
exports.listUsers = listUsers;
const createUser = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        const normalizedEmail = String(email).toLowerCase().trim();
        // Check if user already exists
        const existing = await prisma_js_1.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (existing) {
            res.status(409).json({
                error: {
                    code: 'CONFLICT',
                    message: 'A user with this email address already exists',
                },
            });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const user = await prisma_js_1.prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                passwordHash,
                role: role,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
        res.status(201).json({ user });
    }
    catch (error) {
        next(error);
    }
};
exports.createUser = createUser;
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, role } = req.body;
        const existing = await prisma_js_1.prisma.user.findUnique({
            where: { id },
        });
        if (!existing) {
            res.status(404).json({
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found',
                },
            });
            return;
        }
        const updateData = {};
        if (name)
            updateData.name = name.trim();
        if (role)
            updateData.role = role;
        if (email) {
            const normalizedEmail = String(email).toLowerCase().trim();
            if (normalizedEmail !== existing.email) {
                const emailConflict = await prisma_js_1.prisma.user.findUnique({
                    where: { email: normalizedEmail },
                });
                if (emailConflict) {
                    res.status(409).json({
                        error: {
                            code: 'CONFLICT',
                            message: 'Email is already in use by another account',
                        },
                    });
                    return;
                }
                updateData.email = normalizedEmail;
            }
        }
        const updatedUser = await prisma_js_1.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
        res.status(200).json({ user: updatedUser });
    }
    catch (error) {
        next(error);
    }
};
exports.updateUser = updateUser;
