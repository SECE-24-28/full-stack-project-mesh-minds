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
  if (session.user.role !== 'ADMIN') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { adminRating } = (await request.json()) as { adminRating: number };

  if (!adminRating || adminRating < 1 || adminRating > 10) {
    return NextResponse.json({ message: 'Rating must be between 1 and 10' }, { status: 400 });
  }

  const event = await prisma.eventProposal.findUnique({ where: { id } });

  if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  if (event.status !== 'ACCEPTED') return NextResponse.json({ message: 'Only accepted events can be marked complete' }, { status: 400 });

  if (new Date() < new Date(event.endDate)) {
    return NextResponse.json({ message: 'Event has not ended yet. Cannot mark as completed.' }, { status: 400 });
  }

  const updated = await prisma.eventProposal.update({
    where: { id },
    data: { status: 'COMPLETED', completedAt: new Date(), adminRating },
  });

  // Notify proposer
  await NotificationService.send(
    event.authorId,
    'Event Completed',
    `Your event "${event.title}" has been marked as completed with a rating of ${adminRating}/10.`,
    event.id
  );

  // Notify mentor to submit their rating
  if (event.mentorFacultyId) {
    await NotificationService.send(
      event.mentorFacultyId,
      'Rate Completed Event',
      `Please rate the event "${event.title}" that you mentored (1–10).`,
      event.id
    );
  }

  return NextResponse.json({ event: updated, message: 'Event marked complete' });
}
