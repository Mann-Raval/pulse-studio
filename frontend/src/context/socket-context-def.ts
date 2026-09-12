import { createContext } from 'react';
import type { Socket } from 'socket.io-client';
import type { NotificationItem } from '../types';

export interface ActivityPayload {
  id: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  changedBy: {
    id: string;
    name: string;
  };
  fromStatus: string;
  toStatus: string;
  changedAt: string | Date;
}

export interface TaskOverduePayload {
  taskId: string;
  projectId: string;
  taskTitle: string;
  assignedToId: string | null;
  dueDate: string | Date | null;
  isOverdue: boolean;
}

export interface PresenceUser {
  id: string;
  name: string;
  role: string;
}

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineCount: number;
  onlineUsers: PresenceUser[];
  activities: ActivityPayload[];
  latestActivity: ActivityPayload | null;
  latestTaskOverdue: TaskOverduePayload | null;
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  latestNotification: any;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  syncActivities: (lastTimestamp: string | null) => Promise<ActivityPayload[]>;
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string | number) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

export const SocketContext = createContext<SocketContextType | undefined>(undefined);
