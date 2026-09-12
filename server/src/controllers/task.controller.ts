import { Response, NextFunction } from 'express';
import { Role, TaskStatus, Prisma, Notification } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { broadcastTaskActivity, broadcastNotification } from '../socket/index.js';

export const createTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedToId, priority, dueDate, status } = req.body;
    const userRole = req.user!.role;
    const userId = req.user!.id;

    // Verify parent project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      res.status(404).json({
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found',
        },
      });
      return;
    }

    // Role check: ADMIN or PM who owns this project only
    if (userRole !== Role.ADMIN && project.createdById !== userId) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to create tasks in this project',
        },
      });
      return;
    }

    // If assignedToId is provided, verify assignee exists and is a DEVELOPER
    if (assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId },
      });

      if (!assignee) {
        res.status(404).json({
          error: {
            code: 'ASSIGNEE_NOT_FOUND',
            message: 'Assigned user was not found',
          },
        });
        return;
      }

      if (assignee.role !== Role.DEVELOPER) {
        res.status(400).json({
          error: {
            code: 'INVALID_ASSIGNEE_ROLE',
            message: 'Tasks can only be assigned to users with the DEVELOPER role',
          },
        });
        return;
      }
    }

    // Atomic transaction: create Task + create Notification for developer if assigned
    const { task: createdTask, notification } = await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          projectId,
          title,
          description: description ?? null,
          assignedToId: assignedToId ?? null,
          priority: priority ?? undefined,
          status: status ?? TaskStatus.TODO,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          project: {
            select: { id: true, name: true, createdById: true },
          },
        },
      });

      let createdNotification: Notification | null = null;
      if (assignedToId) {
        createdNotification = await tx.notification.create({
          data: {
            userId: assignedToId,
            type: 'TASK_ASSIGNED',
            message: `You were assigned Task: "${task.title}"`,
            relatedTaskId: task.id,
          },
        });
      }

      return { task, notification: createdNotification };
    });

    // Real-time WebSocket emission after successful commit
    if (notification && assignedToId) {
      broadcastNotification(assignedToId, notification);
    }

    res.status(201).json({ task: createdTask });
  } catch (error) {
    next(error);
  }
};

export const getProjectTasks = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userRole = req.user!.role;
    const userId = req.user!.id;

    // Verify parent project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      res.status(404).json({
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found',
        },
      });
      return;
    }

    // Role check on project access:
    // PM can only access tasks of projects they created
    if (userRole === Role.PM && project.createdById !== userId) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view tasks for this project',
        },
      });
      return;
    }

    const { status, priority, dueBefore, dueAfter, assignedToId } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Build database-level role-scoping where-clause dynamically:
    // - ADMIN: sees all tasks in project
    // - PM: sees all tasks in project they created (verified above and scoped here)
    // - DEVELOPER: ONLY sees tasks assigned to their own user id
    const where: Prisma.TaskWhereInput = {
      projectId,
      ...(userRole === Role.DEVELOPER ? { assignedToId: userId } : {}),
      ...(userRole === Role.PM ? { project: { createdById: userId } } : {}),
    };

    // Apply dynamic filters if present
    if (status) {
      where.status = status as TaskStatus;
    }

    if (priority) {
      where.priority = priority as any;
    }

    const dueDateFilter: Prisma.DateTimeNullableFilter = {};
    if (dueBefore) {
      dueDateFilter.lte = new Date(dueBefore as string);
    }
    if (dueAfter) {
      dueDateFilter.gte = new Date(dueAfter as string);
    }
    if (Object.keys(dueDateFilter).length > 0) {
      where.dueDate = dueDateFilter;
    }

    // Allow ADMIN / PM to filter by a specific assignee
    if (assignedToId && userRole !== Role.DEVELOPER) {
      where.assignedToId = assignedToId as string;
    }

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          project: {
            select: { id: true, name: true, createdById: true },
          },
          _count: {
            select: { activityLogs: true },
          },
        },
      }),
    ]);

    res.status(200).json({
      tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user!.role;
    const userId = req.user!.id;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            client: true,
            createdBy: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        activityLogs: {
          orderBy: { changedAt: 'desc' },
          include: {
            changedBy: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
      },
    });

    if (!task) {
      res.status(404).json({
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found',
        },
      });
      return;
    }

    // Role scoping:
    // DEVELOPER can only fetch if assignedToId is theirs
    if (userRole === Role.DEVELOPER && task.assignedToId !== userId) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this task',
        },
      });
      return;
    }

    // PM only if they own the parent project
    if (userRole === Role.PM && task.project.createdById !== userId) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view tasks outside your created projects',
        },
      });
      return;
    }

    res.status(200).json({ task });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;
    const userRole = req.user!.role;
    const userId = req.user!.id;

    // For DEVELOPER: reject any unexpected fields in req.body
    if (userRole === Role.DEVELOPER) {
      const keys = Object.keys(req.body);
      const invalidKeys = keys.filter((k) => k !== 'status');
      if (invalidKeys.length > 0) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: `Developers can only update task status. Forbidden fields: ${invalidKeys.join(', ')}`,
          },
        });
        return;
      }
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!task) {
      res.status(404).json({
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found',
        },
      });
      return;
    }

    // Role-scoping checks:
    // DEVELOPER can only change status on tasks assigned to them
    if (userRole === Role.DEVELOPER && task.assignedToId !== userId) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Developers can only update the status of tasks assigned to them',
        },
      });
      return;
    }

    // PM can change status on tasks within their own projects
    if (userRole === Role.PM && task.project.createdById !== userId) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update tasks outside your created projects',
        },
      });
      return;
    }

    const oldStatus = task.status;

    // Transaction:
    // 1. Update task.status
    // 2. Insert TaskActivityLog row
    // 3. If newStatus is IN_REVIEW, create Notification for PM (project.createdById)
    const result = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          status: newStatus,
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          project: {
            select: { id: true, name: true, createdById: true },
          },
        },
      });

      const activityLog = await tx.taskActivityLog.create({
        data: {
          taskId: task.id,
          changedById: userId,
          fromStatus: oldStatus,
          toStatus: newStatus,
        },
        include: {
          changedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      let pmNotification: Notification | null = null;
      // If new status is IN_REVIEW, notify the project's PM
      if (newStatus === TaskStatus.IN_REVIEW && oldStatus !== TaskStatus.IN_REVIEW) {
        pmNotification = await tx.notification.create({
          data: {
            userId: task.project.createdById,
            type: 'TASK_IN_REVIEW',
            message: `Task "${task.title}" moved to In Review`,
            relatedTaskId: task.id,
          },
        });
      }

      return { task: updatedTask, activityLog, pmNotification };
    });

    // Real-time WebSocket emission after successful transaction commit
    broadcastTaskActivity(
      {
        id: result.activityLog.id,
        taskId: result.task.id,
        taskTitle: result.task.title,
        projectId: result.task.projectId,
        projectName: result.task.project.name,
        changedBy: {
          id: result.activityLog.changedBy.id,
          name: result.activityLog.changedBy.name,
        },
        fromStatus: result.activityLog.fromStatus,
        toStatus: result.activityLog.toStatus,
        changedAt: result.activityLog.changedAt,
      },
      result.task.assignedToId
    );

    if (result.pmNotification) {
      broadcastNotification(result.pmNotification.userId, result.pmNotification);
    }

    res.status(200).json({ task: result.task, activityLog: result.activityLog });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, assignedToId, priority, dueDate, status } = req.body;
    const userRole = req.user!.role;
    const userId = req.user!.id;

    // Role rule: ADMIN or owning PM only — DEVELOPER gets 403
    if (userRole === Role.DEVELOPER) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message:
            'Developers cannot edit task details. Use PATCH /api/tasks/:id/status to update status.',
        },
      });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!task) {
      res.status(404).json({
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found',
        },
      });
      return;
    }

    // Owning PM check
    if (userRole === Role.PM && task.project.createdById !== userId) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to edit tasks outside your created projects',
        },
      });
      return;
    }

    // If assignedToId is provided, verify assignee exists and is a DEVELOPER
    if (assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId },
      });

      if (!assignee) {
        res.status(404).json({
          error: {
            code: 'ASSIGNEE_NOT_FOUND',
            message: 'Assigned user was not found',
          },
        });
        return;
      }

      if (assignee.role !== Role.DEVELOPER) {
        res.status(400).json({
          error: {
            code: 'INVALID_ASSIGNEE_ROLE',
            message: 'Tasks can only be assigned to users with the DEVELOPER role',
          },
        });
        return;
      }
    }

    const oldStatus = task.status;
    const oldAssigneeId = task.assignedToId;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(assignedToId !== undefined ? { assignedToId } : {}),
          ...(priority !== undefined ? { priority } : {}),
          ...(status !== undefined ? { status } : {}),
          ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          project: {
            select: { id: true, name: true, createdById: true },
          },
        },
      });

      let activityLog: any = null;
      let pmNotification: Notification | null = null;
      let devNotification: Notification | null = null;

      // If status changed, log activity and send PM notification if IN_REVIEW
      if (status !== undefined && status !== oldStatus) {
        activityLog = await tx.taskActivityLog.create({
          data: {
            taskId: task.id,
            changedById: userId,
            fromStatus: oldStatus,
            toStatus: status,
          },
          include: {
            changedBy: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        });

        if (status === TaskStatus.IN_REVIEW && oldStatus !== TaskStatus.IN_REVIEW) {
          pmNotification = await tx.notification.create({
            data: {
              userId: task.project.createdById,
              type: 'TASK_IN_REVIEW',
              message: `Task "${updated.title}" moved to In Review`,
              relatedTaskId: task.id,
            },
          });
        }
      }

      // If assigned to a new developer, create notification
      if (assignedToId && assignedToId !== oldAssigneeId) {
        devNotification = await tx.notification.create({
          data: {
            userId: assignedToId,
            type: 'TASK_ASSIGNED',
            message: `You were assigned Task: "${updated.title}"`,
            relatedTaskId: task.id,
          },
        });
      }

      return { updated, activityLog, pmNotification, devNotification };
    });

    // Real-time WebSocket emission after successful transaction commit
    if (result.activityLog) {
      broadcastTaskActivity(
        {
          id: result.activityLog.id,
          taskId: result.updated.id,
          taskTitle: result.updated.title,
          projectId: result.updated.projectId,
          projectName: result.updated.project.name,
          changedBy: {
            id: result.activityLog.changedBy.id,
            name: result.activityLog.changedBy.name,
          },
          fromStatus: result.activityLog.fromStatus,
          toStatus: result.activityLog.toStatus,
          changedAt: result.activityLog.changedAt,
        },
        result.updated.assignedToId
      );
    }

    if (result.pmNotification) {
      broadcastNotification(result.pmNotification.userId, result.pmNotification);
    }

    if (result.devNotification && assignedToId) {
      broadcastNotification(assignedToId, result.devNotification);
    }

    res.status(200).json({ task: result.updated });
  } catch (error) {
    next(error);
  }
};
