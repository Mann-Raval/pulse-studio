"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const validate_middleware_js_1 = require("../middlewares/validate.middleware.js");
const task_controller_js_1 = require("../controllers/task.controller.js");
const task_validation_js_1 = require("../validations/task.validation.js");
const router = (0, express_1.Router)();
// GET single task with activity logs (Role-scoped)
router.get('/:id', auth_middleware_js_1.authenticate, (0, validate_middleware_js_1.validateParams)(task_validation_js_1.taskIdParamSchema), task_controller_js_1.getTaskById);
// Status transition (Permitted for ADMIN, PM, and DEVELOPER for assigned tasks)
router.patch('/:id/status', auth_middleware_js_1.authenticate, (0, validate_middleware_js_1.validateParams)(task_validation_js_1.taskIdParamSchema), (0, validate_middleware_js_1.validateBody)(task_validation_js_1.updateTaskStatusSchema), task_controller_js_1.updateTaskStatus);
// Full task edit (ADMIN or PM who created the project only)
router.patch('/:id', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.requireRole)(client_1.Role.ADMIN, client_1.Role.PM), (0, validate_middleware_js_1.validateParams)(task_validation_js_1.taskIdParamSchema), (0, validate_middleware_js_1.validateBody)(task_validation_js_1.updateTaskSchema), task_controller_js_1.updateTask);
exports.default = router;
