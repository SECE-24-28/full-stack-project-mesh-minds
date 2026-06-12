import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const calendarEvents = await prisma.calendarEvent.findMany({
    where: { userId: session.user.id },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          venue: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      },
    },
    orderBy: { event: { startDate: 'asc' } },
  });

  const formatted = calendarEvents.map((ce) => ({
    id: ce.id,
    userId: ce.userId,
    eventId: ce.eventId,
    roleType: ce.roleType,
    title: ce.event?.title,
    start: ce.event?.startDate.toISOString(),
    end: ce.event?.endDate.toISOString(),
    venue: ce.event?.venue,
    status: ce.event?.status,
  }));

  return NextResponse.json({ events: formatted });
}