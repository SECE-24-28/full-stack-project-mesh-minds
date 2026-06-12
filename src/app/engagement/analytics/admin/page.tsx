import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { FileText, CheckCircle, XCircle, TrendingUp, Users } from 'lucide-react';
import { EngagementBarChart, EngagementPieChart, EngagementLineChart } from '@/components/engagement/EngagementCharts';

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');

  const [allEvents, volunteerStats, userStats] = await Promise.all([
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
  const acceptanceRatio = total > 0 ? Math.round((accepted / total) * 100) : 0;

  const mostVoted = [...allEvents]
    .sort((a, b) => b._count.votes - a._count.votes)
    .slice(0, 6)
    .map((e) => ({ name: e.title.length > 18 ? e.title.slice(0, 18) + '…' : e.title, votes: e._count.votes }));

  const deptMap: Record<string, number> = {};
  for (const e of allEvents) {
    const dept = e.author.department ?? 'Unknown';
    deptMap[dept] = (deptMap[dept] ?? 0) + 1;
  }
  const deptData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

  const monthlyMap: Record<string, number> = {};
  for (const e of allEvents) {
    const key = e.createdAt.toISOString().slice(0, 7);
    monthlyMap[key] = (monthlyMap[key] ?? 0) + 1;
  }
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  const statusPieData = [
    { name: 'Accepted', value: accepted },
    { name: 'Rejected', value: rejected },
    { name: 'Completed', value: completed },
    { name: 'Pending', value: total - accepted - rejected },
  ].filter((d) => d.value > 0);

  const volunteerPieData = volunteerStats.map((v) => ({ name: v.status, value: v._count }));

  const kpis = [
    { label: 'Total Events', value: total, icon: FileText, color: 'from-blue-500 to-cyan-500' },
    { label: 'Accepted', value: accepted, icon: CheckCircle, color: 'from-emerald-500 to-teal-500' },
    { label: 'Rejected', value: rejected, icon: XCircle, color: 'from-red-500 to-rose-500' },
    { label: 'Acceptance Rate', value: `${acceptanceRatio}%`, icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
    { label: 'Total Users', value: userStats.reduce((s, u) => s + u._count, 0), icon: Users, color: 'from-violet-500 to-indigo-500' },
  ];

  return (
    <div className="animate-fade-in p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Platform-wide engagement and event statistics</p>
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
          <p className="mb-4 font-semibold text-white">Event Status Distribution</p>
          <EngagementPieChart data={statusPieData} />
        </div>
        <div className="role-card rounded-2xl p-6">
          <p className="mb-4 font-semibold text-white">Most Voted Events</p>
          <EngagementBarChart data={mostVoted} dataKey="votes" nameKey="name" color="#3B82F6" label="Votes" />
        </div>
        <div className="role-card rounded-2xl p-6">
          <p className="mb-4 font-semibold text-white">Department Participation</p>
          <EngagementBarChart data={deptData} dataKey="value" nameKey="name" color="#10B981" label="Events" />
        </div>
        <div className="role-card rounded-2xl p-6">
          <p className="mb-4 font-semibold text-white">Volunteer Applications</p>
          <EngagementPieChart data={volunteerPieData} />
        </div>
        <div className="role-card rounded-2xl p-6 lg:col-span-2">
          <p className="mb-4 font-semibold text-white">Monthly Event Trend</p>
          <EngagementLineChart data={monthlyData} dataKey="count" nameKey="month" label="Events" />
        </div>
      </div>

      <div className="role-card mt-6 rounded-2xl p-6">
        <p className="mb-4 font-semibold text-white">Most Voted Events (Top 10)</p>
        <div className="space-y-2">
          {[...allEvents].sort((a, b) => b._count.votes - a._count.votes).slice(0, 10).map((e, i) => (
            <div key={e.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/3 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600">#{i + 1}</span>
                <div>
                  <p className="text-sm font-medium text-slate-200">{e.title}</p>
                  <p className="text-xs text-slate-500">{e.category} · {e.author.department ?? 'Unknown'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-blue-400">{e._count.votes} votes</p>
                <p className="text-xs text-slate-600">{e._count.bookings} bookings</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
