import { PrismaClient, Role, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Cleaning and reseeding database...');

  // 1. Clean existing data in dependency order
  await prisma.taskActivityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('password123', salt);

  // 2. Create Exactly 1 Admin, 2 PMs, 4 Developers
  const admin = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'admin@pulsestudio.io',
      passwordHash: defaultPasswordHash,
      role: Role.ADMIN,
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      name: 'Alex Mercer',
      email: 'pm@pulsestudio.io',
      passwordHash: defaultPasswordHash,
      role: Role.PM,
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      name: 'Marcus Lead',
      email: 'pm2@pulsestudio.io',
      passwordHash: defaultPasswordHash,
      role: Role.PM,
    },
  });

  const dev1 = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      email: 'dev@pulsestudio.io',
      passwordHash: defaultPasswordHash,
      role: Role.DEVELOPER,
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'dev2@pulsestudio.io',
      passwordHash: defaultPasswordHash,
      role: Role.DEVELOPER,
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      name: 'Devon Vance',
      email: 'dev3@pulsestudio.io',
      passwordHash: defaultPasswordHash,
      role: Role.DEVELOPER,
    },
  });

  const dev4 = await prisma.user.create({
    data: {
      name: 'Maya Lin',
      email: 'dev4@pulsestudio.io',
      passwordHash: defaultPasswordHash,
      role: Role.DEVELOPER,
    },
  });

  console.log('✅ Users seeded:');
  console.log('   - 1 Admin:      admin@pulsestudio.io');
  console.log('   - 2 PMs:        pm@pulsestudio.io, pm2@pulsestudio.io');
  console.log('   - 4 Devs:       dev@pulsestudio.io, dev2@pulsestudio.io, dev3@pulsestudio.io, dev4@pulsestudio.io');

  // 3. Create Clients
  const clientNova = await prisma.client.create({ data: { name: 'Nova AI Inc.' } });
  const clientAcme = await prisma.client.create({ data: { name: 'Acme Corporation' } });
  const clientFinPulse = await prisma.client.create({ data: { name: 'FinPulse Global' } });
  const clientHyper = await prisma.client.create({ data: { name: 'Hyperscale Labs' } });

  // 4. Create At least 3 Projects
  const projectNova = await prisma.project.create({
    data: {
      name: 'Nova AI Token Engine',
      clientId: clientNova.id,
      createdById: pm1.id,
    },
  });

  const projectAcme = await prisma.project.create({
    data: {
      name: 'Pulse Dashboard Overhaul',
      clientId: clientAcme.id,
      createdById: pm1.id,
    },
  });

  const projectFinPulse = await prisma.project.create({
    data: {
      name: 'Mobile Fintech Redesign',
      clientId: clientFinPulse.id,
      createdById: pm2.id,
    },
  });

  const projectHyper = await prisma.project.create({
    data: {
      name: 'Distributed Cluster Telemetry',
      clientId: clientHyper.id,
      createdById: pm2.id,
    },
  });

  console.log('✅ Projects created (4 projects across 2 PMs)');

  // Helper timestamps
  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000);
  const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000);
  const minsAgo = (m: number) => new Date(now - m * 60 * 1000);
  const daysFromNow = (d: number) => new Date(now + d * 24 * 60 * 60 * 1000);

  // 5. Create Tasks (5+ tasks per project, realistic status spread, at least 2 overdue)

  // --- Project 1: Nova AI Token Engine (7 tasks) ---
  const tNova1 = await prisma.task.create({
    data: {
      projectId: projectNova.id,
      title: 'Biometric SSO Callback Handshake - Fix Token Deserialization',
      description: 'Resolve timing race condition during OAuth2 state exchange on mobile Safari biometric triggers.',
      assignedToId: dev1.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: daysAgo(2),
      isOverdue: true, // Overdue requirement 1
    },
  });

  const tNova2 = await prisma.task.create({
    data: {
      projectId: projectNova.id,
      title: 'Multi-modal Token Pipeline Cache Layer',
      description: 'Implement Redis LRU caching for multimodal inference token streaming buffers.',
      assignedToId: dev2.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFromNow(4),
      isOverdue: false,
    },
  });

  const tNova3 = await prisma.task.create({
    data: {
      projectId: projectNova.id,
      title: 'Document gRPC Protocol Buffers & Endpoints',
      description: 'Generate OpenAPI 3.0 specs and protobuf schemas for token cluster ingestion.',
      assignedToId: dev3.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: daysFromNow(6),
      isOverdue: false,
    },
  });

  const tNova4 = await prisma.task.create({
    data: {
      projectId: projectNova.id,
      title: 'WebGL Shader Fallback Rendering Pipeline',
      description: 'Gracefully downgrade shader pipelines when client WebGL context loses hardware acceleration.',
      assignedToId: dev4.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(3),
      isOverdue: false,
    },
  });

  const tNova5 = await prisma.task.create({
    data: {
      projectId: projectNova.id,
      title: 'Vector Embedding Reduction Layer',
      description: 'Apply PCA and quantization to reduce memory footprint of dense vector indices.',
      assignedToId: dev1.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(1),
      isOverdue: false,
    },
  });

  const tNova6 = await prisma.task.create({
    data: {
      projectId: projectNova.id,
      title: 'Automated Integration Tests for Token Handshake',
      description: 'Write end-to-end Vitest coverage testing PKCE and biometric authorization callbacks.',
      assignedToId: dev2.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: daysAgo(1),
      isOverdue: false,
    },
  });

  const tNova7 = await prisma.task.create({
    data: {
      projectId: projectNova.id,
      title: 'OAuth2 State Verification Edge Cases',
      description: 'Handle state parameter collisions and replay prevention with cryptographic nonces.',
      assignedToId: dev1.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: daysAgo(3),
      isOverdue: false,
    },
  });

  // --- Project 2: Pulse Dashboard Overhaul (6 tasks) ---
  const tAcme1 = await prisma.task.create({
    data: {
      projectId: projectAcme.id,
      title: 'Design Database Schema and JWT Auth Middleware',
      description: 'Implement PostgreSQL Prisma schema, access/refresh tokens, and role authorization.',
      assignedToId: dev1.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: daysAgo(4),
      isOverdue: false,
    },
  });

  const tAcme2 = await prisma.task.create({
    data: {
      projectId: projectAcme.id,
      title: 'Implement Role-Scoped Task & Project Queries',
      description: 'Ensure ADMIN, PM, and DEVELOPER queries enforce strict database-level filtering.',
      assignedToId: dev2.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(2),
      isOverdue: false,
    },
  });

  const tAcme3 = await prisma.task.create({
    data: {
      projectId: projectAcme.id,
      title: 'WebSocket Real-Time Telemetry Layer with Socket.io',
      description: 'Broadcast task state transitions and activity feeds across role-scoped rooms.',
      assignedToId: dev3.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: daysFromNow(1),
      isOverdue: false,
    },
  });

  const tAcme4 = await prisma.task.create({
    data: {
      projectId: projectAcme.id,
      title: 'Dark Theme Glassmorphism Design System CSS',
      description: 'Craft tailwind and CSS design tokens for elevated dark mode enterprise UI.',
      assignedToId: dev4.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFromNow(5),
      isOverdue: false,
    },
  });

  const tAcme5 = await prisma.task.create({
    data: {
      projectId: projectAcme.id,
      title: 'Overdue SLA Task Background Cron Job Scheduler',
      description: 'Automated recurring worker to mark overdue tasks and emit SLA breach alerts.',
      assignedToId: dev1.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: daysAgo(3),
      isOverdue: true, // Overdue requirement 2
    },
  });

  const tAcme6 = await prisma.task.create({
    data: {
      projectId: projectAcme.id,
      title: 'Activity Audit CSV Export Endpoint',
      description: 'Stream activity logs as formatted CSV for compliance and telemetry audits.',
      assignedToId: dev2.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: daysFromNow(7),
      isOverdue: false,
    },
  });

  // --- Project 3: Mobile Fintech Redesign (6 tasks) ---
  const tFin1 = await prisma.task.create({
    data: {
      projectId: projectFinPulse.id,
      title: 'Hotfix Memory Leak on Financial Canvas View',
      description: 'Fix WebGL memory accumulation during live stock candlestick rendering.',
      assignedToId: dev2.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: daysFromNow(2),
      isOverdue: false,
    },
  });

  const tFin2 = await prisma.task.create({
    data: {
      projectId: projectFinPulse.id,
      title: 'Implement Biometric TouchID / FaceID Module',
      description: 'Native biometric prompt integration for financial transaction confirmations.',
      assignedToId: dev3.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(5),
      isOverdue: false,
    },
  });

  const tFin3 = await prisma.task.create({
    data: {
      projectId: projectFinPulse.id,
      title: 'Plaid Bank Integration Webhook Handlers',
      description: 'Handle incoming account sync and transaction ledger webhook events securely.',
      assignedToId: dev4.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(1),
      isOverdue: false,
    },
  });

  const tFin4 = await prisma.task.create({
    data: {
      projectId: projectFinPulse.id,
      title: 'Transaction History Virtualized Infinite Scroll',
      description: 'Optimize viewport rendering for account ledgers containing 10,000+ items.',
      assignedToId: dev1.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: daysAgo(2),
      isOverdue: false,
    },
  });

  const tFin5 = await prisma.task.create({
    data: {
      projectId: projectFinPulse.id,
      title: 'Push Notification Registration Service',
      description: 'Register APNS and FCM device tokens for real-time transaction balance alerts.',
      assignedToId: dev2.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: daysFromNow(6),
      isOverdue: false,
    },
  });

  const tFin6 = await prisma.task.create({
    data: {
      projectId: projectFinPulse.id,
      title: 'Cryptographic Key Storage on iOS Keychain & Android Keystore',
      description: 'Hardware-backed encryption for user session private keys.',
      assignedToId: dev3.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.CRITICAL,
      dueDate: daysAgo(5),
      isOverdue: false,
    },
  });

  // --- Project 4: Distributed Cluster Telemetry (5 tasks) ---
  await prisma.task.createMany({
    data: [
      {
        projectId: projectHyper.id,
        title: 'Kafka Dead-Letter Consumer & Retry Queue',
        description: 'Implement backoff retry policy for unparseable telemetry packet streams.',
        assignedToId: dev4.id,
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: daysFromNow(4),
        isOverdue: false,
      },
      {
        projectId: projectHyper.id,
        title: 'Cluster Node Heartbeat Monitor',
        description: 'Track node liveness via UDP ping and trigger automated failovers.',
        assignedToId: dev1.id,
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.CRITICAL,
        dueDate: daysFromNow(2),
        isOverdue: false,
      },
      {
        projectId: projectHyper.id,
        title: 'Prometheus Metrics Exporter Gateway',
        description: 'Expose standard /metrics endpoint with custom latency and memory histograms.',
        assignedToId: dev2.id,
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.MEDIUM,
        dueDate: daysFromNow(1),
        isOverdue: false,
      },
      {
        projectId: projectHyper.id,
        title: 'Distributed Tracing with OpenTelemetry',
        description: 'Inject W3C trace context headers into all outgoing gRPC and HTTP RPCs.',
        assignedToId: dev3.id,
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        dueDate: daysAgo(3),
        isOverdue: false,
      },
      {
        projectId: projectHyper.id,
        title: 'Log Aggregation Elastic Index Lifecycle Rules',
        description: 'Configure hot-warm-cold storage tier rollover for cluster logs.',
        assignedToId: dev4.id,
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        dueDate: daysAgo(6),
        isOverdue: false,
      },
    ],
  });

  console.log('✅ 24 tasks seeded across 4 projects with realistic status distributions');

  // 6. Pre-existing Task Activity Logs with realistic historical timestamps
  await prisma.taskActivityLog.createMany({
    data: [
      {
        taskId: tNova1.id,
        changedById: dev1.id,
        fromStatus: TaskStatus.TODO,
        toStatus: TaskStatus.IN_PROGRESS,
        changedAt: minsAgo(8),
      },
      {
        taskId: tNova5.id,
        changedById: dev1.id,
        fromStatus: TaskStatus.IN_PROGRESS,
        toStatus: TaskStatus.IN_REVIEW,
        changedAt: minsAgo(35),
      },
      {
        taskId: tAcme3.id,
        changedById: dev3.id,
        fromStatus: TaskStatus.TODO,
        toStatus: TaskStatus.IN_PROGRESS,
        changedAt: hoursAgo(2),
      },
      {
        taskId: tAcme2.id,
        changedById: dev2.id,
        fromStatus: TaskStatus.IN_PROGRESS,
        toStatus: TaskStatus.IN_REVIEW,
        changedAt: hoursAgo(5),
      },
      {
        taskId: tFin1.id,
        changedById: dev2.id,
        fromStatus: TaskStatus.TODO,
        toStatus: TaskStatus.IN_PROGRESS,
        changedAt: hoursAgo(9),
      },
      {
        taskId: tFin3.id,
        changedById: dev4.id,
        fromStatus: TaskStatus.IN_PROGRESS,
        toStatus: TaskStatus.IN_REVIEW,
        changedAt: daysAgo(1),
      },
      {
        taskId: tNova6.id,
        changedById: dev2.id,
        fromStatus: TaskStatus.IN_REVIEW,
        toStatus: TaskStatus.DONE,
        changedAt: daysAgo(1),
      },
      {
        taskId: tAcme1.id,
        changedById: dev1.id,
        fromStatus: TaskStatus.IN_REVIEW,
        toStatus: TaskStatus.DONE,
        changedAt: daysAgo(2),
      },
      {
        taskId: tFin4.id,
        changedById: dev1.id,
        fromStatus: TaskStatus.IN_REVIEW,
        toStatus: TaskStatus.DONE,
        changedAt: daysAgo(2),
      },
      {
        taskId: tNova7.id,
        changedById: dev1.id,
        fromStatus: TaskStatus.IN_REVIEW,
        toStatus: TaskStatus.DONE,
        changedAt: daysAgo(3),
      },
    ],
  });

  console.log('✅ Historical Task Activity Logs seeded with realistic timestamp spread');

  // 7. Pre-existing Notification entries (mix of read and unread)
  await prisma.notification.createMany({
    data: [
      {
        userId: dev1.id,
        type: 'TASK_ASSIGNED',
        message: 'You were assigned to task: Biometric SSO Callback Handshake',
        relatedTaskId: tNova1.id,
        isRead: false,
        createdAt: minsAgo(12),
      },
      {
        userId: pm1.id,
        type: 'TASK_IN_REVIEW',
        message: 'Task "Vector Embedding Reduction Layer" moved to In Review by Elena Rostova',
        relatedTaskId: tNova5.id,
        isRead: false,
        createdAt: minsAgo(40),
      },
      {
        userId: pm1.id,
        type: 'TASK_IN_REVIEW',
        message: 'Task "Implement Role-Scoped Task & Project Queries" moved to In Review by Alex Rivera',
        relatedTaskId: tAcme2.id,
        isRead: false,
        createdAt: hoursAgo(5),
      },
      {
        userId: dev2.id,
        type: 'TASK_ASSIGNED',
        message: 'You were assigned to task: Hotfix Memory Leak on Financial Canvas View',
        relatedTaskId: tFin1.id,
        isRead: true,
        createdAt: hoursAgo(10),
      },
      {
        userId: admin.id,
        type: 'SYSTEM_ALERT',
        message: 'Sprint 4 staging build v2.4.1 deployed successfully across all clusters',
        isRead: true,
        createdAt: daysAgo(1),
      },
    ],
  });

  console.log('✅ Notification rows seeded (unread & read entries for instant UI verification)');
  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
