"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const index_js_1 = require("./config/index.js");
const index_js_2 = __importDefault(require("./routes/index.js"));
const error_middleware_js_1 = require("./middlewares/error.middleware.js");
const createApp = () => {
    const app = (0, express_1.default)();
    // CORS configuration
    app.use((0, cors_1.default)({
        origin: index_js_1.config.CLIENT_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    // Parsers
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)(index_js_1.config.COOKIE_SECRET));
    // Root welcome endpoint
    app.get('/', (_req, res) => {
        res.status(200).json({
            service: 'Pulse Studio API',
            status: 'running',
            documentation: 'See /api/health for health check',
            frontend: 'https://pulse-studio-olive.vercel.app',
        });
    });
    // Mount API routes
    app.use('/api', index_js_2.default);
    // 404 handler with structured response
    app.use((_req, res) => {
        res.status(404).json({
            error: {
                code: 'NOT_FOUND',
                message: 'The requested resource was not found',
            },
        });
    });
    // Global structured error handling middleware
    app.use(error_middleware_js_1.errorHandler);
    return app;
};
exports.createApp = createApp;
