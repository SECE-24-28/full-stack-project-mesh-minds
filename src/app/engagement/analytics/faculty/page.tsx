import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { PointsService } from '@/lib/engagement/points.service';
import { FileText, CheckCircle, Users, TrendingUp, Zap } from 'lucide-react';
import { EngagementBarChart, EngagementPieChart } from '@/components/engagement/EngagementCharts';

export default async function FacultyAnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'FACULTY' && session.user.role !== 'ADMIN') redirect('/dashboard');

  const facultyId = session.user.id;

  const [proposals, volunteerSelections, totalPoints] = await Promise.all([
    prisma.eventProposal.findMany({
      where: { authorId: facultyId },
      select: { id: true, title: true, status: true, _count: { select: { votes: true, bookings: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.volunteerApplication.count({
      where: { event: { authorId: facultyId }, status: 'SELECTED' },
    }),
    PointsService.getUserTotalPoints(facultyId),
  ]);

  const approved = proposals.filter((p) => ['ACCEPTED', 'COMPLETED'].includes(p.status)).length;
  const completed = proposals.filter((p) => p.status === 'COMPLETED').length;
  const successRate = proposals.length > 0 ? Math.round((completed / proposals.length) * 100) : 0;

  const statusCounts: Record<string, number> = {};
  for (const p of proposals) statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
  const statusPieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const topVoted = [...proposals].sort((a, b) => b._count.votes - a._count.votes).slice(0, 6).map((p) => ({
    name: p.title.length > 20 ? p.title.slice(0, 20) + '…' : p.title,
    votes: p._count.votes,
  }));

  const kpis = [
    { label: 'Events Mentored', value: proposals.length, icon: FileText, color: 'from-blue-500 to-cyan-500' },
    { label: 'Approved', value: approved, icon: CheckCircle, color: 'from-emerald-500 to-teal-500' },
    { label: 'Volunteers Selected', value: volunteerSelections, icon: Users, color: 'from-violet-500 to-indigo-500' },
    { label: 'Success Rate', value: `${successRate}%`, icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
    { label: 'Total Points', value: totalPoints, icon: Zap, color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <div className="animate-fade-in p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Faculty Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Your event mentorship and engagement metrics</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="role-stat-card rounded-2xl p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{k.label}</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-bold text-white">{k.value}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${k.color}`}>
                <k.icon className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="role-card rounded-2xl p-6">
          <p className="mb-4 font-semibold text-white">Event Status Breakdown</p>
          <EngagementPieChart data={statusPieData} />
        </div>
        <div className="role-card rounded-2xl p-6">
          <p className="mb-4 font-semibold text-white">Most Voted Events</p>
          <EngagementBarChart data={topVoted} dataKey="votes" nameKey="name" color="#8B5CF6" label="Votes" />
        </div>
      </div>
    </div>
  );
}
