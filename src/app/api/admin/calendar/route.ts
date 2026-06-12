import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const [events, reminders] = await Promise.all([
    prisma.eventProposal.findMany({
      where: { status: { in: ['ACCEPTED', 'COMPLETED'] } },
      select: { id: true, title: true, startDate: true, endDate: true, status: true },
      orderBy: { startDate: 'asc' },
    }),
    prisma.calendarEvent.findMany({
      where: { userId: session.user.id, roleType: 'PARTICIPANT' },
      select: { eventId: true },
    }),
  ]);

  const remindedSet = new Set(reminders.map((r) => r.eventId));

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.startDate.toISOString(),
      end: e.endDate.toISOString(),
      status: e.status,
      reminded: remindedSet.has(e.id),
    })),
  });
}
