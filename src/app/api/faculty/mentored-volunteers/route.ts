import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'FACULTY') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const mentoredEvents = await prisma.eventProposal.findMany({
    where: {
      mentorFacultyId: session.user.id,
      status: 'ACCEPTED',
      requiredVolunteers: { gt: 0 },
    },
    select: {
      id: true,
      title: true,
      requiredVolunteers: true,
      volunteerApplications: {
        include: { student: { select: { name: true, department: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  const events = mentoredEvents.map((ev) => {
    const total = ev.requiredVolunteers ?? 0;
    const proposerQuota = total > 0 ? Math.ceil(total * 0.7) : 0;
    const mentorQuota = total - proposerQuota;
    const mentorSelected = ev.volunteerApplications.filter((a) => a.status === 'SELECTED').length;

    return {
      id: ev.id,
      title: ev.title,
      requiredVolunteers: ev.requiredVolunteers,
      mentorQuota,
      mentorSelected,
      volunteerApplications: ev.volunteerApplications.map((a) => ({
        id: a.id,
        studentName: a.student.name,
        department: a.student.department,
        skill: a.skill,
        reason: a.reason,
        status: a.status,
      })),
    };
  });

  return NextResponse.json({ events });
}
