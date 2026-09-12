import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import type { ActivityEvent, Project } from '../types';
import { useSocket } from '../hooks/useSocket';
import { useSearch } from '../context/SearchContext';
import { api } from '../services/api';

export interface DashboardScreenProps {
  recentActivity?: ActivityEvent[];
  projects?: Project[];
  onExportReport?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  recentActivity: initialActivity = [],
  projects: initialProjects = [],
  onExportReport,
}) => {
  const navigate = useNavigate();
  const { onlineCount, activities } = useSocket();
  const { searchQuery } = useSearch();
  const [filterTab, setFilterTab] = useState<'All' | 'Status' | 'Deployments'>('All');
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasksCount, setTasksCount] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    inReview: 0,
    done: 0,
    overdue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDashboardData = () => {
    setIsLoading(true);
    setErrorMessage(null);

    Promise.all([
      api.getProjects(),
      api.getTasks(),
    ])
      .then(([projRes, tasksRes]) => {
        if (projRes?.projects) {
          const mapped: Project[] = projRes.projects.map((p: any) => ({
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
            sprint: 'Sprint Active',
            target: 'Active',
          }));
          setProjects(mapped);
        }

        if (tasksRes?.tasks) {
          const allTasks: any[] = tasksRes.tasks;
          const todo = allTasks.filter((t) => t.status === 'TODO').length;
          const inProgress = allTasks.filter((t) => t.status === 'IN_PROGRESS').length;
          const inReview = allTasks.filter((t) => t.status === 'IN_REVIEW').length;
          const done = allTasks.filter((t) => t.status === 'DONE').length;
          const overdue = allTasks.filter((t) => t.isOverdue).length;

          setTasksCount({
            total: allTasks.length,
            todo,
            inProgress,
            inReview,
            done,
            overdue,
          });
        }
      })
      .catch((err: any) => {
        console.error('Failed to load admin dashboard data:', err);
        setErrorMessage(
          err?.message || 'Unable to load real-time telemetry from server.'
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleExport = () => {
    if (onExportReport) {
      onExportReport();
    } else {
      console.log('Exporting admin report...');
    }
  };

  // Convert real socket activities to display format
  const socketEvents: ActivityEvent[] = activities.slice(0, 10).map((act) => ({
    id: act.id,
    user: act.changedBy?.name || 'Admin',
    action: `updated task "${act.taskTitle}" to ${act.toStatus}`,
    from: act.fromStatus,
    to: act.toStatus,
    project: act.projectName || 'Pulse Project',
    time: typeof act.changedAt === 'string' ? new Date(act.changedAt).toLocaleTimeString() : 'just now',
    type: 'status',
  }));

  const combinedActivity = socketEvents.length > 0 ? socketEvents : initialActivity;

  const query = searchQuery.trim().toLowerCase();

  const filteredActivity = combinedActivity.filter((item) => {
    if (filterTab === 'Status' && item.type !== 'status') return false;
    if (filterTab === 'Deployments' && item.type !== 'deploy') return false;

    if (query) {
      const matchUser = item.user.toLowerCase().includes(query);
      const matchAction = item.action.toLowerCase().includes(query);
      const matchProject = item.project.toLowerCase().includes(query);
      if (!matchUser && !matchAction && !matchProject) return false;
    }

    return true;
  });

  const filteredProjects = projects.filter((p) => {
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      p.client.toLowerCase().includes(query)
    );
  });

  const totalTasks = tasksCount.total || 1;

  const [adminSection, setAdminSection] = useState<'overview' | 'users' | 'clients'>('overview');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isClientsLoading, setIsClientsLoading] = useState(false);

  // User creation state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'DEVELOPER' | 'PM' | 'ADMIN'>('DEVELOPER');
  const [userActionError, setUserActionError] = useState<string | null>(null);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Client creation state
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [clientActionError, setClientActionError] = useState<string | null>(null);
  const [isSubmittingClient, setIsSubmittingClient] = useState(false);

  const fetchUsers = () => {
    setIsUsersLoading(true);
    api.getUsers()
      .then((res) => {
        if (res?.users) setUsersList(res.users);
      })
      .catch((err) => console.error('Failed to load users:', err))
      .finally(() => setIsUsersLoading(false));
  };

  const fetchClients = () => {
    setIsClientsLoading(true);
    api.getClients()
      .then((res) => {
        if (res?.clients) setClientsList(res.clients);
      })
      .catch((err) => console.error('Failed to load clients:', err))
      .finally(() => setIsClientsLoading(false));
  };

  useEffect(() => {
    if (adminSection === 'users') fetchUsers();
    if (adminSection === 'clients') fetchClients();
  }, [adminSection]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) return;

    setIsSubmittingUser(true);
    setUserActionError(null);
    try {
      await api.createUser({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        role: newUserRole,
      });
      setUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('DEVELOPER');
      fetchUsers();
    } catch (err: any) {
      setUserActionError(err?.message || 'Failed to create user.');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await api.updateUser(userId, { role: newRole });
      fetchUsers();
    } catch (err: any) {
      alert(err?.message || 'Failed to update user role');
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    setIsSubmittingClient(true);
    setClientActionError(null);
    try {
      await api.createClient({ name: newClientName.trim() });
      setClientModalOpen(false);
      setNewClientName('');
      fetchClients();
    } catch (err: any) {
      setClientActionError(err?.message || 'Failed to create client.');
    } finally {
      setIsSubmittingClient(false);
    }
  };

  return (
    <AppLayout activeTab="dashboard" userRole="Admin">
      <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Strip with Section Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-5">
          <div>
            <h1 className="text-xl font-bold text-on-surface">Admin Command Center</h1>
            <p className="text-xs text-on-surface-variant mt-1">
              Manage enterprise operations, cross-project workload, clients, and user roles.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-surface-container-low p-1 border border-outline-variant/30 rounded-sm">
              <button
                onClick={() => setAdminSection('overview')}
                className={`px-3 py-1 text-xs rounded-sm transition-colors cursor-pointer ${
                  adminSection === 'overview'
                    ? 'bg-primary text-white font-medium shadow-xs'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                Telemetry
              </button>
              <button
                onClick={() => setAdminSection('users')}
                className={`px-3 py-1 text-xs rounded-sm transition-colors cursor-pointer ${
                  adminSection === 'users'
                    ? 'bg-primary text-white font-medium shadow-xs'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                Manage Users
              </button>
              <button
                onClick={() => setAdminSection('clients')}
                className={`px-3 py-1 text-xs rounded-sm transition-colors cursor-pointer ${
                  adminSection === 'clients'
                    ? 'bg-primary text-white font-medium shadow-xs'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                Manage Clients
              </button>
            </div>
            {adminSection === 'overview' && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-surface-container-low hover:bg-surface-container border border-outline-variant text-xs text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Export</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3 rounded-sm bg-error/10 border border-error/30 text-error flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={fetchDashboardData}
              className="text-xs font-mono underline hover:text-white cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* SECTION 1: OVERVIEW TELEMETRY */}
        {adminSection === 'overview' && (
          <div className="space-y-6">
            {/* Loading Spinner */}
            {isLoading && (
              <div className="p-8 text-center text-outline text-xs flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                <span>Loading admin operational telemetry...</span>
              </div>
            )}

            {/* KPI 4-Card Deck */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Projects */}
              <div className="bg-surface-container-low border border-outline-variant/40 rounded-sm p-4 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Total Projects</span>
                  <span className="material-symbols-outlined text-outline">folder</span>
                </div>
                <div className="my-2">
                  <div className="text-2xl font-bold font-mono text-on-surface">{projects.length} Active</div>
                  <div className="text-[11px] text-secondary mt-0.5">Live database sync</div>
                </div>
                <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-3/4"></div>
                </div>
              </div>

              {/* Card 2: Total Tasks by Status */}
              <div className="bg-surface-container-low border border-outline-variant/40 rounded-sm p-4 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Total Tasks by Status</span>
                  <span className="material-symbols-outlined text-outline">checklist</span>
                </div>
                <div className="my-1">
                  <div className="text-2xl font-bold font-mono text-on-surface">{tasksCount.total} Tasks</div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container-highest flex overflow-hidden gap-0.5 mt-2">
                    <div
                      className="h-full bg-outline-variant"
                      style={{ width: `${(tasksCount.todo / totalTasks) * 100}%` }}
                    ></div>
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(tasksCount.inProgress / totalTasks) * 100}%` }}
                    ></div>
                    <div
                      className="h-full bg-tertiary"
                      style={{ width: `${(tasksCount.inReview / totalTasks) * 100}%` }}
                    ></div>
                    <div
                      className="h-full bg-secondary"
                      style={{ width: `${(tasksCount.done / totalTasks) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-outline pt-1">
                  <span>{tasksCount.todo} To Do</span>
                  <span>{tasksCount.inProgress} In Prog</span>
                  <span>{tasksCount.inReview} Review</span>
                  <span>{tasksCount.done} Done</span>
                </div>
              </div>

              {/* Card 3: Overdue Tasks */}
              <div className="bg-surface-container-low border border-tertiary-container/50 rounded-sm p-4 flex flex-col justify-between bg-gradient-to-br from-tertiary-container/5 to-transparent shadow-xs">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Overdue Tasks</span>
                  <span className="material-symbols-outlined text-tertiary">warning</span>
                </div>
                <div className="my-2">
                  <div className="text-2xl font-bold font-mono text-tertiary">{tasksCount.overdue} Overdue</div>
                  <p className="text-[11px] text-tertiary font-medium mt-0.5">
                    Automated cron background detection
                  </p>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono pt-1 border-t border-outline-variant/20">
                  <span className="text-outline">SLA Health</span>
                  <span className={`font-semibold ${tasksCount.overdue > 0 ? 'text-tertiary' : 'text-secondary'}`}>
                    {tasksCount.overdue > 0 ? 'Action Required' : 'Optimal'}
                  </span>
                </div>
              </div>

              {/* Card 4: Active Users Online */}
              <div className="bg-surface-container-low border border-outline-variant/40 rounded-sm p-4 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Active Users Online</span>
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                </div>
                <div className="my-2">
                  <div className="text-2xl font-bold font-mono text-secondary">{onlineCount} Online</div>
                  <p className="text-[11px] text-outline mt-0.5">Real-time socket presence tracked</p>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-secondary pt-1 border-t border-outline-variant/20">
                  <span>Cluster Live</span>
                  <span>WebSocket Stream Active</span>
                </div>
              </div>
            </div>

            {/* Split Operational Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Live Operational Stream */}
              <section className="lg:col-span-8 bg-surface-container-low border border-outline-variant/30 rounded-sm p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-on-surface">Live Operational Stream</h2>
                    <span className="px-1.5 py-0.2 rounded-sm bg-secondary/10 text-secondary text-[10px] font-mono font-semibold">
                      LIVE
                    </span>
                  </div>
                  <div className="flex gap-1 text-xs">
                    {(['All', 'Status', 'Deployments'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setFilterTab(t)}
                        className={`px-2.5 py-0.5 rounded-sm text-xs transition-colors cursor-pointer ${
                          filterTab === t
                            ? 'bg-surface-container-highest text-primary font-medium shadow-xs'
                            : 'text-outline hover:text-on-surface'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-outline-variant/20 text-xs">
                  {filteredActivity.length === 0 ? (
                    <div className="py-6 text-center text-outline">
                      {searchQuery
                        ? `No activity matching "${searchQuery}".`
                        : 'No activity logs registered yet. Actions taken across the app stream here in real time.'}
                    </div>
                  ) : (
                    filteredActivity.map((ev) => (
                      <div key={ev.id} className="py-3 flex items-start justify-between">
                        <div>
                          <p className="font-medium text-on-surface">
                            <strong className="text-primary mr-1.5">{ev.user}</strong>
                            {ev.action}
                          </p>
                          <span className="text-[11px] text-outline font-mono">[{ev.project}]</span>
                        </div>
                        <span className="font-mono text-[11px] text-outline">{ev.time}</span>
                      </div>
                    ))
                  )}
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
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-sm p-4 space-y-3 shadow-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                    <h3 className="text-xs font-semibold text-on-surface">Projects Health Overview</h3>
                    <span className="text-[10px] font-mono text-outline">Active</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    {filteredProjects.length === 0 ? (
                      <div className="py-4 text-center text-outline">No projects found</div>
                    ) : (
                      filteredProjects.map((p) => (
                        <div key={p.id || p.name}>
                          <div className="flex justify-between mb-1">
                            <Link to="/project-board" className="font-medium text-on-surface hover:text-primary transition-colors">
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
                      ))
                    )}
                  </div>
                </div>

                {/* Overdue SLA Critical Card */}
                <div className="bg-surface-container-low border border-tertiary-container/40 rounded-sm p-4 space-y-3 shadow-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                    <h3 className="text-xs font-semibold text-tertiary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">error</span>
                      Overdue SLA Critical
                    </h3>
                    <span className="px-1.5 py-0.2 rounded-sm bg-tertiary/10 text-tertiary text-[10px] font-mono font-semibold">
                      {tasksCount.overdue} Tasks
                    </span>
                  </div>
                  <p className="text-xs text-outline">
                    {tasksCount.overdue > 0
                      ? `${tasksCount.overdue} tasks are marked as overdue. Use the Kanban board or PM workspace to reschedule or reassign.`
                      : 'All tasks are currently within their scheduled delivery windows.'}
                  </p>
                  <button
                    onClick={() => navigate('/project-board')}
                    className="text-xs text-tertiary hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Reassign or inspect backlog</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: MANAGE USERS */}
        {adminSection === 'users' && (
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-sm p-5 space-y-4 shadow-xs">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20">
              <div>
                <h2 className="text-sm font-semibold text-on-surface">User Management (Admin Only)</h2>
                <p className="text-xs text-outline mt-0.5">
                  Create new team members, manage access roles (Admin, PM, Developer), and monitor profiles.
                </p>
              </div>
              <button
                onClick={() => setUserModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-inverse-primary text-white text-xs font-medium rounded-sm transition-colors cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>Create User</span>
              </button>
            </div>

            {isUsersLoading ? (
              <div className="py-8 text-center text-xs text-outline">Loading users list...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container text-outline font-mono text-[11px] uppercase border-b border-outline-variant/30">
                    <tr>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Role</th>
                      <th className="p-2.5">Created At</th>
                      <th className="p-2.5 text-right">Change Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-surface-container/50 transition-colors">
                        <td className="p-2.5 font-medium text-on-surface">{u.name}</td>
                        <td className="p-2.5 font-mono text-outline">{u.email}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-sm text-[10px] font-mono font-semibold uppercase ${
                              u.role === 'ADMIN'
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : u.role === 'PM'
                                ? 'bg-secondary/20 text-secondary border border-secondary/30'
                                : 'bg-surface-container-highest text-on-surface-variant'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-outline">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-2.5 text-right">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                            className="h-7 px-2 bg-surface-container border border-outline-variant rounded-sm text-xs text-on-surface focus:outline-none"
                          >
                            <option value="DEVELOPER">DEVELOPER</option>
                            <option value="PM">PM</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: MANAGE CLIENTS */}
        {adminSection === 'clients' && (
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-sm p-5 space-y-4 shadow-xs">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20">
              <div>
                <h2 className="text-sm font-semibold text-on-surface">Client Organizations (Admin Only)</h2>
                <p className="text-xs text-outline mt-0.5">
                  Register client enterprise accounts for project billing, grouping, and telemetry.
                </p>
              </div>
              <button
                onClick={() => setClientModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-inverse-primary text-white text-xs font-medium rounded-sm transition-colors cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">domain_add</span>
                <span>Create Client</span>
              </button>
            </div>

            {isClientsLoading ? (
              <div className="py-8 text-center text-xs text-outline">Loading client directory...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container text-outline font-mono text-[11px] uppercase border-b border-outline-variant/30">
                    <tr>
                      <th className="p-2.5">Client Name</th>
                      <th className="p-2.5">Projects Linked</th>
                      <th className="p-2.5">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {clientsList.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-container/50 transition-colors">
                        <td className="p-2.5 font-medium text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-secondary">business</span>
                          <span>{c.name}</span>
                        </td>
                        <td className="p-2.5 font-mono text-outline">
                          {c._count?.projects || 0} Projects
                        </td>
                        <td className="p-2.5 font-mono text-outline">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CREATE USER MODAL */}
        {userModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container-low border border-outline-variant rounded-sm w-full max-w-md p-5 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
                <h3 className="text-sm font-semibold text-on-surface">Create New User</h3>
                <button
                  onClick={() => setUserModalOpen(false)}
                  className="text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              {userActionError && (
                <div className="p-2.5 rounded-sm bg-error/10 border border-error/30 text-error text-xs">
                  {userActionError}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-outline mb-1">Full Name</label>
                  <input
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Maya Lin"
                    className="w-full h-8 px-2.5 bg-surface-container border border-outline-variant rounded-sm text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-outline mb-1">Email Address</label>
                  <input
                    required
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="maya@pulsestudio.io"
                    className="w-full h-8 px-2.5 bg-surface-container border border-outline-variant rounded-sm text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-outline mb-1">Password</label>
                  <input
                    required
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-8 px-2.5 bg-surface-container border border-outline-variant rounded-sm text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-outline mb-1">Role Assignment</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full h-8 px-2.5 bg-surface-container border border-outline-variant rounded-sm text-xs text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="DEVELOPER">Developer</option>
                    <option value="PM">Project Manager (PM)</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setUserModalOpen(false)}
                    className="px-3 py-1.5 rounded-sm bg-surface-container text-xs text-outline hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingUser}
                    className="px-4 py-1.5 rounded-sm bg-primary hover:bg-inverse-primary text-white text-xs font-medium"
                  >
                    {isSubmittingUser ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CREATE CLIENT MODAL */}
        {clientModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container-low border border-outline-variant rounded-sm w-full max-w-md p-5 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
                <h3 className="text-sm font-semibold text-on-surface">Create Client Organization</h3>
                <button
                  onClick={() => setClientModalOpen(false)}
                  className="text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              {clientActionError && (
                <div className="p-2.5 rounded-sm bg-error/10 border border-error/30 text-error text-xs">
                  {clientActionError}
                </div>
              )}

              <form onSubmit={handleCreateClient} className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-outline mb-1">Client Organization Name</label>
                  <input
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Apex Global Systems"
                    className="w-full h-8 px-2.5 bg-surface-container border border-outline-variant rounded-sm text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setClientModalOpen(false)}
                    className="px-3 py-1.5 rounded-sm bg-surface-container text-xs text-outline hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingClient}
                    className="px-4 py-1.5 rounded-sm bg-primary hover:bg-inverse-primary text-white text-xs font-medium"
                  >
                    {isSubmittingClient ? 'Creating...' : 'Create Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
};
