import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id: eventId } = await params;

  const event = await prisma.eventProposal.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  }

  const isParticipant = session.user.role === 'STUDENT' && event.status === 'ACCEPTED';
  const isAdmin = session.user.role === 'ADMIN';
  const isFacultyMentor = session.user.role === 'FACULTY' && event.mentorFacultyId === session.user.id;

  if (!isParticipant && !isAdmin && !isFacultyMentor) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const participants = await prisma.registration.findMany({
    where: { eventId },
    include: {
      user: {
        select: {
          name: true,
          rollNumber: true,
          department: true,
        },
      },
    },
    orderBy: { registeredAt: 'desc' },
  });

  const formatted = participants.map((p) => ({
    id: p.id,
    userId: p.userId,
    eventId: p.eventId,
    registeredAt: p.registeredAt.toISOString(),
    userName: p.user.name,
    userRollNumber: p.user.rollNumber,
    userDepartment: p.user.department,
  }));

  return NextResponse.json({ participants: formatted });
}