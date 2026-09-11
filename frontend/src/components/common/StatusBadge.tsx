import React from 'react';
import type { TaskPriority, TaskStatus } from '../../types';

interface StatusBadgeProps {
  status?: TaskStatus | string;
  priority?: TaskPriority | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  priority,
  className = '',
}) => {
  if (priority) {
    const priorityClasses: Record<string, string> = {
      critical: 'bg-error/20 text-error',
      high: 'bg-tertiary/20 text-tertiary',
      medium: 'bg-primary/20 text-primary',
      low: 'bg-surface-container text-outline',
    };

    const color = priorityClasses[priority.toLowerCase()] || 'bg-surface-container text-outline';

    return (
      <span
        className={`px-1.5 py-0.5 rounded-sm text-[10px] font-mono capitalize ${color} ${className}`}
      >
        {priority}
      </span>
    );
  }

  if (status) {
    const statusClasses: Record<string, string> = {
      'In Progress': 'bg-primary/20 text-primary',
      'In Review': 'bg-secondary/20 text-secondary',
      'To Do': 'bg-surface-container text-outline',
      'Done': 'bg-secondary/20 text-secondary',
      'Blocked': 'bg-error/20 text-error',
    };

    const color = statusClasses[status] || 'bg-surface-container text-outline';

    return (
      <span
        className={`px-2 py-0.5 rounded-sm text-xs font-sans ${color} ${className}`}
      >
        {status}
      </span>
    );
  }

  return null;
};
