'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { Loader2, Shield, GraduationCap, BookOpen, Mail, Building } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load users');
        setLoading(false);
      });
  }, [session, router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Manage Users</h1>
        <p className="mt-1 text-sm text-slate-500">View all users on the platform.</p>
      </div>

      <div className="role-card rounded-2xl p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="pb-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
              <th className="pb-3 text-left text-xs font-medium uppercase text-slate-500">Email</th>
              <th className="pb-3 text-left text-xs font-medium uppercase text-slate-500">Role</th>
              <th className="pb-3 text-left text-xs font-medium uppercase text-slate-500">Department</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-white/5 last:border-0">
                <td className="py-3">
                  <span className="text-sm font-medium text-slate-200">{user.name}</span>
                </td>
                <td className="py-3">
                  <span className="text-sm text-slate-400">{user.email}</span>
                </td>
                <td className="py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.role === 'ADMIN' ? 'bg-violet-500/20 text-violet-400' :
                    user.role === 'FACULTY' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {user.role === 'ADMIN' && <Shield className="h-3 w-3" />}
                    {user.role === 'FACULTY' && <BookOpen className="h-3 w-3" />}
                    {user.role === 'STUDENT' && <GraduationCap className="h-3 w-3" />}
                    {user.role}
                  </span>
                </td>
                <td className="py-3">
                  <span className="text-sm text-slate-400">{user.department || '—'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}