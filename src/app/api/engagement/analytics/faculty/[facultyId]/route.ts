import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PointsService } from '@/lib/engagement/points.service';

export async function GET(_: Request, { params }: { params: Promise<{ facultyId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'FACULTY' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { facultyId } = await params;

  const [proposals, volunteerSelections, totalPoints] = await Promise.all([
    prisma.eventProposal.findMany({
      where: { authorId: facultyId },
      select: { id: true, title: true, status: true, _count: { select: { votes: true } } },
    }),
    prisma.volunteerApplication.count({
      where: { event: { authorId: facultyId }, status: 'SELECTED' },
    }),
    PointsService.getUserTotalPoints(facultyId),
  ]);

  const accepted = proposals.filter((p) => ['ACCEPTED', 'COMPLETED'].includes(p.status));
  const completed = proposals.filter((p) => p.status === 'COMPLETED');

  return NextResponse.json({
    mentoredEvents: proposals.length,
    approvedProposals: accepted.length,
    volunteerSelections,
    eventSuccessRate: proposals.length > 0 ? Math.round((completed.length / proposals.length) * 100) : 0,
    totalPoints,
    proposals: proposals.map((p) => ({ id: p.id, title: p.title, status: p.status, votes: p._count.votes })),
  });
}
