import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/engagement/notification.service';
import { PointsService } from '@/lib/engagement/points.service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, rejectionReason } = body as { action: 'approve' | 'reject' | 'complete'; rejectionReason?: string };

  const event = await prisma.eventProposal.findUnique({
    where: { id },
  });

  if (!event) {
    return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  }

  if (action === 'approve') {
    if (event.status !== 'PENDING_ADMIN_APPROVAL') {
      return NextResponse.json({ message: 'Event not in admin approval status' }, { status: 400 });
    }

    const updated = await prisma.eventProposal.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        approvedById: session.user.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    if (event.mentorFacultyId) {
      await prisma.user.update({
        where: { id: event.mentorFacultyId },
        data: { mentoredEventsCount: { increment: 1 } },
      });
    }

    // Award 25 points to proposer for full approval (faculty + admin)
    await PointsService.awardAcceptancePoints(event.authorId);
    await prisma.user.update({ where: { id: event.authorId }, data: { points: { increment: 25 } } });

    await NotificationService.send(
      event.authorId,
      'Admin Approved Your Proposal',
      `Admin approved "${event.title}" — it's now live! You earned 25 points!`,
      event.id
    );
    if (event.mentorFacultyId) {
      await NotificationService.send(
        event.mentorFacultyId,
        'Faculty Mentor Request Received',
        `The event "${event.title}" you mentored has been approved by admin.`,
        event.id
      );
    }

    return NextResponse.json({ event: updated, message: 'Event approved' });
  }

  if (action === 'reject') {
    const updated = await prisma.eventProposal.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'Rejected by admin',
        approvedById: session.user.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await NotificationService.send(
      event.authorId,
      'Admin Rejected Your Proposal',
      `Admin rejected "${event.title}". Sorry, will catch up in other events.`,
      event.id
    );

    return NextResponse.json({ event: updated, message: 'Event rejected' });
  }

  if (action === 'complete') {
    if (event.status !== 'ACCEPTED') {
      return NextResponse.json({ message: 'Only accepted events can be marked complete' }, { status: 400 });
    }

    const updated = await prisma.eventProposal.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await NotificationService.send(
      event.authorId,
      'Event Completed',
      `Your event "${event.title}" has been marked as completed.`,
      event.id
    );

    return NextResponse.json({ event: updated, message: 'Event marked complete' });
  }

  return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
}