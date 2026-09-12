import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';
import {
  validateBody,
  validateParams,
} from '../middlewares/validate.middleware.js';
import {
  getTaskById,
  updateTaskStatus,
  updateTask,
} from '../controllers/task.controller.js';
import {
  taskIdParamSchema,
  updateTaskStatusSchema,
  updateTaskSchema,
} from '../validations/task.validation.js';

const router = Router();

// GET single task with activity logs (Role-scoped)
router.get(
  '/:id',
  authenticate,
  validateParams(taskIdParamSchema),
  getTaskById
);

// Status transition (Permitted for ADMIN, PM, and DEVELOPER for assigned tasks)
router.patch(
  '/:id/status',
  authenticate,
  validateParams(taskIdParamSchema),
  validateBody(updateTaskStatusSchema),
  updateTaskStatus
);

// Full task edit (ADMIN or PM who created the project only)
router.patch(
  '/:id',
  authenticate,
  requireRole(Role.ADMIN, Role.PM),
  validateParams(taskIdParamSchema),
  validateBody(updateTaskSchema),
  updateTask
);

export default router;
