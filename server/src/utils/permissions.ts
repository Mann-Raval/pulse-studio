import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

/**
 * Shared project access verification function.
 * Used by both REST controllers and WebSocket room join handlers.
 */
export async function canAccessProject(
  userId: string,
  role: Role,
  projectId: string
): Promise<{ allowed: boolean; project?: any }> {
  const project = await prisma.project.findUnique({
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
  if (role === Role.ADMIN) {
    return { allowed: true, project };
  }

  // PM can only access projects they created
  if (role === Role.PM) {
    return { allowed: project.createdById === userId, project };
  }

  // DEVELOPER can only access a project if they have assigned tasks in that project
  if (role === Role.DEVELOPER) {
    const hasAssignedTask = await prisma.task.findFirst({
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
