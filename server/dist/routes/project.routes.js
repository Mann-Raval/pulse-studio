"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const validate_middleware_js_1 = require("../middlewares/validate.middleware.js");
const project_controller_js_1 = require("../controllers/project.controller.js");
const task_controller_js_1 = require("../controllers/task.controller.js");
const project_validation_js_1 = require("../validations/project.validation.js");
const task_validation_js_1 = require("../validations/task.validation.js");
const router = (0, express_1.Router)();
// Project Endpoints
router.post('/', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.requireRole)(client_1.Role.ADMIN, client_1.Role.PM), (0, validate_middleware_js_1.validateBody)(project_validation_js_1.createProjectSchema), project_controller_js_1.createProject);
router.get('/', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.requireRole)(client_1.Role.ADMIN, client_1.Role.PM), (0, validate_middleware_js_1.validateQuery)(project_validation_js_1.projectQuerySchema), project_controller_js_1.getProjects);
router.get('/:id', auth_middleware_js_1.authenticate, (0, validate_middleware_js_1.validateParams)(project_validation_js_1.projectIdParamSchema), project_controller_js_1.getProjectById);
router.patch('/:id', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.requireRole)(client_1.Role.ADMIN, client_1.Role.PM), (0, validate_middleware_js_1.validateParams)(project_validation_js_1.projectIdParamSchema), (0, validate_middleware_js_1.validateBody)(project_validation_js_1.updateProjectSchema), project_controller_js_1.updateProject);
router.delete('/:id', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.requireRole)(client_1.Role.ADMIN, client_1.Role.PM), (0, validate_middleware_js_1.validateParams)(project_validation_js_1.projectIdParamSchema), project_controller_js_1.deleteProject);
// Nested Project Tasks Endpoints
router.post('/:projectId/tasks', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.requireRole)(client_1.Role.ADMIN, client_1.Role.PM), (0, validate_middleware_js_1.validateParams)(task_validation_js_1.projectTaskParamsSchema), (0, validate_middleware_js_1.validateBody)(task_validation_js_1.createTaskSchema), task_controller_js_1.createTask);
router.get('/:projectId/tasks', auth_middleware_js_1.authenticate, (0, validate_middleware_js_1.validateParams)(task_validation_js_1.projectTaskParamsSchema), (0, validate_middleware_js_1.validateQuery)(task_validation_js_1.taskQuerySchema), task_controller_js_1.getProjectTasks);
exports.default = router;
