import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generatePassCode, generateQRCode } from '@/lib/qrcode';
import { NotificationService } from '@/lib/engagement/notification.service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'STUDENT') {
    return NextResponse.json({ message: 'Only students can register' }, { status: 403 });
  }

  const { id: eventId } = await params;

  const event = await prisma.eventProposal.findUnique({
    where: { id: eventId },
    include: {
      _count: { select: { registrations: true } },
    },
  });

  if (!event) {
    return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  }

  if (event.status !== 'ACCEPTED') {
    return NextResponse.json({ message: 'Event not open for registration' }, { status: 400 });
  }

  if (event.participantLimit && event._count.registrations >= event.participantLimit) {
    return NextResponse.json({ message: 'Event is full' }, { status: 400 });
  }

  const existingRegistration = await prisma.registration.findUnique({
    where: {
      userId_eventId: {
        userId: session.user.id,
        eventId,
      },
    },
  });

  if (existingRegistration) {
    return NextResponse.json({ message: 'Already registered' }, { status: 400 });
  }

  const passCode = generatePassCode();
  const qrCodeUrl = await generateQRCode(passCode);

  const registration = await prisma.registration.create({
    data: {
      userId: session.user.id,
      eventId,
    },
  });

  const epass = await prisma.ePass.create({
    data: {
      eventId,
      studentId: session.user.id,
      passCode,
      qrCodeUrl,
    },
  });

  await prisma.calendarEvent.create({
    data: {
      userId: session.user.id,
      eventId,
      roleType: 'PARTICIPANT',
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { registeredEventsCount: { increment: 1 } },
  });

  await NotificationService.send(
    session.user.id,
    'Event Registration Confirmed',
    `You have successfully registered for "${event.title}". Your e-pass is ready.`,
    eventId
  );

  return NextResponse.json({
    registration: {
      ...registration,
      registeredAt: registration.registeredAt.toISOString(),
    },
    epass: {
      ...epass,
      createdAt: epass.createdAt.toISOString(),
    },
    message: 'Registration successful',
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'STUDENT') {
    return NextResponse.json({ message: 'Only students can cancel registration' }, { status: 403 });
  }

  const { id: eventId } = await params;

  const registration = await prisma.registration.findUnique({
    where: {
      userId_eventId: {
        userId: session.user.id,
        eventId,
      },
    },
  });

  if (!registration) {
    return NextResponse.json({ message: 'Not registered for this event' }, { status: 404 });
  }

  const event = await prisma.eventProposal.findUnique({
    where: { id: eventId },
  });

  if (event?.status === 'COMPLETED' || event?.status === 'REJECTED') {
    return NextResponse.json({ message: 'Cannot cancel registration for completed or rejected events' }, { status: 400 });
  }

  await prisma.registration.delete({
    where: {
      userId_eventId: {
        userId: session.user.id,
        eventId,
      },
    },
  });

  await prisma.ePass.deleteMany({
    where: {
      eventId,
      studentId: session.user.id,
    },
  });

  await prisma.calendarEvent.deleteMany({
    where: {
      eventId,
      userId: session.user.id,
      roleType: 'PARTICIPANT',
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { registeredEventsCount: { decrement: 1 } },
  });

  return NextResponse.json({ message: 'Registration cancelled' });
}
