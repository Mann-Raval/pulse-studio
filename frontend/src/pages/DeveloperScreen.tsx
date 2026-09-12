import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import type { Task } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useSearch } from '../context/SearchContext';
import { api } from '../services/api';

export interface DeveloperScreenProps {
  tasks?: Task[];
  userName?: string;
  sprintName?: string;
  activeFocusCount?: number;
  dueThisWeekCount?: number;
  overdueCount?: number;
  completedVelocity?: string;
  onSelectTask?: (taskId: string) => void;
}

export const DeveloperScreen: React.FC<DeveloperScreenProps> = ({
  tasks: initialTasks,
  sprintName = 'Sprint 4',
  activeFocusCount = 0,
  dueThisWeekCount = 0,
  overdueCount: defaultOverdueCount = 0,
  completedVelocity = '12 (Vel: 94%)',
  onSelectTask,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { latestTaskOverdue, latestActivity } = useSocket();
  const { searchQuery } = useSearch();
  const [tasks, setTasks] = useState<Task[]>(initialTasks || []);
  const [filter, setFilter] = useState<'all' | 'in-prog' | 'review' | 'todo'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTasks = () => {
    setIsLoading(true);
    setErrorMessage(null);

    // Fetch role-scoped developer tasks directly via GET /api/tasks
    api.getTasks()
      .then((res) => {
        if (res.tasks) {
          const mapped: Task[] = res.tasks.map((t: any) => ({
            id: t.id,
            displayId: t.id.length > 8 ? t.id.slice(0, 8).toUpperCase() : t.id,
            title: t.title,
            project: t.project?.name || 'Pulse Project',
            branch: 'feat/pulse-dev',
            due: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Active',
            status:
              t.status === 'TODO'
                ? 'To Do'
                : t.status === 'IN_PROGRESS'
                ? 'In Progress'
                : t.status === 'IN_REVIEW'
                ? 'In Review'
                : 'Done',
            priority: (t.priority || 'medium').toLowerCase() as any,
            isOverdue: t.isOverdue || false,
            description: t.description,
          }));
          setTasks(mapped);
        }
      })
      .catch((err: any) => {
        console.error('Failed to load developer tasks:', err);
        const msg = err?.message || 'Unable to load assigned tasks from server.';
        setErrorMessage(msg);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Live WebSocket synchronization on incoming task:overdue events
  useEffect(() => {
    if (!latestTaskOverdue) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === latestTaskOverdue.taskId ? { ...t, isOverdue: true } : t
      )
    );
  }, [latestTaskOverdue]);

  // Live WebSocket synchronization on incoming task:activity events
  useEffect(() => {
    if (!latestActivity) return;
    const statusMap: Record<string, any> = {
      TODO: 'To Do',
      IN_PROGRESS: 'In Progress',
      IN_REVIEW: 'In Review',
      DONE: 'Done',
    };
    const mappedStatus = statusMap[latestActivity.toStatus];
    if (mappedStatus) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === latestActivity.taskId ? { ...t, status: mappedStatus } : t
        )
      );
    }
  }, [latestActivity]);

  const query = searchQuery.trim().toLowerCase();

  const filteredTasks = tasks.filter((t) => {
    // Status filter tab
    if (filter === 'in-prog' && t.status !== 'In Progress') return false;
    if (filter === 'review' && t.status !== 'In Review') return false;
    if (filter === 'todo' && t.status !== 'To Do') return false;

    // Search query matching
    if (query) {
      const matchTitle = t.title.toLowerCase().includes(query);
      const matchProject = t.project.toLowerCase().includes(query);
      const matchId = (t.displayId || t.id).toLowerCase().includes(query);
      const matchDesc = t.description?.toLowerCase().includes(query) || false;
      if (!matchTitle && !matchProject && !matchId && !matchDesc) return false;
    }

    return true;
  });

  const realOverdueCount = tasks.filter((t) => t.isOverdue).length || defaultOverdueCount;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const calculatedDueThisWeek =
    tasks.filter((t) => t.due && t.due !== 'Active').length || dueThisWeekCount;

  const handleTaskClick = (taskId: string) => {
    if (onSelectTask) {
      onSelectTask(taskId);
    }
    navigate('/project-board');
  };

  return (
    <AppLayout activeTab="developer" userRole="Developer">
      <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Personal Summary Strip */}
        <section className="p-4 rounded-sm bg-surface-container-low border border-outline-variant/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-colors shadow-sm">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-on-surface">
                Welcome back, {user?.name || 'Elena Rostova'}.
              </span>
              <span className="px-2 py-0.5 rounded-sm text-[11px] font-mono bg-surface-container border border-outline-variant text-outline">
                {sprintName}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-outline">
              <span>
                You have <strong className="text-on-surface font-medium">{calculatedDueThisWeek} tasks</strong> due this week,
              </span>
              <span className="text-tertiary font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">warning</span> {realOverdueCount} overdue.
              </span>
            </div>
          </div>

          {/* 3 Metric Pills */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="px-3.5 py-2 rounded-sm bg-surface-container border border-outline-variant/30 min-w-[120px]">
              <span className="text-[11px] font-mono text-outline block">Active Focus</span>
              <div className="text-xl font-bold font-mono text-on-surface">
                {inProgressCount || tasks.length || activeFocusCount} Active
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-sm bg-surface-container border border-outline-variant/30 min-w-[120px]">
              <span className="text-[11px] font-mono text-outline block">Assigned / Overdue</span>
              <div className="text-xl font-bold font-mono text-tertiary">
                {tasks.length} ({realOverdueCount} Overdue)
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-sm bg-surface-container border border-outline-variant/30 min-w-[120px]">
              <span className="text-[11px] font-mono text-outline block">Completed</span>
              <div className="text-xl font-bold font-mono text-emerald-500 dark:text-emerald-400">{completedVelocity}</div>
            </div>
          </div>
        </section>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3 rounded-sm bg-error/10 border border-error/30 text-error flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={fetchTasks}
              className="text-xs font-mono underline hover:text-white cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* My Tasks Section */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-outline-variant/40">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-on-surface">
                Assigned Tasks ({filteredTasks.length} {searchQuery ? `of ${tasks.length}` : ''})
              </h2>
              <div className="flex items-center gap-1 bg-surface-container-lowest p-0.5 rounded-sm border border-outline-variant/40 text-xs">
                {(['all', 'in-prog', 'review', 'todo'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className={`px-2 py-0.5 rounded-sm capitalize transition-colors cursor-pointer ${
                      filter === k
                        ? 'bg-surface-container text-primary font-medium shadow-xs'
                        : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    {k.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => navigate('/project-board')}
              className="text-xs font-mono text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open Kanban Board View</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="p-8 text-center text-outline text-xs flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
              <span>Loading assigned tasks...</span>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filteredTasks.length === 0 && (
            <div className="p-8 text-center border border-dashed border-outline-variant/40 rounded-sm text-outline text-xs space-y-1">
              <span className="material-symbols-outlined text-2xl text-outline/50">checklist</span>
              <p>
                {searchQuery
                  ? `No tasks matching "${searchQuery}".`
                  : 'No tasks found in this view.'}
              </p>
            </div>
          )}

          {/* Task Cards List */}
          <div className="space-y-2">
            {filteredTasks.map((t) => (
              <article
                key={t.id}
                onClick={() => handleTaskClick(t.id)}
                className="p-3.5 rounded-sm bg-surface-container-low border border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      t.priority === 'critical'
                        ? 'bg-error'
                        : t.priority === 'high'
                        ? 'bg-tertiary'
                        : 'bg-primary'
                    }`}
                  ></span>
                  <span className="text-xs font-mono text-outline font-semibold">
                    {t.displayId || t.id.slice(0, 8).toUpperCase()}
                  </span>
                  <h3 className="text-xs font-medium text-on-surface truncate">{t.title}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded-sm bg-surface-container text-outline">
                    {t.project}
                  </span>
                  {t.branch && (
                    <span className="px-2 py-0.5 rounded-sm bg-surface-container text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-primary">fork_right</span>
                      {t.branch}
                    </span>
                  )}
                  {t.due && (
                    <span
                      className={`px-2 py-0.5 rounded-sm ${
                        t.isOverdue ? 'bg-tertiary/10 text-tertiary font-semibold' : 'text-outline'
                      }`}
                    >
                      {t.due}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-sm font-sans ${
                      t.status === 'In Progress'
                        ? 'bg-primary/20 text-primary font-medium'
                        : t.status === 'In Review'
                        ? 'bg-secondary/20 text-secondary font-medium'
                        : 'bg-surface-container text-outline'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </AppLayout>
  );
};
