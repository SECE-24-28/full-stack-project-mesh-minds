'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { UserRecord } from '@/types';
import { Upload, Loader2, User as UserIcon } from 'lucide-react';

const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Artificial Intelligence and Data Science',
  'Cyber Security',
  'MBA',
  'MCA',
];

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

    if (!session) {
      router.push('/login');
      return;
    }

    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        setName(data.user.name);
        setProfileImage(data.user.profileImage ?? '');
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load profile');
        setLoading(false);
      });
  }, [session, sessionLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        profileImage: profileImage || null,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.message || 'Failed to update profile');
      return;
    }

    const { user: updatedUser } = await res.json();
    setUser(updatedUser);
    refetch();
    toast.success('Profile updated!');
    router.push('/profile');
  }

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

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-slate-500">Profile not found</p>
      </div>
    );
  }

  const inputCls = 'w-full rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-white/20 focus:bg-white/8';
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5';

  return (
    <div className="animate-fade-in p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Update your account information.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Full Name</label>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input
              className={`${inputCls} opacity-60`}
              value={user.email}
              disabled
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Profile Image URL</label>
          <input
            className={inputCls}
            placeholder="https://example.com/image.jpg"
            value={profileImage}
            onChange={(e) => setProfileImage(e.target.value)}
          />
        </div>

        {profileImage && (
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-white/5">
            <img src={profileImage} alt="Preview" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
