import { Router } from 'express';
import {
  login,
  refresh,
  logout,
  register,
  getMe,
  getUsers,
} from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { loginSchema, registerSchema } from '../validations/auth.validation.js';

const router = Router();

// Public routes
router.post('/login', validateBody(loginSchema), login);
router.post('/register', validateBody(registerSchema), register);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, getUsers);

export default router;
