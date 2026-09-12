import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavBar } from './TopNavBar';
import { NotificationDrawer } from './NotificationDrawer';
import { TaskCreateModal } from './TaskCreateModal';
import { NotificationToast } from '../common/NotificationToast';
import type { UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { api } from '../../services/api';

export interface AppLayoutProps {
  children: React.ReactNode;
  activeTab?: 'dashboard' | 'pm' | 'developer' | 'board' | 'activity' | string;
  userRole?: UserRole | string;
  onSearchChange?: (query: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab,
  onSearchChange,
}) => {
  const { user } = useAuth();
  const {
    unreadNotificationsCount,
    notifications,
    onlineCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useSocket();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCreateTask = async (payload: {
    projectId: string;
    title: string;
    description?: string;
    assignedToId?: string | null;
    priority: any;
    dueDate?: string;
  }) => {
    try {
      await api.createTask(payload.projectId, {
        title: payload.title,
        description: payload.description,
        assignedToId: payload.assignedToId,
        priority: String(payload.priority).toUpperCase(),
        dueDate: payload.dueDate,
      });
    } catch (err) {
      console.error('Failed to create task:', err);
      throw err; // Propagate to modal so it displays error banner
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-on-surface">
      {/* SideNavBar */}
      <Sidebar
        activeTab={activeTab}
        onOpenTaskModal={() => setTaskModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <TopNavBar
          currentTime={currentTime}
          unreadNotificationsCount={unreadNotificationsCount}
          isNotificationsOpen={notificationsOpen}
          onToggleNotifications={() => setNotificationsOpen(!notificationsOpen)}
          onOpenTaskModal={() => setTaskModalOpen(true)}
          activeAgentsCount={onlineCount}
          userAvatarUrl={user?.avatarUrl}
          onSearchChange={onSearchChange}
        />

        {/* Notifications Flyout Drawer */}
        {notificationsOpen && (
          <NotificationDrawer
            notifications={notifications}
            unreadCount={unreadNotificationsCount}
            onMarkAsRead={markNotificationAsRead}
            onMarkAllAsRead={markAllNotificationsAsRead}
            onClose={() => setNotificationsOpen(false)}
          />
        )}

        {/* Quick Task Creation Modal */}
        <TaskCreateModal
          isOpen={taskModalOpen}
          onClose={() => setTaskModalOpen(false)}
          onCreateTask={handleCreateTask}
        />

        {/* Live Notification Popups (Toast) */}
        <NotificationToast onOpenNotifications={() => setNotificationsOpen(true)} />

        {/* Viewport content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
