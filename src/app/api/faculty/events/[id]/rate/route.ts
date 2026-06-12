import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/engagement/notification.service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'FACULTY') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { mentorRating } = (await request.json()) as { mentorRating: number };

  if (!mentorRating || mentorRating < 1 || mentorRating > 10) {
    return NextResponse.json({ message: 'Rating must be between 1 and 10' }, { status: 400 });
  }

  const event = await prisma.eventProposal.findUnique({
    where: { id },
    include: {
      volunteerApplications: { where: { status: 'ACCEPTED' }, select: { studentId: true } },
    },
  });

  if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  if (event.status !== 'COMPLETED') return NextResponse.json({ message: 'Event is not completed yet' }, { status: 400 });
  if (event.mentorFacultyId !== session.user.id) return NextResponse.json({ message: 'You are not the mentor for this event' }, { status: 403 });
  if (event.mentorRating) return NextResponse.json({ message: 'You have already rated this event' }, { status: 400 });

  // Compute final event rating as average of admin + mentor rating
  const eventRating = event.adminRating
    ? Math.round((event.adminRating + mentorRating) / 2)
    : mentorRating;

  await prisma.eventProposal.update({
    where: { id },
    data: { mentorRating, eventRating },
  });

  // Points for proposer: rating * 3 (max 30), minimum 0
  const proposerPoints = eventRating * 3;
  await prisma.$transaction([
    prisma.campusPointTransaction.create({
      data: { userId: event.authorId, points: proposerPoints, reason: `Event "${event.title}" rated ${eventRating}/10` },
    }),
    prisma.user.update({
      where: { id: event.authorId },
      data: { points: { increment: proposerPoints } },
    }),
  ]);

  // Points for each accepted volunteer: rating * 1 (max 10)
  const volunteerPoints = eventRating;
  for (const v of event.volunteerApplications) {
    await prisma.$transaction([
      prisma.campusPointTransaction.create({
        data: { userId: v.studentId, points: volunteerPoints, reason: `Volunteered at "${event.title}" (rated ${eventRating}/10)` },
      }),
      prisma.user.update({
        where: { id: v.studentId },
        data: { points: { increment: volunteerPoints } },
      }),
    ]);
  }

  // Notify proposer of final rating and points
  await NotificationService.send(
    event.authorId,
    'Event Rating Finalised',
    `Your event "${event.title}" received a final rating of ${eventRating}/10. You earned ${proposerPoints} points!`,
    event.id
  );

  return NextResponse.json({ eventRating, message: 'Rating submitted and points awarded' });
}
