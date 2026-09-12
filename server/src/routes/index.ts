import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import clientRoutes from './client.routes.js';
import projectRoutes from './project.routes.js';
import taskRoutes from './task.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth endpoints
router.use('/auth', authRoutes);

// Users management endpoints (ADMIN only CRUD / PM role list)
router.use('/users', userRoutes);

// Clients management endpoints (ADMIN CRUD / PM list)
router.use('/clients', clientRoutes);

// Projects endpoints
router.use('/projects', projectRoutes);

// Tasks endpoints
router.use('/tasks', taskRoutes);

// Notifications endpoints
router.use('/notifications', notificationRoutes);

export default router;

