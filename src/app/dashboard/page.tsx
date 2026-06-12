import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import {
  FileText, ThumbsUp, Ticket, Users, Clock, CheckCircle,
  DollarSign, TrendingUp, Star, Activity, ArrowUpRight, Zap,
  Calendar, XCircle,
} from 'lucide-react';

function StatCard({
  title, value, icon: Icon, gradient, subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  subtitle?: string;
}) {
  return (
    <div className="role-stat-card group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-8`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function RowCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="role-card flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200">
      {children}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { role, id: userId, name } = session.user;

// ── Student ──────────────────────────────────────────────────────
  if (role === 'STUDENT') {
    const {
      rollNumber,
      year,
      section,
      department,
    } = session.user;

    const [proposalCount, voteCount, bookingCount, recentProposals, upcomingEvents] = await Promise.all([
      prisma.eventProposal.count({ where: { authorId: userId } }),
      prisma.vote.count({ where: { userId } }),
      prisma.booking.count({ where: { userId, status: 'CONFIRMED' } }),
      prisma.eventProposal.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        take: 4,
        select: { id: true, title: true, status: true, _count: { select: { votes: true } } },
      }),
      prisma.eventProposal.findMany({
        where: {
          authorId: { not: userId },
          status: 'ACCEPTED',
          startDate: { gt: new Date() },
        },
        orderBy: { startDate: 'asc' },
        take: 4,
        include: { author: { select: { name: true } }, _count: { select: { registrations: true } } },
      }),
    ]);

    const statusColors: Record<string, string> = {
      PENDING_FACULTY_APPROVAL: 'bg-slate-500/20 text-slate-400',
      PENDING_ADMIN_APPROVAL: 'bg-blue-500/20 text-blue-400',
      ACCEPTED: 'bg-emerald-500/20 text-emerald-400',
      REJECTED: 'bg-red-500/20 text-red-400',
      COMPLETED: 'bg-slate-400/20 text-slate-300',
    };

    const yearLabels = ['I', 'II', 'III', 'IV'];
    const yearDisplay = year ? yearLabels[year - 1] + ' Year' : '';

    return (
      <div className="animate-fade-in p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-blue-400">
              <Zap className="h-3.5 w-3.5" />
              Student Portal
            </div>
            <h1 className="mt-1 text-2xl font-bold text-white">
              Welcome, {name} {'\u2019'}
            </h1>
            <div className="mt-1 space-x-4 text-sm text-slate-400">
              <span>Roll No: {rollNumber}</span>
              <span>Department: {department}</span>
              <span>Year: {yearDisplay}</span>
              <span>Section: {section}</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">Here&apos;s what&apos;s happening with your events today.</p>
          </div>
          <div className="hidden items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 md:flex">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
            <span className="text-xs font-medium text-blue-300">Active member</span>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard title="Proposals Submitted" value={proposalCount} icon={FileText} gradient="from-blue-500 to-cyan-500" subtitle="All time" />
          <StatCard title="Votes Cast" value={voteCount} icon={ThumbsUp} gradient="from-cyan-500 to-blue-600" subtitle="Community support given" />
          <StatCard title="Tickets Booked" value={bookingCount} icon={Ticket} gradient="from-blue-600 to-indigo-600" subtitle="Confirmed bookings" />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="role-card rounded-2xl p-6 transition-all duration-200">
            <SectionHeader title="Upcoming Events" subtitle="Accepted events proposed by others" />
            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10">
                  <Calendar className="h-6 w-6 text-cyan-400" />
                </div>
                <p className="font-medium text-slate-300">No upcoming events</p>
                <p className="mt-1 text-sm text-slate-500">Accepted campus events will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <RowCard key={event.id}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
                        <Calendar className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{event.title}</p>
                        <p className="text-xs text-slate-500">
                          by {event.author.name} · {new Date(event.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                      {event._count.registrations} registered
                    </span>
                  </RowCard>
                ))}
              </div>
            )}
          </div>

          <div className="role-card rounded-2xl p-6 transition-all duration-200">
            <SectionHeader title="My Proposals" subtitle="Recent event proposals you've submitted" />
            {recentProposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
                <p className="font-medium text-slate-300">No proposals yet</p>
                <p className="mt-1 text-sm text-slate-500">Head to Proposals to create your first event idea.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProposals.map((p) => (
                  <RowCard key={p.id}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                        <FileText className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{p.title}</p>
                        <p className="text-xs text-slate-500">{p._count.votes} votes</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[p.status] ?? 'bg-slate-500/20 text-slate-400'}`}>
                      {p.status.replaceAll('_', ' ')}
                    </span>
                  </RowCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

// ── Faculty ───────────────────────────────────────────────────────
  if (role === 'FACULTY') {
    const { employeeId, department } = session.user;

    const [pending, approved, completed, recentPending] = await Promise.all([
      prisma.eventProposal.count({ where: { mentorFacultyId: userId, status: 'PENDING_FACULTY_APPROVAL' } }),
      prisma.eventProposal.count({ where: { status: 'ACCEPTED' } }),
      prisma.eventProposal.count({ where: { status: 'COMPLETED' } }),
      prisma.eventProposal.findMany({
        where: { mentorFacultyId: userId, status: 'PENDING_FACULTY_APPROVAL' },
        orderBy: { createdAt: 'desc' },
        take: 4,
        include: { author: { select: { name: true } }, _count: { select: { votes: true } } },
      }),
    ]);

    return (
      <div className="animate-fade-in p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-emerald-400">
              <Activity className="h-3.5 w-3.5" />
              Faculty Portal
            </div>
            <h1 className="mt-1 text-2xl font-bold text-white">
              Welcome, {name}
            </h1>
            <div className="mt-1 space-x-4 text-sm text-slate-400">
              <span>Employee ID: {employeeId}</span>
              <span>Department: {department}</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">Review and manage student event proposals.</p>
          </div>
          {pending > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-300">{pending} awaiting review</span>
            </div>
          )}
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard title="Pending Review" value={pending} icon={Clock} gradient="from-amber-500 to-orange-500" subtitle="Need your attention" />
          <StatCard title="Approved Events" value={approved} icon={CheckCircle} gradient="from-emerald-500 to-teal-500" subtitle="Active & published" />
          <StatCard title="Completed Events" value={completed} icon={Star} gradient="from-teal-500 to-cyan-500" subtitle="Successfully held" />
        </div>

        <div className="role-card rounded-2xl p-6 transition-all duration-200">
          <SectionHeader title="Pending Reviews" subtitle="Proposals awaiting your faculty review" />
          {recentPending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="font-medium text-slate-300">All caught up!</p>
              <p className="mt-1 text-sm text-slate-500">No proposals pending review right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPending.map((p) => (
                <RowCard key={p.id}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                      <FileText className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{p.title}</p>
                      <p className="text-xs text-slate-500">by {p.author.name} · {p._count.votes} votes</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                    Under Review
                  </span>
                </RowCard>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

// ── Admin ─────────────────────────────────────────────────────────
  const [userCount, studentCount, facultyCount, eventCount, pendingCount, acceptedCount, rejectedCount, completedCount, acceptedUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'FACULTY' } }),
    prisma.eventProposal.count(),
    prisma.eventProposal.count({ where: { status: 'PENDING_ADMIN_APPROVAL' } }),
    prisma.eventProposal.count({ where: { status: 'ACCEPTED' } }),
    prisma.eventProposal.count({ where: { status: 'REJECTED' } }),
    prisma.eventProposal.count({ where: { status: 'COMPLETED' } }),
    prisma.user.findMany({
      where: { emailVerified: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
  ]);

  const roleColors: Record<string, string> = {
    STUDENT: 'bg-blue-500/20 text-blue-400',
    FACULTY: 'bg-emerald-500/20 text-emerald-400',
    ADMIN: 'bg-violet-500/20 text-violet-400',
  };

  return (
    <div className="animate-fade-in p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-violet-400">
            <ShieldIcon className="h-3.5 w-3.5" />
            Admin Control Center
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white">System Overview</h1>
          <p className="mt-1 text-sm text-slate-400">Monitor platform activity, users, and performance.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
          <span className="text-xs font-medium text-violet-300">System operational</span>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Users" value={userCount} icon={Users} gradient="from-violet-500 to-indigo-500" subtitle="Registered accounts" />
        <StatCard title="Students" value={studentCount} icon={Users} gradient="from-blue-500 to-cyan-500" subtitle="Active students" />
        <StatCard title="Faculty" value={facultyCount} icon={Users} gradient="from-emerald-500 to-teal-500" subtitle="Active faculty" />
        <StatCard title="Total Events" value={eventCount} icon={FileText} gradient="from-amber-500 to-orange-500" subtitle="All proposals" />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <StatCard title="Pending Events" value={pendingCount} icon={Clock} gradient="from-amber-500 to-orange-500" />
        <StatCard title="Accepted Events" value={acceptedCount} icon={CheckCircle} gradient="from-emerald-500 to-teal-500" />
        <StatCard title="Rejected Events" value={rejectedCount} icon={XCircle} gradient="from-red-500 to-rose-500" />
        <StatCard title="Completed Events" value={completedCount} icon={Calendar} gradient="from-cyan-500 to-blue-500" />
      </div>

      <div className="role-card rounded-2xl p-6 transition-all duration-200">
        <SectionHeader title="Accepted Users" subtitle="Users with verified accounts" />
        <div className="space-y-3">
          {acceptedUsers.map((u) => (
            <RowCard key={u.id}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-bold text-white">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[u.role] ?? ''}`}>
                {u.role}
              </span>
            </RowCard>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
