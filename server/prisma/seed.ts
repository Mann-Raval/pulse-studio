import { PrismaClient, Role, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.taskActivityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('password123', salt);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'admin@pulsestudio.io',
      passwordHash: defaultPasswordHash,
      role: Role.ADMIN,
    },
  });

  const pm = await prisma.user.create({
    data: {
      name: 'Alex Mercer',
      email: 'pm@pulsestudio.io',
      passwordHash: defaultPasswordHash,
      role: Role.PM,
    },
  });

  const dev = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      email: 'dev@pulsestudio.io',
      passwordHash: defaultPasswordHash,
      role: Role.DEVELOPER,
    },
  });

  console.log('✅ Users created:');
  console.log('   - Admin: admin@pulsestudio.io (password: password123)');
  console.log('   - PM:    pm@pulsestudio.io    (password: password123)');
  console.log('   - Dev:   dev@pulsestudio.io   (password: password123)');

  // 2. Create Sample Client
  const client = await prisma.client.create({
    data: {
      name: 'Acme Corporation',
    },
  });

  // 3. Create Sample Project
  const project = await prisma.project.create({
    data: {
      name: 'Pulse Dashboard Overhaul',
      clientId: client.id,
      createdById: pm.id,
    },
  });

  // 4. Create Sample Tasks
  const task1 = await prisma.task.create({
    data: {
      projectId: project.id,
      title: 'Design Database Schema and JWT Auth',
      description: 'Implement PostgreSQL Prisma schema, access/refresh tokens, and role middleware.',
      assignedToId: dev.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  // 5. Create Task Activity Log
  await prisma.taskActivityLog.create({
    data: {
      taskId: task1.id,
      changedById: dev.id,
      fromStatus: TaskStatus.TODO,
      toStatus: TaskStatus.IN_PROGRESS,
    },
  });

  // 6. Create Notification
  await prisma.notification.create({
    data: {
      userId: dev.id,
      type: 'TASK_ASSIGNED',
      message: 'You have been assigned to task: Design Database Schema and JWT Auth',
      relatedTaskId: task1.id,
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
