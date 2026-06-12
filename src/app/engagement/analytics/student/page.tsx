import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { PointsService } from '@/lib/engagement/points.service';
import { FileText, ThumbsUp, Star, Users, Zap } from 'lucide-react';
import { EngagementBarChart, EngagementPieChart } from '@/components/engagement/EngagementCharts';

export default async function StudentAnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userId = session.user.id;

  const [proposals, volunteerApps, bookings, totalPoints, activityHistory] = await Promise.all([
    prisma.eventProposal.findMany({
      where: { authorId: userId },
      select: { id: true, title: true, status: true, createdAt: true, _count: { select: { votes: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.volunteerApplication.count({ where: { studentId: userId, status: 'SELECTED' } }),
    prisma.booking.count({ where: { userId } }),
    PointsService.getUserTotalPoints(userId),
    PointsService.getUserHistory(userId),
  ]);

  const accepted = proposals.filter((p) => ['ACCEPTED', 'COMPLETED'].includes(p.status)).length;
  const rejected = proposals.filter((p) => p.status === 'REJECTED').length;
  const votesReceived = proposals.reduce((s, p) => s + p._count.votes, 0);

  const statusCounts: Record<string, number> = {};
  for (const p of proposals) {
    statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
  }
  const statusPieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const recentActivity = activityHistory.slice(0, 10).map((h) => ({
    reason: h.reason.length > 25 ? h.reason.slice(0, 25) + '…' : h.reason,
    points: h.points,
  }));

  const kpis = [
    { label: 'Proposals', value: proposals.length, icon: FileText, color: 'from-blue-500 to-cyan-500' },
    { label: 'Accepted', value: accepted, icon: Star, color: 'from-emerald-500 to-teal-500' },
    { label: 'Votes Received', value: votesReceived, icon: ThumbsUp, color: 'from-pink-500 to-rose-500' },
    { label: 'Volunteer Roles', value: volunteerApps, icon: Users, color: 'from-violet-500 to-indigo-500' },
    { label: 'Registered Events', value: bookings, icon: Star, color: 'from-amber-500 to-orange-500' },
    { label: 'Total Points', value: totalPoints, icon: Zap, color: 'from-cyan-500 to-blue-500' },
  ];

  return (
    <div className="animate-fade-in p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Your engagement stats on CampusConnect</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="role-stat-card rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{k.label}</p>
                <p className="mt-2 text-3xl font-bold text-white">{k.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${k.color}`}>
                <k.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="role-card rounded-2xl p-6">
          <p className="mb-4 font-semibold text-white">Proposal Status Breakdown</p>
          <EngagementPieChart data={statusPieData} />
        </div>

        <div className="role-card rounded-2xl p-6">
          <p className="mb-4 font-semibold text-white">Recent Point Activity</p>
          <EngagementBarChart
            data={recentActivity}
            dataKey="points"
            nameKey="reason"
            color="#3B82F6"
            label="Points"
          />
        </div>
      </div>

      <div className="role-card mt-6 rounded-2xl p-6">
        <p className="mb-4 font-semibold text-white">My Proposals ({proposals.length})</p>
        {proposals.length === 0 ? (
          <p className="text-center text-sm text-slate-600">No proposals yet.</p>
        ) : (
          <div className="space-y-2">
            {proposals.slice(0, 8).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">{p.title}</p>
                  <p className="text-xs text-slate-500">{p._count.votes} votes · {new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  p.status === 'ACCEPTED' || p.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                  p.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'
                }`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="role-card mt-6 rounded-2xl p-6">
        <p className="mb-4 font-semibold text-white">Points History</p>
        {activityHistory.length === 0 ? (
          <p className="text-center text-sm text-slate-600">No points yet.</p>
        ) : (
          <div className="space-y-2">
            {activityHistory.slice(0, 10).map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/3 px-4 py-3">
                <p className="text-sm text-slate-300">{h.reason}</p>
                <span className={`text-sm font-bold ${h.points > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {h.points > 0 ? '+' : ''}{h.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
