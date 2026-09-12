"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastNotification = exports.broadcastTaskActivity = exports.getIO = exports.initSocketServer = void 0;
const socket_io_1 = require("socket.io");
const client_1 = require("@prisma/client");
const index_js_1 = require("../config/index.js");
const prisma_js_1 = require("../lib/prisma.js");
const token_js_1 = require("../utils/token.js");
const permissions_js_1 = require("../utils/permissions.js");
const presence_js_1 = require("./presence.js");
let io = null;
const initSocketServer = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: index_js_1.config.CLIENT_URL,
            credentials: true,
            methods: ['GET', 'POST'],
        },
        pingTimeout: 30000,
        pingInterval: 25000,
    });
    // Authentication Middleware on Handshake
    io.use(async (socket, next) => {
        try {
            const authHeader = socket.handshake.headers?.authorization;
            let token = socket.handshake.auth?.token;
            if (!token && authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
            if (!token) {
                return next(new Error('Authentication error: Token is missing'));
            }
            const decoded = (0, token_js_1.verifyAccessToken)(token);
            const user = await prisma_js_1.prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, name: true, role: true },
            });
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }
            // Attach user information to socket data
            socket.data.user = {
                id: user.id,
                name: user.name,
                role: user.role,
            };
            next();
        }
        catch (error) {
            const isExpired = error?.name === 'TokenExpiredError';
            return next(new Error(isExpired
                ? 'Authentication error: Access token expired'
                : 'Authentication error: Invalid access token'));
        }
    });
    // Socket Connection Handling
    io.on('connection', async (socket) => {
        const user = socket.data.user;
        if (!user) {
            socket.disconnect(true);
            return;
        }
        // 1. Join personal user room (for personal notifications)
        const userPersonalRoom = `user:${user.id}`;
        socket.join(userPersonalRoom);
        // 2. Role-based initial room subscriptions:
        if (user.role === client_1.Role.ADMIN) {
            // ADMIN: global room for all activity and presence
            socket.join('activity:global');
        }
        else if (user.role === client_1.Role.PM) {
            // PM: joins personal PM room and all project rooms for projects they created
            socket.join(`activity:pm:${user.id}`);
            try {
                const pmProjects = await prisma_js_1.prisma.project.findMany({
                    where: { createdById: user.id },
                    select: { id: true },
                });
                for (const proj of pmProjects) {
                    socket.join(`activity:project:${proj.id}`);
                }
            }
            catch (err) {
                console.error(`Failed to join PM ${user.id} to project rooms:`, err);
            }
        }
        else if (user.role === client_1.Role.DEVELOPER) {
            // DEVELOPER: joins their assigned activity room
            socket.join(`activity:dev:${user.id}`);
        }
        // 3. Track presence
        presence_js_1.presenceManager.addConnection({
            id: user.id,
            name: user.name,
            role: user.role,
        });
        // Broadcast updated presence to Admin global room
        io?.to('activity:global').emit('presence:update', presence_js_1.presenceManager.getPresencePayload());
        // If Admin connects, send them the current presence state immediately
        if (user.role === client_1.Role.ADMIN) {
            socket.emit('presence:update', presence_js_1.presenceManager.getPresencePayload());
        }
        // 4. Handle client navigating to a specific project board
        socket.on('join:project', async (data, callback) => {
            try {
                const { projectId } = data;
                if (!projectId) {
                    callback?.({ success: false, message: 'Project ID is required' });
                    return;
                }
                const { allowed } = await (0, permissions_js_1.canAccessProject)(user.id, user.role, projectId);
                if (!allowed) {
                    callback?.({ success: false, message: 'Forbidden: Access denied to project' });
                    socket.emit('error', {
                        code: 'FORBIDDEN',
                        message: 'You do not have access to view activity for this project',
                    });
                    return;
                }
                socket.join(`activity:project:${projectId}`);
                callback?.({ success: true });
            }
            catch (err) {
                callback?.({ success: false, message: err.message });
            }
        });
        // 5. Handle client leaving a project board
        socket.on('leave:project', (data, callback) => {
            const { projectId } = data;
            if (projectId) {
                socket.leave(`activity:project:${projectId}`);
            }
            callback?.({ success: true });
        });
        // 6. DB-backed Missed-Event Catchup
        socket.on('sync:request', async (data, callback) => {
            try {
                const { lastActivityTimestamp } = data;
                // Scoped by role:
                // - Admin: all activities
                // - PM: activities within projects created by PM
                // - Developer: activities on tasks assigned to Developer
                const where = {
                    ...(lastActivityTimestamp
                        ? { changedAt: { gt: new Date(lastActivityTimestamp) } }
                        : {}),
                    ...(user.role === client_1.Role.PM
                        ? { task: { project: { createdById: user.id } } }
                        : {}),
                    ...(user.role === client_1.Role.DEVELOPER
                        ? { task: { assignedToId: user.id } }
                        : {}),
                };
                const logs = await prisma_js_1.prisma.taskActivityLog.findMany({
                    where,
                    take: 20,
                    orderBy: { changedAt: 'desc' },
                    include: {
                        task: {
                            include: {
                                project: {
                                    select: { id: true, name: true },
                                },
                            },
                        },
                        changedBy: {
                            select: { id: true, name: true },
                        },
                    },
                });
                // Map to standard ActivityPayload format
                const activities = logs.map((log) => ({
                    id: log.id,
                    taskId: log.taskId,
                    taskTitle: log.task.title,
                    projectId: log.task.projectId,
                    projectName: log.task.project.name,
                    changedBy: {
                        id: log.changedBy.id,
                        name: log.changedBy.name,
                    },
                    fromStatus: log.fromStatus,
                    toStatus: log.toStatus,
                    changedAt: log.changedAt,
                }));
                // Reverse to return oldest first (chronological order)
                activities.reverse();
                socket.emit('sync:response', activities);
                callback?.({ success: true, data: activities });
            }
            catch (err) {
                console.error('sync:request error:', err);
                socket.emit('error', {
                    code: 'SYNC_ERROR',
                    message: 'Failed to synchronize missed activity events',
                });
                callback?.({ success: false, error: err.message });
            }
        });
        // 7. Handle Disconnect
        socket.on('disconnect', () => {
            presence_js_1.presenceManager.removeConnection(user.id);
            io?.to('activity:global').emit('presence:update', presence_js_1.presenceManager.getPresencePayload());
        });
    });
    return io;
};
exports.initSocketServer = initSocketServer;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io server has not been initialized');
    }
    return io;
};
exports.getIO = getIO;
/**
 * Broadcasts task activity event to relevant role-scoped rooms.
 * - activity:global (Admin sees all)
 * - activity:project:<projectId> (Anyone viewing the project board)
 * - activity:dev:<assignedToId> (Assignee developer if set)
 */
const broadcastTaskActivity = (activity, assignedToId) => {
    if (!io)
        return;
    // 1. Global room for Admins
    io.to('activity:global').emit('activity:new', activity);
    // 2. Project room for board viewers
    io.to(`activity:project:${activity.projectId}`).emit('activity:new', activity);
    // 3. Developer room for the assigned developer
    if (assignedToId) {
        io.to(`activity:dev:${assignedToId}`).emit('activity:new', activity);
    }
};
exports.broadcastTaskActivity = broadcastTaskActivity;
/**
 * Emits a notification and updated unread count to a specific user.
 */
const broadcastNotification = async (userId, notification) => {
    if (!io)
        return;
    const targetRoom = `user:${userId}`;
    // Emit the new notification
    io.to(targetRoom).emit('notification:new', notification);
    // Compute live unread count from database and emit
    try {
        const unreadCount = await prisma_js_1.prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
        io.to(targetRoom).emit('notification:count', { unreadCount });
    }
    catch (err) {
        console.error(`Failed to query unread count for user ${userId}:`, err);
    }
};
exports.broadcastNotification = broadcastNotification;
