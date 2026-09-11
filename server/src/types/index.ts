import { Role } from '@prisma/client';
import { Request } from 'express';

export interface AuthUserPayload {
  id: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export interface StructuredErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
