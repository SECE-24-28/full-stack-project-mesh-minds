'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { Loader2, Shield, GraduationCap, BookOpen, Search } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

const roleBadge: Record<string, { cls: string; icon: React.ElementType }> = {
  ADMIN:   { cls: 'badge badge-completed', icon: Shield },
  FACULTY: { cls: 'badge badge-accepted',  icon: BookOpen },
  STUDENT: { cls: 'badge badge-review',    icon: GraduationCap },
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!session) { router.push('/login'); return; }
    if (session.user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => { setUsers(d.users || []); setLoading(false); })
      .catch(() => { toast.error('Failed to load users'); setLoading(false); });
  }, [session, router]);

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--role-accent)' }} />
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-up" data-role="ADMIN">
      <div className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">View and manage all platform users</p>
        </div>
        <div className="text-sm text-[#94A3B8] bg-white border border-[#E9ECF5] rounded-xl px-4 py-2 font-medium">
          {filtered.length} users
        </div>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="saas-input pl-11"
          style={{ height: '44px' }}
        />
      </div>

      <div className="saas-table-wrap">
        <table className="saas-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const rb = roleBadge[user.role] ?? roleBadge.STUDENT;
              const RoleIcon = rb.icon;
              return (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: 'var(--role-accent)' }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-[#1E293B]">{user.name}</span>
                    </div>
                  </td>
                  <td className="text-[#64748B]">{user.email}</td>
                  <td>
                    <span className={`${rb.cls} inline-flex items-center gap-1`}>
                      <RoleIcon className="h-3 w-3" />
                      {user.role}
                    </span>
                  </td>
                  <td className="text-[#94A3B8]">{user.department || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-[#94A3B8]">No users found.</p>
        )}
      </div>
    </div>
  );
}
