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

  // Return all events assigned to this faculty mentor:
  // - PENDING_FACULTY_APPROVAL: awaiting their review
  // - ACCEPTED: approved but still ongoing (stays until faculty rates after completion)
  const events = await prisma.eventProposal.findMany({
    where: {
      mentorFacultyId: session.user.id,
      status: { in: ['PENDING_FACULTY_APPROVAL', 'ACCEPTED'] },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { name: true, department: true, rollNumber: true } },
      _count: { select: { votes: true } },
      fundingContributions: {
        select: { id: true, amount: true, contributor: { select: { name: true } } },
      },
    },
  });

  const formatted = events.map((e) => ({
    ...e,
    authorName: e.author.name,
    authorDepartment: e.author.department,
    voteCount: e._count.votes,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    funding: e.fundingContributions.map((f) => ({
      id: f.id, amount: f.amount, contributor: f.contributor.name,
    })),
  }));

  return NextResponse.json({ events: formatted });
}