import React, { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { mockActivityEvents } from '../data/mockData';
import type { ActivityEvent, ActivityType } from '../types';
import { useSocket } from '../hooks/useSocket';
import { useSearch } from '../context/SearchContext';

export interface ActivityScreenProps {
  initialEvents?: ActivityEvent[];
  connectionLatencyMs?: number;
  onExportCsv?: () => void;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({
  initialEvents = mockActivityEvents,
  connectionLatencyMs = 14,
  onExportCsv,
}) => {
  const { activities, isConnected } = useSocket();
  const { searchQuery } = useSearch();
  const [filterType, setFilterType] = useState<ActivityType>('all');

  // Convert real socket activities to display format if available
  const socketEvents: ActivityEvent[] = activities.map((act) => ({
    id: act.id,
    user: act.changedBy?.name || 'System',
    action: `updated task "${act.taskTitle}" from ${act.fromStatus} to ${act.toStatus}`,
    from: act.fromStatus,
    to: act.toStatus,
    project: act.projectName || 'Pulse Project',
    time: typeof act.changedAt === 'string' ? new Date(act.changedAt).toLocaleTimeString() : new Date().toLocaleTimeString(),
    type: 'status',
  }));

  const combinedEvents = [...socketEvents, ...initialEvents];

  const query = searchQuery.trim().toLowerCase();

  const filteredEvents = combinedEvents.filter((e) => {
    if (filterType !== 'all' && e.type !== filterType) return false;

    if (query) {
      const matchUser = e.user.toLowerCase().includes(query);
      const matchAction = e.action.toLowerCase().includes(query);
      const matchProject = e.project.toLowerCase().includes(query);
      const matchNote = e.note?.toLowerCase().includes(query) || false;
      if (!matchUser && !matchAction && !matchProject && !matchNote) return false;
    }

    return true;
  });

  const handleExport = () => {
    if (onExportCsv) {
      onExportCsv();
    } else {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "User,Action,From,To,Project,Time\n"
        + filteredEvents.map(e => `"${e.user}","${e.action}","${e.from || ''}","${e.to || ''}","${e.project}","${e.time}"`).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "pulse_activity_audit.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <AppLayout activeTab="activity">
      <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div>
            <h1 className="text-xl font-bold text-on-surface">Global Activity Audit & Live Feed</h1>
            <p className="text-xs text-on-surface-variant">
              Real-time telemetry event trace across all projects and tasks via Socket.io
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className={`px-2.5 py-1 rounded-sm border flex items-center gap-1.5 ${
              isConnected
                ? 'bg-surface-container border-secondary/30 text-secondary'
                : 'bg-surface-container border-outline-variant text-outline'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-secondary animate-pulse' : 'bg-outline'}`}></span>
              {isConnected ? `Connected (${connectionLatencyMs}ms)` : 'Offline'}
            </span>
            <button
              onClick={handleExport}
              className="px-3 py-1 rounded-sm bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs text-on-surface transition-colors cursor-pointer"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Filter Sidebar */}
          <aside className="lg:col-span-3 bg-surface-container-low border border-outline-variant/30 rounded-sm p-4 space-y-4 text-xs shadow-xs">
            <div className="font-semibold text-xs border-b border-outline-variant/20 pb-2 text-on-surface">
              Filter Events
            </div>
            <div>
              <label className="block text-[11px] font-mono text-outline mb-1.5">
                Event Type
              </label>
              <div className="space-y-1">
                {(['all', 'status', 'assign', 'blocker', 'deploy'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setFilterType(k)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-sm capitalize text-xs transition-colors cursor-pointer ${
                      filterType === k
                        ? 'bg-primary/20 text-primary font-semibold shadow-xs'
                        : 'text-outline hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Feed List */}
          <section className="lg:col-span-9 space-y-3">
            <div className="divide-y divide-outline-variant/20 border border-outline-variant/30 rounded-sm bg-surface-container-low overflow-hidden shadow-xs">
              {filteredEvents.length === 0 ? (
                <div className="p-8 text-center text-outline text-xs">
                  {searchQuery
                    ? `No activity events matching "${searchQuery}".`
                    : 'No activity logs found.'}
                </div>
              ) : (
                filteredEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 hover:bg-surface-container transition-colors flex items-start justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="text-on-surface">
                        <strong className="text-on-surface mr-1">{ev.user}</strong>
                        <span className="text-on-surface-variant">{ev.action}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-outline">[{ev.project}]</span>
                        {ev.to && (
                          <span
                            className={`px-1.5 py-0.2 rounded-sm font-medium ${
                              ev.type === 'blocker'
                                ? 'bg-error/20 text-error'
                                : 'bg-secondary/10 text-secondary'
                            }`}
                          >
                            {ev.to}
                          </span>
                        )}
                        {ev.note && (
                          <span className="text-outline italic">"{ev.note}"</span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-outline shrink-0">
                      {ev.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </AppLayout>
  );
};
