import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { PointsService } from '@/lib/engagement/points.service';
import { FileText, CheckCircle, Users, TrendingUp, Zap, Award, Star } from 'lucide-react';

export default async function FacultyMyStatsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'FACULTY' && session.user.role !== 'ADMIN') redirect('/dashboard');

  const facultyId = session.user.id;

  const [mentoredProposals, ownProposals, volunteerSelections, totalPoints, activityHistory] = await Promise.all([
    prisma.eventProposal.findMany({
      where: { mentorFacultyId: facultyId },
      select: { id: true, title: true, status: true, createdAt: true, adminRating: true, _count: { select: { votes: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.eventProposal.count({ where: { authorId: facultyId } }),
    prisma.volunteerApplication.count({ where: { event: { mentorFacultyId: facultyId }, status: 'SELECTED' } }),
    PointsService.getUserTotalPoints(facultyId),
    PointsService.getUserHistory(facultyId),
  ]);

  const approved    = mentoredProposals.filter((p) => ['ACCEPTED', 'COMPLETED'].includes(p.status)).length;
  const completed   = mentoredProposals.filter((p) => p.status === 'COMPLETED').length;
  const pending     = mentoredProposals.filter((p) => p.status.startsWith('PENDING')).length;
  const successRate = mentoredProposals.length > 0 ? Math.round((completed / mentoredProposals.length) * 100) : 0;

  const statusConfig: Record<string, { label: string; cls: string }> = {
    ACCEPTED:                 { label: 'Accepted',      cls: 'bg-emerald-100 text-emerald-700' },
    COMPLETED:                { label: 'Completed',     cls: 'bg-blue-100 text-blue-700' },
    REJECTED:                 { label: 'Rejected',      cls: 'bg-red-100 text-red-700' },
    PENDING_FACULTY_APPROVAL: { label: 'Faculty Review',cls: 'bg-amber-100 text-amber-700' },
    PENDING_ADMIN_APPROVAL:   { label: 'Admin Review',  cls: 'bg-purple-100 text-purple-700' },
  };

  return (
    <div className="page-content animate-fade-up">
      <div className="page-header">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--role-soft)' }}>
            <TrendingUp className="h-5 w-5" style={{ color: 'var(--role-accent)' }} />
          </div>
          <div>
            <h1 className="page-title">My Stats</h1>
            <p className="page-subtitle">Your mentorship and engagement overview</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-6">
        {[
          { label: 'Total Points',        value: totalPoints,              gradient: 'from-violet-500 to-indigo-500', icon: <Zap className="h-6 w-6 text-white" /> },
          { label: 'Events Mentored',     value: mentoredProposals.length, gradient: 'from-blue-500 to-cyan-500',     icon: <FileText className="h-6 w-6 text-white" /> },
          { label: 'Approved',            value: approved,                 gradient: 'from-emerald-500 to-teal-500',  icon: <CheckCircle className="h-6 w-6 text-white" /> },
          { label: 'Volunteers Selected', value: volunteerSelections,      gradient: 'from-amber-500 to-orange-500',  icon: <Users className="h-6 w-6 text-white" /> },
          { label: 'Success Rate',        value: `${successRate}%`,        gradient: 'from-pink-500 to-rose-500',     icon: <TrendingUp className="h-6 w-6 text-white" /> },
          { label: 'Own Proposals',       value: ownProposals,             gradient: 'from-sky-500 to-blue-500',      icon: <Award className="h-6 w-6 text-white" /> },
        ].map((k) => (
          <div key={k.label} className="saas-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">{k.label}</p>
                <p className="text-3xl font-bold text-[#0F172A]">{k.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${k.gradient} flex-shrink-0`}>
                {k.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mentored Events Breakdown */}
      {mentoredProposals.length > 0 && (
        <div className="saas-card p-5 mb-6">
          <p className="text-sm font-semibold text-[#0F172A] mb-3">Mentored Events Breakdown</p>
          <div className="grid grid-cols-4 gap-3 text-center">
            {[
              { label: 'Approved',  count: approved,                 cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
              { label: 'Completed', count: completed,                cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
              { label: 'Pending',   count: pending,                  cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
              { label: 'Total',     count: mentoredProposals.length, cls: 'bg-violet-50 text-violet-700 border border-violet-200' },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl p-3 ${s.cls}`}>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mentored Events List */}
        <div className="saas-card p-5">
          <p className="text-sm font-semibold text-[#0F172A] mb-4">Mentored Events ({mentoredProposals.length})</p>
          {mentoredProposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-8 w-8 text-[#CBD5E1] mb-2" />
              <p className="text-sm text-[#94A3B8]">No mentored events yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {mentoredProposals.slice(0, 8).map((p) => {
                const sc = statusConfig[p.status] ?? { label: p.status, cls: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-[#F1F5F9] bg-[#F8F9FC] px-4 py-3 gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{p.title}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        {p._count.votes} votes
                        {p.adminRating != null && (
                          <span className="ml-2 inline-flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-amber-400" />{p.adminRating}/10
                          </span>
                        )}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.cls}`}>{sc.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Points History */}
        <div className="saas-card p-5">
          <p className="text-sm font-semibold text-[#0F172A] mb-4">Points History</p>
          {activityHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Zap className="h-8 w-8 text-[#CBD5E1] mb-2" />
              <p className="text-sm text-[#94A3B8]">No points activity yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activityHistory.slice(0, 10).map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-xl border border-[#F1F5F9] bg-[#F8F9FC] px-4 py-3">
                  <p className="text-sm text-[#475569] truncate flex-1 mr-3">{h.reason}</p>
                  <span className={`flex-shrink-0 text-sm font-bold ${h.points > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {h.points > 0 ? '+' : ''}{h.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
