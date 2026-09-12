import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const [total, unreadCount, notifications] = await Promise.all([
      prisma.notification.count({
        where: { userId },
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          relatedTask: {
            select: {
              id: true,
              title: true,
              status: true,
              projectId: true,
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadNotificationsCount = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Enforce userId scoping: user can only mark their own notification as read
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      res.status(404).json({
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found or access denied',
        },
      });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: {
        relatedTask: {
          select: {
            id: true,
            title: true,
            status: true,
            projectId: true,
          },
        },
      },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.status(200).json({
      notification: updated,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Enforce userId scoping: mark only current user's unread notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.status(200).json({
      message: 'All notifications marked as read',
      count: result.count,
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
};
