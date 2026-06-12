import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PointsService } from '@/lib/engagement/points.service';
import { NotificationService } from '@/lib/engagement/notification.service';

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['FACULTY', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ message: 'Only faculty or admin can select volunteers' }, { status: 403 });
  }

  const { id } = await params;
  const app = await prisma.volunteerApplication.findUnique({
    where: { id },
    include: { event: { select: { title: true } } },
  });
  if (!app) return NextResponse.json({ message: 'Application not found' }, { status: 404 });

  const updated = await prisma.volunteerApplication.update({ where: { id }, data: { status: 'SELECTED' } });

  await PointsService.awardVolunteerPoints(app.studentId);
  await NotificationService.send(app.studentId, 'Volunteer Selected!', `You have been selected as a volunteer for "${app.event.title}".`, app.eventId);

  return NextResponse.json({ application: updated });
}
