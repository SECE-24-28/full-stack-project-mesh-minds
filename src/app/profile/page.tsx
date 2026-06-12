'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { UserRecord } from '@/types';
import {
  Mail, Building, Calendar, BookOpen, Award, Edit3,
  User, Shield, GraduationCap, Clock,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;

    if (!session) {
      router.push('/login');
      return;
    }

    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load profile');
        setLoading(false);
      });
  }, [session, sessionLoading, router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-slate-500">Profile not found</p>
      </div>
    );
  }

  const roleIcons: Record<string, React.ElementType> = {
    STUDENT: GraduationCap,
    FACULTY: User,
    ADMIN: Shield,
  };

  const RoleIcon = roleIcons[user.role] || User;

  return (
    <div className="animate-fade-in p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">View and manage your account information.</p>
        </div>
        <button
          onClick={() => router.push('/profile/edit')}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10"
        >
          <Edit3 className="h-4 w-4" />
          Edit Profile
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="role-card rounded-2xl p-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                <RoleIcon className="h-12 w-12 text-white" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-white">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
            <span className="mt-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400">
              {user.role}
            </span>
          </div>

          <div className="mt-6 space-y-3 border-t border-white/5 pt-4">
            <div className="flex items-center gap-3">
              <Award className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-slate-400">Points</span>
              <span className="ml-auto font-semibold text-white">{user.points ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="role-card rounded-2xl p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Account Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {user.role === 'STUDENT' && (
              <>
                <DetailItem icon={GraduationCap} label="Roll Number" value={user.rollNumber} />
                <DetailItem icon={Calendar} label="Year" value={user.year ? `${user.year} Year` : undefined} />
                <DetailItem icon={Building} label="Department" value={user.department} />
                <DetailItem icon={BookOpen} label="Section" value={user.section} />
                <StatBox label="Events Created" value={user.createdEventsCount ?? 0} />
                <StatBox label="Events Registered" value={user.registeredEventsCount ?? 0} />
              </>
            )}

            {user.role === 'FACULTY' && (
              <>
                <DetailItem icon={Shield} label="Employee ID" value={user.employeeId} />
                <DetailItem icon={Building} label="Department" value={user.department} />
                <StatBox label="Events Mentored" value={user.mentoredEventsCount ?? 0} />
              </>
            )}

            {user.role === 'ADMIN' && (
              <DetailItem icon={Building} label="Department" value={user.department} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 px-4 py-3">
      <Icon className="h-4 w-4 text-slate-500" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-200">{value ?? '—'}</p>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/3 px-4 py-3 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
