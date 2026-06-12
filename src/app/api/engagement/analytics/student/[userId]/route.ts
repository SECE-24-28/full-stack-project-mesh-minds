import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PointsService } from '@/lib/engagement/points.service';

export async function GET(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { userId } = await params;
  if (session.user.id !== userId && session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const [proposals, volunteerApps, bookings, votes, totalPoints, activityHistory] = await Promise.all([
    prisma.eventProposal.findMany({
      where: { authorId: userId },
      select: { id: true, title: true, status: true, createdAt: true, _count: { select: { votes: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.volunteerApplication.findMany({
      where: { studentId: userId },
      include: { event: { select: { title: true, status: true } } },
    }),
    prisma.booking.count({ where: { userId } }),
    prisma.vote.count({ where: { userId } }),
    PointsService.getUserTotalPoints(userId),
    PointsService.getUserHistory(userId),
  ]);

  return NextResponse.json({
    totalEventsProposed: proposals.length,
    acceptedEvents: proposals.filter((p) => ['ACCEPTED', 'COMPLETED'].includes(p.status)).length,
    rejectedEvents: proposals.filter((p) => p.status === 'REJECTED').length,
    votesReceived: proposals.reduce((s, p) => s + p._count.votes, 0),
    votesCast: votes,
    volunteerParticipations: volunteerApps.filter((a) => a.status === 'SELECTED').length,
    registeredEvents: bookings,
    totalPoints,
    activityHistory: activityHistory.map((h) => ({
      id: h.id,
      points: h.points,
      reason: h.reason,
      createdAt: h.createdAt.toISOString(),
    })),
    proposals: proposals.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      votes: p._count.votes,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}
