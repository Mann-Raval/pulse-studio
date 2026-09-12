import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { NotificationItem } from '../../types';

export interface NotificationDrawerProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAsRead?: (id: string | number) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}) => {
  const navigate = useNavigate();

  const handleNotificationClick = (n: NotificationItem) => {
    if (n.unread && onMarkAsRead) {
      onMarkAsRead(n.id);
    }
  };

  const handleViewTask = (n: NotificationItem) => {
    if (n.unread && onMarkAsRead) {
      onMarkAsRead(n.id);
    }
    onClose();
    navigate('/project-board');
  };

  const handleDismiss = (n: NotificationItem) => {
    if (n.unread && onMarkAsRead) {
      onMarkAsRead(n.id);
    }
  };

  return (
    <div className="fixed top-12 right-6 w-[420px] max-w-[90vw] z-50 rounded-sm bg-surface-container-lowest border border-outline-variant/60 shadow-2xl backdrop-blur-xl flex flex-col animate-in fade-in duration-100 transition-colors">
      <div className="p-3 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-low">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-on-surface">Notifications</span>
          <span className="px-1.5 py-0.2 rounded-sm bg-primary/20 text-primary text-[10px] font-mono font-semibold">
            {unreadCount} Unread
          </span>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-[11px] font-mono text-outline hover:text-primary transition-colors cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="max-h-[380px] overflow-y-auto divide-y divide-outline-variant/20">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-outline text-xs font-mono">
            <span className="material-symbols-outlined text-2xl text-outline mb-1 block">notifications_off</span>
            No notifications right now
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-3 text-xs transition-colors hover:bg-surface-container cursor-pointer ${
                n.unread
                  ? 'bg-primary/5 border-l-2 border-primary'
                  : ''
              }`}
            >
              <div className="flex justify-between items-center text-[10px] font-mono text-outline mb-1">
                <span className="truncate max-w-[240px]">{n.team}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {n.unread && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                  )}
                  <span>{n.time}</span>
                </div>
              </div>
              <p className="text-on-surface font-medium leading-snug">{n.title}</p>
              <div className="mt-2.5 flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewTask(n);
                  }}
                  className="px-2.5 py-0.5 rounded-sm bg-primary text-white text-[10px] font-medium hover:bg-inverse-primary cursor-pointer transition-colors"
                >
                  View Task
                </button>
                {n.unread && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(n);
                    }}
                    className="px-2 py-0.5 rounded-sm bg-surface-container-high text-outline hover:text-on-surface text-[10px] cursor-pointer transition-colors"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-2.5 border-t border-outline-variant/40 bg-surface-container-low flex justify-between items-center text-[11px] font-mono">
        <span className="text-secondary flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
          Realtime Sync Active
        </span>
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
