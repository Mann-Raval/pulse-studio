import { Role, TaskStatus } from '@prisma/client';

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
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  changedAt: string | Date;
}

export interface NotificationPayload {
  id: string;
  userId: string;
  type: string;
  message: string;
  relatedTaskId: string | null;
  isRead: boolean;
  createdAt: string | Date;
}

export interface NotificationCountPayload {
  unreadCount: number;
}

export interface PresenceUser {
  id: string;
  name: string;
  role: Role;
}

export interface PresenceUpdatePayload {
  count: number;
  users: PresenceUser[];
}

export interface TaskOverduePayload {
  taskId: string;
  projectId: string;
  taskTitle: string;
  assignedToId: string | null;
  dueDate: string | Date | null;
  isOverdue: boolean;
}

// Client-to-Server Events
export interface ClientToServerEvents {
  'join:project': (data: { projectId: string }, callback?: (response: { success: boolean; message?: string }) => void) => void;
  'leave:project': (data: { projectId: string }, callback?: (response: { success: boolean }) => void) => void;
  'sync:request': (data: { lastActivityTimestamp: string | null }, callback?: (response: { success: boolean; data?: ActivityPayload[]; error?: string }) => void) => void;
}

// Server-to-Client Events
export interface ServerToClientEvents {
  'activity:new': (payload: ActivityPayload) => void;
  'notification:new': (payload: NotificationPayload) => void;
  'notification:count': (payload: NotificationCountPayload) => void;
  'presence:update': (payload: PresenceUpdatePayload) => void;
  'sync:response': (activities: ActivityPayload[]) => void;
  'task:overdue': (payload: TaskOverduePayload) => void;
  'error': (error: { code: string; message: string }) => void;
}

// Inter-Server Events (if needed)
export interface InterServerEvents {
  ping: () => void;
}

// Socket Data attached to Socket instances
export interface SocketData {
  user: {
    id: string;
    role: Role;
    name: string;
  };
}
