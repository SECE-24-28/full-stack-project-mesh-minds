import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const [allEvents, volunteerStats, userCount] = await Promise.all([
    prisma.eventProposal.findMany({
      select: {
        id: true, title: true, status: true, category: true, createdAt: true,
        author: { select: { department: true } },
        _count: { select: { votes: true, bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.volunteerApplication.groupBy({ by: ['status'], _count: true }),
    prisma.user.groupBy({ by: ['role'], _count: true }),
  ]);

  const total = allEvents.length;
  const accepted = allEvents.filter((e) => ['ACCEPTED', 'COMPLETED'].includes(e.status)).length;
  const rejected = allEvents.filter((e) => e.status === 'REJECTED').length;
  const completed = allEvents.filter((e) => e.status === 'COMPLETED').length;

  const mostVoted = [...allEvents]
    .sort((a, b) => b._count.votes - a._count.votes)
    .slice(0, 5)
    .map((e) => ({ eventId: e.id, eventTitle: e.title, voteCount: e._count.votes }));

  const deptMap: Record<string, number> = {};
  for (const e of allEvents) {
    const dept = e.author.department ?? 'Unknown';
    deptMap[dept] = (deptMap[dept] ?? 0) + 1;
  }
  const departmentParticipation = Object.entries(deptMap).map(([department, count]) => ({ department, count }));

  const monthlyMap: Record<string, number> = {};
  for (const e of allEvents) {
    const key = e.createdAt.toISOString().slice(0, 7);
    monthlyMap[key] = (monthlyMap[key] ?? 0) + 1;
  }
  const monthlyEventStatistics = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  return NextResponse.json({
    totalEvents: total,
    acceptedEvents: accepted,
    rejectedEvents: rejected,
    completedEvents: completed,
    acceptanceRatio: total > 0 ? Math.round((accepted / total) * 100) : 0,
    mostVotedEvents: mostVoted,
    departmentParticipation,
    volunteerStatistics: volunteerStats.map((v) => ({ status: v.status, count: v._count })),
    monthlyEventStatistics,
    userEngagementMetrics: userCount.map((u) => ({ role: u.role, count: u._count })),
  });
}
