import { cookies } from 'next/headers';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  rollNumber?: string | null;
  year?: number | null;
  section?: string | null;
  employeeId?: string | null;
  department?: string | null;
  profileImage?: string | null;
  points?: number;
  createdEventsCount?: number;
  registeredEventsCount?: number;
  mentoredEventsCount?: number;
}

export interface Session {
  user: SessionUser;
}

const SESSION_COOKIE = 'campus_session';

export async function signIn(credentials: { email: string; password: string }): Promise<Session | null> {
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      passwordHash: true,
      rollNumber: true,
      year: true,
      section: true,
      employeeId: true,
      department: true,
      profileImage: true,
      points: true,
      createdEventsCount: true,
      registeredEventsCount: true,
      mentoredEventsCount: true,
    },
  });
  if (!user) return null;

  const valid = await compare(credentials.password, user.passwordHash);
  if (!valid) return null;

  const { passwordHash: _, ...sessionUser } = user;

  const session: Session = {
    user: sessionUser,
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return session;
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function auth(): Promise<Session | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    return JSON.parse(value) as Session;
  } catch {
    return null;
  }
}
