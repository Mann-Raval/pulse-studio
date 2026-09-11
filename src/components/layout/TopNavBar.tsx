import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../common/Avatar';

export interface TopNavBarProps {
  currentTime: string;
  unreadNotificationsCount: number;
  isNotificationsOpen: boolean;
  onToggleNotifications: () => void;
  onOpenTaskModal: () => void;
  activeAgentsCount?: number;
  userAvatarUrl?: string;
  onSearchChange?: (query: string) => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentTime,
  unreadNotificationsCount,
  isNotificationsOpen,
  onToggleNotifications,
  onOpenTaskModal,
  activeAgentsCount = 24,
  userAvatarUrl,
  onSearchChange,
}) => {
  return (
    <header className="h-12 bg-surface-container-lowest border-b border-outline-variant/30 flex justify-between items-center w-full px-5 select-none z-30 shrink-0">
      {/* Search bar with ⌘K shortcut */}
      <div className="flex items-center gap-3 max-w-md flex-1">
        <div className="relative w-full flex items-center">
          <span className="material-symbols-outlined absolute left-2.5 text-outline text-sm">
            search
          </span>
          <input
            type="text"
            placeholder="Search projects, tasks, or agents (⌘K)..."
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full h-8 pl-8 pr-10 rounded-sm bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <span className="absolute right-2 text-[10px] font-mono px-1 py-0.2 rounded bg-surface-container-highest text-outline">
            ⌘K
          </span>
        </div>
      </div>

      {/* Center stream status */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-sm bg-surface-container-low border border-outline-variant/40 text-[11px] font-mono">
        <span className="relative flex h-1.5 w-1.5">
          <span className="status-ring-pulse absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-secondary"></span>
        </span>
        <span className="text-on-surface-variant">STREAM: {activeAgentsCount} active agents</span>
        <span className="text-outline">|</span>
        <span className="text-on-surface">{currentTime || "14:28:45 UTC"}</span>
      </div>

      {/* Trailing Controls */}
      <div className="flex items-center gap-2 relative">
        <button
          onClick={onOpenTaskModal}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm bg-primary hover:bg-inverse-primary text-white text-xs font-medium transition-all shadow-sm active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Create Task</span>
        </button>

        <div className="h-4 w-px bg-outline-variant/40 mx-1"></div>

        {/* Notifications Bell */}
        <button
          onClick={onToggleNotifications}
          className={`p-1.5 rounded-sm relative transition-colors ${
            isNotificationsOpen
              ? 'bg-surface-container-high text-primary'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
          title="Toggle notifications"
        >
          <span className="material-symbols-outlined text-base">notifications</span>
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-tertiary"></span>
          )}
        </button>

        {/* Telemetry / Log shortcut */}
        <Link
          to="/activity"
          className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-sm"
          title="Audit Stream"
        >
          <span className="material-symbols-outlined text-base">monitoring</span>
        </Link>

        {/* User avatar */}
        <div className="ml-2 flex items-center">
          <Avatar src={userAvatarUrl} size="md" isOnline={true} />
        </div>
      </div>
    </header>
  );
};
