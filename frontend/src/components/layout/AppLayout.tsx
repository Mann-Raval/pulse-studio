import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavBar } from './TopNavBar';
import { NotificationDrawer } from './NotificationDrawer';
import { TaskCreateModal } from './TaskCreateModal';
import { mockNotifications } from '../../data/mockData';
import type { CreateTaskPayload, NotificationItem, UserRole } from '../../types';
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
  const { unreadNotificationsCount, onlineCount, latestNotification } = useSocket();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [markedAllRead, setMarkedAllRead] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  const effectiveUnreadCount = markedAllRead ? 0 : (unreadNotificationsCount || 3);

  const notifications: NotificationItem[] = [
    ...(latestNotification && !markedAllRead
      ? [
          {
            id: latestNotification.id || 'live-notif',
            title: latestNotification.message || 'New notification',
            team: 'Pulse Studio',
            time: 'just now',
            unread: true,
            type: latestNotification.type?.toLowerCase().includes('task') ? 'task' : 'review',
          } as NotificationItem,
        ]
      : []),
    ...mockNotifications.map((n) => (markedAllRead ? { ...n, unread: false } : n)),
  ];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCreateTask = async (newTaskPayload: CreateTaskPayload) => {
    try {
      const projectsRes = await api.getProjects().catch(() => null);
      const projectId = projectsRes?.projects?.[0]?.id;

      if (projectId) {
        await api.createTask(projectId, {
          title: newTaskPayload.title,
          description: newTaskPayload.description,
          priority: newTaskPayload.priority.toUpperCase(),
        });
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleMarkAllNotificationsRead = () => {
    setMarkedAllRead(true);
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
          unreadNotificationsCount={effectiveUnreadCount}
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
            unreadCount={effectiveUnreadCount}
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
