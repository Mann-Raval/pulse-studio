import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

export const listUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userRole = req.user!.role;
    const { role } = req.query;

    // ADMIN can view all users or filtered users.
    // PM can view with ?role=DEVELOPER (for task assignment).
    // DEVELOPER is forbidden from listing all users.
    if (userRole === Role.DEVELOPER) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. Requires one of the following roles: ADMIN, PM',
        },
      });
      return;
    }

    if (userRole === Role.PM && !role) {
      // If PM requests full user list without filter, restrict to DEVELOPERs
      const users = await prisma.user.findMany({
        where: { role: Role.DEVELOPER },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      });
      res.status(200).json({ users });
      return;
    }

    const where: any = {};
    if (role) {
      const upper = String(role).toUpperCase();
      if (upper === 'ADMIN' || upper === 'PM' || upper === 'DEVELOPER') {
        where.role = upper as Role;
      }
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const normalizedEmail = String(email).toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: 'A user with this email address already exists',
        },
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: role as Role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (role) updateData.role = role as Role;
    if (email) {
      const normalizedEmail = String(email).toLowerCase().trim();
      if (normalizedEmail !== existing.email) {
        const emailConflict = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (emailConflict) {
          res.status(409).json({
            error: {
              code: 'CONFLICT',
              message: 'Email is already in use by another account',
            },
          });
          return;
        }
        updateData.email = normalizedEmail;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
};
