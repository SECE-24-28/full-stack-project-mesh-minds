'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { Users, Calendar, Clock, CheckCircle, XCircle, TrendingUp, ArrowRight } from 'lucide-react';

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
    authorRole: string;
    startDate: string;
    registrations: number;
  }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;

    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load stats');
        setLoading(false);
      });
  }, [session, sessionLoading, router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const StatCard = ({ title, value, icon: Icon, gradient }: { title: string; value: number; icon: React.ElementType; gradient: string }) => (
    <div className="role-stat-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Manage users and events across the platform.</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} gradient="from-violet-500 to-indigo-500" />
        <StatCard title="Students" value={stats.totalStudents} icon={Users} gradient="from-blue-500 to-cyan-500" />
        <StatCard title="Faculty" value={stats.totalFaculty} icon={Users} gradient="from-emerald-500 to-teal-500" />
        <StatCard title="Total Events" value={stats.totalEvents} icon={Calendar} gradient="from-amber-500 to-orange-500" />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard title="Pending Approval" value={stats.pendingEvents} icon={Clock} gradient="from-amber-500 to-orange-500" />
        <StatCard title="Accepted" value={stats.acceptedEvents} icon={CheckCircle} gradient="from-emerald-500 to-teal-500" />
        <StatCard title="Completed" value={stats.completedEvents} icon={TrendingUp} gradient="from-cyan-500 to-blue-500" />
      </div>

      <div className="role-card rounded-2xl p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => router.push('/admin/pending-events')}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:bg-white/8"
          >
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-400" />
              <span className="font-medium text-slate-200">Pending Events</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500" />
          </button>
          <button
            onClick={() => router.push('/admin/users')}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:bg-white/8"
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-violet-400" />
              <span className="font-medium text-slate-200">Manage Users</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="role-card mt-6 rounded-2xl p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Accepted Events</h3>
        {stats.acceptedEventList?.length ? (
          <div className="space-y-3">
            {stats.acceptedEventList.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">{event.title}</p>
                  <p className="text-xs text-slate-500">
                    by {event.authorName} · {new Date(event.startDate).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                  {event.registrations} registered
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">No accepted events yet.</p>
        )}
      </div>
    </div>
  );
}
