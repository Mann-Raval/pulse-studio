export type ProjectHealthStatus = 'On Track' | 'At Risk' | 'Overdue' | 'Active' | 'On Hold';

export interface Project {
  id?: string;
  name: string;
  client: string;
  status: ProjectHealthStatus | string;
  statusColor?: string;
  pct: number;
  tasksCount?: string;
  sprint?: string;
  target?: string;
  activeTasks?: number;
  totalTasks?: number;
}
