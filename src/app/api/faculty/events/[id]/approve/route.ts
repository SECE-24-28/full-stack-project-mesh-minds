import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/engagement/notification.service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'FACULTY') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action } = body as { action: 'approve' | 'reject'; rejectionReason?: string };

  const event = await prisma.eventProposal.findUnique({
    where: { id },
    include: { mentorFaculty: { select: { id: true } } },
  });

  if (!event) {
    return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  }

  if (event.mentorFacultyId !== session.user.id) {
    return NextResponse.json({ message: 'Not assigned to mentor this event' }, { status: 403 });
  }

  if (event.status !== 'PENDING_FACULTY_APPROVAL') {
    return NextResponse.json({ message: 'Event not in faculty review status' }, { status: 400 });
  }

  if (action === 'approve') {
    const updated = await prisma.eventProposal.update({
      where: { id },
      data: {
        status: 'PENDING_ADMIN_APPROVAL',
        updatedAt: new Date(),
      },
    });

    await NotificationService.send(
      event.authorId,
      'Faculty Mentor Approved Your Proposal',
      `Faculty mentor approved "${event.title}" — now awaiting admin review.`,
      event.id
    );
    // Notify admin(s)
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    for (const admin of admins) {
      await NotificationService.send(admin.id, 'New Proposal Alert', `"${event.title}" is awaiting your approval.`, event.id);
    }

    return NextResponse.json({ event: updated, message: 'Event approved' });
  }

  if (action === 'reject') {
    const updated = await prisma.eventProposal.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: body.rejectionReason,
        updatedAt: new Date(),
      },
    });

    await NotificationService.send(
      event.authorId,
      'Faculty Mentor Rejected Your Proposal',
      `Faculty mentor rejected "${event.title}". Sorry, will catch up in other events.`,
      event.id
    );

    return NextResponse.json({ event: updated, message: 'Event rejected' });
  }

  return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
}