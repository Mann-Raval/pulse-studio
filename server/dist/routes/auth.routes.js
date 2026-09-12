"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const validate_middleware_js_1 = require("../middlewares/validate.middleware.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const auth_validation_js_1 = require("../validations/auth.validation.js");
const router = (0, express_1.Router)();
// Public routes
router.post('/login', (0, validate_middleware_js_1.validateBody)(auth_validation_js_1.loginSchema), auth_controller_js_1.login);
router.post('/register', (0, validate_middleware_js_1.validateBody)(auth_validation_js_1.registerSchema), auth_controller_js_1.register);
router.post('/refresh', auth_controller_js_1.refresh);
router.post('/logout', auth_controller_js_1.logout);
// Protected routes
router.get('/me', auth_middleware_js_1.authenticate, auth_controller_js_1.getMe);
router.get('/users', auth_middleware_js_1.authenticate, auth_controller_js_1.getUsers);
exports.default = router;
