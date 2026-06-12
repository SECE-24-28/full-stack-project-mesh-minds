import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const [
    totalUsers,
    totalStudents,
    totalFaculty,
    totalEvents,
    pendingEvents,
    acceptedEvents,
    rejectedEvents,
    completedEvents,
    acceptedEventList,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'FACULTY' } }),
    prisma.eventProposal.count(),
    prisma.eventProposal.count({ where: { status: 'PENDING_ADMIN_APPROVAL' } }),
    prisma.eventProposal.count({ where: { status: 'ACCEPTED' } }),
    prisma.eventProposal.count({ where: { status: 'REJECTED' } }),
    prisma.eventProposal.count({ where: { status: 'COMPLETED' } }),
    prisma.eventProposal.findMany({
      where: { status: 'ACCEPTED' },
      orderBy: { startDate: 'asc' },
      take: 6,
      select: {
        id: true,
        title: true,
        authorId: true,
        startDate: true,
        _count: { select: { registrations: true } },
      },
    }),
  ]);

  const authorIds = [...new Set(acceptedEventList.map(e => e.authorId))];
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true, role: true },
  });
  const authorMap = Object.fromEntries(authors.map(a => [a.id, { name: a.name, role: a.role }]));

  return NextResponse.json({
    stats: {
      totalUsers,
      totalStudents,
      totalFaculty,
      totalEvents,
      pendingEvents,
      acceptedEvents,
      rejectedEvents,
      completedEvents,
      acceptedEventList: acceptedEventList.map((event) => ({
        id: event.id,
        title: event.title,
        authorName: authorMap[event.authorId]?.name ?? 'Unknown',
        authorRole: authorMap[event.authorId]?.role ?? 'UNKNOWN',
        startDate: event.startDate.toISOString(),
        registrations: event._count.registrations,
      })),
    },
  });
}
