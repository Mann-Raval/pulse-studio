import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NavLink } from './NavLink';
import { useAuth } from '../../hooks/useAuth';


export interface SidebarProps {
  activeTab?: string;
  onOpenTaskModal: () => void;
  clusterSyncPct?: string;
  version?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onOpenTaskModal,
  clusterSyncPct = '99.98%',
  version = 'v2.4.1',
}) => {
  const navigate = useNavigate();
  const { user, logout, switchDemoRole } = useAuth();

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    navigate('/');
  };

  const currentRole = user?.role ? String(user.role).toUpperCase() : 'DEVELOPER';

  return (
    <aside className="w-60 h-screen shrink-0 bg-surface-container-low border-r border-outline-variant/30 flex flex-col justify-between p-3 font-sans select-none z-30">
      <div className="flex flex-col gap-4">
        {/* Brand identity */}
        <Link to="/dashboard" className="flex items-center gap-2.5 px-2 py-1 cursor-pointer">
          <div className="w-7 h-7 rounded-sm bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-sm font-bold">bolt</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-on-surface">Pulse Studio</span>
            <span className="text-[10px] font-mono text-outline">
              {user ? `${user.name} (${user.role})` : 'Enterprise Workspace'}
            </span>
          </div>
        </Link>

        {/* Quick Action Button (Admins & PMs can create tasks) */}
        {(currentRole === 'ADMIN' || currentRole === 'PM') && (
          <button
            onClick={onOpenTaskModal}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-surface-container-high hover:bg-surface-container text-primary font-medium text-xs rounded-sm border border-outline-variant/40 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>New Issue / Task</span>
          </button>
        )}

        {/* Main Nav Links */}
        <nav className="flex flex-col gap-0.5">
          {currentRole === 'ADMIN' && (
            <NavLink to="/dashboard" icon="dashboard" label="Admin Overview" active={activeTab === "dashboard"} />
          )}
          {(currentRole === 'ADMIN' || currentRole === 'PM') && (
            <NavLink to="/pm" icon="folder_managed" label="PM Dashboard" active={activeTab === "pm"} />
          )}
          {(currentRole === 'ADMIN' || currentRole === 'DEVELOPER') && (
            <NavLink to="/developer" icon="terminal" label="Dev Workspace" active={activeTab === "developer"} badge="8" />
          )}
          <NavLink to="/project-board" icon="view_kanban" label="Kanban Board" active={activeTab === "board"} />
          <NavLink to="/activity" icon="history" label="Activity Audit" active={activeTab === "activity"} badge="LIVE" />
        </nav>

        {/* Role Switcher Section */}
        <div className="border-t border-outline-variant/20 pt-2 flex flex-col gap-1">
          <div className="px-2 py-1 text-[10px] font-mono text-outline uppercase tracking-wider">Role Switcher</div>
          <button
            onClick={() => {
              switchDemoRole('Admin');
              navigate("/dashboard");
            }}
            className={`flex items-center justify-between px-3 py-1.5 text-xs rounded-sm text-left transition-colors ${
              currentRole === 'ADMIN'
                ? 'bg-primary/20 text-primary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span>👑 Admin View</span>
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </button>
          <button
            onClick={() => {
              switchDemoRole('PM');
              navigate("/pm");
            }}
            className={`flex items-center justify-between px-3 py-1.5 text-xs rounded-sm text-left transition-colors ${
              currentRole === 'PM'
                ? 'bg-primary/20 text-primary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span>📁 PM View</span>
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </button>
          <button
            onClick={() => {
              switchDemoRole('Developer');
              navigate("/developer");
            }}
            className={`flex items-center justify-between px-3 py-1.5 text-xs rounded-sm text-left transition-colors ${
              currentRole === 'DEVELOPER'
                ? 'bg-primary/20 text-primary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span>💻 Dev View</span>
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Sidebar Bottom Footnote & Realtime Beacon */}
      <div className="flex flex-col gap-3 pt-3 border-t border-outline-variant/30">
        <div className="px-3 py-2 rounded-sm bg-surface-container border border-outline-variant/30 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="status-ring-pulse absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
            </span>
            <span className="text-on-surface-variant">Cluster Sync</span>
          </div>
          <span className="text-secondary font-semibold">{clusterSyncPct}</span>
        </div>
        <div className="flex items-center justify-between px-2 text-[11px] text-outline font-mono">
          <button
            onClick={handleSignOut}
            className="hover:text-on-surface transition-colors flex items-center gap-1 text-outline cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">logout</span>
            Sign Out
          </button>
          <span>{version}</span>
        </div>
      </div>
    </aside>
  );
};
