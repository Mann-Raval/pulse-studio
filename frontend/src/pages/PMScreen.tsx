import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import type { Project, Task } from '../types';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useSearch } from '../context/SearchContext';

export interface PMScreenProps {
  projects?: Project[];
  teamTasks?: Task[];
  podName?: string;
  totalTeamTasksCount?: number;
}

export const PMScreen: React.FC<PMScreenProps> = ({
  projects: initialProjects,
  teamTasks: initialTeamTasks,
  podName = 'Pod Alpha',
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { searchQuery } = useSearch();
  const [projects, setProjects] = useState<Project[]>(initialProjects || []);
  const [tasks, setTasks] = useState<Task[]>(initialTeamTasks || []);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = () => {
    setIsLoading(true);
    setErrorMessage(null);

    Promise.all([
      api.getProjects(),
      api.getTasks(),
    ])
      .then(([projRes, tasksRes]) => {
        if (projRes?.projects) {
          const mappedProjects: Project[] = projRes.projects.map((p: any) => ({
            id: p.id,
            name: p.name,
            client: p.client?.name || 'Client',
            status: p.derivedStatus === 'COMPLETED' ? 'On Track' : 'In Progress',
            statusColor: 'text-secondary',
            pct:
              p.taskStats?.total > 0
                ? Math.round((p.taskStats.completed / p.taskStats.total) * 100)
                : 0,
            tasksCount: `${p.taskStats?.completed || 0}/${p.taskStats?.total || 0} done`,
            sprint: 'Active Sprint',
            target: 'Active',
          }));
          setProjects(mappedProjects);
        }

        if (tasksRes?.tasks) {
          const mappedTasks: Task[] = tasksRes.tasks.map((t: any) => ({
            id: t.id,
            displayId: t.id.length > 8 ? t.id.slice(0, 8).toUpperCase() : t.id,
            title: t.title,
            project: t.project?.name || 'Project',
            assignee: t.assignedTo?.name || 'Unassigned',
            priority: (t.priority || 'medium').toLowerCase() as any,
            status:
              t.status === 'TODO'
                ? 'To Do'
                : t.status === 'IN_PROGRESS'
                ? 'In Progress'
                : t.status === 'IN_REVIEW'
                ? 'In Review'
                : 'Done',
            due: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Active',
            isOverdue: t.isOverdue || false,
            description: t.description,
          }));
          setTasks(mappedTasks);
        }
      })
      .catch((err: any) => {
        console.error('Failed to load PM dashboard data:', err);
        setErrorMessage(
          err?.message || 'Unable to load project and task telemetry from server.'
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const query = searchQuery.trim().toLowerCase();

  const filteredProjects = projects.filter((p) => {
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      p.client.toLowerCase().includes(query)
    );
  });

  const filteredTasks = tasks.filter((t) => {
    if (!query) return true;
    return (
      t.title.toLowerCase().includes(query) ||
      t.project.toLowerCase().includes(query) ||
      (t.assignee && t.assignee.toLowerCase().includes(query)) ||
      (t.displayId && t.displayId.toLowerCase().includes(query))
    );
  });

  const criticalCount = tasks.filter((t) => t.priority === 'critical').length;
  const highCount = tasks.filter((t) => t.priority === 'high').length;
  const mediumCount = tasks.filter((t) => t.priority === 'medium').length;
  const totalTaskCount = tasks.length || 1;

  const dueThisWeekTasks = tasks.filter((t) => t.due && t.due !== 'Active').slice(0, 5);

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
            className="px-3 py-1.5 rounded-sm bg-primary hover:bg-inverse-primary text-white text-xs font-medium transition-colors cursor-pointer"
          >
            View Kanban Board
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3 rounded-sm bg-error/10 border border-error/30 text-error flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={fetchData}
              className="text-xs font-mono underline hover:text-white cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="p-8 text-center text-outline text-xs flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
            <span>Loading managed projects & tasks...</span>
          </div>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredProjects.map((p, i) => (
            <div
              key={p.id || i}
              className="bg-surface-container-low border border-outline-variant/40 rounded-sm p-4 flex flex-col justify-between hover:border-primary/50 hover:bg-surface-container transition-all cursor-pointer shadow-xs"
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
                <div className="text-xl font-bold font-mono text-on-surface">{p.pct}%</div>
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
          <div className="lg:col-span-8 bg-surface-container-low border border-outline-variant/30 rounded-sm p-4 space-y-3 shadow-xs">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20 text-xs font-semibold text-on-surface">
              <span>Workload Tasks by Priority</span>
              <span className="text-[10px] font-mono text-outline">Active Sprint Distribution</span>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span className="text-error font-medium">Critical ({criticalCount} items)</span>
                  <span>{Math.round((criticalCount / totalTaskCount) * 100)}%</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-error h-full"
                    style={{ width: `${(criticalCount / totalTaskCount) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span className="text-tertiary font-medium">High ({highCount} items)</span>
                  <span>{Math.round((highCount / totalTaskCount) * 100)}%</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-tertiary h-full"
                    style={{ width: `${(highCount / totalTaskCount) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span className="text-primary font-medium">Medium ({mediumCount} items)</span>
                  <span>{Math.round((mediumCount / totalTaskCount) * 100)}%</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full"
                    style={{ width: `${(mediumCount / totalTaskCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-surface-container-low border border-outline-variant/30 rounded-sm p-4 space-y-3 shadow-xs">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20 text-xs font-semibold text-on-surface">
              <span>Due This Week</span>
              <span className="text-[10px] font-mono text-outline">{dueThisWeekTasks.length} items</span>
            </div>
            <div className="space-y-2 text-xs">
              {dueThisWeekTasks.length === 0 ? (
                <p className="text-outline text-xs py-4 text-center">No upcoming due dates this week.</p>
              ) : (
                dueThisWeekTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => navigate('/project-board')}
                    className={`p-2 rounded-sm bg-surface-container border-l-2 cursor-pointer transition-colors ${
                      t.isOverdue ? 'border-error' : 'border-primary'
                    }`}
                  >
                    <div className="flex justify-between font-semibold text-on-surface">
                      <span>{t.due}</span>
                      <span className="text-[10px] font-mono text-outline">{t.project}</span>
                    </div>
                    <div className="text-[11px] text-on-surface truncate mt-0.5">{t.title}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Team Task Table */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-sm p-4 space-y-3 shadow-xs">
          <div className="flex justify-between items-center text-xs font-semibold text-on-surface">
            <span>Team Tasks Matrix</span>
            <span className="text-[10px] font-mono text-outline">
              {filteredTasks.length} tasks across {filteredProjects.length} projects
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
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-outline">
                      {searchQuery
                        ? `No tasks matching "${searchQuery}".`
                        : 'No tasks found.'}
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t, idx) => (
                    <tr
                      key={t.id || idx}
                      onClick={() => navigate('/project-board')}
                      className="hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <td className="py-2 font-mono">
                        <strong className="text-primary mr-2">{t.displayId || t.id.slice(0, 8).toUpperCase()}</strong>
                        <span className="text-on-surface">{t.title}</span>
                      </td>
                      <td className="py-2 text-on-surface-variant font-mono text-[11px]">
                        {t.project}
                      </td>
                      <td className="py-2 text-on-surface">{t.assignee}</td>
                      <td className="py-2">
                        <span
                          className={`px-1.5 py-0.2 rounded-sm text-[10px] font-mono font-medium ${
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
                        <span className="text-secondary font-medium">{t.status}</span>
                      </td>
                      <td className="py-2 font-mono text-outline">{t.due}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};
