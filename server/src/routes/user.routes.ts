import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validate.middleware.js';
import {
  listUsers,
  createUser,
  updateUser,
} from '../controllers/user.controller.js';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  userQuerySchema,
} from '../validations/user.validation.js';

const router = Router();

// GET /api/users (ADMIN can list all, PM can list developers/assignees)
router.get(
  '/',
  authenticate,
  validateQuery(userQuerySchema),
  listUsers
);

// POST /api/users (ADMIN only)
router.post(
  '/',
  authenticate,
  requireRole(Role.ADMIN),
  validateBody(createUserSchema),
  createUser
);

// PATCH /api/users/:id (ADMIN only)
router.patch(
  '/:id',
  authenticate,
  requireRole(Role.ADMIN),
  validateParams(userIdParamSchema),
  validateBody(updateUserSchema),
  updateUser
);

export default router;
