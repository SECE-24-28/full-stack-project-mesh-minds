import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/engagement/notification.service';
import { PointsService } from '@/lib/engagement/points.service';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const event = await prisma.eventProposal.findUnique({
    where: { id },
    select: { authorId: true, requiredVolunteers: true },
  });
  if (!event) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  if (event.authorId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const applications = await prisma.volunteerApplication.findMany({
    where: { eventId: id },
    include: { student: { select: { name: true, email: true, department: true, rollNumber: true } } },
    orderBy: { createdAt: 'asc' },
  });

  // proposer quota = floor(requiredVolunteers * 0.7), min 1 if requiredVolunteers > 0
  const total = event.requiredVolunteers ?? 0;
  const proposerQuota = total > 0 ? Math.ceil(total * 0.7) : null;
  const selectedByProposer = applications.filter((a) => a.status === 'PROPOSER_SELECTED').length;

  return NextResponse.json({
    applications: applications.map((a) => ({
      id: a.id,
      studentName: a.student.name,
      studentEmail: a.student.email,
      department: a.student.department,
      rollNumber: a.student.rollNumber,
      reason: a.reason,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
    })),
    proposerQuota,
    selectedByProposer,
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id: eventId } = await params;
  const { applicationId, action } = await request.json() as { applicationId: string; action: 'approve' | 'deny' };

  const event = await prisma.eventProposal.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, authorId: true, mentorFacultyId: true, requiredVolunteers: true },
  });
  if (!event) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  if (event.authorId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const app = await prisma.volunteerApplication.findUnique({
    where: { id: applicationId },
    select: { id: true, studentId: true, status: true, eventId: true },
  });
  if (!app || app.eventId !== eventId) return NextResponse.json({ message: 'Application not found' }, { status: 404 });
  if (app.status !== 'PENDING') return NextResponse.json({ message: 'Application already processed' }, { status: 400 });

  const total = event.requiredVolunteers ?? 0;
  // proposer can select ceil(70%) of total volunteers
  const proposerQuota = total > 0 ? Math.ceil(total * 0.7) : Infinity;

  if (action === 'approve') {
    const selectedCount = await prisma.volunteerApplication.count({
      where: { eventId, status: 'PROPOSER_SELECTED' },
    });
    if (selectedCount >= proposerQuota) {
      return NextResponse.json({ message: `You can only select up to ${proposerQuota} volunteers` }, { status: 400 });
    }

    await prisma.volunteerApplication.update({ where: { id: applicationId }, data: { status: 'PROPOSER_SELECTED' } });

    // Add to calendar as VOLUNTEER
    const alreadyInCalendar = await prisma.calendarEvent.findFirst({
      where: { userId: app.studentId, eventId, roleType: 'VOLUNTEER' },
    });
    if (!alreadyInCalendar) {
      await prisma.calendarEvent.create({ data: { userId: app.studentId, eventId, roleType: 'VOLUNTEER' } });
    }

    await PointsService.awardVolunteerPoints(app.studentId);
    await NotificationService.send(
      app.studentId,
      'You Have Been Selected as a Volunteer!',
      `You have been selected as a volunteer for "${event.title}".`,
      eventId
    );

    // Check if proposer quota is now full — auto-deny remaining PENDING
    const newSelectedCount = selectedCount + 1;
    if (newSelectedCount >= proposerQuota) {
      const pendingApps = await prisma.volunteerApplication.findMany({
        where: { eventId, status: 'PENDING' },
        select: { id: true, studentId: true },
      });
      // Only auto-deny if mentor quota is also exhausted (i.e. no mentor to handle remaining)
      // If no mentor, deny all pending
      if (!event.mentorFacultyId) {
        await prisma.volunteerApplication.updateMany({ where: { eventId, status: 'PENDING' }, data: { status: 'REJECTED' } });
        for (const p of pendingApps) {
          await NotificationService.send(
            p.studentId,
            'Volunteer Application Update',
            `Your volunteer application for "${event.title}" was not selected.`,
            eventId
          );
        }
      }
    }
  } else {
    await prisma.volunteerApplication.update({ where: { id: applicationId }, data: { status: 'REJECTED' } });
    await NotificationService.send(
      app.studentId,
      'Volunteer Application Update',
      `Your volunteer application for "${event.title}" was not selected.`,
      eventId
    );
  }

  return NextResponse.json({ success: true });
}
