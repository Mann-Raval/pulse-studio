import { Router } from 'express';
import authRoutes from './auth.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth endpoints
router.use('/auth', authRoutes);

export default router;
