import React, { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { mockBoardTasks, mockTaskComments } from '../data/mockData';
import type { Task, TaskComment, TaskStatus } from '../types';

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
  // TODO: Replace with GET /api/projects/:id/board and subscribe to Socket.io 'board:task_moved'
  initialBoardTasks = mockBoardTasks,
  // TODO: Replace with GET /api/tasks/:id/comments and subscribe to Socket.io 'task:comment_added'
  initialComments = mockTaskComments,
  onTaskMove,
  onAddComment,
}) => {
  const [boardTasks] = useState<Record<string, Task[]>>(initialBoardTasks);
  const [activeDrawer, setActiveDrawer] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task>({
    id: 'PLS-882',
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

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setActiveDrawer(true);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    // TODO: POST /api/tasks/:taskId/comments
    const newComment: TaskComment = {
      id: Date.now(),
      user: 'Alex Rivera',
      time: 'Just now',
      text: commentText,
    };

    setComments((prev) => [...prev, newComment]);
    onAddComment?.(selectedTask.id, commentText);
    setCommentText('');
  };

  const handleTaskStatusChange = (status: TaskStatus) => {
    onTaskMove?.(selectedTask.id, status);
  };

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
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  <span>WEBSOCKET SYNC</span>
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
                  {completionPct}% Complete (32/41 Tasks)
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
                        <span>{t.id}</span>
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
                          <span className="text-primary font-bold">{t.id}</span>
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
                            <span className={t.isOverdue ? 'text-error' : ''}>{t.due || 'Nov 16'}</span>
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
                        <span>{t.id}</span>
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
                        <span className="line-through">{t.id}</span>
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

        {/* Slide-out Detail Drawer (380px Pinned Right Panel) */}
        {activeDrawer && (
          <aside className="w-[380px] shrink-0 border-l border-outline-variant bg-surface-container-lowest flex flex-col h-full shadow-2xl z-20 animate-in slide-in-from-right duration-150">
            <div className="p-3 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-primary font-bold">{selectedTask.id}</span>
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
              <h2 className="text-sm font-bold text-on-surface leading-snug">
                {selectedTask.title}
              </h2>

              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-sm bg-surface-container-low border border-outline-variant/60 font-mono text-[11px]">
                <div>
                  <span className="text-outline block">Assignee</span>
                  <span className="font-sans font-medium text-on-surface">
                    {selectedTask.assignee || 'Alex Rivera'}
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
                  Update Workflow Status
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
                  {comments.map((c) => (
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
