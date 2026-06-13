'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FileText, LogOut, Zap,
  Users, Shield, GraduationCap, BookOpen, Star, User,
  CalendarDays, Clock, ChevronRight, Settings, Calendar,
  Bell, Ticket, BarChart3,
} from 'lucide-react';
import { useSession, signOut } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

const navByRole = {
  STUDENT: [
    { href: '/dashboard',       label: 'Dashboard',    icon: LayoutDashboard },
    { href: '/upcoming-events', label: 'Events',       icon: CalendarDays },
    { href: '/proposals',       label: 'My Proposals', icon: FileText },
    { href: '/calendar',        label: 'Calendar',     icon: Calendar },
    { href: '/engagement/analytics/student', label: 'My Stats', icon: Star },
    { href: '/profile',         label: 'Profile',      icon: User },
  ],
  FACULTY: [
    { href: '/dashboard',       label: 'Dashboard',    icon: LayoutDashboard },
    { href: '/proposals',       label: 'Proposals',    icon: FileText },
    { href: '/upcoming-events', label: 'Events',       icon: CalendarDays },
    { href: '/faculty/pending-events', label: 'Review Events', icon: Clock },
    { href: '/calendar',        label: 'Calendar',     icon: Calendar },
    { href: '/engagement/analytics/faculty', label: 'My Stats', icon: Star },
    { href: '/profile',         label: 'Profile',      icon: User },
  ],
  ADMIN: [
    { href: '/admin',                    label: 'Dashboard',       icon: LayoutDashboard },
    { href: '/admin/pending-events',     label: 'Pending Events',  icon: Clock },
    { href: '/admin/upcoming-events',    label: 'Upcoming Events', icon: CalendarDays },
    { href: '/admin/completed-events',   label: 'Completed Events',icon: Star },
    { href: '/admin/analytics',          label: 'Analytics',       icon: BarChart3 },
    { href: '/admin/users',             label: 'Users',           icon: Users },
    { href: '/profile',                 label: 'Profile',         icon: User },
  ],
};

const roleConfig = {
  STUDENT: { label: 'Student', icon: GraduationCap, accent: '#3B9EFF' },
  FACULTY: { label: 'Faculty', icon: BookOpen,      accent: '#4DC96A' },
  ADMIN:   { label: 'Admin',   icon: Shield,        accent: '#6366F1' },
};

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session } = useSession();

  const role   = (session?.user?.role as keyof typeof roleConfig) ?? 'ADMIN';
  const config = roleConfig[role];
  const RoleIcon = config.icon;
  const navItems = navByRole[role] ?? navByRole.ADMIN;

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  return (
    <aside className="app-sidebar" data-role={role}>

      {/* ── Logo area ── */}
      <div className="sidebar-logo-area">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${config.accent}, ${config.accent}99)`,
            boxShadow: `0 4px 12px ${config.accent}40`,
          }}
        >
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-[15px] font-bold leading-none" style={{ color: 'var(--text-heading)' }}>
            CampusConnect
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Event Platform
          </p>
        </div>
      </div>

      {/* ── User profile card ── */}
      {session?.user && (
        <div
          className="mx-4 mt-5 mb-4 rounded-2xl p-3"
          style={{ background: 'var(--role-soft)', border: '1px solid var(--role-soft2)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
              style={{ background: config.accent }}
            >
              <RoleIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-heading)' }}>
                {session.user.name}
              </p>
              <p className="text-[11px] font-medium" style={{ color: config.accent }}>
                {config.label}
              </p>
            </div>
            <Bell className="h-4 w-4 flex-shrink-0 cursor-pointer" style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
      )}

      {/* ── Section label ── */}
      <div className="px-5 mb-1.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
          Navigation
        </p>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('sidebar-nav-item', isActive && 'active')}
            >
              <Icon className="nav-icon" />
              <span className="flex-1 truncate">{item.label}</span>
              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: config.accent }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom actions ── */}
      <div
        className="px-3 py-4 space-y-0.5"
        style={{ borderTop: '1px solid var(--sidebar-border)' }}
      >
        <Link href="/profile" className="sidebar-nav-item">
          <Settings className="nav-icon" />
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="sidebar-nav-item w-full text-left hover:!bg-red-50 hover:!text-red-600"
        >
          <LogOut className="nav-icon" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function Navigation() { return null; }
