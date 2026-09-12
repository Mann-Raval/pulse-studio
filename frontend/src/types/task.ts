export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done' | 'Blocked';

export interface TaskComment {
  id: string | number;
  user: string;
  time: string;
  text: string;
}

export interface Task {
  id: string;
  displayId?: string;
  title: string;
  project: string;
  assignee?: string;
  priority: TaskPriority;
  status: TaskStatus;
  branch?: string;
  due?: string;
  isOverdue?: boolean;
  description?: string;
  comments?: TaskComment[];
}

export interface CreateTaskPayload {
  title: string;
  project: string;
  priority: TaskPriority;
  description?: string;
  assignee?: string;
}
