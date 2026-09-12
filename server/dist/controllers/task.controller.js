"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTask = exports.updateTaskStatus = exports.getTaskById = exports.listTasks = exports.getProjectTasks = exports.createTask = void 0;
const client_1 = require("@prisma/client");
const prisma_js_1 = require("../lib/prisma.js");
const index_js_1 = require("../socket/index.js");
const createTask = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { title, description, assignedToId, priority, dueDate, status } = req.body;
        const userRole = req.user.role;
        const userId = req.user.id;
        // Verify parent project exists
        const project = await prisma_js_1.prisma.project.findUnique({
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
        if (userRole !== client_1.Role.ADMIN && project.createdById !== userId) {
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
            const assignee = await prisma_js_1.prisma.user.findUnique({
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
            if (assignee.role !== client_1.Role.DEVELOPER) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_ASSIGNEE_ROLE',
                        message: 'Tasks can only be assigned to users with the DEVELOPER role',
                    },
                });
                return;
            }
        }
        // Atomic transaction: create Task + activity log + notification for developer if assigned
        const { task: createdTask, notification, activityLog } = await prisma_js_1.prisma.$transaction(async (tx) => {
            const task = await tx.task.create({
                data: {
                    projectId,
                    title,
                    description: description ?? null,
                    assignedToId: assignedToId ?? null,
                    priority: priority ?? undefined,
                    status: status ?? client_1.TaskStatus.TODO,
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
            const log = await tx.taskActivityLog.create({
                data: {
                    taskId: task.id,
                    changedById: userId,
                    fromStatus: task.status,
                    toStatus: task.status,
                },
                include: {
                    changedBy: {
                        select: { id: true, name: true, email: true, role: true },
                    },
                },
            });
            let createdNotification = null;
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
            return { task, notification: createdNotification, activityLog: log };
        });
        // Real-time WebSocket emission after successful commit
        (0, index_js_1.broadcastTaskActivity)({
            id: activityLog.id,
            taskId: createdTask.id,
            taskTitle: createdTask.title,
            projectId: createdTask.projectId,
            projectName: createdTask.project.name,
            changedBy: {
                id: activityLog.changedBy.id,
                name: activityLog.changedBy.name,
            },
            fromStatus: activityLog.fromStatus,
            toStatus: activityLog.toStatus,
            changedAt: activityLog.changedAt,
        }, createdTask.assignedToId);
        if (notification && assignedToId) {
            (0, index_js_1.broadcastNotification)(assignedToId, notification);
        }
        res.status(201).json({ task: createdTask });
    }
    catch (error) {
        next(error);
    }
};
exports.createTask = createTask;
const getProjectTasks = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const userRole = req.user.role;
        const userId = req.user.id;
        // Verify parent project exists
        const project = await prisma_js_1.prisma.project.findUnique({
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
        if (userRole === client_1.Role.PM && project.createdById !== userId) {
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
        const where = {
            projectId,
            ...(userRole === client_1.Role.DEVELOPER ? { assignedToId: userId } : {}),
            ...(userRole === client_1.Role.PM ? { project: { createdById: userId } } : {}),
        };
        // Apply dynamic filters if present
        if (status) {
            where.status = status;
        }
        if (priority) {
            where.priority = priority;
        }
        const dueDateFilter = {};
        if (dueBefore) {
            dueDateFilter.lte = new Date(dueBefore);
        }
        if (dueAfter) {
            dueDateFilter.gte = new Date(dueAfter);
        }
        if (Object.keys(dueDateFilter).length > 0) {
            where.dueDate = dueDateFilter;
        }
        // Allow ADMIN / PM to filter by a specific assignee
        if (assignedToId && userRole !== client_1.Role.DEVELOPER) {
            where.assignedToId = assignedToId;
        }
        const [total, tasks] = await Promise.all([
            prisma_js_1.prisma.task.count({ where }),
            prisma_js_1.prisma.task.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getProjectTasks = getProjectTasks;
const listTasks = async (req, res, next) => {
    try {
        const userRole = req.user.role;
        const userId = req.user.id;
        const { status, priority, dueBefore, dueAfter, assignedToId, projectId, isOverdue } = req.query;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        // Database-level role-scoping:
        // - DEVELOPER: ONLY sees tasks assigned to their own user id
        // - PM: sees tasks belonging to projects created by this PM
        // - ADMIN: sees all tasks
        const where = {
            ...(userRole === client_1.Role.DEVELOPER ? { assignedToId: userId } : {}),
            ...(userRole === client_1.Role.PM ? { project: { createdById: userId } } : {}),
        };
        if (projectId) {
            if (userRole === client_1.Role.PM) {
                where.projectId = projectId;
                where.project = { createdById: userId };
            }
            else if (userRole === client_1.Role.ADMIN || userRole === client_1.Role.DEVELOPER) {
                where.projectId = projectId;
            }
        }
        if (status) {
            where.status = status;
        }
        if (priority) {
            where.priority = priority;
        }
        if (isOverdue !== undefined) {
            where.isOverdue = isOverdue === 'true';
        }
        const dueDateFilter = {};
        if (dueBefore) {
            dueDateFilter.lte = new Date(dueBefore);
        }
        if (dueAfter) {
            dueDateFilter.gte = new Date(dueAfter);
        }
        if (Object.keys(dueDateFilter).length > 0) {
            where.dueDate = dueDateFilter;
        }
        if (assignedToId && userRole !== client_1.Role.DEVELOPER) {
            where.assignedToId = assignedToId;
        }
        const [total, tasks] = await Promise.all([
            prisma_js_1.prisma.task.count({ where }),
            prisma_js_1.prisma.task.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.listTasks = listTasks;
const getTaskById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userRole = req.user.role;
        const userId = req.user.id;
        const task = await prisma_js_1.prisma.task.findUnique({
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
        if (userRole === client_1.Role.DEVELOPER && task.assignedToId !== userId) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to view this task',
                },
            });
            return;
        }
        // PM only if they own the parent project
        if (userRole === client_1.Role.PM && task.project.createdById !== userId) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to view tasks outside your created projects',
                },
            });
            return;
        }
        res.status(200).json({ task });
    }
    catch (error) {
        next(error);
    }
};
exports.getTaskById = getTaskById;
const updateTaskStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status: newStatus } = req.body;
        const userRole = req.user.role;
        const userId = req.user.id;
        // For DEVELOPER: reject any unexpected fields in req.body
        if (userRole === client_1.Role.DEVELOPER) {
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
        const task = await prisma_js_1.prisma.task.findUnique({
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
        if (userRole === client_1.Role.DEVELOPER && task.assignedToId !== userId) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'Developers can only update the status of tasks assigned to them',
                },
            });
            return;
        }
        // PM can change status on tasks within their own projects
        if (userRole === client_1.Role.PM && task.project.createdById !== userId) {
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
        const result = await prisma_js_1.prisma.$transaction(async (tx) => {
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
            let pmNotification = null;
            let devNotification = null;
            // If new status is IN_REVIEW, notify the project's PM
            if (newStatus === client_1.TaskStatus.IN_REVIEW && oldStatus !== client_1.TaskStatus.IN_REVIEW) {
                pmNotification = await tx.notification.create({
                    data: {
                        userId: task.project.createdById,
                        type: 'TASK_IN_REVIEW',
                        message: `Task "${task.title}" moved to In Review`,
                        relatedTaskId: task.id,
                    },
                });
            }
            // If status changed by PM/Admin and task is assigned to a developer, notify the developer
            if (task.assignedToId && task.assignedToId !== userId) {
                const statusLabel = newStatus === 'TODO'
                    ? 'To Do'
                    : newStatus === 'IN_PROGRESS'
                        ? 'In Progress'
                        : newStatus === 'IN_REVIEW'
                            ? 'In Review'
                            : 'Done';
                devNotification = await tx.notification.create({
                    data: {
                        userId: task.assignedToId,
                        type: 'TASK_ASSIGNED',
                        message: `Task "${task.title}" status updated to ${statusLabel}`,
                        relatedTaskId: task.id,
                    },
                });
            }
            return { task: updatedTask, activityLog, pmNotification, devNotification };
        });
        // Real-time WebSocket emission after successful transaction commit
        (0, index_js_1.broadcastTaskActivity)({
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
        }, result.task.assignedToId);
        if (result.pmNotification) {
            (0, index_js_1.broadcastNotification)(result.pmNotification.userId, result.pmNotification);
        }
        if (result.devNotification && result.task.assignedToId) {
            (0, index_js_1.broadcastNotification)(result.task.assignedToId, result.devNotification);
        }
        res.status(200).json({ task: result.task, activityLog: result.activityLog });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTaskStatus = updateTaskStatus;
const updateTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, assignedToId, priority, dueDate, status } = req.body;
        const userRole = req.user.role;
        const userId = req.user.id;
        // Role rule: ADMIN or owning PM only — DEVELOPER gets 403
        if (userRole === client_1.Role.DEVELOPER) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'Developers cannot edit task details. Use PATCH /api/tasks/:id/status to update status.',
                },
            });
            return;
        }
        const task = await prisma_js_1.prisma.task.findUnique({
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
        if (userRole === client_1.Role.PM && task.project.createdById !== userId) {
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
            const assignee = await prisma_js_1.prisma.user.findUnique({
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
            if (assignee.role !== client_1.Role.DEVELOPER) {
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
        const result = await prisma_js_1.prisma.$transaction(async (tx) => {
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
            let activityLog = null;
            let pmNotification = null;
            let devNotification = null;
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
                if (status === client_1.TaskStatus.IN_REVIEW && oldStatus !== client_1.TaskStatus.IN_REVIEW) {
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
            (0, index_js_1.broadcastTaskActivity)({
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
            }, result.updated.assignedToId);
        }
        if (result.pmNotification) {
            (0, index_js_1.broadcastNotification)(result.pmNotification.userId, result.pmNotification);
        }
        if (result.devNotification && assignedToId) {
            (0, index_js_1.broadcastNotification)(assignedToId, result.devNotification);
        }
        res.status(200).json({ task: result.updated });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTask = updateTask;
