"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_js_1 = require("../controllers/notification.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const router = (0, express_1.Router)();
// All notification routes require authentication
router.use(auth_middleware_js_1.authenticate);
// GET /api/notifications -> List paginated notifications for current user
router.get('/', notification_controller_js_1.getNotifications);
// GET /api/notifications/unread-count -> Current unread badge count
router.get('/unread-count', notification_controller_js_1.getUnreadNotificationsCount);
// PATCH /api/notifications/read-all -> Mark all notifications as read for current user
router.patch('/read-all', notification_controller_js_1.markAllNotificationsAsRead);
// PATCH /api/notifications/:id/read -> Mark specific notification as read
router.patch('/:id/read', notification_controller_js_1.markNotificationAsRead);
exports.default = router;
