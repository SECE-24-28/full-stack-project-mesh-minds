'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { UserRecord } from '@/types';
import { Upload, Loader2, User as UserIcon } from 'lucide-react';

export default function ProfileEditPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading, refetch } = useSession();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState('');

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) { router.push('/login'); return; }
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => { setUser(d.user); setName(d.user.name); setProfileImage(d.user.profileImage ?? ''); setLoading(false); })
      .catch(() => { toast.error('Failed to load profile'); setLoading(false); });
  }, [session, sessionLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, profileImage: profileImage || null }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); toast.error(d.message || 'Failed to update'); return; }
    const { user: updated } = await res.json();
    setUser(updated);
    refetch();
    toast.success('Profile updated!');
    router.push('/profile');
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--role-accent)' }} />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p style={{ color: 'var(--text-muted)' }}>Profile not found</p>
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-up">
      <div className="page-header">
        <h1 className="page-title">Edit Profile</h1>
        <p className="page-subtitle">Update your account information</p>
      </div>

      <div className="saas-card p-7 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar preview */}
          <div className="flex items-center gap-5 pb-5 border-b border-[#F1F5F9]">
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ background: 'var(--role-soft)', border: '2px solid var(--role-soft2)' }}
            >
              {profileImage ? (
                <img src={profileImage} alt="Preview" className="h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <UserIcon className="h-9 w-9" style={{ color: 'var(--role-accent)' }} />
              )}
            </div>
            <div>
              <p className="font-semibold text-[#0F172A]">{user.name}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
              <span className="role-tag mt-1.5 inline-flex">{user.role}</span>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="saas-label">Full Name <span className="text-red-400">*</span></label>
              <input className="saas-input" value={name}
                onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="saas-label">Email (read-only)</label>
              <input className="saas-input opacity-60 cursor-not-allowed" value={user.email} disabled />
            </div>
          </div>

          <div>
            <label className="saas-label">Profile Image URL</label>
            <input className="saas-input" placeholder="https://example.com/avatar.jpg"
              value={profileImage} onChange={(e) => setProfileImage(e.target.value)} />
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
              Paste a direct image URL or leave blank for the default avatar.
            </p>
          </div>

          <div className="flex gap-3 pt-2 border-t border-[#F1F5F9]">
            <button type="button" onClick={() => router.push('/profile')} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
