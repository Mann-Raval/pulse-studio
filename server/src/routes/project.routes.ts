import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validate.middleware.js';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/project.controller.js';
import {
  createTask,
  getProjectTasks,
} from '../controllers/task.controller.js';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  projectQuerySchema,
} from '../validations/project.validation.js';
import {
  createTaskSchema,
  projectTaskParamsSchema,
  taskQuerySchema,
} from '../validations/task.validation.js';

const router = Router();

// Project Endpoints
router.post(
  '/',
  authenticate,
  requireRole(Role.ADMIN, Role.PM),
  validateBody(createProjectSchema),
  createProject
);

router.get(
  '/',
  authenticate,
  requireRole(Role.ADMIN, Role.PM),
  validateQuery(projectQuerySchema),
  getProjects
);

router.get(
  '/:id',
  authenticate,
  validateParams(projectIdParamSchema),
  getProjectById
);

router.patch(
  '/:id',
  authenticate,
  requireRole(Role.ADMIN, Role.PM),
  validateParams(projectIdParamSchema),
  validateBody(updateProjectSchema),
  updateProject
);

router.delete(
  '/:id',
  authenticate,
  requireRole(Role.ADMIN, Role.PM),
  validateParams(projectIdParamSchema),
  deleteProject
);

// Nested Project Tasks Endpoints
router.post(
  '/:projectId/tasks',
  authenticate,
  requireRole(Role.ADMIN, Role.PM),
  validateParams(projectTaskParamsSchema),
  validateBody(createTaskSchema),
  createTask
);

router.get(
  '/:projectId/tasks',
  authenticate,
  validateParams(projectTaskParamsSchema),
  validateQuery(taskQuerySchema),
  getProjectTasks
);

export default router;
