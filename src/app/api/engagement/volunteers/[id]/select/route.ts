import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PointsService } from '@/lib/engagement/points.service';
import { NotificationService } from '@/lib/engagement/notification.service';

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['FACULTY', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ message: 'Only faculty or admin can select volunteers here' }, { status: 403 });
  }

  const { id } = await params;
  const app = await prisma.volunteerApplication.findUnique({
    where: { id },
    include: { event: { select: { id: true, title: true, authorId: true, mentorFacultyId: true, requiredVolunteers: true } } },
  });
  if (!app) return NextResponse.json({ message: 'Application not found' }, { status: 404 });
  if (app.status !== 'PENDING') return NextResponse.json({ message: 'Application already processed' }, { status: 400 });

  const { event } = app;
  const total = event.requiredVolunteers ?? 0;

  // If event has no mentor (faculty proposed it directly), no quota restriction
  // mentor quota = total - proposerQuota = floor(30% of total), min remaining
  const proposerQuota = total > 0 ? Math.ceil(total * 0.7) : 0;
  const mentorQuota = total > 0 ? total - proposerQuota : Infinity;

  // Check if this faculty is the mentor or admin
  const isMentor = session.user.id === event.mentorFacultyId;
  const isAdmin = session.user.role === 'ADMIN';
  const isProposerFaculty = session.user.role === 'FACULTY' && event.authorId === session.user.id;

  // Faculty who is the proposer can select up to full quota (faculty-proposed event = no split)
  const noSplit = !event.mentorFacultyId || isProposerFaculty;

  if (!noSplit && !isMentor && !isAdmin) {
    return NextResponse.json({ message: 'Only the mentor faculty can select volunteers from this panel' }, { status: 403 });
  }

  if (!noSplit) {
    const mentorSelected = await prisma.volunteerApplication.count({
      where: { eventId: event.id, status: 'SELECTED' },
    });
    if (mentorSelected >= mentorQuota) {
      return NextResponse.json({ message: `Mentor quota of ${mentorQuota} volunteers reached` }, { status: 400 });
    }
  }

  await prisma.volunteerApplication.update({ where: { id }, data: { status: 'SELECTED' } });

  // Add to calendar
  const alreadyInCalendar = await prisma.calendarEvent.findFirst({
    where: { userId: app.studentId, eventId: event.id, roleType: 'VOLUNTEER' },
  });
  if (!alreadyInCalendar) {
    await prisma.calendarEvent.create({ data: { userId: app.studentId, eventId: event.id, roleType: 'VOLUNTEER' } });
  }

  await PointsService.awardVolunteerPoints(app.studentId);
  await NotificationService.send(
    app.studentId,
    'Volunteer Selected!',
    `You have been selected as a volunteer for "${event.title}".`,
    event.id
  );

  // Auto-deny remaining PENDING if total quota now reached
  const totalSelected = await prisma.volunteerApplication.count({
    where: { eventId: event.id, status: { in: ['SELECTED', 'PROPOSER_SELECTED'] } },
  });
  if (total > 0 && totalSelected >= total) {
    const pendingApps = await prisma.volunteerApplication.findMany({
      where: { eventId: event.id, status: 'PENDING' },
      select: { id: true, studentId: true },
    });
    await prisma.volunteerApplication.updateMany({ where: { eventId: event.id, status: 'PENDING' }, data: { status: 'REJECTED' } });
    for (const p of pendingApps) {
      await NotificationService.send(
        p.studentId,
        'Volunteer Application Update',
        `Your volunteer application for "${event.title}" was not selected.`,
        event.id
      );
    }
  }

  return NextResponse.json({ application: { ...app, status: 'SELECTED' } });
}
