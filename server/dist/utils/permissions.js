"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canAccessProject = canAccessProject;
const client_1 = require("@prisma/client");
const prisma_js_1 = require("../lib/prisma.js");
/**
 * Shared project access verification function.
 * Used by both REST controllers and WebSocket room join handlers.
 */
async function canAccessProject(userId, role, projectId) {
    const project = await prisma_js_1.prisma.project.findUnique({
        where: { id: projectId },
        include: {
            client: true,
            createdBy: {
                select: { id: true, name: true, email: true, role: true },
            },
        },
    });
    if (!project) {
        return { allowed: false };
    }
    // ADMIN can access any project
    if (role === client_1.Role.ADMIN) {
        return { allowed: true, project };
    }
    // PM can only access projects they created
    if (role === client_1.Role.PM) {
        return { allowed: project.createdById === userId, project };
    }
    // DEVELOPER can only access a project if they have assigned tasks in that project
    if (role === client_1.Role.DEVELOPER) {
        const hasAssignedTask = await prisma_js_1.prisma.task.findFirst({
            where: {
                projectId,
                assignedToId: userId,
            },
            select: { id: true },
        });
        return { allowed: !!hasAssignedTask, project };
    }
    return { allowed: false };
}
