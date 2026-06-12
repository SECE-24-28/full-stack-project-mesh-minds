import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { FileText, Users, DollarSign, TrendingUp } from 'lucide-react';
import { AnalyticsCharts } from '@/components/analytics-charts';

const CATEGORY_COLORS: Record<string, string> = {
  Technical: '#3B82F6',
  Cultural: '#EC4899',
  Sports: '#F97316',
  Workshop: '#F59E0B',
  Seminar: '#8B5CF6',
  Hackathon: '#06B6D4',
  'Community Service': '#10B981',
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // ── Real DB queries ───────────────────────────────────────────────
  const [
    totalProposals,
    totalUsers,
    fundingAgg,
    totalVotes,
    allProposals,
    fundingByProposal,
  ] = await Promise.all([
    prisma.eventProposal.count(),
    prisma.user.count(),
    prisma.fundingContribution.aggregate({ _sum: { amount: true } }),
    prisma.vote.count(),
    prisma.eventProposal.findMany({
      select: {
        category: true,
        status: true,
        createdAt: true,
        _count: { select: { votes: true, comments: true } },
      },
    }),
    prisma.fundingContribution.findMany({
      include: { proposal: { select: { title: true, category: true } } },
    }),
  ]);

  // ── Category distribution (real) ─────────────────────────────────
  const categoryMap: Record<string, number> = {};
  for (const p of allProposals) {
    categoryMap[p.category] = (categoryMap[p.category] ?? 0) + 1;
  }
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
    color: CATEGORY_COLORS[name] ?? '#64748B',
  }));

  // ── Funding by category (real) ────────────────────────────────────
  const fundingByCat: Record<string, number> = {};
  for (const f of fundingByProposal) {
    const cat = f.proposal.category;
    fundingByCat[cat] = (fundingByCat[cat] ?? 0) + f.amount;
  }
  const fundingChartData = Object.entries(fundingByCat)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  // ── Proposals by status (real) ────────────────────────────────────
  const statusMap: Record<string, number> = {};
  for (const p of allProposals) {
    statusMap[p.status] = (statusMap[p.status] ?? 0) + 1;
  }
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

// ── Recent proposals list (real) ──────────────────────────────────
   const recentProposals = await prisma.eventProposal.findMany({
     orderBy: { createdAt: 'desc' },
     take: 8,
     select: {
       id: true,
       title: true,
       category: true,
       status: true,
       createdAt: true,
       authorId: true,
       _count: { select: { votes: true, comments: true } },
     },
   });

   // Fetch author names separately
   const authorIds = [...new Set(recentProposals.map(p => p.authorId))];
   const authors = await prisma.user.findMany({
     where: { id: { in: authorIds } },
     select: { id: true, name: true },
   });
   const authorMap = Object.fromEntries(authors.map(a => [a.id, a.name]));

   const totalFunding = fundingAgg._sum.amount ?? 0;

   const kpis = [
     { title: 'Total Proposals', value: totalProposals, icon: FileText, gradient: 'from-blue-500 to-cyan-500' },
     { title: 'Total Users', value: totalUsers, icon: Users, gradient: 'from-violet-500 to-indigo-500' },
     { title: 'Funds Raised', value: `$${totalFunding.toLocaleString()}`, icon: DollarSign, gradient: 'from-emerald-500 to-teal-500' },
     { title: 'Total Votes', value: totalVotes, icon: TrendingUp, gradient: 'from-pink-500 to-rose-500' },
   ];

   const recentList = recentProposals.map((p) => ({
     id: p.id,
     title: p.title,
     category: p.category,
     status: p.status,
     authorName: authorMap[p.authorId] ?? 'Unknown',
     votes: p._count.votes,
     comments: p._count.comments,
     createdAt: p.createdAt.toISOString(),
   }));

  return (
    <div className="animate-fade-in p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Live data from your platform — proposals, funding, votes, and users.
        </p>
      </div>

      {/* KPI cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.title} className="role-stat-card group rounded-2xl p-5 transition-all hover:-translate-y-0.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{k.title}</p>
                  <p className="mt-2 text-3xl font-bold text-white">{k.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${k.gradient}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts — client component receives serialisable data */}
      <AnalyticsCharts
        categoryData={categoryData}
        fundingChartData={fundingChartData}
        statusData={statusData}
      />

      {/* Recent proposals table */}
      <div className="role-card mt-6 rounded-2xl p-6">
        <div className="mb-5">
          <p className="font-semibold text-white">Recent Proposals</p>
          <p className="text-xs text-slate-500">Latest submissions across all categories</p>
        </div>
        {recentList.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-600">No proposals yet.</p>
        ) : (
          <div className="space-y-2">
            {recentList.map((p) => (
              <div key={p.id} className="role-card flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ background: CATEGORY_COLORS[p.category] ?? '#64748B' }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">{p.title}</p>
                    <p className="text-xs text-slate-500">
                      by {p.authorName} · {p.votes} votes · {p.comments} comments
                    </p>
                  </div>
                </div>
                <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                  <span className="hidden text-xs text-slate-600 sm:block">{p.category}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(p.status)}`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING_FACULTY_APPROVAL: 'bg-amber-500/20 text-amber-400',
    PENDING_ADMIN_APPROVAL: 'bg-blue-500/20 text-blue-400',
    ACCEPTED: 'bg-emerald-500/20 text-emerald-400',
    REJECTED: 'bg-red-500/20 text-red-400',
    COMPLETED: 'bg-slate-400/20 text-slate-300',
  };
  return map[status] ?? 'bg-slate-500/20 text-slate-400';
}
