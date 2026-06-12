'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { UserRecord } from '@/types';
import {
  Mail, Building, Calendar, BookOpen, Award, Edit3,
  User, Shield, GraduationCap, Hash, FileText, Ticket, Star,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) { router.push('/login'); return; }
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => { setUser(d.user); setLoading(false); })
      .catch(() => { toast.error('Failed to load profile'); setLoading(false); });
  }, [session, sessionLoading, router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--role-primary)', borderTopColor: 'transparent' }} />
          <p className="text-sm text-[#94A3B8]">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-[#94A3B8]">Profile not found</p>
      </div>
    );
  }

  const roleIcons: Record<string, React.ElementType> = {
    STUDENT: GraduationCap,
    FACULTY: BookOpen,
    ADMIN: Shield,
  };
  const RoleIcon = roleIcons[user.role] || User;

  return (
    <div className="page-content animate-fade-up">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account information</p>
        </div>
        <button
          onClick={() => router.push('/profile/edit')}
          className="btn-secondary"
        >
          <Edit3 className="h-4 w-4" />
          Edit Profile
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Profile Card */}
        <div className="saas-card p-6 flex flex-col items-center text-center">
          <div
            className="h-24 w-24 rounded-2xl flex items-center justify-center mb-4 overflow-hidden"
            style={{ background: 'var(--role-soft)' }}
          >
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <RoleIcon className="h-12 w-12" style={{ color: 'var(--role-accent)' }} />
            )}
          </div>

          <h2 className="text-xl font-bold text-[#0F172A]">{user.name}</h2>
          <p className="text-sm text-[#64748B] mt-0.5">{user.email}</p>

          <span className="role-tag mt-3">
            <RoleIcon className="h-3 w-3" />
            {user.role}
          </span>

          {/* Points */}
          <div className="mt-6 w-full rounded-2xl p-4 border border-[#E9ECF5]" style={{ background: 'var(--role-soft)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" style={{ color: 'var(--role-accent)' }} />
                <span className="text-sm font-medium text-[#475569]">Campus Points</span>
              </div>
              <span className="text-2xl font-bold" style={{ color: 'var(--role-accent)' }}>{user.points ?? 0}</span>
            </div>
          </div>

          {/* Quick stats for student */}
          {user.role === 'STUDENT' && (
            <div className="mt-4 w-full grid grid-cols-2 gap-3">
              {[
                { label: 'Events Created', value: user.createdEventsCount ?? 0, icon: FileText },
                { label: 'Registered',     value: user.registeredEventsCount ?? 0, icon: Ticket },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-[#E9ECF5] p-3 text-center">
                  <Icon className="h-4 w-4 mx-auto mb-1" style={{ color: 'var(--role-accent)' }} />
                  <p className="text-xl font-bold text-[#0F172A]">{value}</p>
                  <p className="text-xs text-[#94A3B8] leading-tight">{label}</p>
                </div>
              ))}
            </div>
          )}

          {user.role === 'FACULTY' && (
            <div className="mt-4 w-full rounded-2xl border border-[#E9ECF5] p-3 text-center">
              <Star className="h-4 w-4 mx-auto mb-1" style={{ color: 'var(--role-accent)' }} />
              <p className="text-xl font-bold text-[#0F172A]">{user.mentoredEventsCount ?? 0}</p>
              <p className="text-xs text-[#94A3B8]">Events Mentored</p>
            </div>
          )}
        </div>

        {/* Details Card */}
        <div className="saas-card p-6">
          <div className="mb-6">
            <p className="section-title">Account Details</p>
            <p className="section-subtitle">Your personal and academic information</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem icon={Mail}     label="Email"      value={user.email} />

            {user.role === 'STUDENT' && (
              <>
                <DetailItem icon={Hash}          label="Roll Number"  value={user.rollNumber} />
                <DetailItem icon={Calendar}      label="Year"         value={user.year ? `Year ${user.year}` : undefined} />
                <DetailItem icon={Building}      label="Department"   value={user.department} />
                <DetailItem icon={BookOpen}      label="Section"      value={user.section} />
              </>
            )}

            {user.role === 'FACULTY' && (
              <>
                <DetailItem icon={Hash}     label="Employee ID"  value={user.employeeId} />
                <DetailItem icon={Building} label="Department"   value={user.department} />
              </>
            )}

            {user.role === 'ADMIN' && (
              <DetailItem icon={Building} label="Department" value={user.department} />
            )}
          </div>

          {/* Activity section */}
          <div className="mt-8 pt-6 border-t border-[#E9ECF5]">
            <p className="section-title mb-4">Account Status</p>
            <div className="flex items-center gap-3 rounded-2xl border border-[#E9ECF5] p-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--role-soft)' }}>
                <User className="h-5 w-5" style={{ color: 'var(--role-accent)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">
                  {user.emailVerified ? 'Verified Account' : 'Pending Verification'}
                </p>
                <p className="text-xs text-[#94A3B8]">
                  {user.emailVerified ? 'Your email address is verified' : 'Please verify your email'}
                </p>
              </div>
              <span className={`ml-auto badge ${user.emailVerified ? 'badge-accepted' : 'badge-pending'}`}>
                {user.emailVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E9ECF5] px-4 py-3 hover:bg-[#F8F9FC] transition-all">
      <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--role-soft)' }}>
        <Icon className="h-4 w-4" style={{ color: 'var(--role-accent)' }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#94A3B8]">{label}</p>
        <p className="text-sm font-semibold text-[#1E293B] truncate">{value ?? '—'}</p>
      </div>
    </div>
  );
}
