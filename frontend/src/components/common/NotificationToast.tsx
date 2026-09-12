import React, { useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'assigned' | 'review' | 'overdue' | 'alert';
  timestamp: string;
}

// Gentle synthetic notification chime using Web Audio API
const playChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio context might be restricted before user interaction; ignore silently
  }
};

export interface NotificationToastProps {
  onOpenNotifications?: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ onOpenNotifications }) => {
  const { latestNotification, latestTaskOverdue } = useSocket();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Trigger toast on new notification event
  useEffect(() => {
    if (!latestNotification) return;

    const notifType = latestNotification.type || 'info';
    let typeCategory: ToastItem['type'] = 'info';
    let title = 'Notification';

    if (notifType.includes('ASSIGNED')) {
      typeCategory = 'assigned';
      title = 'Task Assigned';
    } else if (notifType.includes('REVIEW')) {
      typeCategory = 'review';
      title = 'Task in Review';
    } else if (notifType.includes('OVERDUE')) {
      typeCategory = 'overdue';
      title = 'Task Overdue Alert';
    }

    const newToast: ToastItem = {
      id: latestNotification.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      message: latestNotification.message || 'You have a new update.',
      type: typeCategory,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    playChime();
    setToasts((prev) => [newToast, ...prev.slice(0, 2)]);

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 6500);

    return () => clearTimeout(timer);
  }, [latestNotification]);

  // Trigger toast on overdue task event
  useEffect(() => {
    if (!latestTaskOverdue) return;

    const newToast: ToastItem = {
      id: `overdue-${latestTaskOverdue.taskId}-${Date.now()}`,
      title: 'Task Overdue',
      message: `Task "${latestTaskOverdue.taskTitle}" is now overdue!`,
      type: 'overdue',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    playChime();
    setToasts((prev) => [newToast, ...prev.slice(0, 2)]);

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 6500);

    return () => clearTimeout(timer);
  }, [latestTaskOverdue]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-14 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isOverdue = toast.type === 'overdue';
        const isAssigned = toast.type === 'assigned';
        const isReview = toast.type === 'review';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-sm shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${
              isOverdue
                ? 'bg-error-container/95 border-error text-on-error-container'
                : isAssigned
                ? 'bg-primary-container/95 border-primary text-on-primary-container'
                : isReview
                ? 'bg-secondary-container/95 border-secondary text-on-secondary-container'
                : 'bg-surface-container-high/95 border-outline-variant text-on-surface'
            }`}
          >
            <div
              className={`p-1.5 rounded-sm shrink-0 flex items-center justify-center ${
                isOverdue
                  ? 'bg-error text-white'
                  : isAssigned
                  ? 'bg-primary text-white'
                  : isReview
                  ? 'bg-secondary text-white'
                  : 'bg-surface-container-highest text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {isOverdue ? 'warning' : isAssigned ? 'assignment_ind' : isReview ? 'rate_review' : 'notifications_active'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {toast.title}
                </span>
                <span className="text-[10px] opacity-75 font-mono">
                  {toast.timestamp}
                </span>
              </div>
              <p className="text-xs mt-0.5 leading-snug break-words">
                {toast.message}
              </p>

              {onOpenNotifications && (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      onOpenNotifications();
                      removeToast(toast.id);
                    }}
                    className="text-[11px] font-mono font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
                  >
                    View in notifications →
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="opacity-70 hover:opacity-100 transition-opacity p-0.5 -mr-1 -mt-1"
              aria-label="Dismiss toast"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
