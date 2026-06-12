'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FileText, Calendar, BarChart3, LogOut, Sun, Moon,
  Zap, ChevronRight, Bell, Settings, Users, Shield, GraduationCap, BookOpen,
  ThumbsUp, Star, Plus, User, Clock, CalendarDays,
} from 'lucide-react';
import { useSession, signOut } from '@/lib/auth-client';
import { useTheme } from '@/components/providers';
import { cn } from '@/lib/utils';

const navByRole = {
  STUDENT: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/proposals', label: 'Proposals', icon: FileText },
    { href: '/upcoming-events', label: 'Upcoming Events', icon: CalendarDays },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/engagement/analytics/student', label: 'My Stats', icon: Star },
  ],
  FACULTY: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/proposals', label: 'Proposals', icon: FileText },
    { href: '/upcoming-events', label: 'Upcoming Events', icon: CalendarDays },
    { href: '/faculty/pending-events', label: 'Review Events', icon: Clock },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/engagement/analytics/faculty', label: 'My Stats', icon: Star },
  ],
  ADMIN: [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/proposals', label: 'Proposals', icon: FileText },
    { href: '/upcoming-events', label: 'Upcoming Events', icon: CalendarDays },
    { href: '/admin/pending-events', label: 'Pending Events', icon: Clock },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/profile', label: 'Profile', icon: User },
  ],
};

const roleConfig = {
  STUDENT: {
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    activeGlow: 'shadow-blue-500/20',
    activeBg: 'bg-blue-500/15',
    activeBorder: 'border-l-blue-500',
    icon: GraduationCap,
    label: 'Student',
  },
  FACULTY: {
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    activeGlow: 'shadow-emerald-500/20',
    activeBg: 'bg-emerald-500/15',
    activeBorder: 'border-l-emerald-500',
    icon: BookOpen,
    label: 'Faculty',
  },
  ADMIN: {
    gradient: 'from-violet-500 to-indigo-500',
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/20',
    activeGlow: 'shadow-violet-500/20',
    activeBg: 'bg-violet-500/15',
    activeBorder: 'border-l-violet-500',
    icon: Shield,
    label: 'Admin',
  },
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();

  const role = (session?.user?.role as keyof typeof roleConfig) ?? 'STUDENT';
  const config = roleConfig[role];
  const RoleIcon = config.icon;
  const navItems = navByRole[role] ?? navByRole.STUDENT;

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  const sidebarClass =
    role === 'FACULTY' ? 'sidebar-faculty' :
    role === 'ADMIN'   ? 'sidebar-admin'   :
                         'sidebar-student';

  return (
    <aside className={`fixed left-0 top-0 z-30 flex h-screen w-64 flex-col backdrop-blur-xl ${sidebarClass}`}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/5 px-5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} shadow-lg`}>
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-semibold text-white">CampusConnect</span>
      </div>

      {/* User info */}
      {session?.user && (
        <div className={`mx-3 mt-4 rounded-xl border ${config.border} ${config.bg} p-3`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${config.gradient} text-white shadow`}>
              <RoleIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{session.user.name}</p>
              <p className={`text-xs ${config.text}`}>{config.label}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="mt-4 flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? `border-l-2 ${config.activeBorder} ${config.activeBg} ${config.text}`
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              )}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110', isActive && config.text)} />
              {item.label}
              {isActive && <ChevronRight className={`ml-auto h-3 w-3 ${config.text}`} />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-white/5 p-3 space-y-0.5">
        <button
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-slate-200"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function Navigation() {
  return null; // replaced by Sidebar
}
