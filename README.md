# Pulse Studio — Real-Time Agency Project & Task Ops

## 1. Project Overview

Pulse Studio is a high-velocity, real-time project and task management platform engineered specifically for digital agencies handling concurrent client deliverables. It unifies project tracking, sprint execution, SLA deadline monitoring, role-governed workflows, and live presence telemetry into a single, cohesive operations terminal. Built with strict role-based access control and live bidirectional event streaming, Pulse Studio provides dedicated, scoped visibility for Administrators, Project Managers, and Developers.

---

## 2. Live Demo

- **Live Application (Frontend)**: [https://pulse-studio-olive.vercel.app](https://pulse-studio-olive.vercel.app)
- **Backend API**: [https://pulse-studio-production-4459.up.railway.app](https://pulse-studio-production-4459.up.railway.app)
  *(This is an API server, not a browsable website — use `/api/health` or `/` to verify it's running, or interact with it through the live frontend above.)*

> **Deployment Architecture Note**: The frontend and backend are hosted on decoupled infrastructure (Vercel and Railway, respectively). Vercel's serverless function runtime does not support persistent, stateful WebSocket connections. Therefore, the backend API, Socket.io engine, background cron scheduler, and PostgreSQL database run on Railway to guarantee uninterrupted, long-lived bidirectional streaming and presence tracking.

---

## 3. Local Setup Instructions

### Prerequisites
- **Node.js**: `v18.x` or `v20.x` (LTS recommended)
- **npm**: `v9.x` or higher
- **Docker Desktop**: Running locally for containerized PostgreSQL

This repository is organized as a monorepo containing decoupled `/server` and `/frontend` packages.

### Step 1: Clone Repository & Install Dependencies

```bash
# Clone repository
git clone https://github.com/Mann-Raval/pulse-studio.git
cd pulse-studio

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../frontend
npm install

cd ..
```

---

### Step 2: Start Local PostgreSQL via Docker

Run the included Docker Compose configuration from the repository root to launch PostgreSQL 16:

```bash
docker-compose up -d
```

This provisions PostgreSQL on `localhost:5432` with database `pulse_studio`, username `postgres`, and password `postgrespassword`.

---

### Step 3: Environment Variable Configuration

#### Backend Configuration (`server/.env`)
Create `server/.env` (or copy from `server/.env.example`):

```bash
cp server/.env.example server/.env
```

| Variable | Description | Local Default |
| :--- | :--- | :--- |
| `PORT` | Port number Express & Socket.io listen on | `5000` |
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | `development` |
| `CLIENT_URL` | Allowed frontend origin for Express CORS and Socket.io handshake | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgrespassword@localhost:5432/pulse_studio` |
| `JWT_ACCESS_SECRET` | Secret key used to sign short-lived access tokens (min 16 chars) | `super-secret-jwt-access-key-change-in-production-min32chars` |
| `JWT_ACCESS_EXPIRES_IN` | Lifespan of JWT access tokens | `15m` |
| `JWT_REFRESH_SECRET` | Secret key used to sign long-lived refresh tokens (min 16 chars) | `super-secret-jwt-refresh-key-change-in-production-min32chars` |
| `JWT_REFRESH_EXPIRES_DAYS`| Lifespan of refresh tokens in days | `7` |
| `COOKIE_SECRET` | Signing secret for signed cookies | `super-secret-cookie-signing-key-change-in-production` |

#### Frontend Configuration (`frontend/.env`)
Create `frontend/.env` (or copy from `frontend/.env.example`):

```bash
cp frontend/.env.example frontend/.env
```

| Variable | Description | Default (Local Dev) |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL for REST API endpoints | *(Leave empty in dev; Vite proxy routes `/api` to `http://localhost:5000`)* |
| `VITE_SOCKET_URL` | Connection URL for Socket.io client | *(Leave empty in dev; defaults to `window.location.origin`)* |

---

### Step 4: Run Database Migrations & Seed Data

Generate the Prisma client, run migrations against your local database, and populate demo data:

```bash
cd server
npm run prisma:migrate
npm run seed
```

---

### Step 5: Start Development Servers

Run both servers concurrently in separate terminal sessions:

```bash
# Terminal 1 — Start Backend Server (runs on http://localhost:5000)
cd server
npm run dev

# Terminal 2 — Start Frontend Application (runs on http://localhost:5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Seeded Credentials

All demo accounts share the password: `password123`

| Role | Name | Email | Permissions / Scope |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | Sarah Connor | `admin@pulsestudio.io` | Global visibility across all clients, projects, tasks, user directory, system-wide presence, and activity feeds |
| **📁 Project Manager** | Alex Mercer | `pm@pulsestudio.io` | Manages created client projects, assigns tasks, reviews developer deliverables, tracks project sprints |
| **📁 Project Manager** | Marcus Lead | `pm2@pulsestudio.io` | Second PM account managing separate client projects for multi-tenant verification |
| **💻 Developer** | Elena Rostova | `dev@pulsestudio.io` | Focused developer workspace; views and transitions assigned tasks, receives assignment alerts |
| **💻 Developer** | Alex Rivera | `dev2@pulsestudio.io` | Secondary developer account for task assignment testing |
| **💻 Developer** | Devon Vance | `dev3@pulsestudio.io` | Developer account |
| **💻 Developer** | Maya Lin | `dev4@pulsestudio.io` | Developer account |

---

## 4. Database Schema & Indexing Rationale

Pulse Studio utilizes PostgreSQL managed through Prisma ORM. The relational model enforces referential integrity, relational cascades, and indexed lookup paths.

```mermaid
erDiagram
    User ||--o{ Project : "createdProjects (onDelete: Restrict)"
    User ||--o{ Task : "assignedTasks (onDelete: SetNull)"
    User ||--o{ TaskActivityLog : "activityLogs (onDelete: Restrict)"
    User ||--o{ Notification : "notifications (onDelete: Cascade)"
    User ||--o{ RefreshToken : "refreshTokens (onDelete: Cascade)"
    Client ||--o{ Project : "projects (onDelete: Cascade)"
    Project ||--o{ Task : "tasks (onDelete: Cascade)"
    Task ||--o{ TaskActivityLog : "activityLogs (onDelete: Cascade)"
    Task ||--o{ Notification : "notifications (onDelete: SetNull)"
```

### Models & Relations

1. **`User`**: Core identity table storing encrypted credentials (`passwordHash`), assigned `Role` (`ADMIN`, `PM`, `DEVELOPER`), and timestamps.
2. **`Client`**: Represents external agency clients owning one or more projects.
3. **`Project`**: Agency deliverables associated with a `Client` and authored by a `User` (`createdById`).
4. **`Task`**: Sprint work items linked to a `Project`, optionally assigned to a `User` (`assignedToId`), tracking `status`, `priority`, `dueDate`, and `isOverdue` status.
5. **`TaskActivityLog`**: Immutable audit ledger recording every status transition, author (`changedById`), prior state (`fromStatus`), new state (`toStatus`), and timestamp (`changedAt`).
6. **`Notification`**: Role-scoped user notifications with read/unread tracking and direct task links.
7. **`RefreshToken`**: Cryptographically hashed session refresh tokens enabling secure token rotation with explicit revocation.

### Index Rationale (Extracted Directly from `schema.prisma`)

| Model | Index Definition | Rationale from Schema |
| :--- | :--- | :--- |
| **`Project`** | `@@index([createdById])` | PM dashboard scoping — "show only projects I created" |
| **`Task`** | `@@index([projectId])` | Filter and fetch tasks by project in project detail and board views |
| **`Task`** | `@@index([assignedToId])` | Fast lookup for personal dashboards and "My Tasks" lists |
| **`Task`** | `@@index([status])` | Efficient filtering on Kanban columns and sprint board statuses |
| **`Task`** | `@@index([dueDate])` | Fast sorting and range queries for deadline alerts, calendar views, and overdue batch jobs |
| **`Task`** | `@@index([projectId, status])` | Composite index for the most common query pattern — a project's board filtered by status — more efficient than combining two single-column indexes for this specific access pattern |
| **`Task`** | `@@index([dueDate, status])` | Backs the scheduled overdue-flagging job's query (`WHERE dueDate < now() AND status != DONE AND isOverdue = false`) |
| **`TaskActivityLog`** | `@@index([taskId])` | Rapid retrieval of complete task audit trail and activity history on task detail drawer |
| **`Notification`** | `@@index([userId])` | Rapid retrieval of notifications for the logged-in user in notification drawer |
| **`Notification`** | `@@index([isRead])` | Fast filtering between unread/read state and badge counters |
| **`RefreshToken`** | `@@index([userId])` | Fast lookup for user session invalidation on logout and token refresh |

---

## 5. Architecture Decisions

### Why Socket.io over Raw WebSockets
Socket.io was selected because Pulse Studio requires sophisticated room-based event multiplexing (`activity:global`, `activity:project:<id>`, `activity:dev:<id>`, `user:<id>`), automatic reconnection backoff, heartbeat health checks, and transparent transport fallback (WebSocket upgrading from HTTP long-polling). Implementing resilient heartbeat monitors, connection clustering, and multi-room subscriptions over native `ws` would require substantial custom networking scaffolding without operational benefits.

### Why `node-cron` over Bull / BullMQ for Overdue Task Processing
The overdue task detector is a lightweight, periodic query executing once every 5 minutes on a single database. Introducing Bull or BullMQ would mandate an external Redis deployment, worker pool serialization, and queue maintenance overhead. `node-cron` combined with an optimized composite PostgreSQL index (`[dueDate, status]`) provides zero-dependency, deterministic in-process execution perfectly suited for this workload.

### HttpOnly Cookies for Refresh Tokens vs. LocalStorage
To defend against Cross-Site Scripting (XSS) attacks, refresh tokens are never exposed to JavaScript runtimes. Short-lived access tokens (15-minute TTL) are held in memory/authorization headers, while long-lived refresh tokens (7-day TTL) are stored in `HttpOnly`, `SameSite=Strict`, `Secure` cookies with SHA-256 database hashing. Even if malicious third-party script execution occurs on the client, refresh tokens cannot be exfiltrated.

### Hierarchical Superuser Bypass for `ADMIN`
Both backend route guards (`requireRole`) and frontend authorization helpers (`hasRole`) implement an explicit hierarchical superuser check:

```typescript
// Backend: server/src/middlewares/auth.middleware.ts
const isAllowed = allowedRoles.includes(req.user.role) || req.user.role === Role.ADMIN;

// Frontend: frontend/src/context/AuthContext.tsx
const hasRole = (allowedRoles?: UserRole[]): boolean => {
  if (!user) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  const userRoleLower = String(user.role).toLowerCase();
  return allowedRoles.some((r) => {
    const allowedLower = String(r).toLowerCase();
    return userRoleLower === allowedLower || userRoleLower === 'admin';
  });
};
```

This ensures Administrators retain unrestricted supervisory oversight across all agency projects, board configurations, telemetry feeds, and audit logs without requiring brittle role enumeration in every route declaration.

### `onDelete: Restrict` for Audit Trail Integrity
In `schema.prisma`, `Project.createdBy` and `TaskActivityLog.changedBy` enforce `onDelete: Restrict`. In an enterprise agency environment, historical compliance and audit trails must remain immutable. Deleting a Project Manager or Developer account cannot cascade-delete or orphan project histories or activity timestamps. User offboarding requires disabling the account rather than destructive cascades that compromise audit compliance.

### Database-Level Role-Scoping (Prisma Where-Clause Pattern)
Security and data privacy are enforced at the database query level rather than relying solely on route middleware. Every controller constructs dynamic Prisma query filters scoped to the authenticated user's session:

```typescript
// Example: server/src/controllers/task.controller.ts (getProjectTasks)
const where: Prisma.TaskWhereInput = {
  projectId,
  ...(userRole === Role.DEVELOPER ? { assignedToId: userId } : {}),
  ...(userRole === Role.PM ? { project: { createdById: userId } } : {}),
};

const [total, tasks] = await Promise.all([
  prisma.task.count({ where }),
  prisma.task.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      assignedTo: { select: { id: true, name: true, email: true, role: true } },
      project: { select: { id: true, name: true, createdById: true } },
      _count: { select: { activityLogs: true } },
    },
  }),
]);
```

Developers can never fetch or inspect tasks outside their direct assignment, and Project Managers can never access tasks belonging to unowned projects, even by manipulating client-side parameters.

---

## 6. Real-Time Architecture & Socket.io Room Strategy

### Room Segmentation

Socket.io rooms are partitioned to prevent noisy data leaks and optimize socket message serialization:

```
├── activity:global               --> Subscribed by ADMIN (sees all workspace events)
├── activity:pm:<pmUserId>        --> Subscribed by specific PM (sees project updates)
├── activity:project:<projectId>  --> Subscribed on demand when viewing a project board
├── activity:dev:<devUserId>      --> Subscribed by assigned Developer (task alerts)
└── user:<userId>                 --> Personal room for targeted unread notifications
```

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer (Browser)
    participant Svr as Express + Socket.io Server
    participant DB as PostgreSQL Database
    actor Admin as Admin (Browser)
    actor PM as PM (Browser)

    Dev->>Svr: PATCH /api/tasks/:id/status (toStatus: IN_PROGRESS)
    activate Svr
    Svr->>DB: prisma.$transaction(Task update + TaskActivityLog create)
    DB-->>Svr: Transaction committed
    Svr-->>Dev: HTTP 200 (Task updated)
    deactivate Svr

    par Broadcast Real-Time Events
        Svr-)Admin: emit('activity:new') on room 'activity:global'
        Svr-)PM: emit('activity:new') on room 'activity:project:id'
        Svr-)Dev: emit('activity:new') on room 'activity:dev:id'
    end
```

### Database-Backed Missed-Event Catchup (`sync:request` / `sync:response`)
Rather than relying on volatile, in-memory circular buffers that lose state during server restarts or client network switches, event synchronization is backed directly by the `TaskActivityLog` table. When a client reconnects or boots up:

1. Client sends `sync:request` with `lastActivityTimestamp`.
2. Server queries `prisma.taskActivityLog.findMany` with `where: { changedAt: { gt: lastActivityTimestamp }, ...roleScope }`, ordered chronologically.
3. Server responds via `sync:response` with the exact sequence of missed activities formatted identically to live payloads.

### Multi-Device Presence Tracking
The `PresenceManager` tracks live user presence using a connection reference-counting map (`Map<string, { user: PresenceUser, connectionCount: number }>`). If a user opens Pulse Studio across 3 browser tabs or multiple devices, their `connectionCount` increments to `3` while their presence is counted as **1 distinct active user**. The user is only broadcast as offline once their final active connection terminates (`connectionCount <= 0`).

---

## 7. Known Limitations

In the interest of full technical transparency, the following architectural constraints and areas for future development exist in the current implementation:

1. **Kanban Drag-and-Drop**: Task status transitions are currently performed via explicit dropdown selectors and action buttons rather than HTML5 drag-and-drop mechanics.
2. **Password Recovery Flow**: Dedicated email SMTP password reset tokens and verification links are omitted; credential resets currently require administrative intervention.
3. **Task File Attachments**: Tasks do not support binary file uploads or S3 storage integration; task context is maintained via markdown descriptions and activity logs.
4. **Single-Node Socket.io Adapter**: Presence management and room broadcasting operate in-memory on a single backend instance. Horizontal multi-container scaling would require configuring the `@socket.io/redis-adapter` with Redis Pub/Sub.

---

## 8. Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Material Symbols Icons
- **Backend**: Node.js, Express, TypeScript, `tsx`
- **Database & ORM**: PostgreSQL 16, Prisma ORM
- **Real-Time Layer**: Socket.io Client & Server
- **Authentication & Security**: JWT (Access Tokens), HttpOnly Signed Cookies (Refresh Tokens), `bcryptjs`, Zod Schema Validation
- **Background Workers**: `node-cron`
- **Infrastructure & Hosting**:
  - **Frontend**: [Vercel](https://vercel.com)
  - **Backend & Database**: [Railway](https://railway.app)
  - **Local Development**: Docker Compose
