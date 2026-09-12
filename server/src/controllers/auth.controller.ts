import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import {
  generateAccessToken,
  generateRefreshTokenString,
  hashToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  REFRESH_COOKIE_NAME,
} from '../utils/token.js';
import { AuthenticatedRequest } from '../types/index.js';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
      return;
    }

    // Generate short-lived access token (15 mins)
    const accessToken = generateAccessToken({
      id: user.id,
      role: user.role,
    });

    // Generate cryptographically secure refresh token (7 days)
    const rawRefreshToken = generateRefreshTokenString();
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + config.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    // Store revocable hashed refresh token in database
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Set refresh token in HttpOnly, Secure, SameSite cookie
    setRefreshTokenCookie(res, rawRefreshToken);

    res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!rawRefreshToken) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Refresh token cookie is missing',
        },
      });
      return;
    }

    const incomingHash = hashToken(rawRefreshToken);

    // Look up refresh token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: incomingHash },
      include: { user: true },
    });

    // If not found or expired -> reject and clear cookie
    if (!storedToken || storedToken.expiresAt < new Date()) {
      // If token existed but was expired, delete it
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } }).catch(() => {});
      }
      clearRefreshTokenCookie(res);
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired refresh token',
        },
      });
      return;
    }

    // Token rotation: delete old refresh token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Issue new refresh token & store hash
    const newRawRefreshToken = generateRefreshTokenString();
    const newTokenHash = hashToken(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + config.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: storedToken.userId,
        tokenHash: newTokenHash,
        expiresAt,
      },
    });

    // Set updated cookie
    setRefreshTokenCookie(res, newRawRefreshToken);

    // Issue new access token
    const accessToken = generateAccessToken({
      id: storedToken.user.id,
      role: storedToken.user.role,
    });

    res.status(200).json({
      accessToken,
      user: {
        id: storedToken.user.id,
        name: storedToken.user.name,
        email: storedToken.user.email,
        role: storedToken.user.role,
        createdAt: storedToken.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (rawRefreshToken) {
      const incomingHash = hashToken(rawRefreshToken);
      // Invalidate the refresh token server-side
      await prisma.refreshToken.deleteMany({
        where: { tokenHash: incomingHash },
      });
    }

    // Clear the cookie
    clearRefreshTokenCookie(res);

    res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(409).json({
        error: {
          code: 'USER_EXISTS',
          message: 'A user with this email address already exists',
        },
      });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
      },
    });

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User is not authenticated',
        },
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role } = req.query;
    const where: any = {};
    if (role) {
      where.role = role as any;
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
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};
