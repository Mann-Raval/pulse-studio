import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { mockPMProjects, mockPMTeamTasks } from '../data/mockData';
import type { Project, Task } from '../types';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';


export interface PMScreenProps {
  projects?: Project[];
  teamTasks?: Task[];
  podName?: string;
  totalTeamTasksCount?: number;
}

export const PMScreen: React.FC<PMScreenProps> = ({
  projects: initialProjects = mockPMProjects,
  teamTasks = mockPMTeamTasks,
  podName = 'Pod Alpha',
  totalTeamTasksCount = 59,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  useEffect(() => {
    api.getProjects()
      .then((res) => {
        if (res.projects && res.projects.length > 0) {
          const mapped: Project[] = res.projects.map((p: any) => ({
            id: p.id,
            name: p.name,
            client: p.client?.name || 'Client',
            status: p.derivedStatus === 'COMPLETED' ? 'On Track' : 'In Progress',
            statusColor: 'text-secondary',
            pct: p.taskStats?.total > 0 ? Math.round((p.taskStats.completed / p.taskStats.total) * 100) : 65,
            tasksCount: `${p.taskStats?.completed || 0}/${p.taskStats?.total || 0} done`,
            sprint: 'Active Sprint',
            target: 'Active',
          }));
          setProjects(mapped);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <AppLayout activeTab="pm" userRole="PM">
      <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
          <div>
            <h1 className="text-xl font-bold text-on-surface">PM Overview & Managed Projects</h1>
            <p className="text-xs text-on-surface-variant">
              Role-scoped projects created by {user?.name || 'Project Manager'} ({podName})
            </p>
          </div>
          <button
            onClick={() => navigate('/project-board')}
            className="px-3 py-1 rounded-sm bg-primary hover:bg-inverse-primary text-white text-xs font-medium transition-colors"
          >
            View Kanban Board
          </button>
        </div>

        {/* 4 Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {projects.map((p, i) => (
            <div
              key={p.id || i}
              className="bg-surface-container-low border border-outline-variant/40 rounded-sm p-4 flex flex-col justify-between hover:border-primary/50 transition-all cursor-pointer"
              onClick={() => navigate('/project-board')}
            >
              <div>
                <div className="flex justify-between items-start text-xs font-mono mb-1">
                  <span className="text-outline">{p.client}</span>
                  <span className={`${p.statusColor || 'text-secondary'} font-semibold`}>
                    {p.status}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-on-surface">{p.name}</h3>
              </div>

              <div className="my-4 flex items-center gap-3">
                <div className="text-xl font-bold font-mono">{p.pct}%</div>
                <div className="flex-1">
                  <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        p.pct > 70 ? 'bg-secondary' : p.pct > 50 ? 'bg-tertiary' : 'bg-error'
                      }`}
                      style={{ width: `${p.pct}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] font-mono text-outline mt-1">{p.tasksCount}</div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-outline pt-2 border-t border-outline-variant/20">
                <span>{p.sprint}</span>
                <span className="text-on-surface font-semibold">Target: {p.target}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Middle Section: Tasks by Priority & Due Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-surface-container-low border border-outline-variant/30 rounded-sm p-4 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20 text-xs font-semibold">
              <span>Workload Tasks by Priority</span>
              <span className="text-[10px] font-mono text-outline">Active Sprint Distribution</span>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span className="text-error">Critical (5 items)</span>
                  <span>8.5%</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div className="bg-error h-full w-[8.5%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span className="text-tertiary">High (14 items)</span>
                  <span>23.7%</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div className="bg-tertiary h-full w-[23.7%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span className="text-primary">Medium (28 items)</span>
                  <span>47.4%</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[47.4%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-surface-container-low border border-outline-variant/30 rounded-sm p-4 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20 text-xs font-semibold">
              <span>Due This Week</span>
              <span className="text-[10px] font-mono text-outline">5 items</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-sm bg-surface-container border-l-2 border-error">
                <div className="font-semibold">Monday • Nov 18</div>
                <div className="text-[11px] text-on-surface">Biometric SSO Callback Handshake</div>
              </div>
              <div className="p-2 rounded-sm bg-surface-container border-l-2 border-primary">
                <div className="font-semibold">Tuesday • Nov 19</div>
                <div className="text-[11px] text-on-surface">Design token export pipeline</div>
              </div>
              <div className="p-2 rounded-sm bg-surface-container border-l-2 border-tertiary">
                <div className="font-semibold">Wednesday • Nov 20</div>
                <div className="text-[11px] text-on-surface">WebGL shader fallback mesh</div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Task Table */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-sm p-4 space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span>Team Tasks Matrix</span>
            <span className="text-[10px] font-mono text-outline">
              {totalTeamTasksCount} tasks across {projects.length} projects
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant/40 font-mono text-outline text-[11px]">
                  <th className="py-2">Task ID & Title</th>
                  <th className="py-2">Project</th>
                  <th className="py-2">Assignee</th>
                  <th className="py-2">Priority</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {teamTasks.map((t, idx) => (
                  <tr
                    key={t.id || idx}
                    onClick={() => navigate('/project-board')}
                    className="hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    <td className="py-2 font-mono">
                      <strong className="text-primary mr-2">{t.id}</strong>
                      {t.title}
                    </td>
                    <td className="py-2 text-on-surface-variant font-mono text-[11px]">
                      {t.project}
                    </td>
                    <td className="py-2">{t.assignee}</td>
                    <td className="py-2">
                      <span
                        className={`px-1.5 py-0.2 rounded-sm text-[10px] font-mono ${
                          t.priority === 'critical'
                            ? 'bg-error/20 text-error'
                            : t.priority === 'high'
                            ? 'bg-tertiary/20 text-tertiary'
                            : 'bg-primary/20 text-primary'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className="text-secondary">{t.status}</span>
                    </td>
                    <td className="py-2 font-mono text-outline">{t.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};
