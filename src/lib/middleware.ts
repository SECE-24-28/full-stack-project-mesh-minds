import { auth } from '@/auth';
import type { Role } from '@prisma/client';

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { user: null, error: 'Unauthorized', status: 401 as const };
  }
  return { user: session.user, error: null, status: null };
}

export async function requireRole(requiredRole: Role) {
  const session = await auth();
  if (!session?.user) {
    return { user: null, error: 'Unauthorized', status: 401 as const };
  }
  if (session.user.role !== requiredRole) {
    return { user: null, error: 'Forbidden', status: 403 as const };
  }
  return { user: session.user, error: null, status: null };
}

export function requireStudent() {
  return requireRole('STUDENT');
}

export function requireFaculty() {
  return requireRole('FACULTY');
}

export function requireAdmin() {
  return requireRole('ADMIN');
}