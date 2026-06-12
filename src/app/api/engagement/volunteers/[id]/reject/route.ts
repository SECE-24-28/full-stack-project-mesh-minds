import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/engagement/notification.service';

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['FACULTY', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ message: 'Only faculty or admin can reject volunteers' }, { status: 403 });
  }

  const { id } = await params;
  const app = await prisma.volunteerApplication.findUnique({
    where: { id },
    include: { event: { select: { title: true } } },
  });
  if (!app) return NextResponse.json({ message: 'Application not found' }, { status: 404 });

  const updated = await prisma.volunteerApplication.update({ where: { id }, data: { status: 'REJECTED' } });

  await NotificationService.send(app.studentId, 'Volunteer Application Update', `Your volunteer application for "${app.event.title}" was not selected.`, app.eventId);

  return NextResponse.json({ application: updated });
}
