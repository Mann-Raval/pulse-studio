import cron, { ScheduledTask } from 'node-cron';
import { TaskStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { broadcastTaskOverdue, broadcastNotification } from '../socket/index.js';

/**
 * Checks for tasks whose dueDate has passed, status is not DONE, and isOverdue is false.
 * Flags them as overdue in the database and broadcasts the event via WebSocket.
 */
export async function checkOverdueTasks(): Promise<number> {
  const now = new Date();
  const timestamp = now.toISOString();

  try {
    // Uses composite index [dueDate, status]
    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: {
          lt: now,
        },
        status: {
          not: TaskStatus.DONE,
        },
        isOverdue: false,
      },
      include: {
        project: {
          select: { id: true, name: true, createdById: true },
        },
      },
    });

    if (overdueTasks.length === 0) {
      console.log(`[${timestamp}] ⏱️ [Cron:OverdueTaskChecker] Checked tasks: 0 newly overdue.`);
      return 0;
    }

    console.log(
      `[${timestamp}] ⚠️ [Cron:OverdueTaskChecker] Found ${overdueTasks.length} newly overdue tasks. Updating...`
    );

    let flaggedCount = 0;

    for (const task of overdueTasks) {
      try {
        const updated = await prisma.task.update({
          where: { id: task.id },
          data: { isOverdue: true },
        });

        flaggedCount++;

        // Create in-app Notification for assigned developer or PM
        const targetUserId = task.assignedToId || task.project?.createdById;
        if (targetUserId) {
          const notif = await prisma.notification.create({
            data: {
              userId: targetUserId,
              type: 'TASK_OVERDUE',
              message: `Task "${task.title}" is now overdue`,
              relatedTaskId: task.id,
            },
          });
          broadcastNotification(targetUserId, notif);
        }

        // Broadcast live WebSocket event
        broadcastTaskOverdue(
          {
            taskId: updated.id,
            projectId: updated.projectId,
            taskTitle: updated.title,
            assignedToId: updated.assignedToId,
            dueDate: updated.dueDate,
            isOverdue: true,
          },
          updated.assignedToId
        );
      } catch (err) {
        console.error(`[Cron:OverdueTaskChecker] Failed to update task ${task.id}:`, err);
      }
    }

    console.log(
      `[${timestamp}] ✅ [Cron:OverdueTaskChecker] Successfully flagged ${flaggedCount} tasks as overdue.`
    );
    return flaggedCount;
  } catch (error) {
    console.error(`[${timestamp}] ❌ [Cron:OverdueTaskChecker] Error during overdue task check:`, error);
    return 0;
  }
}

/**
 * Initializes and starts the scheduled overdue task cron job.
 * Runs every 5 minutes: 'star-slash-5 * * * *'
 */
export function startOverdueTaskChecker(): ScheduledTask {
  console.log('⏰ Initializing Overdue Task Background Cron Job (every 5 minutes: */5 * * * *)');

  // Run an initial check on server start as well
  checkOverdueTasks().catch((err) => {
    console.error('[Cron:OverdueTaskChecker] Initial check failed:', err);
  });

  const scheduledJob = cron.schedule('*/5 * * * *', async () => {
    await checkOverdueTasks();
  });

  return scheduledJob;
}
