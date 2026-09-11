import React, { useState } from 'react';
import type { CreateTaskPayload, TaskPriority } from '../../types';

export interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: CreateTaskPayload) => void;
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateTask,
}) => {
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('Nova AI Token Engine');
  const [priority, setPriority] = useState<TaskPriority>('medium');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateTask({
      title,
      project,
      priority,
    });

    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-low border border-outline-variant rounded-sm w-full max-w-lg p-5 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
          <h3 className="text-sm font-semibold text-on-surface">
            Create New Task / Sprint Item
          </h3>
          <button
            onClick={onClose}
            className="text-outline hover:text-on-surface p-1"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-mono text-outline mb-1">
              Task Title
            </label>
            <input
              name="taskTitle"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement Token Caching"
              className="w-full h-8 px-2.5 bg-surface-container border border-outline-variant rounded-sm text-xs focus:ring-1 focus:ring-primary focus:border-primary text-on-surface focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-outline mb-1">
                Project
              </label>
              <select
                name="taskProject"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full h-8 px-2.5 bg-surface-container border border-outline-variant rounded-sm text-xs text-on-surface focus:outline-none focus:border-primary"
              >
                <option>Nova AI Token Engine</option>
                <option>FinPulse Mobile Redesign</option>
                <option>Hyperscale Cloud</option>
                <option>Kinetix 3D Web</option>
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
                className="w-full h-8 px-2.5 bg-surface-container border border-outline-variant rounded-sm text-xs text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-sm bg-surface-container text-xs text-outline hover:text-on-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-sm bg-primary hover:bg-inverse-primary text-white text-xs font-medium transition-all"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
