import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  FileText, ThumbsUp, Ticket, Users, Clock, CheckCircle,
  Star, Calendar, XCircle, TrendingUp, ArrowUpRight,
  Activity, Zap, BarChart2,
} from 'lucide-react';

function StatCard({
  title, value, icon: Icon, color, subtitle, trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  trend?: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div
          className="stat-icon-circle"
          style={{ background: `${color}18` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <ArrowUpRight className="h-3 w-3" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-[#0F172A] leading-none">{value}</p>
      <p className="text-sm font-medium text-[#64748B] mt-1.5">{title}</p>
      {subtitle && <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>}
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="saas-card p-6">
      <div className="mb-5">
        <p className="section-title">{title}</p>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const statusBadge: Record<string, string> = {
  PENDING_FACULTY_APPROVAL: 'badge badge-pending',
  PENDING_ADMIN_APPROVAL: 'badge badge-review',
  ACCEPTED: 'badge badge-accepted',
  REJECTED: 'badge badge-rejected',
  COMPLETED: 'badge badge-completed',
};
const statusLabel: Record<string, string> = {
  PENDING_FACULTY_APPROVAL: 'Faculty Review',
  PENDING_ADMIN_APPROVAL: 'Admin Review',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { role, id: userId, name } = session.user;

  // ── STUDENT ──────────────────────────────────────────────────────
  if (role === 'STUDENT') {
    const { rollNumber, year, section, department } = session.user;

    const [proposalCount, voteCount, bookingCount, recentProposals, upcomingEvents] = await Promise.all([
      prisma.eventProposal.count({ where: { authorId: userId } }),
      prisma.vote.count({ where: { userId } }),
      prisma.booking.count({ where: { userId, status: 'CONFIRMED' } }),
      prisma.eventProposal.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, status: true, category: true, _count: { select: { votes: true } } },
      }),
      prisma.eventProposal.findMany({
        where: { status: 'ACCEPTED', startDate: { gt: new Date() } },
        orderBy: { startDate: 'asc' },
        take: 5,
        include: { author: { select: { name: true } }, _count: { select: { registrations: true } } },
      }),
    ]);

    const yearLabels = ['I', 'II', 'III', 'IV'];
    const yearDisplay = year ? yearLabels[year - 1] + ' Year' : '—';

    return (
      <div className="page-content animate-fade-up" data-role="STUDENT">
        {/* Header */}
        <div className="page-header flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="role-tag">
                <Zap className="h-3 w-3" />
                Student Portal
              </span>
            </div>
            <h1 className="page-title">Welcome back, {name} 👋</h1>
            <p className="page-subtitle mt-1">
              {department} · {yearDisplay} · Section {section || '—'} · Roll {rollNumber || '—'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-[#E9ECF5] bg-white text-sm text-[#64748B]">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Member
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-7">
          <StatCard title="Proposals Submitted" value={proposalCount} icon={FileText} color="#6BB6FF" subtitle="All time" trend="+2" />
          <StatCard title="Votes Cast"           value={voteCount}    icon={ThumbsUp}  color="#7EDC92" subtitle="Community support" />
          <StatCard title="Tickets Booked"       value={bookingCount} icon={Ticket}    color="#9FA1FF" subtitle="Confirmed bookings" />
        </div>

        {/* Two Column */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SectionCard title="Upcoming Events" subtitle="Accepted events you can register for">
            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-12 w-12 rounded-2xl bg-[#EEF4FF] flex items-center justify-center mb-3">
                  <Calendar className="h-6 w-6 text-[#6BB6FF]" />
                </div>
                <p className="font-medium text-[#1E293B]">No upcoming events</p>
                <p className="text-sm text-[#94A3B8] mt-1">Accepted events will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#F1F5F9] hover:border-[#E9ECF5] hover:bg-[#FAFBFF] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-[#EEF4FF] flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-4 w-4 text-[#6BB6FF]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1E293B] leading-none">{event.title}</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">
                          {event.author.name} · {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                      {event._count.registrations} registered
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="My Proposals" subtitle="Track your event proposal status">
            {recentProposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-12 w-12 rounded-2xl bg-[#EEF4FF] flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6 text-[#6BB6FF]" />
                </div>
                <p className="font-medium text-[#1E293B]">No proposals yet</p>
                <p className="text-sm text-[#94A3B8] mt-1">Create your first event proposal</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentProposals.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#F1F5F9] hover:border-[#E9ECF5] hover:bg-[#FAFBFF] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-[#EEF4FF] flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-[#6BB6FF]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1E293B] leading-none">{p.title}</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">{p._count.votes} votes · {p.category}</p>
                      </div>
                    </div>
                    <span className={statusBadge[p.status] ?? 'badge badge-pending'}>
                      {statusLabel[p.status] ?? p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    );
  }

  // ── FACULTY ───────────────────────────────────────────────────────
  if (role === 'FACULTY') {
    const { employeeId, department } = session.user;

    const [pending, approved, completed, recentPending] = await Promise.all([
      prisma.eventProposal.count({ where: { mentorFacultyId: userId, status: 'PENDING_FACULTY_APPROVAL' } }),
      prisma.eventProposal.count({ where: { status: 'ACCEPTED' } }),
      prisma.eventProposal.count({ where: { status: 'COMPLETED' } }),
      prisma.eventProposal.findMany({
        where: { mentorFacultyId: userId, status: 'PENDING_FACULTY_APPROVAL' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { author: { select: { name: true } }, _count: { select: { votes: true } } },
      }),
    ]);

    return (
      <div className="page-content animate-fade-up" data-role="FACULTY">
        <div className="page-header flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="role-tag">
                <Activity className="h-3 w-3" />
                Faculty Portal
              </span>
            </div>
            <h1 className="page-title">Welcome back, {name} 👋</h1>
            <p className="page-subtitle">{department} · Employee ID: {employeeId || '—'}</p>
          </div>
          {pending > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-sm text-amber-700">
              <Clock className="h-4 w-4" />
              {pending} awaiting review
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-7">
          <StatCard title="Pending Review"   value={pending}   icon={Clock}        color="#F59E0B" subtitle="Need attention" />
          <StatCard title="Approved Events"  value={approved}  icon={CheckCircle}  color="#7EDC92" subtitle="Active & published" />
          <StatCard title="Completed Events" value={completed} icon={Star}         color="#9FA1FF" subtitle="Successfully held" />
        </div>

        <SectionCard title="Pending Reviews" subtitle="Proposals assigned to you for review">
          {recentPending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-12 w-12 rounded-2xl bg-[#EAFBEE] flex items-center justify-center mb-3">
                <CheckCircle className="h-6 w-6 text-[#7EDC92]" />
              </div>
              <p className="font-medium text-[#1E293B]">All caught up!</p>
              <p className="text-sm text-[#94A3B8] mt-1">No proposals pending your review</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentPending.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#F1F5F9] hover:border-[#E9ECF5] hover:bg-[#F8FFF9] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#EAFBEE] flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-[#7EDC92]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B] leading-none">{p.title}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">by {p.author.name} · {p._count.votes} votes</p>
                    </div>
                  </div>
                  <span className="badge badge-pending">Under Review</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    );
  }

  // ── ADMIN ─────────────────────────────────────────────────────────
  const [userCount, studentCount, facultyCount, eventCount, pendingCount, acceptedCount, rejectedCount, completedCount, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'FACULTY' } }),
    prisma.eventProposal.count(),
    prisma.eventProposal.count({ where: { status: 'PENDING_ADMIN_APPROVAL' } }),
    prisma.eventProposal.count({ where: { status: 'ACCEPTED' } }),
    prisma.eventProposal.count({ where: { status: 'REJECTED' } }),
    prisma.eventProposal.count({ where: { status: 'COMPLETED' } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
  ]);

  const roleBadge: Record<string, string> = {
    STUDENT: 'badge badge-review',
    FACULTY: 'badge badge-accepted',
    ADMIN: 'badge badge-completed',
  };

  return (
    <div className="page-content animate-fade-up" data-role="ADMIN">
      <div className="page-header flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="role-tag">
              <BarChart2 className="h-3 w-3" />
              Admin Control Center
            </span>
          </div>
          <h1 className="page-title">System Overview</h1>
          <p className="page-subtitle">Monitor platform activity, users, and events</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-[#E9ECF5] bg-white text-sm text-[#64748B]">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          System Operational
        </div>
      </div>

      {/* User stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
        <StatCard title="Total Users"   value={userCount}    icon={Users}  color="#9FA1FF" subtitle="Registered accounts" trend="+12%" />
        <StatCard title="Students"      value={studentCount} icon={Users}  color="#6BB6FF" subtitle="Active students" />
        <StatCard title="Faculty"       value={facultyCount} icon={Users}  color="#7EDC92" subtitle="Active faculty" />
        <StatCard title="Total Events"  value={eventCount}   icon={FileText} color="#F59E0B" subtitle="All proposals" />
      </div>

      {/* Event stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard title="Pending"   value={pendingCount}   icon={Clock}        color="#F59E0B" />
        <StatCard title="Accepted"  value={acceptedCount}  icon={CheckCircle}  color="#7EDC92" />
        <StatCard title="Rejected"  value={rejectedCount}  icon={XCircle}      color="#F87171" />
        <StatCard title="Completed" value={completedCount} icon={Star}         color="#9FA1FF" />
      </div>

      {/* Users table */}
      <div className="saas-table-wrap">
        <div className="px-6 py-5 border-b border-[#E9ECF5]">
          <p className="section-title">Recent Users</p>
          <p className="section-subtitle">Latest registered accounts on the platform</p>
        </div>
        <table className="saas-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'var(--role-accent)' }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-[#1E293B]">{u.name}</span>
                  </div>
                </td>
                <td className="text-[#64748B]">{u.email}</td>
                <td><span className={roleBadge[u.role] ?? 'badge badge-completed'}>{u.role}</span></td>
                <td className="text-[#94A3B8]">
                  {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
