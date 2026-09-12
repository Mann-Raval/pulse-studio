import { Router } from 'express';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications -> List paginated notifications for current user
router.get('/', getNotifications);

// GET /api/notifications/unread-count -> Current unread badge count
router.get('/unread-count', getUnreadNotificationsCount);

// PATCH /api/notifications/read-all -> Mark all notifications as read for current user
router.patch('/read-all', markAllNotificationsAsRead);

// PATCH /api/notifications/:id/read -> Mark specific notification as read
router.patch('/:id/read', markNotificationAsRead);

export default router;
