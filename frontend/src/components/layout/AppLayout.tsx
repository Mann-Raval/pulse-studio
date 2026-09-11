import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavBar } from './TopNavBar';
import { NotificationDrawer } from './NotificationDrawer';
import { TaskCreateModal } from './TaskCreateModal';
import { mockNotifications, mockCurrentUser } from '../../data/mockData';
import type { CreateTaskPayload, NotificationItem, UserRole } from '../../types';

export interface AppLayoutProps {
  children: React.ReactNode;
  activeTab?: 'dashboard' | 'pm' | 'developer' | 'board' | 'activity' | string;
  userRole?: UserRole | string;
  onSearchChange?: (query: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab,
  userRole = 'Lead',
  onSearchChange,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  // TODO: Replace initial notification count and list with real-time state from NotificationContext / WebSocket
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [unreadCount, setUnreadCount] = useState(3);
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

  const handleCreateTask = (newTaskPayload: CreateTaskPayload) => {
    // TODO: POST /api/tasks with newTaskPayload
    console.log('Task created payload for role', userRole, newTaskPayload);
  };

  const handleMarkAllNotificationsRead = () => {
    // TODO: PATCH /api/notifications/read-all
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
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
          unreadNotificationsCount={unreadCount}
          isNotificationsOpen={notificationsOpen}
          onToggleNotifications={() => setNotificationsOpen(!notificationsOpen)}
          onOpenTaskModal={() => setTaskModalOpen(true)}
          userAvatarUrl={mockCurrentUser.avatarUrl}
          onSearchChange={onSearchChange}
        />

        {/* Notifications Flyout Drawer */}
        {notificationsOpen && (
          <NotificationDrawer
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllAsRead={handleMarkAllNotificationsRead}
            onClose={() => setNotificationsOpen(false)}
          />
        )}

        {/* Quick Task Creation Modal */}
        <TaskCreateModal
          isOpen={taskModalOpen}
          onClose={() => setTaskModalOpen(false)}
          onCreateTask={handleCreateTask}
        />

        {/* Viewport content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
