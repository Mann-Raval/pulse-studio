import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Role, Prisma } from '@prisma/client';
import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';
import { verifyAccessToken } from '../utils/token.js';
import { canAccessProject } from '../utils/permissions.js';
import { presenceManager } from './presence.js';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  ActivityPayload,
  NotificationPayload,
} from '../types/socket.js';

let io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;

export const initSocketServer = (
  httpServer: HttpServer
): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> => {
  io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: config.CLIENT_URL,
        credentials: true,
        methods: ['GET', 'POST'],
      },
      pingTimeout: 30000,
      pingInterval: 25000,
    }
  );

  // Authentication Middleware on Handshake
  io.use(async (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      let token = socket.handshake.auth?.token;

      if (!token && authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }

      if (!token) {
        return next(new Error('Authentication error: Token is missing'));
      }

      const decoded = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
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
    } catch (error: any) {
      const isExpired = error?.name === 'TokenExpiredError';
      return next(
        new Error(
          isExpired
            ? 'Authentication error: Access token expired'
            : 'Authentication error: Invalid access token'
        )
      );
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
    if (user.role === Role.ADMIN) {
      // ADMIN: global room for all activity and presence
      socket.join('activity:global');
    } else if (user.role === Role.PM) {
      // PM: joins personal PM room and all project rooms for projects they created
      socket.join(`activity:pm:${user.id}`);

      try {
        const pmProjects = await prisma.project.findMany({
          where: { createdById: user.id },
          select: { id: true },
        });

        for (const proj of pmProjects) {
          socket.join(`activity:project:${proj.id}`);
        }
      } catch (err) {
        console.error(`Failed to join PM ${user.id} to project rooms:`, err);
      }
    } else if (user.role === Role.DEVELOPER) {
      // DEVELOPER: joins their assigned activity room
      socket.join(`activity:dev:${user.id}`);
    }

    // 3. Track presence
    presenceManager.addConnection({
      id: user.id,
      name: user.name,
      role: user.role,
    });

    // Broadcast updated presence to Admin global room
    io?.to('activity:global').emit('presence:update', presenceManager.getPresencePayload());

    // If Admin connects, send them the current presence state immediately
    if (user.role === Role.ADMIN) {
      socket.emit('presence:update', presenceManager.getPresencePayload());
    }

    // 4. Handle client navigating to a specific project board
    socket.on('join:project', async (data, callback) => {
      try {
        const { projectId } = data;
        if (!projectId) {
          callback?.({ success: false, message: 'Project ID is required' });
          return;
        }

        const { allowed } = await canAccessProject(user.id, user.role, projectId);

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
      } catch (err: any) {
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
        const where: Prisma.TaskActivityLogWhereInput = {
          ...(lastActivityTimestamp
            ? { changedAt: { gt: new Date(lastActivityTimestamp) } }
            : {}),
          ...(user.role === Role.PM
            ? { task: { project: { createdById: user.id } } }
            : {}),
          ...(user.role === Role.DEVELOPER
            ? { task: { assignedToId: user.id } }
            : {}),
        };

        const logs = await prisma.taskActivityLog.findMany({
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
        const activities: ActivityPayload[] = logs.map((log) => ({
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
      } catch (err: any) {
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
      presenceManager.removeConnection(user.id);
      io?.to('activity:global').emit('presence:update', presenceManager.getPresencePayload());
    });
  });

  return io;
};

export const getIO = (): Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> => {
  if (!io) {
    throw new Error('Socket.io server has not been initialized');
  }
  return io;
};

/**
 * Broadcasts task activity event to relevant role-scoped rooms.
 * - activity:global (Admin sees all)
 * - activity:project:<projectId> (Anyone viewing the project board)
 * - activity:dev:<assignedToId> (Assignee developer if set)
 */
export const broadcastTaskActivity = (
  activity: ActivityPayload,
  assignedToId?: string | null
): void => {
  if (!io) return;

  // 1. Global room for Admins
  io.to('activity:global').emit('activity:new', activity);

  // 2. Project room for board viewers
  io.to(`activity:project:${activity.projectId}`).emit('activity:new', activity);

  // 3. Developer room for the assigned developer
  if (assignedToId) {
    io.to(`activity:dev:${assignedToId}`).emit('activity:new', activity);
  }
};

/**
 * Emits a notification and updated unread count to a specific user.
 */
export const broadcastNotification = async (
  userId: string,
  notification: NotificationPayload
): Promise<void> => {
  if (!io) return;

  const targetRoom = `user:${userId}`;

  // Emit the new notification
  io.to(targetRoom).emit('notification:new', notification);

  // Compute live unread count from database and emit
  try {
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    io.to(targetRoom).emit('notification:count', { unreadCount });
  } catch (err) {
    console.error(`Failed to query unread count for user ${userId}:`, err);
  }
};
