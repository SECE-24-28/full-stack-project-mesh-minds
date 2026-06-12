import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// POST /api/admin/remind  body: { eventId }
// Toggles remind-me: adds/removes a CalendarEvent entry for the admin
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const { eventId } = await request.json();

  const existing = await prisma.calendarEvent.findFirst({
    where: { userId: session.user.id, eventId, roleType: 'PARTICIPANT' },
  });

  if (existing) {
    await prisma.calendarEvent.delete({ where: { id: existing.id } });
    return NextResponse.json({ reminded: false });
  }

  await prisma.calendarEvent.create({
    data: { userId: session.user.id, eventId, roleType: 'PARTICIPANT' },
  });
  return NextResponse.json({ reminded: true });
}
