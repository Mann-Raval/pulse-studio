export interface NotificationItem {
  id: string | number;
  title: string;
  team: string;
  time: string;
  unread: boolean;
  type: 'task' | 'review' | 'mention' | 'deploy' | string;
}
