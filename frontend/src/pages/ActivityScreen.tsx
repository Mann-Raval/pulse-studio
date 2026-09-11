import React, { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { mockActivityEvents } from '../data/mockData';
import type { ActivityEvent, ActivityType } from '../types';

export interface ActivityScreenProps {
  initialEvents?: ActivityEvent[];
  connectionLatencyMs?: number;
  onExportCsv?: () => void;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({
  // TODO: Replace with GET /api/activity and subscribe to Socket.io 'activity:new'
  initialEvents = mockActivityEvents,
  connectionLatencyMs = 14,
  onExportCsv,
}) => {
  const [events] = useState<ActivityEvent[]>(initialEvents);
  const [filterType, setFilterType] = useState<ActivityType>('all');

  const filteredEvents = events.filter(
    (e) => filterType === 'all' || e.type === filterType
  );

  const handleExport = () => {
    // TODO: GET /api/activity/export?format=csv
    if (onExportCsv) {
      onExportCsv();
    } else {
      console.log('Exporting activity CSV...');
    }
  };

  return (
    <AppLayout activeTab="activity">
      <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div>
            <h1 className="text-xl font-bold text-on-surface">Global Activity Audit & Live Feed</h1>
            <p className="text-xs text-on-surface-variant">
              Real-time telemetry event trace across all micro-services and project repos
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 rounded-sm bg-surface-container border border-secondary/30 text-secondary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Connected ({connectionLatencyMs}ms)
            </span>
            <button
              onClick={handleExport}
              className="px-3 py-1 rounded-sm bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Filter Sidebar */}
          <aside className="lg:col-span-3 bg-surface-container-low border border-outline-variant/30 rounded-sm p-4 space-y-4 text-xs">
            <div className="font-semibold text-xs border-b border-outline-variant/20 pb-2">
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
                    className={`w-full text-left px-2 py-1 rounded-sm capitalize text-xs transition-colors ${
                      filterType === k
                        ? 'bg-primary/20 text-primary font-semibold'
                        : 'text-outline hover:text-on-surface'
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
            <div className="divide-y divide-outline-variant/20 border border-outline-variant/30 rounded-sm bg-surface-container-low overflow-hidden">
              {filteredEvents.map((ev) => (
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
                          className={`px-1.5 py-0.2 rounded-sm ${
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
              ))}
            </div>
          </section>
        </div>
      </main>
    </AppLayout>
  );
};
