import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/engagement/notification.service';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'STUDENT') return NextResponse.json({ message: 'Only students can register for events' }, { status: 403 });

  const { id } = await params;
  const userId = session.user.id;

  const event = await prisma.eventProposal.findUnique({
    where: { id },
    select: { id: true, title: true, status: true, participantLimit: true, authorId: true, _count: { select: { registrations: true } } },
  });

  if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });

  if (!['ACCEPTED', 'PENDING_FACULTY_APPROVAL', 'PENDING_ADMIN_APPROVAL'].includes(event.status)) {
    return NextResponse.json({ message: 'Registration is not open for this event' }, { status: 400 });
  }

  const existing = await prisma.registration.findUnique({
    where: { userId_eventId: { userId, eventId: id } },
  });

  if (existing) {
    // Unregister
    await prisma.$transaction([
      prisma.registration.delete({ where: { userId_eventId: { userId, eventId: id } } }),
      prisma.user.update({ where: { id: userId }, data: { registeredEventsCount: { decrement: 1 } } }),
    ]);
    return NextResponse.json({ registered: false, registrationCount: event._count.registrations - 1 });
  }

  // Check participant limit
  if (event.participantLimit && event._count.registrations >= event.participantLimit) {
    return NextResponse.json({ message: 'This event has reached its participant limit' }, { status: 400 });
  }

  const alreadyInCalendar = await prisma.calendarEvent.findFirst({ where: { userId, eventId: id, roleType: 'PARTICIPANT' } });

  const newCount = event._count.registrations + 1;

  await prisma.$transaction([
    prisma.registration.create({ data: { userId, eventId: id } }),
    prisma.user.update({ where: { id: userId }, data: { registeredEventsCount: { increment: 1 } } }),
    ...(alreadyInCalendar ? [] : [prisma.calendarEvent.create({ data: { userId, eventId: id, roleType: 'PARTICIPANT' } })]),
  ]);

  // Notify proposer: short message, milestone every 10
  if (newCount % 10 === 0) {
    await NotificationService.send(
      event.authorId,
      'Registration Milestone',
      `${newCount} members have registered for "${event.title}"!`,
      id
    );
  } else {
    await NotificationService.send(
      event.authorId,
      'New Registration',
      `A new student registered for "${event.title}".`,
      id
    );
  }

  return NextResponse.json({ registered: true, registrationCount: newCount });
}
