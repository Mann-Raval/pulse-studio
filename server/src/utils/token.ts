import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Response, CookieOptions } from 'express';
import { Role } from '@prisma/client';
import { config } from '../config/index.js';
import { AuthUserPayload } from '../types/index.js';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export const generateAccessToken = (payload: AuthUserPayload): string => {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): AuthUserPayload => {
  return jwt.verify(token, config.JWT_ACCESS_SECRET) as AuthUserPayload;
};

export const generateRefreshTokenString = (): string => {
  return crypto.randomBytes(48).toString('hex');
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const getRefreshTokenCookieOptions = (): CookieOptions => {
  const isProduction = config.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: config.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  };
};

export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_COOKIE_NAME, token, getRefreshTokenCookieOptions());
};

export const clearRefreshTokenCookie = (res: Response): void => {
  const isProduction = config.NODE_ENV === 'production';
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/api/auth',
  });
};
