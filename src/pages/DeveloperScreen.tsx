import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { mockDevTasks } from '../data/mockData';
import type { Task } from '../types';

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
  // TODO: Replace with GET /api/developer/tasks and subscribe to Socket.io 'task:assigned'
  tasks = mockDevTasks,
  userName = 'Alex Rivera',
  sprintName = 'Sprint 4',
  activeFocusCount = 8,
  dueThisWeekCount = 3,
  overdueCount = 1,
  completedVelocity = '12 (Vel: 94%)',
  onSelectTask,
}) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'in-prog' | 'review' | 'todo'>('all');

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'in-prog') return t.status === 'In Progress';
    if (filter === 'review') return t.status === 'In Review';
    if (filter === 'todo') return t.status === 'To Do';
    return true;
  });

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
        <section className="p-4 rounded-sm bg-[#14171C] border border-outline-variant/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-on-surface">Welcome back, {userName}.</span>
              <span className="px-2 py-0.5 rounded-sm text-[11px] font-mono bg-surface-container border border-outline-variant text-outline">
                {sprintName}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-outline">
              <span>
                You have <strong className="text-on-surface font-medium">{dueThisWeekCount} tasks</strong> due this week,
              </span>
              <span className="text-tertiary font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">warning</span> {overdueCount} overdue.
              </span>
            </div>
          </div>

          {/* 3 Metric Pills */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="px-3.5 py-2 rounded-sm bg-[#1B1F26] border border-white/5 min-w-[120px]">
              <span className="text-[11px] font-mono text-outline block">Active Focus</span>
              <div className="text-xl font-bold font-mono text-on-surface">{activeFocusCount} Assigned</div>
            </div>
            <div className="px-3.5 py-2 rounded-sm bg-[#1B1F26] border border-white/5 min-w-[120px]">
              <span className="text-[11px] font-mono text-outline block">Due This Week</span>
              <div className="text-xl font-bold font-mono text-tertiary">
                {dueThisWeekCount} ({overdueCount} Overdue)
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-sm bg-[#1B1F26] border border-white/5 min-w-[120px]">
              <span className="text-[11px] font-mono text-outline block">Completed</span>
              <div className="text-xl font-bold font-mono text-emerald-400">{completedVelocity}</div>
            </div>
          </div>
        </section>

        {/* My Tasks Section */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-outline-variant/40">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold">Assigned Tasks ({tasks.length})</h2>
              <div className="flex items-center gap-1 bg-surface-container-lowest p-0.5 rounded-sm border border-outline-variant/40 text-xs">
                {(['all', 'in-prog', 'review', 'todo'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className={`px-2 py-0.5 rounded-sm capitalize transition-colors ${
                      filter === k
                        ? 'bg-surface-container text-primary font-medium'
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
              className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
            >
              <span>Open Kanban Board View</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Task Cards List */}
          <div className="space-y-2">
            {filteredTasks.map((t) => (
              <article
                key={t.id}
                onClick={() => handleTaskClick(t.id)}
                className="p-3.5 rounded-sm bg-[#14171C] border border-outline-variant/30 hover:border-primary/50 hover:bg-[#181C22] transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
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
                  <span className="text-xs font-mono text-outline font-semibold">{t.id}</span>
                  <h3 className="text-xs font-medium text-on-surface truncate">{t.title}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded-sm bg-surface-container text-outline">{t.project}</span>
                  {t.branch && (
                    <span className="px-2 py-0.5 rounded-sm bg-surface-container text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-primary">fork_right</span>
                      {t.branch}
                    </span>
                  )}
                  {t.due && (
                    <span
                      className={`px-2 py-0.5 rounded-sm ${
                        t.isOverdue ? 'bg-tertiary/10 text-tertiary' : 'text-outline'
                      }`}
                    >
                      {t.due}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-sm font-sans ${
                      t.status === 'In Progress'
                        ? 'bg-primary/20 text-primary'
                        : t.status === 'In Review'
                        ? 'bg-secondary/20 text-secondary'
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
