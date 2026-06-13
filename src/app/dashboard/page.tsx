import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  FileText, ThumbsUp, Ticket, Users, Clock, CheckCircle,
  Star, Calendar, XCircle, ArrowUpRight, Activity, Zap, BarChart2,
} from 'lucide-react';

/* ── Stat Card ─────────────────────────────── */
function StatCard({ title, value, icon: Icon, color, subtitle, trend }: {
  title: string; value: string | number; icon: React.ElementType;
  color: string; subtitle?: string; trend?: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <div className="stat-icon-circle" style={{ background: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            <ArrowUpRight className="h-3 w-3" />{trend}
          </span>
        )}
      </div>
      <p className="text-[28px] font-bold leading-none" style={{ color: '#0F172A' }}>{value}</p>
      <p className="text-sm font-medium mt-1.5" style={{ color: '#64748B' }}>{title}</p>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{subtitle}</p>}
    </div>
  );
}

/* ── Section Card ───────────────────────────── */
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

/* ── Row item ───────────────────────────────── */
function RowItem({ icon: Icon, iconBg, iconColor, title, sub, badge, badgeClass }: {
  icon: React.ElementType; iconBg: string; iconColor: string;
  title: string; sub: string; badge: string; badgeClass: string;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all hover:bg-[var(--role-soft)]"
      style={{ borderColor: 'var(--card-border)' }}
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none" style={{ color: 'var(--text-heading)' }}>{title}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
        </div>
      </div>
      <span className={`badge ${badgeClass}`}>{badge}</span>
    </div>
  );
}

const sLabel: Record<string, string> = {
  PENDING_FACULTY_APPROVAL: 'Faculty Review', PENDING_ADMIN_APPROVAL: 'Admin Review',
  ACCEPTED: 'Accepted', REJECTED: 'Rejected', COMPLETED: 'Completed',
};
const sBadge: Record<string, string> = {
  PENDING_FACULTY_APPROVAL: 'badge-pending', PENDING_ADMIN_APPROVAL: 'badge-review',
  ACCEPTED: 'badge-accepted', REJECTED: 'badge-rejected', COMPLETED: 'badge-completed',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const { role, id: userId, name } = session.user;

  /* ══ STUDENT ═══════════════════════════════ */
  if (role === 'STUDENT') {
    const { rollNumber, year, section, department } = session.user;
    const yearLabels = ['I', 'II', 'III', 'IV'];
    const yearDisplay = year ? `Year ${yearLabels[year - 1]}` : '—';

    const [proposalCount, voteCount, bookingCount, recentProposals, upcomingEvents] = await Promise.all([
      prisma.eventProposal.count({ where: { authorId: userId } }),
      prisma.vote.count({ where: { userId } }),
      prisma.booking.count({ where: { userId, status: 'CONFIRMED' } }),
      prisma.eventProposal.findMany({
        where: { authorId: userId }, orderBy: { createdAt: 'desc' }, take: 5,
        select: { id: true, title: true, status: true, category: true, _count: { select: { votes: true } } },
      }),
      prisma.eventProposal.findMany({
        where: { status: 'ACCEPTED', startDate: { gt: new Date() } },
        orderBy: { startDate: 'asc' }, take: 5,
        include: { author: { select: { name: true } }, _count: { select: { registrations: true } } },
      }),
    ]);

    return (
      <div className="page-content animate-fade-up" data-role="STUDENT">
        <div className="page-header flex items-start justify-between">
          <div>
            <span className="role-tag mb-2 inline-flex"><Zap className="h-3 w-3" />Student Portal</span>
            <h1 className="page-title mt-2">Welcome back, {name} 👋</h1>
            <p className="page-subtitle">{department} · {yearDisplay} · Section {section || '—'} · Roll {rollNumber || '—'}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: 'var(--role-soft)', border: '1px solid var(--role-soft2)', color: 'var(--role-accent)' }}>
            <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: 'var(--role-accent)' }} />
            Active Member
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-7">
          <StatCard title="Proposals"    value={proposalCount} icon={FileText} color="#3B9EFF" subtitle="All time" trend="+2" />
          <StatCard title="Votes Cast"   value={voteCount}     icon={ThumbsUp} color="#4DC96A" subtitle="Community support" />
          <StatCard title="Tickets"      value={bookingCount}  icon={Ticket}   color="#6366F1" subtitle="Confirmed bookings" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SectionCard title="Upcoming Events" subtitle="Accepted events you can register for">
            {upcomingEvents.length === 0 ? (
              <EmptyState icon={Calendar} iconBg="var(--role-soft)" iconColor="var(--role-accent)" text="No upcoming events" sub="Accepted events will appear here" />
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((ev) => (
                  <RowItem key={ev.id} icon={Calendar}
                    iconBg="var(--role-soft)" iconColor="var(--role-accent)"
                    title={ev.title}
                    sub={`${ev.author.name} · ${new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    badge={`${ev._count.registrations} joined`} badgeClass="badge-accepted" />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="My Proposals" subtitle="Track your event proposal status">
            {recentProposals.length === 0 ? (
              <EmptyState icon={FileText} iconBg="var(--role-soft)" iconColor="var(--role-accent)" text="No proposals yet" sub="Create your first event proposal" />
            ) : (
              <div className="space-y-2">
                {recentProposals.map((p) => (
                  <RowItem key={p.id} icon={FileText}
                    iconBg="var(--role-soft)" iconColor="var(--role-accent)"
                    title={p.title} sub={`${p._count.votes} votes · ${p.category}`}
                    badge={sLabel[p.status] ?? p.status} badgeClass={sBadge[p.status] ?? 'badge-pending'} />
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    );
  }

  /* ══ FACULTY ════════════════════════════════ */
  if (role === 'FACULTY') {
    const { employeeId, department } = session.user;
    const [pending, approved, completed, recentPending] = await Promise.all([
      prisma.eventProposal.count({ where: { mentorFacultyId: userId, status: 'PENDING_FACULTY_APPROVAL' } }),
      prisma.eventProposal.count({ where: { status: 'ACCEPTED' } }),
      prisma.eventProposal.count({ where: { status: 'COMPLETED' } }),
      prisma.eventProposal.findMany({
        where: { mentorFacultyId: userId, status: 'PENDING_FACULTY_APPROVAL' },
        orderBy: { createdAt: 'desc' }, take: 5,
        include: { author: { select: { name: true } }, _count: { select: { votes: true } } },
      }),
    ]);

    return (
      <div className="page-content animate-fade-up" data-role="FACULTY">
        <div className="page-header flex items-start justify-between">
          <div>
            <span className="role-tag mb-2 inline-flex"><Activity className="h-3 w-3" />Faculty Portal</span>
            <h1 className="page-title mt-2">Welcome back, {name} 👋</h1>
            <p className="page-subtitle">{department} · Employee ID: {employeeId || '—'}</p>
          </div>
          {pending > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-amber-50 border border-amber-200 text-amber-700">
              <Clock className="h-4 w-4" />{pending} awaiting review
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-7">
          <StatCard title="Pending Review"   value={pending}   icon={Clock}       color="#F59E0B" subtitle="Need attention" />
          <StatCard title="Approved Events"  value={approved}  icon={CheckCircle} color="#4DC96A" subtitle="Active & published" />
          <StatCard title="Completed Events" value={completed} icon={Star}        color="#6366F1" subtitle="Successfully held" />
        </div>

        <SectionCard title="Pending Reviews" subtitle="Proposals assigned to you for review">
          {recentPending.length === 0 ? (
            <EmptyState icon={CheckCircle} iconBg="var(--role-soft)" iconColor="var(--role-accent)" text="All caught up!" sub="No proposals pending your review" />
          ) : (
            <div className="space-y-2">
              {recentPending.map((p) => (
                <RowItem key={p.id} icon={FileText}
                  iconBg="var(--role-soft)" iconColor="var(--role-accent)"
                  title={p.title} sub={`by ${p.author.name} · ${p._count.votes} votes`}
                  badge="Under Review" badgeClass="badge-pending" />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    );
  }

  /* ══ ADMIN ══════════════════════════════════ */
  const [userCount, studentCount, facultyCount, eventCount, pendingCount, acceptedCount, rejectedCount, completedCount, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'FACULTY' } }),
    prisma.eventProposal.count(),
    prisma.eventProposal.count({ where: { status: 'PENDING_ADMIN_APPROVAL' } }),
    prisma.eventProposal.count({ where: { status: 'ACCEPTED' } }),
    prisma.eventProposal.count({ where: { status: 'REJECTED' } }),
    prisma.eventProposal.count({ where: { status: 'COMPLETED' } }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
  ]);

  const roleBadge: Record<string, string> = { STUDENT: 'badge-review', FACULTY: 'badge-accepted', ADMIN: 'badge-completed' };

  return (
    <div className="page-content animate-fade-up" data-role="ADMIN">
      <div className="page-header flex items-start justify-between">
        <div>
          <span className="role-tag mb-2 inline-flex"><BarChart2 className="h-3 w-3" />Admin Control Center</span>
          <h1 className="page-title mt-2">System Overview</h1>
          <p className="page-subtitle">Monitor platform activity, users, and events</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: 'var(--role-soft)', border: '1px solid var(--role-soft2)', color: 'var(--text-muted)' }}>
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          System Operational
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
        <StatCard title="Total Users"  value={userCount}    icon={Users}    color="#6366F1" trend="+12%" />
        <StatCard title="Students"     value={studentCount} icon={Users}    color="#3B9EFF" />
        <StatCard title="Faculty"      value={facultyCount} icon={Users}    color="#4DC96A" />
        <StatCard title="Total Events" value={eventCount}   icon={FileText} color="#F59E0B" />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <StatCard title="Pending"   value={pendingCount}   icon={Clock}       color="#F59E0B" />
        <StatCard title="Accepted"  value={acceptedCount}  icon={CheckCircle} color="#4DC96A" />
        <StatCard title="Rejected"  value={rejectedCount}  icon={XCircle}     color="#EF4444" />
        <StatCard title="Completed" value={completedCount} icon={Star}        color="#6366F1" />
      </div>

      <div className="saas-table-wrap">
        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--card-border)' }}>
          <p className="section-title">Recent Users</p>
          <p className="section-subtitle">Latest registered accounts on the platform</p>
        </div>
        <table className="saas-table">
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
          <tbody>
            {recentUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'var(--role-accent)' }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold" style={{ color: 'var(--text-heading)' }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                <td><span className={`badge ${roleBadge[u.role] ?? 'badge-completed'}`}>{u.role}</span></td>
                <td style={{ color: '#94A3B8' }}>{new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, iconBg, iconColor, text, sub }: {
  icon: React.ElementType; iconBg: string; iconColor: string; text: string; sub: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: iconBg }}>
        <Icon className="h-6 w-6" style={{ color: iconColor }} />
      </div>
      <p className="font-semibold" style={{ color: 'var(--text-heading)' }}>{text}</p>
      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  );
}
