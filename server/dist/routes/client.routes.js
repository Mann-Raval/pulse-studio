"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const validate_middleware_js_1 = require("../middlewares/validate.middleware.js");
const client_controller_js_1 = require("../controllers/client.controller.js");
const client_validation_js_1 = require("../validations/client.validation.js");
const router = (0, express_1.Router)();
// GET /api/clients (ADMIN & PM can list all clients)
router.get('/', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.requireRole)(client_1.Role.ADMIN, client_1.Role.PM), client_controller_js_1.listClients);
// POST /api/clients (ADMIN only can create clients)
router.post('/', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.requireRole)(client_1.Role.ADMIN), (0, validate_middleware_js_1.validateBody)(client_validation_js_1.createClientSchema), client_controller_js_1.createClient);
exports.default = router;
