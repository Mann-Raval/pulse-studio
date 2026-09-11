import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { NotificationItem } from '../../types';

export interface NotificationDrawerProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  notifications,
  unreadCount,
  onMarkAllAsRead,
  onClose,
}) => {
  const navigate = useNavigate();

  return (
    <div className="fixed top-12 right-6 w-[420px] z-50 rounded-sm bg-[#16191E] border border-outline-variant shadow-2xl backdrop-blur-xl flex flex-col animate-in fade-in duration-100">
      <div className="p-3 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">Notifications</span>
          <span className="px-1.5 py-0.2 rounded-sm bg-primary/20 text-primary text-[10px] font-mono">
            {unreadCount} Unread
          </span>
        </div>
        <button
          onClick={onMarkAllAsRead}
          className="text-[11px] font-mono text-outline hover:text-primary transition-colors"
        >
          Mark all as read
        </button>
      </div>

      <div className="max-h-[380px] overflow-y-auto divide-y divide-outline-variant/20">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-3 text-xs transition-colors hover:bg-surface-container ${
              n.unread && unreadCount > 0
                ? 'bg-primary/5 border-l-2 border-primary'
                : ''
            }`}
          >
            <div className="flex justify-between items-center text-[10px] font-mono text-outline mb-1">
              <span>{n.team}</span>
              <span>{n.time}</span>
            </div>
            <p className="text-on-surface font-medium">{n.title}</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  onClose();
                  navigate('/project-board');
                }}
                className="px-2 py-0.5 rounded-sm bg-primary text-white text-[10px] hover:bg-inverse-primary"
              >
                View Task
              </button>
              <button
                onClick={onClose}
                className="px-2 py-0.5 rounded-sm bg-surface-container-high text-outline hover:text-on-surface text-[10px]"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 border-t border-outline-variant/60 bg-surface-container-low flex justify-between items-center text-[11px] font-mono">
        <span className="text-secondary">● Realtime Sync Active</span>
        <Link
          to="/activity"
          onClick={onClose}
          className="text-primary hover:underline"
        >
          Full Audit Log →
        </Link>
      </div>
    </div>
  );
};
