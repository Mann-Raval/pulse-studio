"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const validate_middleware_js_1 = require("../middlewares/validate.middleware.js");
const user_controller_js_1 = require("../controllers/user.controller.js");
const user_validation_js_1 = require("../validations/user.validation.js");
const router = (0, express_1.Router)();
// GET /api/users (ADMIN can list all, PM can list developers/assignees)
router.get('/', auth_middleware_js_1.authenticate, (0, validate_middleware_js_1.validateQuery)(user_validation_js_1.userQuerySchema), user_controller_js_1.listUsers);
// POST /api/users (ADMIN only)
router.post('/', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.requireRole)(client_1.Role.ADMIN), (0, validate_middleware_js_1.validateBody)(user_validation_js_1.createUserSchema), user_controller_js_1.createUser);
// PATCH /api/users/:id (ADMIN only)
router.patch('/:id', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.requireRole)(client_1.Role.ADMIN), (0, validate_middleware_js_1.validateParams)(user_validation_js_1.userIdParamSchema), (0, validate_middleware_js_1.validateBody)(user_validation_js_1.updateUserSchema), user_controller_js_1.updateUser);
exports.default = router;
