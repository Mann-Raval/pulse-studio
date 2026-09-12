import React, { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import {
  SocketContext,
  type ActivityPayload,
  type TaskOverduePayload,
  type PresenceUser,
} from './socket-context-def';
import type { NotificationItem } from '../types';
import { api } from '../services/api';

const formatNotification = (n: any): NotificationItem => ({
  id: n.id,
  title: n.message,
  team: n.relatedTask?.title ? `Task: ${n.relatedTask.title}` : 'Pulse Studio',
  time: n.createdAt
    ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'just now',
  unread: !n.isRead,
  type: n.type?.toLowerCase().includes('task')
    ? 'task'
    : n.type?.toLowerCase().includes('alert')
    ? 'deploy'
    : 'review',
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [activities, setActivities] = useState<ActivityPayload[]>([]);
  const [latestActivity, setLatestActivity] = useState<ActivityPayload | null>(null);
  const [latestTaskOverdue, setLatestTaskOverdue] = useState<TaskOverduePayload | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<any>(null);

  const socketRef = useRef<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const [resNotifs, resCount] = await Promise.all([
        api.getNotifications(1, 20).catch(() => null),
        api.getUnreadNotificationsCount().catch(() => null),
      ]);

      if (resNotifs?.notifications) {
        setNotifications(resNotifs.notifications.map(formatNotification));
      }
      if (resCount?.unreadCount !== undefined) {
        setUnreadNotificationsCount(resCount.unreadCount);
      } else if (resNotifs?.unreadCount !== undefined) {
        setUnreadNotificationsCount(resNotifs.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications on load:', err);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setNotifications([]);
      setUnreadNotificationsCount(0);
      return;
    }

    // Fetch initial notifications and unread badge count from REST API
    fetchNotifications();

    const socketInstance = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setSocket(socketInstance);
      socketInstance.emit('sync:request', { lastActivityTimestamp: null });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      setSocket(null);
    });

    socketInstance.on('presence:update', (payload: { count: number; users: PresenceUser[] }) => {
      setOnlineCount(payload.count || 1);
      setOnlineUsers(payload.users || []);
    });

    socketInstance.on('activity:new', (activity: ActivityPayload) => {
      setLatestActivity(activity);
      setActivities((prev) => [activity, ...prev.slice(0, 49)]);
    });

    socketInstance.on('task:overdue', (payload: TaskOverduePayload) => {
      setLatestTaskOverdue(payload);
    });

    socketInstance.on('notification:new', (notificationPayload: any) => {
      setLatestNotification(notificationPayload);
      const formatted = formatNotification(notificationPayload);
      setNotifications((prev) => {
        const filtered = prev.filter((item) => item.id !== formatted.id);
        return [formatted, ...filtered];
      });
      setUnreadNotificationsCount((prev) => prev + 1);
    });

    socketInstance.on('notification:count', (data: { unreadCount: number }) => {
      setUnreadNotificationsCount(data.unreadCount);
    });

    socketInstance.on('sync:response', (syncedActivities: ActivityPayload[]) => {
      if (syncedActivities && syncedActivities.length > 0) {
        setActivities((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const newEntries = syncedActivities.filter((a) => !existingIds.has(a.id));
          return [...newEntries, ...prev];
        });
      }
    });

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.id, fetchNotifications]);

  const joinProject = useCallback((projectId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join:project', { projectId });
    }
  }, []);

  const leaveProject = useCallback((projectId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave:project', { projectId });
    }
  }, []);

  const syncActivities = useCallback((lastTimestamp: string | null): Promise<ActivityPayload[]> => {
    return new Promise((resolve) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('sync:request', { lastActivityTimestamp: lastTimestamp }, (res: any) => {
          if (res?.success && res.data) {
            resolve(res.data);
          } else {
            resolve([]);
          }
        });
      } else {
        resolve([]);
      }
    });
  }, []);

  const markNotificationAsRead = useCallback(
    async (id: string | number) => {
      const prevNotifications = notifications;
      const prevCount = unreadNotificationsCount;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (String(n.id) === String(id) ? { ...n, unread: false } : n))
      );
      setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));

      try {
        const res = await api.markNotificationAsRead(id);
        if (res?.unreadCount !== undefined) {
          setUnreadNotificationsCount(res.unreadCount);
        }
      } catch (err) {
        console.error(`Failed to mark notification ${id} as read:`, err);
        // Rollback state on error
        setNotifications(prevNotifications);
        setUnreadNotificationsCount(prevCount);
      }
    },
    [notifications, unreadNotificationsCount]
  );

  const markAllNotificationsAsRead = useCallback(async () => {
    const prevNotifications = notifications;
    const prevCount = unreadNotificationsCount;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setUnreadNotificationsCount(0);

    try {
      await api.markAllNotificationsAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      // Rollback state on error
      setNotifications(prevNotifications);
      setUnreadNotificationsCount(prevCount);
    }
  }, [notifications, unreadNotificationsCount]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineCount,
        onlineUsers,
        activities,
        latestActivity,
        latestTaskOverdue,
        notifications,
        unreadNotificationsCount,
        latestNotification,
        joinProject,
        leaveProject,
        syncActivities,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
