import type { Task, Project, ActivityEvent, NotificationItem, User } from '../types';

/**
 * ============================================================================
 * LEGACY / TEST FIXTURE DATA
 * ============================================================================
 * WARNING: Do not use these mock data objects as silent catch fallbacks in production
 * components. Production components should fetch live data via the API client and
 * display visible loading/error states rather than falling back to stale mock data.
 * ============================================================================
 */

// User fixture (for storybook / test renderers)
export const mockCurrentUser: User = {
  id: 'usr-01',
  name: 'Alex Rivera',
  email: 'alex.rivera@pulsestudio.agency',
  role: 'Developer',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvx4PgiQ3jZ_4n6eeB76G0hZCI4bG_n_5SQfqowo81L0S11YsWIupEZqyt3ExsiBfDLE-6pkvnMD8axEi32wHLsbuseWN5dNJVVazA8qAXOOr5m5e0Wo-mtDp0I8pKCm61rDJwAKMrwqnh5f2lVEmeE2jao52tJnaRCpzLUZuw1yYZBuUBS2h3D79bHIqgEQcdeigbbQSjZ2s1BUdCyWu5cd5q-Ow9N1p28z4SLqBdG4gWBLuDL8OKJg',
  pod: 'Pod Alpha',
  cluster: 'US-EAST-1',
  status: 'online',
};

// Notification fixture
export const mockNotifications: NotificationItem[] = [
  { id: 1, title: "You were assigned Task #14: Redesign homepage", team: "Nova AI Inc. // Design Ops", time: "just now", unread: true, type: "task" },
  { id: 2, title: "Task #88: Vector Embedding Reduction moved to In Review", team: "Hyperscale Labs", time: "4m ago", unread: true, type: "review" },
  { id: 3, title: "Elena R. mentioned you in PLS-882: Biometric SSO Callback", team: "Nova AI Token Engine", time: "18m ago", unread: true, type: "mention" },
  { id: 4, title: "Sprint 4 staging build v2.4.1 deployed successfully", team: "Pulse Infrastructure", time: "1h ago", unread: false, type: "deploy" }
];

// Developer assigned tasks fixture (DEPRECATED for production screens - use api.getTasks())
export const mockDevTasks: Task[] = [
  { id: "PLS-882", title: "Biometric SSO Callback Handshake - Fix Token Deserialization", project: "Nova AI Inc.", branch: "feat/auth-sso", due: "Overdue (Nov 16)", status: "In Progress", priority: "critical", isOverdue: true, description: "Resolve the timing race condition during OAuth2 state exchange on mobile Safari biometric triggers. Token refresh fails intermittently if cryptographic nonce is resolved prematurely." },
  { id: "PLS-904", title: "Mobile Fintech Redesign: Hotfix Memory Leak on Canvas View", project: "FinPulse Global", branch: "bugfix/canvas-mem", due: "Today, 5:00 PM", status: "In Progress", priority: "critical", isOverdue: false },
  { id: "PLS-782", title: "Rust Micro-services: Implement Kafka Dead-Letter Consumer", project: "Hyperscale Labs", branch: "chore/kafka-dlq", due: "Tomorrow, Nov 19", status: "To Do", priority: "high", isOverdue: false },
  { id: "PLS-912", title: "Design Token Compiler: Export Theme CSS Variables Script", project: "Pulse Studio", branch: "feat/token-gen", due: "Nov 20, 2024", status: "In Review", priority: "high", isOverdue: false },
  { id: "PLS-640", title: "WebGL Fallback Mesh Rendering on Safari iOS", project: "Kinetix Studio", branch: "fix/safari-webgl", due: "Nov 22, 2024", status: "To Do", priority: "medium", isOverdue: false },
  { id: "PLS-721", title: "Client Deliverables Checklist API Endpoint", project: "Pulse Studio", branch: "feat/checklist-api", due: "Nov 24, 2024", status: "In Review", priority: "medium", isOverdue: false },
  { id: "PLS-805", title: "Update Docker Compose development container dependencies", project: "Infrastructure", branch: "dev/docker-up", due: "Nov 28, 2024", status: "To Do", priority: "low", isOverdue: false }
];

// Board tasks fixture (DEPRECATED for production screens - use api.getProjectTasks())
export const mockBoardTasks: Record<string, Task[]> = {
  'To Do': [
    { id: "PLS-610", title: "Multi-modal Token Pipeline Cache", project: "Nova AI Token Engine", priority: "medium", status: "To Do" },
    { id: "PLS-721", title: "Document gRPC Protocol Buffers", project: "Nova AI Token Engine", priority: "low", status: "To Do" }
  ],
  'In Progress': [
    {
      id: "PLS-882",
      title: "Biometric SSO Callback Handshake - Fix Token Refresh",
      project: "Nova AI Token Engine",
      assignee: "Alex Rivera",
      priority: "critical",
      status: "In Progress",
      branch: "feat/auth-sso",
      due: "Nov 16",
      isOverdue: true,
      description: "Resolve the timing race condition during OAuth2 state exchange on mobile Safari biometric triggers. Token refresh fails intermittently if cryptographic nonce is resolved prematurely."
    },
    { id: "PLS-843", title: "Vector Embedding Dimension Reduction", project: "Nova AI Token Engine", priority: "high", status: "In Progress" }
  ],
  'In Review': [
    { id: "PLS-770", title: "Rust FFI Bindings for Transformer", project: "Nova AI Token Engine", priority: "high", status: "In Review" }
  ],
  'Done': [
    { id: "PLS-504", title: "Setup Kubernetes Canary Pipeline", project: "Nova AI Token Engine", priority: "medium", status: "Done" }
  ]
};

export const mockTaskComments = [
  { id: 1, user: "Alex Rivera", time: "12m ago", text: "Pushed commit 4f9b2a to feat/auth-sso" },
  { id: 2, user: "Marcus Lead", time: "1h ago", text: "Changed status from To Do → In Progress" },
  { id: 3, user: "Elena Rostova", time: "3h ago", text: "Added tag: Waiting on API gateway specs" }
];

export const mockPMProjects: Project[] = [
  { id: "prj-1", name: "Nova AI Token Engine", client: "Nova AI Inc.", status: "On Track", statusColor: "text-secondary", pct: 78, tasksCount: "32/41 done", sprint: "Sprint 4 • High Load", target: "Nov 28" },
  { id: "prj-2", name: "FinPulse Mobile Redesign", client: "FinPulse Global", status: "At Risk", statusColor: "text-tertiary", pct: 54, tasksCount: "19/35 done", sprint: "Design QA lag", target: "Dec 04" },
  { id: "prj-3", name: "Hyperscale Migration", client: "Hyperscale Labs", status: "Overdue", statusColor: "text-error", pct: 32, tasksCount: "9/28 done", sprint: "Database locking issue", target: "Nov 15" },
  { id: "prj-4", name: "Kinetix 3D Prototyping", client: "Kinetix Studio", status: "On Track", statusColor: "text-secondary", pct: 91, tasksCount: "31/34 done", sprint: "Final renders in test", target: "Nov 22" }
];

export const mockPMTeamTasks: Task[] = [
  { id: "PLS-304", title: "Biometric SSO Callback Handshake", project: "Nova AI Token Engine", assignee: "Elena Rostova", priority: "critical", status: "In Progress", due: "Nov 18" },
  { id: "PLS-298", title: "Design token export pipeline", project: "FinPulse Mobile Redesign", assignee: "Marcus Chen", priority: "medium", status: "In Progress", due: "Nov 19" },
  { id: "PLS-312", title: "Kafka dead-letter queue schema", project: "Hyperscale Migration", assignee: "Tariq Al-Mansoor", priority: "high", status: "Blocked", due: "Nov 19" },
  { id: "PLS-289", title: "WebGL shader fallback mesh", project: "Kinetix 3D Prototyping", assignee: "Sora Takahashi", priority: "critical", status: "In Review", due: "Nov 20" },
  { id: "PLS-324", title: "Client staging deployment demo", project: "Nova AI Token Engine", assignee: "Devon Vance", priority: "high", status: "In Progress", due: "Nov 22" },
  { id: "PLS-330", title: "PostgreSQL read replica synchronization lag", project: "Hyperscale Migration", assignee: "Tariq Al-Mansoor", priority: "critical", status: "Blocked", due: "Nov 16" }
];

export const mockActivityEvents: ActivityEvent[] = [
  { id: 1, user: "Elena Rostova", action: "updated status for PLS-882: Biometric SSO Callback", from: "In Progress", to: "In Review", project: "Nova AI Token Engine", time: "2m ago", type: "status" },
  { id: 2, user: "Alex Rivera", action: "reassigned Task #14: Redesign homepage to Sarah Lin", from: "To Do", to: "In Progress", project: "FinPulse Mobile", time: "14m ago", type: "assign" },
  { id: 3, user: "Marcus Lead", action: "flagged blocker on Task #88: Vector Embedding Reduction", from: "", to: "Blocker", project: "Hyperscale Labs", time: "28m ago", type: "blocker", note: "Exceeding GPU memory budget" },
  { id: 4, user: "Sarah Lin", action: "merged PR #419 into main: Design Token Compiler", from: "In Review", to: "Done", project: "Pulse Studio", time: "1h ago", type: "pr" },
  { id: 5, user: "David Park", action: "triggered staging deployment v2.4.1 for cluster us-east", from: "", to: "Success", project: "Pulse Infrastructure", time: "2h ago", type: "deploy" },
  { id: 6, user: "Devon Ward", action: "transitioned PLS-721: Client Deliverables Checklist API", from: "To Do", to: "In Progress", project: "Pulse Studio", time: "Yesterday", type: "status" }
];

export const mockAdminMetrics = {
  activeProjects: 18,
  projectsChangeText: "+3 this month • 4 on hold",
  totalTasks: 142,
  tasksBreakdown: {
    todo: 28,
    inProgress: 54,
    inReview: 24,
    done: 36
  },
  overdueTasksCount: 7,
  avgDelay: "1.4 days",
  criticalOverdueCount: 3,
  activeUsersOnline: 19,
  engineeringPodActivePct: "83%",
  clusterSync: "99.98%"
};
