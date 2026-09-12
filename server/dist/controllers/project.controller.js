"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.getProjectById = exports.getProjects = exports.createProject = void 0;
const client_1 = require("@prisma/client");
const prisma_js_1 = require("../lib/prisma.js");
const createProject = async (req, res, next) => {
    try {
        const { name, clientId } = req.body;
        const userId = req.user.id;
        // Verify client exists
        const client = await prisma_js_1.prisma.client.findUnique({
            where: { id: clientId },
        });
        if (!client) {
            res.status(404).json({
                error: {
                    code: 'CLIENT_NOT_FOUND',
                    message: 'Referenced client not found',
                },
            });
            return;
        }
        const project = await prisma_js_1.prisma.project.create({
            data: {
                name,
                clientId,
                createdById: userId, // Always set from authenticated user, never from body
            },
            include: {
                client: true,
                createdBy: {
                    select: { id: true, name: true, email: true, role: true },
                },
                _count: {
                    select: { tasks: true },
                },
            },
        });
        res.status(201).json({ project });
    }
    catch (error) {
        next(error);
    }
};
exports.createProject = createProject;
const getProjects = async (req, res, next) => {
    try {
        const userRole = req.user.role;
        const userId = req.user.id;
        // DEVELOPER must never see the list of projects
        if (userRole === client_1.Role.DEVELOPER) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'Developers do not have permission to view projects list',
                },
            });
            return;
        }
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const skip = (page - 1) * limit;
        // Database-level role scoping:
        // ADMIN: see all projects
        // PM: see only projects where createdById == user.id
        const where = userRole === client_1.Role.ADMIN ? {} : { createdById: userId };
        const [total, rawProjects] = await Promise.all([
            prisma_js_1.prisma.project.count({ where }),
            prisma_js_1.prisma.project.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    client: true,
                    createdBy: {
                        select: { id: true, name: true, email: true, role: true },
                    },
                    tasks: {
                        select: {
                            id: true,
                            status: true,
                            isOverdue: true,
                        },
                    },
                    _count: {
                        select: { tasks: true },
                    },
                },
            }),
        ]);
        // Derive project status & statistics
        const projects = rawProjects.map((p) => {
            const totalTasks = p.tasks.length;
            const completedTasks = p.tasks.filter((t) => t.status === 'DONE').length;
            const inProgressTasks = p.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
            const inReviewTasks = p.tasks.filter((t) => t.status === 'IN_REVIEW').length;
            const overdueTasks = p.tasks.filter((t) => t.isOverdue).length;
            let derivedStatus = 'NOT_STARTED';
            if (totalTasks > 0) {
                if (completedTasks === totalTasks) {
                    derivedStatus = 'COMPLETED';
                }
                else if (inReviewTasks > 0) {
                    derivedStatus = 'IN_REVIEW';
                }
                else if (inProgressTasks > 0 || completedTasks > 0) {
                    derivedStatus = 'IN_PROGRESS';
                }
            }
            const { tasks, ...projectWithoutTasks } = p;
            return {
                ...projectWithoutTasks,
                derivedStatus,
                taskStats: {
                    total: totalTasks,
                    completed: completedTasks,
                    inProgress: inProgressTasks,
                    inReview: inReviewTasks,
                    overdue: overdueTasks,
                },
            };
        });
        // Filter by derived status if requested
        const statusFilter = req.query.status;
        const filteredProjects = statusFilter
            ? projects.filter((p) => p.derivedStatus.toUpperCase() === statusFilter.toUpperCase())
            : projects;
        res.status(200).json({
            projects: filteredProjects,
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
exports.getProjects = getProjects;
const getProjectById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userRole = req.user.role;
        const userId = req.user.id;
        const project = await prisma_js_1.prisma.project.findUnique({
            where: { id },
            include: {
                client: true,
                createdBy: {
                    select: { id: true, name: true, email: true, role: true },
                },
                tasks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                        dueDate: true,
                        isOverdue: true,
                        assignedTo: {
                            select: { id: true, name: true, email: true, role: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: { tasks: true },
                },
            },
        });
        // 404 if not found
        if (!project) {
            res.status(404).json({
                error: {
                    code: 'PROJECT_NOT_FOUND',
                    message: 'Project not found',
                },
            });
            return;
        }
        // 403 structured error if requester isn't ADMIN and isn't the project's creator
        if (userRole !== client_1.Role.ADMIN && project.createdById !== userId) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to view this project',
                },
            });
            return;
        }
        res.status(200).json({ project });
    }
    catch (error) {
        next(error);
    }
};
exports.getProjectById = getProjectById;
const updateProject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, clientId } = req.body;
        const userRole = req.user.role;
        const userId = req.user.id;
        const project = await prisma_js_1.prisma.project.findUnique({
            where: { id },
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
        // Only ADMIN or the PM who created it can update
        if (userRole !== client_1.Role.ADMIN && project.createdById !== userId) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to update this project',
                },
            });
            return;
        }
        if (clientId) {
            const client = await prisma_js_1.prisma.client.findUnique({
                where: { id: clientId },
            });
            if (!client) {
                res.status(404).json({
                    error: {
                        code: 'CLIENT_NOT_FOUND',
                        message: 'Referenced client not found',
                    },
                });
                return;
            }
        }
        const updatedProject = await prisma_js_1.prisma.project.update({
            where: { id },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(clientId !== undefined ? { clientId } : {}),
            },
            include: {
                client: true,
                createdBy: {
                    select: { id: true, name: true, email: true, role: true },
                },
                _count: {
                    select: { tasks: true },
                },
            },
        });
        res.status(200).json({ project: updatedProject });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userRole = req.user.role;
        const userId = req.user.id;
        const project = await prisma_js_1.prisma.project.findUnique({
            where: { id },
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
        // Only ADMIN or the PM who created it can delete
        if (userRole !== client_1.Role.ADMIN && project.createdById !== userId) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to delete this project',
                },
            });
            return;
        }
        await prisma_js_1.prisma.project.delete({
            where: { id },
        });
        res.status(200).json({
            message: 'Project deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProject = deleteProject;
