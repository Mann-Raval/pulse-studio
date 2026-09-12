import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { useTheme } from '../../context/ThemeContext';
import { useSearch } from '../../context/SearchContext';

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
  const { theme, toggleTheme } = useTheme();
  const { searchQuery, setSearchQuery, clearSearch } = useSearch();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global ⌘K / Ctrl+K keyboard shortcut listener to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearchChange?.(val);
  };

  const handleSearchClick = () => {
    searchInputRef.current?.focus();
  };

  return (
    <header className="h-12 bg-surface-container-lowest border-b border-outline-variant/40 flex justify-between items-center w-full px-5 select-none z-30 shrink-0 transition-colors">
      {/* Search bar with ⌘K shortcut */}
      <div className="flex items-center gap-3 max-w-md flex-1">
        <div className="relative w-full flex items-center">
          <button
            type="button"
            onClick={handleSearchClick}
            className="material-symbols-outlined absolute left-2.5 text-outline text-sm hover:text-on-surface transition-colors cursor-pointer"
            title="Focus search (⌘K)"
          >
            search
          </button>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            placeholder="Search projects, tasks, or agents (⌘K)..."
            onChange={handleInputChange}
            className="w-full h-8 pl-8 pr-16 rounded-sm bg-surface-container border border-outline-variant/40 text-on-surface text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-outline transition-colors"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-outline hover:text-on-surface p-0.5 rounded cursor-pointer transition-colors"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            )}
            <kbd className="text-[10px] font-mono px-1 py-0.2 rounded bg-surface-container-highest text-outline border border-outline-variant/30 pointer-events-none">
              ⌘K
            </kbd>
          </div>
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
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm bg-primary hover:bg-inverse-primary text-white text-xs font-medium transition-all shadow-sm active:scale-[0.98] cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Create Task</span>
        </button>

        <div className="h-4 w-px bg-outline-variant/40 mx-1"></div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-center"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          <span className="material-symbols-outlined text-base">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onToggleNotifications}
          className={`p-1.5 rounded-sm relative transition-colors cursor-pointer ${
            isNotificationsOpen
              ? 'bg-surface-container-high text-primary'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
          title="Toggle notifications"
          aria-label="Toggle notifications"
        >
          <span className="material-symbols-outlined text-base">notifications</span>
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-tertiary ring-2 ring-surface-container-lowest"></span>
          )}
        </button>

        {/* Telemetry / Log shortcut */}
        <Link
          to="/activity"
          className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-sm transition-colors cursor-pointer"
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
