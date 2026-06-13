'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { Users, Calendar, Clock, CheckCircle, TrendingUp, ArrowRight, BarChart2, Loader2 } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  totalEvents: number;
  pendingEvents: number;
  acceptedEvents: number;
  rejectedEvents: number;
  completedEvents: number;
  acceptedEventList?: Array<{
    id: string;
    title: string;
    authorName: string;
    startDate: string;
    registrations: number;
  }>;
}

const statItems = (s: AdminStats) => [
  { title: 'Total Users',   value: s.totalUsers,    icon: Users,       color: '#9FA1FF' },
  { title: 'Students',      value: s.totalStudents, icon: Users,       color: '#6BB6FF' },
  { title: 'Faculty',       value: s.totalFaculty,  icon: Users,       color: '#7EDC92' },
  { title: 'Total Events',  value: s.totalEvents,   icon: Calendar,    color: '#F59E0B' },
  { title: 'Pending',       value: s.pendingEvents,  icon: Clock,       color: '#F59E0B' },
  { title: 'Accepted',      value: s.acceptedEvents, icon: CheckCircle, color: '#7EDC92' },
  { title: 'Completed',     value: s.completedEvents,icon: TrendingUp,  color: '#9FA1FF' },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) { router.push('/login'); return; }
    if (session.user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => { setStats(d.stats); setLoading(false); })
      .catch(() => { toast.error('Failed to load stats'); setLoading(false); });
  }, [session, sessionLoading, router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--role-accent)' }} />
      </div>
    );
  }

  if (!stats) return null;

  const items = statItems(stats);

  return (
    <div className="page-content animate-fade-up" data-role="ADMIN">
      <div className="page-header flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="role-tag"><BarChart2 className="h-3 w-3" /> Admin Dashboard</span>
          </div>
          <h1 className="page-title">System Overview</h1>
          <p className="page-subtitle">Manage users and events across the platform</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-[#E9ECF5] bg-white text-sm text-[#64748B]">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          System Operational
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
        {items.slice(0, 4).map((s) => (
          <div key={s.title} className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="stat-icon-circle" style={{ background: `${s.color}18` }}>
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#0F172A] leading-none">{s.value}</p>
            <p className="text-sm font-medium text-[#64748B] mt-1.5">{s.title}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-5 mb-7">
        {items.slice(4).map((s) => (
          <div key={s.title} className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="stat-icon-circle" style={{ background: `${s.color}18` }}>
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#0F172A] leading-none">{s.value}</p>
            <p className="text-sm font-medium text-[#64748B] mt-1.5">{s.title}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="saas-card p-6">
        <p className="section-title mb-4">Quick Actions</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Review Pending Events', icon: Clock,     href: '/admin/pending-events',   color: '#F59E0B' },
            { label: 'Upcoming Events',       icon: Calendar,  href: '/admin/upcoming-events',  color: '#4DC96A' },
            { label: 'Manage Users',          icon: Users,     href: '/admin/users',            color: '#9FA1FF' },
          ].map((action) => (
            <button
              key={action.href}
              onClick={() => router.push(action.href)}
              className="flex items-center justify-between rounded-2xl border border-[#E9ECF5] p-4 text-left hover:bg-[#F8F9FC] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${action.color}18` }}>
                  <action.icon className="h-4 w-4" style={{ color: action.color }} />
                </div>
                <span className="font-semibold text-[#1E293B] text-sm">{action.label}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-[#94A3B8]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
