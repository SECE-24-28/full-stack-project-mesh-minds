'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FileText, Calendar, BarChart3, LogOut,
  Zap, Bell, Settings, Users, Shield, GraduationCap, BookOpen,
  Star, User, CalendarDays, Clock, Ticket, ChevronRight,
} from 'lucide-react';
import { useSession, signOut } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

const navByRole = {
  STUDENT: [
    { href: '/dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
    { href: '/proposals',   label: 'Proposals',        icon: FileText },
    { href: '/upcoming-events', label: 'Events',       icon: CalendarDays },
    { href: '/calendar',    label: 'Calendar',         icon: Calendar },
    { href: '/analytics',   label: 'Analytics',        icon: BarChart3 },
    { href: '/engagement/analytics/student', label: 'My Stats', icon: Star },
    { href: '/profile',     label: 'Profile',          icon: User },
  ],
  FACULTY: [
    { href: '/dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
    { href: '/proposals',   label: 'Proposals',        icon: FileText },
    { href: '/upcoming-events', label: 'Events',       icon: CalendarDays },
    { href: '/faculty/pending-events', label: 'Review Events', icon: Clock },
    { href: '/calendar',    label: 'Calendar',         icon: Calendar },
    { href: '/analytics',   label: 'Analytics',        icon: BarChart3 },
    { href: '/engagement/analytics/faculty', label: 'My Stats', icon: Star },
    { href: '/profile',     label: 'Profile',          icon: User },
  ],
  ADMIN: [
    { href: '/admin',       label: 'Dashboard',       icon: LayoutDashboard },
    { href: '/proposals',   label: 'Proposals',        icon: FileText },
    { href: '/upcoming-events', label: 'Events',       icon: CalendarDays },
    { href: '/admin/pending-events', label: 'Pending',  icon: Clock },
    { href: '/calendar',    label: 'Calendar',         icon: Calendar },
    { href: '/analytics',   label: 'Analytics',        icon: BarChart3 },
    { href: '/admin/users', label: 'Users',             icon: Users },
    { href: '/profile',     label: 'Profile',           icon: User },
  ],
};

const roleConfig = {
  STUDENT: { label: 'Student', icon: GraduationCap, role: 'STUDENT' },
  FACULTY: { label: 'Faculty', icon: BookOpen,      role: 'FACULTY' },
  ADMIN:   { label: 'Admin',   icon: Shield,        role: 'ADMIN'   },
};

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session } = useSession();

  const role = (session?.user?.role as keyof typeof roleConfig) ?? 'STUDENT';
  const config = roleConfig[role];
  const RoleIcon = config.icon;
  const navItems = navByRole[role] ?? navByRole.STUDENT;

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  return (
    <aside
      className="app-sidebar fixed left-0 top-0 z-30 flex h-screen flex-col"
      data-role={role}
    >
      {/* Logo */}
      <div className="sidebar-logo-area flex items-center gap-3 px-6">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl shadow-sm"
          style={{ background: 'var(--role-accent)' }}
        >
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="text-[15px] font-bold text-white">CampusConnect</span>
          <p className="text-[11px] leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Event Platform</p>
        </div>
      </div>

      {/* User Card */}
      {session?.user && (
        <div className="mx-4 mt-5 mb-2 rounded-2xl p-3.5" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm flex-shrink-0"
              style={{ background: 'var(--role-accent)' }}
            >
              <RoleIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">{session.user.name}</p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.70)' }}>{config.label}</p>
            </div>
            <Bell className="h-4 w-4 flex-shrink-0 cursor-pointer" style={{ color: 'rgba(255,255,255,0.55)' }} />
          </div>
        </div>
      )}

      {/* Nav Section */}
      <div className="px-3 mb-1 mt-3">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.40)' }}>Navigation</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('sidebar-nav-item', isActive && 'active')}
            >
              <Icon className="nav-icon" />
              <span className="flex-1 truncate">{item.label}</span>
              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--role-primary)' }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <Link href="/profile" className="sidebar-nav-item">
          <Settings className="nav-icon" />
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="sidebar-nav-item w-full text-left hover:!bg-red-500/20 hover:!text-red-200"
        >
          <LogOut className="nav-icon hover:!text-red-400" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function Navigation() {
  return null;
}
