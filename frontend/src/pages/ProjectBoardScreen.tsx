import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { mockBoardTasks, mockTaskComments } from '../data/mockData';
import type { Task, TaskComment, TaskStatus } from '../types';
import { useSocket } from '../hooks/useSocket';
import { api } from '../services/api';

export interface ProjectBoardScreenProps {
  projectName?: string;
  clientName?: string;
  pmName?: string;
  sprintText?: string;
  completionPct?: number;
  initialBoardTasks?: Record<string, Task[]>;
  initialComments?: TaskComment[];
  onTaskMove?: (taskId: string, targetStatus: TaskStatus) => void;
  onAddComment?: (taskId: string, text: string) => void;
}

export const ProjectBoardScreen: React.FC<ProjectBoardScreenProps> = ({
  projectName = 'Nova AI Token Engine',
  clientName = 'Nova AI Inc.',
  pmName = 'Marcus Lead (PM)',
  sprintText = 'Sprint 4 • Nov 14 – Nov 28',
  completionPct = 78,
  initialBoardTasks = mockBoardTasks,
  initialComments = mockTaskComments,
  onTaskMove,
  onAddComment,
}) => {
  const { joinProject, leaveProject, activities, latestActivity } = useSocket();
  const [boardTasks, setBoardTasks] = useState<Record<string, Task[]>>(initialBoardTasks);
  const [activeDrawer, setActiveDrawer] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task>({
    id: 'PLS-882',
    displayId: 'PLS-882',
    title: 'Biometric SSO Callback Handshake - Fix Token Refresh',
    project: 'Nova AI Token Engine',
    assignee: 'Alex Rivera',
    priority: 'critical',
    status: 'In Progress',
    branch: 'feat/auth-sso',
    due: 'Nov 16',
    isOverdue: true,
    description: 'Resolve the timing race condition during OAuth2 state exchange on mobile Safari biometric triggers. Token refresh fails intermittently if cryptographic nonce is resolved prematurely.',
  });

  const [comments, setComments] = useState<TaskComment[]>(initialComments);
  const [commentText, setCommentText] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Live WebSocket synchronization on incoming activity events
  useEffect(() => {
    if (!latestActivity) return;
    const statusMap: Record<string, TaskStatus> = {
      TODO: 'To Do',
      IN_PROGRESS: 'In Progress',
      IN_REVIEW: 'In Review',
      DONE: 'Done',
    };
    const targetUiStatus = statusMap[latestActivity.toStatus];
    if (!targetUiStatus) return;

    setBoardTasks((prev) => {
      let found = false;
      let targetTask: Task | null = null;
      const nextBoard: Record<string, Task[]> = { ...prev };

      for (const col of Object.keys(nextBoard)) {
        nextBoard[col] = (nextBoard[col] || []).filter((t) => {
          if (t.id === latestActivity.taskId) {
            found = true;
            targetTask = { ...t, status: targetUiStatus };
            return false;
          }
          return true;
        });
      }

      if (found && targetTask && nextBoard[targetUiStatus]) {
        nextBoard[targetUiStatus] = [targetTask, ...nextBoard[targetUiStatus]];
        return nextBoard;
      }
      return prev;
    });

    setSelectedTask((prev) => {
      if (prev && prev.id === latestActivity.taskId) {
        return { ...prev, status: targetUiStatus };
      }
      return prev;
    });
  }, [latestActivity]);

  useEffect(() => {
    // Attempt loading real project and tasks
    api.getProjects()
      .then((res) => {
        if (res.projects && res.projects.length > 0) {
          const firstProj = res.projects[0];
          setProjectId(firstProj.id);
          joinProject(firstProj.id);

          api.getProjectTasks(firstProj.id)
            .then((tasksRes) => {
              if (tasksRes.tasks && tasksRes.tasks.length > 0) {
                const newBoard: Record<string, Task[]> = {
                  'To Do': [],
                  'In Progress': [],
                  'In Review': [],
                  'Done': [],
                };

                tasksRes.tasks.forEach((t: any) => {
                  const uiStatus = t.status === 'TODO' ? 'To Do'
                    : t.status === 'IN_PROGRESS' ? 'In Progress'
                    : t.status === 'IN_REVIEW' ? 'In Review'
                    : 'Done';

                  const mappedTask: Task = {
                    id: t.id,
                    displayId: t.id.length > 8 ? t.id.slice(0, 8).toUpperCase() : t.id,
                    title: t.title,
                    project: firstProj.name,
                    assignee: t.assignedTo?.name || 'Unassigned',
                    priority: (t.priority || 'medium').toLowerCase() as any,
                    status: uiStatus,
                    description: t.description || undefined,
                  };

                  if (newBoard[uiStatus]) {
                    newBoard[uiStatus].push(mappedTask);
                  }
                });

                setBoardTasks(newBoard);
                if (tasksRes.tasks[0]) {
                  const firstTask = tasksRes.tasks[0];
                  const firstUiStatus = firstTask.status === 'TODO' ? 'To Do'
                    : firstTask.status === 'IN_PROGRESS' ? 'In Progress'
                    : firstTask.status === 'IN_REVIEW' ? 'In Review'
                    : 'Done';

                  setSelectedTask({
                    id: firstTask.id,
                    displayId: firstTask.id.length > 8 ? firstTask.id.slice(0, 8).toUpperCase() : firstTask.id,
                    title: firstTask.title,
                    project: firstProj.name,
                    assignee: firstTask.assignedTo?.name || 'Unassigned',
                    priority: (firstTask.priority || 'medium').toLowerCase() as any,
                    status: firstUiStatus,
                    description: firstTask.description,
                  });
                }
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      if (projectId) {
        leaveProject(projectId);
      }
    };
  }, [joinProject, leaveProject, projectId]);

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setActiveDrawer(true);
    setStatusError(null);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: TaskComment = {
      id: Date.now(),
      user: 'Me',
      time: 'Just now',
      text: commentText,
    };

    setComments((prev) => [...prev, newComment]);
    onAddComment?.(selectedTask.id, commentText);
    setCommentText('');
  };

  const handleTaskStatusChange = async (targetStatus: TaskStatus) => {
    if (selectedTask.status === targetStatus) return;

    setStatusError(null);
    const previousBoard = { ...boardTasks };
    const previousSelectedTask = { ...selectedTask };

    // Map UI status to server TaskStatus
    const serverStatusMap: Record<string, string> = {
      'To Do': 'TODO',
      'In Progress': 'IN_PROGRESS',
      'In Review': 'IN_REVIEW',
      'Done': 'DONE',
    };

    const serverStatus = serverStatusMap[targetStatus] || 'TODO';

    // Optimistically update UI
    setBoardTasks((prev) => {
      const nextBoard: Record<string, Task[]> = { ...prev };
      for (const col of Object.keys(nextBoard)) {
        nextBoard[col] = (nextBoard[col] || []).filter((t) => t.id !== selectedTask.id);
      }
      const updated = { ...selectedTask, status: targetStatus };
      if (nextBoard[targetStatus]) {
        nextBoard[targetStatus].push(updated);
      }
      return nextBoard;
    });

    setSelectedTask((prev) => ({ ...prev, status: targetStatus }));
    onTaskMove?.(selectedTask.id, targetStatus);

    // Call real API with full UUID
    try {
      await api.updateTaskStatus(selectedTask.id, serverStatus);
    } catch (err: any) {
      console.error('Failed to update task status:', err);
      // Revert optimistic UI changes on error
      setBoardTasks(previousBoard);
      setSelectedTask(previousSelectedTask);
      const errMsg =
        err?.error?.message ||
        err?.message ||
        'Failed to save status change to server. Changes reverted.';
      setStatusError(errMsg);
    }
  };

  const combinedActivityList = [
    ...activities.slice(0, 5).map((a) => ({
      id: a.id,
      user: a.changedBy?.name || 'User',
      time: typeof a.changedAt === 'string' ? new Date(a.changedAt).toLocaleTimeString() : 'Just now',
      text: `Transitioned task to ${a.toStatus}`,
    })),
    ...comments,
  ];

  return (
    <AppLayout activeTab="board">
      <div className="flex-1 flex h-full overflow-hidden">
        {/* Kanban Columns Canvas */}
        <section className="flex-1 flex flex-col min-w-0 bg-surface overflow-hidden">
          {/* Project Header Banner */}
          <div className="border-b border-outline-variant bg-surface-container-lowest px-5 py-3 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-sm bg-surface-container border border-outline-variant flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-xl">memory</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm font-bold text-on-surface">{projectName}</h1>
                    <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-secondary text-[10px] font-mono">
                      {clientName}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-outline flex items-center gap-2 mt-0.5">
                    <span>{pmName}</span>
                    <span>•</span>
                    <span>{sprintText}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-surface-container text-xs font-mono text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                  <span>WEBSOCKET LIVE SYNC</span>
                </div>
                <button
                  onClick={() => setActiveDrawer(!activeDrawer)}
                  className="px-2.5 py-1 rounded-sm bg-surface-container border border-outline-variant text-xs text-outline hover:text-on-surface transition-colors"
                >
                  {activeDrawer ? 'Collapse Drawer' : 'Show Drawer'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-on-surface-variant">
                  {completionPct}% Complete (Sprint Telemetry Active)
                </span>
                <div className="w-40 h-1.5 rounded-full bg-surface-container-high overflow-hidden flex">
                  <div className="h-full bg-secondary w-[55%]"></div>
                  <div className="h-full bg-primary w-[23%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column Board Grid */}
          <div className="flex-1 p-4 overflow-x-auto overflow-y-hidden">
            <div className="grid grid-cols-4 gap-4 h-full min-w-[900px]">
              {/* To Do Column */}
              <div className="bg-surface-container-lowest rounded-sm border border-outline-variant/60 flex flex-col overflow-hidden">
                <div className="px-3 py-2 border-b border-outline-variant/60 bg-surface-container-low flex justify-between items-center text-xs font-semibold">
                  <span>To Do</span>
                  <span className="px-1.5 py-0.2 rounded-sm bg-surface-container font-mono text-[10px] text-outline">
                    {boardTasks['To Do']?.length || 0}
                  </span>
                </div>
                <div className="p-2 space-y-2 overflow-y-auto flex-1 text-xs">
                  {boardTasks['To Do']?.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTask(t)}
                      className="p-2.5 rounded-sm bg-surface-container-low border border-outline-variant hover:border-outline cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between text-[10px] font-mono text-outline mb-1">
                        <span>{t.displayId || t.id.slice(0, 8).toUpperCase()}</span>
                        <span className={t.priority === 'medium' ? 'text-primary' : 'text-outline'}>
                          {t.priority}
                        </span>
                      </div>
                      <h4 className="font-medium text-on-surface">{t.title}</h4>
                    </div>
                  ))}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="bg-surface-container-lowest rounded-sm border border-outline-variant/60 flex flex-col overflow-hidden">
                <div className="px-3 py-2 border-b border-outline-variant/60 bg-surface-container-low flex justify-between items-center text-xs font-semibold text-primary">
                  <span>In Progress</span>
                  <span className="px-1.5 py-0.2 rounded-sm bg-surface-container font-mono text-[10px] text-primary">
                    {boardTasks['In Progress']?.length || 0}
                  </span>
                </div>
                <div className="p-2 space-y-2 overflow-y-auto flex-1 text-xs">
                  {boardTasks['In Progress']?.map((t) => {
                    const isSelected = selectedTask.id === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleSelectTask(t)}
                        className={`p-2.5 rounded-sm cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-surface-container border border-primary ring-1 ring-primary/40 shadow-md'
                            : 'bg-surface-container-low border border-outline-variant hover:border-outline'
                        }`}
                      >
                        <div className="flex justify-between text-[10px] font-mono mb-1">
                          <span className="text-primary font-bold">{t.displayId || t.id.slice(0, 8).toUpperCase()}</span>
                          <span
                            className={
                              t.priority === 'critical'
                                ? 'text-error font-semibold'
                                : 'text-tertiary'
                            }
                          >
                            {t.priority}
                          </span>
                        </div>
                        <h4 className="font-semibold text-on-surface leading-snug">{t.title}</h4>
                        {t.assignee && (
                          <div className="mt-2 pt-1 border-t border-outline-variant/30 flex justify-between text-[10px] font-mono text-outline">
                            <span>{t.assignee}</span>
                            <span className={t.isOverdue ? 'text-error' : ''}>{t.due || 'Active'}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* In Review Column */}
              <div className="bg-surface-container-lowest rounded-sm border border-outline-variant/60 flex flex-col overflow-hidden">
                <div className="px-3 py-2 border-b border-outline-variant/60 bg-surface-container-low flex justify-between items-center text-xs font-semibold text-tertiary">
                  <span>In Review</span>
                  <span className="px-1.5 py-0.2 rounded-sm bg-surface-container font-mono text-[10px] text-tertiary">
                    {boardTasks['In Review']?.length || 0}
                  </span>
                </div>
                <div className="p-2 space-y-2 overflow-y-auto flex-1 text-xs">
                  {boardTasks['In Review']?.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTask(t)}
                      className="p-2.5 rounded-sm bg-surface-container-low border border-outline-variant hover:border-outline cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between text-[10px] font-mono text-outline mb-1">
                        <span>{t.displayId || t.id.slice(0, 8).toUpperCase()}</span>
                        <span className="text-tertiary">{t.priority}</span>
                      </div>
                      <h4 className="font-medium text-on-surface">{t.title}</h4>
                    </div>
                  ))}
                </div>
              </div>

              {/* Done Column */}
              <div className="bg-surface-container-lowest rounded-sm border border-outline-variant/60 flex flex-col overflow-hidden">
                <div className="px-3 py-2 border-b border-outline-variant/60 bg-surface-container-low flex justify-between items-center text-xs font-semibold text-secondary">
                  <span>Done</span>
                  <span className="px-1.5 py-0.2 rounded-sm bg-surface-container font-mono text-[10px] text-secondary">
                    {boardTasks['Done']?.length || 0}
                  </span>
                </div>
                <div className="p-2 space-y-2 overflow-y-auto flex-1 text-xs opacity-85">
                  {boardTasks['Done']?.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTask(t)}
                      className="p-2.5 rounded-sm bg-surface-container-low border border-outline-variant/60 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between text-[10px] font-mono text-outline mb-1">
                        <span className="line-through">{t.displayId || t.id.slice(0, 8).toUpperCase()}</span>
                        <span className="text-secondary font-mono">Merged</span>
                      </div>
                      <h4 className="font-medium text-on-surface-variant line-through">{t.title}</h4>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Slide-out Detail Drawer */}
        {activeDrawer && (
          <aside className="w-[380px] shrink-0 border-l border-outline-variant bg-surface-container-lowest flex flex-col h-full shadow-2xl z-20 animate-in slide-in-from-right duration-150">
            <div className="p-3 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-primary font-bold">{selectedTask.displayId || selectedTask.id.slice(0, 8).toUpperCase()}</span>
                <span className="px-2 py-0.2 rounded-sm bg-secondary/20 text-secondary">
                  {selectedTask.status}
                </span>
              </div>
              <button
                onClick={() => setActiveDrawer(false)}
                className="text-outline hover:text-on-surface p-1 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {statusError && (
                <div className="p-2.5 rounded-sm bg-error/10 border border-error/30 text-error flex items-start justify-between gap-2 text-xs">
                  <div className="flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">error</span>
                    <span>{statusError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatusError(null)}
                    className="text-error/70 hover:text-error p-0.5"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                </div>
              )}

              <h2 className="text-sm font-bold text-on-surface leading-snug">
                {selectedTask.title}
              </h2>

              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-sm bg-surface-container-low border border-outline-variant/60 font-mono text-[11px]">
                <div>
                  <span className="text-outline block">Assignee</span>
                  <span className="font-sans font-medium text-on-surface">
                    {selectedTask.assignee || 'Elena Rostova'}
                  </span>
                </div>
                <div>
                  <span className="text-outline block">Priority</span>
                  <span className="text-error font-semibold capitalize">{selectedTask.priority}</span>
                </div>
                <div>
                  <span className="text-outline block">Sprint</span>
                  <span className="text-on-surface">{sprintText}</span>
                </div>
                <div>
                  <span className="text-outline block">Branch</span>
                  <span className="text-secondary">{selectedTask.branch || 'feat/auth-sso'}</span>
                </div>
              </div>

              <div>
                <h5 className="text-[10px] font-mono text-outline uppercase tracking-wider mb-1">
                  Description
                </h5>
                <div className="p-2.5 rounded-sm bg-surface-container-low border border-outline-variant/40 text-on-surface-variant leading-relaxed text-xs">
                  {selectedTask.description ||
                    'Resolve the timing race condition during OAuth2 state exchange on mobile Safari biometric triggers. Token refresh fails intermittently if cryptographic nonce is resolved prematurely.'}
                </div>
              </div>

              {/* Status quick switch buttons */}
              <div>
                <h5 className="text-[10px] font-mono text-outline uppercase tracking-wider mb-1.5">
                  Update Workflow Status (Live Sync)
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {(['To Do', 'In Progress', 'In Review', 'Done'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleTaskStatusChange(st)}
                      className={`px-2 py-0.5 rounded-sm text-[10px] font-mono transition-colors ${
                        selectedTask.status === st
                          ? 'bg-primary text-white font-semibold'
                          : 'bg-surface-container text-outline hover:text-on-surface'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-outline uppercase">
                  <span>Audit & Activity</span>
                  <span className="text-secondary">Realtime</span>
                </div>
                <div className="space-y-2">
                  {combinedActivityList.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 rounded-sm bg-surface-container-low border border-outline-variant/30 text-xs"
                    >
                      <div className="flex justify-between text-[10px] font-mono text-outline mb-1">
                        <span className="text-on-surface font-medium">{c.user}</span>
                        <span>{c.time}</span>
                      </div>
                      <p className="text-on-surface-variant">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-outline-variant bg-surface-container-low shrink-0">
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add comment or commit note..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 h-8 px-2 rounded-sm bg-surface-container border border-outline-variant text-xs text-on-surface focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 h-8 bg-primary hover:bg-inverse-primary text-white rounded-sm text-xs font-medium transition-all"
                >
                  Send
                </button>
              </form>
            </div>
          </aside>
        )}
      </div>
    </AppLayout>
  );
};
