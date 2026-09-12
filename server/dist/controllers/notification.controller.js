"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUnreadNotificationsCount = exports.getNotifications = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;
        const [total, unreadCount, notifications] = await Promise.all([
            prisma_js_1.prisma.notification.count({
                where: { userId },
            }),
            prisma_js_1.prisma.notification.count({
                where: { userId, isRead: false },
            }),
            prisma_js_1.prisma.notification.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getNotifications = getNotifications;
const getUnreadNotificationsCount = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const unreadCount = await prisma_js_1.prisma.notification.count({
            where: { userId, isRead: false },
        });
        res.status(200).json({ unreadCount });
    }
    catch (error) {
        next(error);
    }
};
exports.getUnreadNotificationsCount = getUnreadNotificationsCount;
const markNotificationAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        // Enforce userId scoping: user can only mark their own notification as read
        const notification = await prisma_js_1.prisma.notification.findUnique({
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
        const updated = await prisma_js_1.prisma.notification.update({
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
        const unreadCount = await prisma_js_1.prisma.notification.count({
            where: { userId, isRead: false },
        });
        res.status(200).json({
            notification: updated,
            unreadCount,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
const markAllNotificationsAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;
        // Enforce userId scoping: mark only current user's unread notifications as read
        const result = await prisma_js_1.prisma.notification.updateMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
