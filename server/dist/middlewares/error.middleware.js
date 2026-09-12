"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, _req, res, _next) => {
    console.error('Unhandled Server Error:', err);
    const statusCode = err.status || err.statusCode || 500;
    const code = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR');
    const message = statusCode === 500 && process.env.NODE_ENV === 'production'
        ? 'An unexpected internal server error occurred'
        : err.message || 'An unexpected error occurred';
    res.status(statusCode).json({
        error: {
            code,
            message,
        },
    });
};
exports.errorHandler = errorHandler;
