import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { mockAdminMetrics, mockActivityEvents, mockPMProjects } from '../data/mockData';
import type { ActivityEvent, Project } from '../types';

export interface DashboardScreenProps {
  metrics?: typeof mockAdminMetrics;
  recentActivity?: ActivityEvent[];
  projects?: Project[];
  onExportReport?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  // TODO: Replace with GET /api/admin/metrics via React Query / custom hook
  metrics = mockAdminMetrics,
  // TODO: Replace with GET /api/activity?limit=5 and subscribe to Socket.io 'activity:new'
  recentActivity = mockActivityEvents.slice(0, 4),
  // TODO: Replace with GET /api/projects/overview
  projects = mockPMProjects.slice(0, 3),
  onExportReport,
}) => {
  const navigate = useNavigate();
  const [filterTab, setFilterTab] = useState<'All' | 'Status' | 'Deployments'>('All');

  const handleExport = () => {
    // TODO: GET /api/admin/reports/export?format=csv
    if (onExportReport) {
      onExportReport();
    } else {
      console.log('Exporting admin report...');
    }
  };

  const filteredActivity = recentActivity.filter((item) => {
    if (filterTab === 'Status') return item.type === 'status';
    if (filterTab === 'Deployments') return item.type === 'deploy';
    return true;
  });

  return (
    <AppLayout activeTab="dashboard" userRole="Admin">
      <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-5">
          <div>
            <h1 className="text-xl font-bold text-on-surface">Admin Overview</h1>
            <p className="text-xs text-on-surface-variant mt-1">
              Real-time agency operations, cross-project workload, and team telemetry.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-surface-container-low border border-outline-variant/30 text-xs font-mono">
              <span className="material-symbols-outlined text-sm text-outline">calendar_today</span>
              <span>Today, Sprint 42</span>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-surface-container-low hover:bg-surface-container border border-outline-variant text-xs transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* KPI 4-Card Deck */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Projects */}
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-sm p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>Total Projects</span>
              <span className="material-symbols-outlined text-outline">folder</span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono">{metrics.activeProjects} Active</div>
              <div className="text-[11px] text-secondary mt-0.5">{metrics.projectsChangeText}</div>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-3/4"></div>
            </div>
          </div>

          {/* Card 2: Total Tasks by Status */}
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-sm p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>Total Tasks by Status</span>
              <span className="material-symbols-outlined text-outline">checklist</span>
            </div>
            <div className="my-1">
              <div className="text-2xl font-bold font-mono">{metrics.totalTasks} Tasks</div>
              <div className="w-full h-1.5 rounded-full bg-surface-container-highest flex overflow-hidden gap-0.5 mt-2">
                <div className="h-full bg-outline-variant w-[20%]"></div>
                <div className="h-full bg-primary w-[38%]"></div>
                <div className="h-full bg-secondary-container w-[17%]"></div>
                <div className="h-full bg-secondary w-[25%]"></div>
              </div>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-outline pt-1">
              <span>{metrics.tasksBreakdown.todo} To Do</span>
              <span>{metrics.tasksBreakdown.inProgress} In Prog</span>
              <span>{metrics.tasksBreakdown.inReview} Review</span>
              <span>{metrics.tasksBreakdown.done} Done</span>
            </div>
          </div>

          {/* Card 3: Overdue Tasks */}
          <div className="bg-surface-container-low border border-tertiary-container/50 rounded-sm p-4 flex flex-col justify-between bg-gradient-to-br from-tertiary-container/5 to-transparent">
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>Overdue Tasks</span>
              <span className="material-symbols-outlined text-tertiary">warning</span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono text-tertiary">{metrics.overdueTasksCount} Overdue</div>
              <p className="text-[11px] text-tertiary-fixed-dim mt-0.5">
                Avg delay: {metrics.avgDelay} • {metrics.criticalOverdueCount} critical
              </p>
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono pt-1 border-t border-outline-variant/20">
              <span className="text-outline">SLA Breach Index</span>
              <span className="text-tertiary font-semibold">Elevated</span>
            </div>
          </div>

          {/* Card 4: Active Users Online */}
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-sm p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>Active Users Online</span>
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono">{metrics.activeUsersOnline} Online</div>
              <p className="text-[11px] text-outline mt-0.5">{metrics.engineeringPodActivePct} of engineering pod active</p>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-secondary pt-1 border-t border-outline-variant/20">
              <span>Cluster Alpha</span>
              <span>All Nodes Active</span>
            </div>
          </div>
        </div>

        {/* Split Operational Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Live Operational Stream */}
          <section className="lg:col-span-8 bg-surface-container-low border border-outline-variant/30 rounded-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Live Operational Stream</h2>
                <span className="px-1.5 py-0.2 rounded-sm bg-secondary/10 text-secondary text-[10px] font-mono font-semibold">
                  LIVE
                </span>
              </div>
              <div className="flex gap-1 text-xs">
                {(['All', 'Status', 'Deployments'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterTab(t)}
                    className={`px-2.5 py-0.5 rounded-sm text-xs transition-colors ${
                      filterTab === t
                        ? 'bg-surface-container-highest text-primary font-medium'
                        : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-outline-variant/20 text-xs">
              {filteredActivity.map((ev) => (
                <div key={ev.id} className="py-3 flex items-start justify-between">
                  <div>
                    <p className="font-medium text-on-surface">
                      {ev.user} {ev.action}
                    </p>
                    <span className="text-[11px] text-outline font-mono">[{ev.project}]</span>
                  </div>
                  <span className="font-mono text-[11px] text-outline">{ev.time}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-outline-variant/20">
              <Link
                to="/activity"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>View Full Activity Audit</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </section>

          {/* Right Summary Columns */}
          <div className="lg:col-span-4 space-y-6">
            {/* Projects Health */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-sm p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                <h3 className="text-xs font-semibold">Projects Health Overview</h3>
                <span className="text-[10px] font-mono text-outline">Sprint 42</span>
              </div>
              <div className="space-y-3 text-xs">
                {projects.map((p) => (
                  <div key={p.id || p.name}>
                    <div className="flex justify-between mb-1">
                      <Link to="/project-board" className="font-medium hover:text-primary transition-colors">
                        {p.name}
                      </Link>
                      <span className="font-mono text-outline">{p.pct}%</span>
                    </div>
                    <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          p.pct > 80 ? 'bg-secondary' : p.pct > 60 ? 'bg-primary' : 'bg-secondary-container'
                        }`}
                        style={{ width: `${p.pct}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overdue SLA Critical Card */}
            <div className="bg-surface-container-low border border-tertiary-container/40 rounded-sm p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                <h3 className="text-xs font-semibold text-tertiary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">error</span>
                  Overdue SLA Critical
                </h3>
                <span className="px-1.5 py-0.2 rounded-sm bg-tertiary/10 text-tertiary text-[10px] font-mono font-semibold">
                  3 High
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-sm bg-surface-container border-l-2 border-tertiary">
                  <div className="font-medium">#104 Biometric SSO Refresh</div>
                  <div className="text-[10px] font-mono text-outline">FinPulse • Due 2d ago</div>
                </div>
                <div className="p-2 rounded-sm bg-surface-container border-l-2 border-tertiary">
                  <div className="font-medium">#82 WebGL Fallback Shaders</div>
                  <div className="text-[10px] font-mono text-outline">Kinetix • Due 1d ago</div>
                </div>
              </div>
              <button
                onClick={() => navigate('/project-board')}
                className="text-xs text-tertiary hover:underline flex items-center gap-1 transition-colors"
              >
                <span>Reassign or inspect backlog</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};
