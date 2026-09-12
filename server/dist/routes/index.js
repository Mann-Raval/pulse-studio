"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_js_1 = __importDefault(require("./auth.routes.js"));
const user_routes_js_1 = __importDefault(require("./user.routes.js"));
const client_routes_js_1 = __importDefault(require("./client.routes.js"));
const project_routes_js_1 = __importDefault(require("./project.routes.js"));
const task_routes_js_1 = __importDefault(require("./task.routes.js"));
const notification_routes_js_1 = __importDefault(require("./notification.routes.js"));
const router = (0, express_1.Router)();
// Health check endpoint
router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Auth endpoints
router.use('/auth', auth_routes_js_1.default);
// Users management endpoints (ADMIN only CRUD / PM role list)
router.use('/users', user_routes_js_1.default);
// Clients management endpoints (ADMIN CRUD / PM list)
router.use('/clients', client_routes_js_1.default);
// Projects endpoints
router.use('/projects', project_routes_js_1.default);
// Tasks endpoints
router.use('/tasks', task_routes_js_1.default);
// Notifications endpoints
router.use('/notifications', notification_routes_js_1.default);
exports.default = router;
