# Pulse Studio

Real-time Project & Task Management Platform with role-scoped access control, live activity streams, instant notifications, and multi-user presence tracking.

---

## Real-Time Architecture: Socket.io Justification

Pulse Studio uses **Socket.io** rather than raw native WebSockets for its real-time engine for the following architectural reasons:

1. **Built-in Room and Namespace Support for Role-Scoped Broadcasting**:
   Socket.io provides native server-side room management (`socket.join()` / `io.to()`). This enables clean, granular, role-based broadcasting channels (`activity:global` for Admins, `activity:pm:<userId>` and `activity:project:<projectId>` for PMs and active board viewers, `activity:dev:<userId>` for assigned developers, and `user:<userId>` for personal notifications) without hand-rolling socket routing tables or channel registries.

2. **Automatic Reconnection Handling**:
   Socket.io natively provides exponential backoff, connection state recovery, and message buffering during temporary network disconnects, preventing race conditions or lost client sessions when network connectivity fluctuates.

3. **Fallback Transport Negotiation**:
   Socket.io gracefully falls back to HTTP long-polling in environments where corporate firewalls, reverse proxies, or restrictive VPNs block direct WebSocket upgrades, ensuring consistent connectivity across all client environments.

---

## Real-Time Socket Events Reference

### Client-to-Server Events (C &rarr; S)

| Event Name | Direction | Payload Schema | Description |
| :--- | :---: | :--- | :--- |
| `join:project` | `C -> S` | `{ projectId: string }` | Client navigates to a project board. Server validates project access permissions before joining the client to `activity:project:<projectId>`. |
| `leave:project` | `C -> S` | `{ projectId: string }` | Client navigates away from a project board. Server leaves the room. |
| `sync:request` | `C -> S` | `{ lastActivityTimestamp: string \| null }` | Client requests missed activity logs. Server queries the database for up to 20 entries newer than `lastActivityTimestamp`, role-scoped to the user. |

### Server-to-Client Events (S &rarr; C)

| Event Name | Direction | Payload Schema | Description |
| :--- | :---: | :--- | :--- |
| `activity:new` | `S -> C` | `{ id, taskId, taskTitle, projectId, projectName, changedBy: { id, name }, fromStatus, toStatus, changedAt }` | Broadcast upon task status changes or edits to `activity:global`, `activity:project:<id>`, and `activity:dev:<assigneeId>`. |
| `notification:new` | `S -> C` | `{ id, userId, type, message, relatedTaskId, isRead, createdAt }` | Emitted directly to `user:<userId>` when tasks are assigned or moved to review. |
| `notification:count` | `S -> C` | `{ unreadCount: number }` | Emitted directly to `user:<userId>` with the fresh live count of unread notifications from DB. |
| `presence:update` | `S -> C` | `{ count: number, users: Array<{ id, name, role }> }` | Broadcast to `activity:global` whenever a user connects or disconnects across all their active browser tabs. |
| `sync:response` | `S -> C` | `ActivityPayload[]` | Emitted back to the requesting client with missed activity logs, ordered oldest to newest. |
| `error` | `S -> C` | `{ code: string, message: string }` | Emitted when an operation (e.g. unauthorized room join) fails. |
