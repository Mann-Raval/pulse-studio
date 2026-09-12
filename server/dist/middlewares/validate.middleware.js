"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateBody = void 0;
const zod_1 = require("zod");
const validateBody = (schema) => {
    return async (req, res, next) => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Input validation failed',
                        details: error.errors.map((e) => ({
                            path: e.path.join('.'),
                            message: e.message,
                        })),
                    },
                });
                return;
            }
            next(error);
        }
    };
};
exports.validateBody = validateBody;
const validateQuery = (schema) => {
    return async (req, res, next) => {
        try {
            req.query = await schema.parseAsync(req.query);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Query parameter validation failed',
                        details: error.errors.map((e) => ({
                            path: e.path.join('.'),
                            message: e.message,
                        })),
                    },
                });
                return;
            }
            next(error);
        }
    };
};
exports.validateQuery = validateQuery;
const validateParams = (schema) => {
    return async (req, res, next) => {
        try {
            req.params = await schema.parseAsync(req.params);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Path parameter validation failed',
                        details: error.errors.map((e) => ({
                            path: e.path.join('.'),
                            message: e.message,
                        })),
                    },
                });
                return;
            }
            next(error);
        }
    };
};
exports.validateParams = validateParams;
