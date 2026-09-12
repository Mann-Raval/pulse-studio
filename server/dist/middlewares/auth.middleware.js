"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticate = void 0;
const client_1 = require("@prisma/client");
const token_js_1 = require("../utils/token.js");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication token is missing or malformed',
            },
        });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = (0, token_js_1.verifyAccessToken)(token);
        req.user = {
            id: decoded.id,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        const isExpired = error?.name === 'TokenExpiredError';
        res.status(401).json({
            error: {
                code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
                message: isExpired ? 'Access token has expired' : 'Invalid access token',
            },
        });
    }
};
exports.authenticate = authenticate;
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User is not authenticated',
                },
            });
            return;
        }
        // ADMIN has hierarchical superuser bypass matching frontend hasRole
        const isAllowed = allowedRoles.includes(req.user.role) || req.user.role === client_1.Role.ADMIN;
        if (!isAllowed) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`,
                },
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
