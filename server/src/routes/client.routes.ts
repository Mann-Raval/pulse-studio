import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { listClients, createClient } from '../controllers/client.controller.js';
import { createClientSchema } from '../validations/client.validation.js';

const router = Router();

// GET /api/clients (ADMIN & PM can list all clients)
router.get(
  '/',
  authenticate,
  requireRole(Role.ADMIN, Role.PM),
  listClients
);

// POST /api/clients (ADMIN only can create clients)
router.post(
  '/',
  authenticate,
  requireRole(Role.ADMIN),
  validateBody(createClientSchema),
  createClient
);

export default router;
