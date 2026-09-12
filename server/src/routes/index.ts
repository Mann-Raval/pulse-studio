import { Router } from 'express';
import authRoutes from './auth.routes.js';
import projectRoutes from './project.routes.js';
import taskRoutes from './task.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth endpoints
router.use('/auth', authRoutes);

// Projects endpoints
router.use('/projects', projectRoutes);

// Tasks endpoints
router.use('/tasks', taskRoutes);

export default router;

