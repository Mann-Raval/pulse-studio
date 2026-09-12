"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.register = exports.logout = exports.refresh = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_js_1 = require("../lib/prisma.js");
const index_js_1 = require("../config/index.js");
const token_js_1 = require("../utils/token.js");
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user) {
            res.status(401).json({
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password',
                },
            });
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            res.status(401).json({
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password',
                },
            });
            return;
        }
        // Generate short-lived access token (15 mins)
        const accessToken = (0, token_js_1.generateAccessToken)({
            id: user.id,
            role: user.role,
        });
        // Generate cryptographically secure refresh token (7 days)
        const rawRefreshToken = (0, token_js_1.generateRefreshTokenString)();
        const tokenHash = (0, token_js_1.hashToken)(rawRefreshToken);
        const expiresAt = new Date(Date.now() + index_js_1.config.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
        // Store revocable hashed refresh token in database
        await prisma_js_1.prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt,
            },
        });
        // Set refresh token in HttpOnly, Secure, SameSite cookie
        (0, token_js_1.setRefreshTokenCookie)(res, rawRefreshToken);
        res.status(200).json({
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const refresh = async (req, res, next) => {
    try {
        const rawRefreshToken = req.cookies?.[token_js_1.REFRESH_COOKIE_NAME];
        if (!rawRefreshToken) {
            res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Refresh token cookie is missing',
                },
            });
            return;
        }
        const incomingHash = (0, token_js_1.hashToken)(rawRefreshToken);
        // Look up refresh token in database
        const storedToken = await prisma_js_1.prisma.refreshToken.findUnique({
            where: { tokenHash: incomingHash },
            include: { user: true },
        });
        // If not found or expired -> reject and clear cookie
        if (!storedToken || storedToken.expiresAt < new Date()) {
            // If token existed but was expired, delete it
            if (storedToken) {
                await prisma_js_1.prisma.refreshToken.delete({ where: { id: storedToken.id } }).catch(() => { });
            }
            (0, token_js_1.clearRefreshTokenCookie)(res);
            res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Invalid or expired refresh token',
                },
            });
            return;
        }
        // Token rotation: delete old refresh token
        await prisma_js_1.prisma.refreshToken.delete({
            where: { id: storedToken.id },
        });
        // Issue new refresh token & store hash
        const newRawRefreshToken = (0, token_js_1.generateRefreshTokenString)();
        const newTokenHash = (0, token_js_1.hashToken)(newRawRefreshToken);
        const expiresAt = new Date(Date.now() + index_js_1.config.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
        await prisma_js_1.prisma.refreshToken.create({
            data: {
                userId: storedToken.userId,
                tokenHash: newTokenHash,
                expiresAt,
            },
        });
        // Set updated cookie
        (0, token_js_1.setRefreshTokenCookie)(res, newRawRefreshToken);
        // Issue new access token
        const accessToken = (0, token_js_1.generateAccessToken)({
            id: storedToken.user.id,
            role: storedToken.user.role,
        });
        res.status(200).json({
            accessToken,
            user: {
                id: storedToken.user.id,
                name: storedToken.user.name,
                email: storedToken.user.email,
                role: storedToken.user.role,
                createdAt: storedToken.user.createdAt,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.refresh = refresh;
const logout = async (req, res, next) => {
    try {
        const rawRefreshToken = req.cookies?.[token_js_1.REFRESH_COOKIE_NAME];
        if (rawRefreshToken) {
            const incomingHash = (0, token_js_1.hashToken)(rawRefreshToken);
            // Invalidate the refresh token server-side
            await prisma_js_1.prisma.refreshToken.deleteMany({
                where: { tokenHash: incomingHash },
            });
        }
        // Clear the cookie
        (0, token_js_1.clearRefreshTokenCookie)(res);
        res.status(200).json({
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await prisma_js_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            res.status(409).json({
                error: {
                    code: 'USER_EXISTS',
                    message: 'A user with this email address already exists',
                },
            });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(12);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const user = await prisma_js_1.prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                passwordHash,
                role,
            },
        });
        res.status(201).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User is not authenticated',
                },
            });
            return;
        }
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
        if (!user) {
            res.status(404).json({
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found',
                },
            });
            return;
        }
        res.status(200).json({ user });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
