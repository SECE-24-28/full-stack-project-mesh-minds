import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'FACULTY') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const events = await prisma.eventProposal.findMany({
    where: {
      mentorFacultyId: session.user.id,
      status: 'PENDING_FACULTY_APPROVAL',
    },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { name: true, department: true, rollNumber: true } },
      _count: { select: { votes: true } },
    },
  });

  const formatted = events.map((e) => ({
    ...e,
    authorName: e.author.name,
    authorDepartment: e.author.department,
    voteCount: e._count.votes,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
  }));

  return NextResponse.json({ events: formatted });
}