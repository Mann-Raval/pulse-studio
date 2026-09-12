import React, { useState, useEffect } from 'react';
import type { TaskPriority } from '../../types';
import { api } from '../../services/api';

export interface TaskCreateModalPayload {
  projectId: string;
  title: string;
  description?: string;
  assignedToId?: string | null;
  priority: TaskPriority;
  dueDate?: string;
}

export interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: TaskCreateModalPayload) => Promise<void> | void;
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedToId, setAssignedToId] = useState<string>(''); // empty string means Unassigned
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');

  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [developers, setDevelopers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingData(true);
    setErrorMessage(null);

    Promise.all([
      api.getProjects().catch((err) => {
        console.error('Failed to load projects for task creation:', err);
        return { projects: [] };
      }),
      api.getUsers('DEVELOPER').catch((err) => {
        console.error('Failed to load developers for task creation:', err);
        return { users: [] };
      }),
    ])
      .then(([projRes, usersRes]) => {
        const fetchedProjects = projRes?.projects || [];
        const fetchedDevelopers = usersRes?.users || [];

        setProjects(fetchedProjects);
        setDevelopers(fetchedDevelopers);

        if (fetchedProjects.length > 0 && !projectId) {
          setProjectId(fetchedProjects[0].id);
        }
      })
      .finally(() => {
        setIsLoadingData(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onCreateTask({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        assignedToId: assignedToId ? assignedToId : null,
        priority,
        dueDate: dueDate || undefined,
      });

      // Reset form on success
      setTitle('');
      setDescription('');
      setAssignedToId('');
      setDueDate('');
      setPriority('medium');
      onClose();
    } catch (err: any) {
      console.error('Task creation failed:', err);
      setErrorMessage(
        err?.error?.message || err?.message || 'Failed to create task. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDeveloper = developers.find((d) => d.id === assignedToId);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-low border border-outline-variant rounded-sm w-full max-w-lg p-5 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-on-surface">
              Create New Task / Sprint Item
            </h3>
            <p className="text-[11px] text-outline mt-0.5">
              Tasks assigned to developers trigger real-time notifications and feed entries.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-outline hover:text-on-surface p-1 transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-2.5 rounded-sm bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm shrink-0">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono text-outline mb-1">
              Task Title <span className="text-error">*</span>
            </label>
            <input
              name="taskTitle"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement Token Caching"
              disabled={isSubmitting}
              className="w-full h-8 px-2.5 bg-surface-container border border-outline-variant rounded-sm text-xs focus:ring-1 focus:ring-primary focus:border-primary text-on-surface focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono text-outline mb-1">
              Description (Optional)
            </label>
            <textarea
              name="taskDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical specs, acceptance criteria, or context..."
              disabled={isSubmitting}
              rows={2}
              className="w-full p-2.5 bg-surface-container border border-outline-variant rounded-sm text-xs focus:ring-1 focus:ring-primary focus:border-primary text-on-surface focus:outline-none resize-none disabled:opacity-50"
            />
          </div>

          {/* Project & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-outline mb-1">
                Project <span className="text-error">*</span>
              </label>
              <select
                name="taskProject"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={isSubmitting || isLoadingData}
                required
                className="w-full h-8 px-2.5 bg-surface-container border border-outline-variant rounded-sm text-xs text-on-surface focus:outline-none focus:border-primary disabled:opacity-50"
              >
                {projects.length === 0 ? (
                  <option value="">No projects available</option>
                ) : (
                  projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-outline mb-1">
                Priority
              </label>
              <select
                name="taskPriority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                disabled={isSubmitting}
                className="w-full h-8 px-2.5 bg-surface-container border border-outline-variant rounded-sm text-xs text-on-surface focus:outline-none focus:border-primary disabled:opacity-50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Assignee & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-mono text-outline">
                  Assignee
                </label>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-sm ${
                    assignedToId
                      ? 'bg-primary/20 text-primary'
                      : 'bg-surface-container-highest text-outline'
                  }`}
                >
                  {assignedToId ? 'Assigned' : 'Unassigned'}
                </span>
              </div>
              <select
                name="taskAssignee"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                disabled={isSubmitting || isLoadingData}
                className="w-full h-8 px-2.5 bg-surface-container border border-outline-variant rounded-sm text-xs text-on-surface focus:outline-none focus:border-primary disabled:opacity-50"
              >
                <option value="">— Unassigned (Assign later) —</option>
                {developers.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.name} ({dev.email})
                  </option>
                ))}
              </select>
              {selectedDeveloper && (
                <p className="text-[10px] text-primary font-mono mt-1">
                  Will notify: {selectedDeveloper.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-outline mb-1">
                Due Date (Optional)
              </label>
              <input
                type="date"
                name="taskDueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-8 px-2.5 bg-surface-container border border-outline-variant rounded-sm text-xs text-on-surface focus:outline-none focus:border-primary disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-sm bg-surface-container text-xs text-outline hover:text-on-surface transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !projectId}
              className="px-4 py-1.5 rounded-sm bg-primary hover:bg-inverse-primary text-white text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Task</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
