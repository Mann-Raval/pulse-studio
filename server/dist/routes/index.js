"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_js_1 = __importDefault(require("./auth.routes.js"));
const project_routes_js_1 = __importDefault(require("./project.routes.js"));
const task_routes_js_1 = __importDefault(require("./task.routes.js"));
const router = (0, express_1.Router)();
// Health check endpoint
router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Auth endpoints
router.use('/auth', auth_routes_js_1.default);
// Projects endpoints
router.use('/projects', project_routes_js_1.default);
// Tasks endpoints
router.use('/tasks', task_routes_js_1.default);
exports.default = router;
