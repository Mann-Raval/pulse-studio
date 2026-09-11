export type ActivityType = 'all' | 'status' | 'assign' | 'blocker' | 'deploy' | 'pr' | 'review' | 'mention' | 'task';

export interface ActivityEvent {
  id: string | number;
  user: string;
  action: string;
  from?: string;
  to?: string;
  project: string;
  time: string;
  type: ActivityType;
  note?: string;
}
