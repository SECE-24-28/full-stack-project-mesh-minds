import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { FileText, Users, DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';
import { AnalyticsCharts } from '@/components/analytics-charts';

const CATEGORY_COLORS: Record<string, string> = {
  Technical:           '#3B82F6',
  Cultural:            '#EC4899',
  Sports:              '#F97316',
  Workshop:            '#F59E0B',
  Seminar:             '#8B5CF6',
  Hackathon:           '#06B6D4',
  'Community Service': '#10B981',
};

const statusBadge: Record<string, string> = {
  PENDING_FACULTY_APPROVAL: 'badge badge-pending',
  PENDING_ADMIN_APPROVAL:   'badge badge-review',
  ACCEPTED:                 'badge badge-accepted',
  REJECTED:                 'badge badge-rejected',
  COMPLETED:                'badge badge-completed',
};
const statusLabel: Record<string, string> = {
  PENDING_FACULTY_APPROVAL: 'Faculty Review',
  PENDING_ADMIN_APPROVAL:   'Admin Review',
  ACCEPTED:                 'Accepted',
  REJECTED:                 'Rejected',
  COMPLETED:                'Completed',
};

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');

  const [totalProposals, totalUsers, fundingAgg, totalVotes, allProposals, fundingByProposal] = await Promise.all([
    prisma.eventProposal.count(),
    prisma.user.count(),
    prisma.fundingContribution.aggregate({ _sum: { amount: true } }),
    prisma.vote.count(),
    prisma.eventProposal.findMany({
      select: { category: true, status: true, createdAt: true, _count: { select: { votes: true, comments: true } } },
    }),
    prisma.fundingContribution.findMany({
      include: { proposal: { select: { title: true, category: true } } },
    }),
  ]);

  const categoryMap: Record<string, number> = {};
  for (const p of allProposals) categoryMap[p.category] = (categoryMap[p.category] ?? 0) + 1;
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] ?? '#64748B' }));

  const fundingByCat: Record<string, number> = {};
  for (const f of fundingByProposal) {
    const cat = f.proposal.category;
    fundingByCat[cat] = (fundingByCat[cat] ?? 0) + f.amount;
  }
  const fundingChartData = Object.entries(fundingByCat).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 6);

  const statusMap: Record<string, number> = {};
  for (const p of allProposals) statusMap[p.status] = (statusMap[p.status] ?? 0) + 1;
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  const recentProposals = await prisma.eventProposal.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: {
      id: true, title: true, category: true, status: true, createdAt: true, authorId: true,
      _count: { select: { votes: true, comments: true } },
    },
  });

  const authorIds = [...new Set(recentProposals.map((p) => p.authorId))];
  const authors = await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true } });
  const authorMap = Object.fromEntries(authors.map((a) => [a.id, a.name]));

  const totalFunding = fundingAgg._sum.amount ?? 0;

  const kpis = [
    { title: 'Total Proposals', value: totalProposals,                      icon: FileText,   color: '#9FA1FF', trend: '+8%' },
    { title: 'Total Users',     value: totalUsers,                          icon: Users,      color: '#6BB6FF', trend: '+12%' },
    { title: 'Funds Raised',    value: `₹${totalFunding.toLocaleString()}`, icon: DollarSign, color: '#7EDC92', trend: '+5%' },
    { title: 'Total Votes',     value: totalVotes,                          icon: TrendingUp, color: '#F59E0B', trend: '+18%' },
  ];

  const recentList = recentProposals.map((p) => ({
    id: p.id, title: p.title, category: p.category, status: p.status,
    authorName: authorMap[p.authorId] ?? 'Unknown',
    votes: p._count.votes, comments: p._count.comments,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="page-content animate-fade-up" data-role="ADMIN">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Live platform data — proposals, funding, votes, and users</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.title} className="stat-card">
              <div className="flex items-start justify-between mb-4">
                <div className="stat-icon-circle" style={{ background: `${k.color}18` }}>
                  <Icon className="h-5 w-5" style={{ color: k.color }} />
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <ArrowUpRight className="h-3 w-3" />{k.trend}
                </span>
              </div>
              <p className="text-3xl font-bold text-[#0F172A] leading-none">{k.value}</p>
              <p className="text-sm font-medium text-[#64748B] mt-1.5">{k.title}</p>
            </div>
          );
        })}
      </div>

      <AnalyticsCharts categoryData={categoryData} fundingChartData={fundingChartData} statusData={statusData} />

      <div className="saas-table-wrap mt-6">
        <div className="px-6 py-5 border-b border-[#E9ECF5]">
          <p className="section-title">Recent Proposals</p>
          <p className="section-subtitle">Latest submissions across all categories</p>
        </div>
        {recentList.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#94A3B8]">No proposals yet.</p>
        ) : (
          <table className="saas-table">
            <thead>
              <tr>
                <th>Proposal</th><th>Author</th><th>Category</th><th>Votes</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentList.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[p.category] ?? '#94A3B8' }} />
                      <span className="font-medium text-[#1E293B] truncate max-w-[200px]">{p.title}</span>
                    </div>
                  </td>
                  <td className="text-[#64748B]">{p.authorName}</td>
                  <td>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${CATEGORY_COLORS[p.category] ?? '#94A3B8'}15`, color: CATEGORY_COLORS[p.category] ?? '#64748B' }}>
                      {p.category}
                    </span>
                  </td>
                  <td className="font-medium text-[#1E293B]">{p.votes}</td>
                  <td><span className={statusBadge[p.status] ?? 'badge badge-pending'}>{statusLabel[p.status] ?? p.status}</span></td>
                  <td className="text-[#94A3B8]">{new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
