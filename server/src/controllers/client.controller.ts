import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

export const listClients = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ clients });
  } catch (error) {
    next(error);
  }
};

export const createClient = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name } = req.body;
    const normalizedName = String(name).trim();

    const client = await prisma.client.create({
      data: {
        name: normalizedName,
      },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });

    res.status(201).json({ client });
  } catch (error) {
    next(error);
  }
};
