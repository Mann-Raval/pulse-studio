import React, { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { SocketContext, type ActivityPayload, type PresenceUser } from './socket-context-def';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [activities, setActivities] = useState<ActivityPayload[]>([]);
  const [latestActivity, setLatestActivity] = useState<ActivityPayload | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<any>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

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

    socketInstance.on('notification:new', (notification: any) => {
      setLatestNotification(notification);
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
  }, [token, user?.id]);

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

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineCount,
        onlineUsers,
        activities,
        latestActivity,
        unreadNotificationsCount,
        latestNotification,
        joinProject,
        leaveProject,
        syncActivities,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
