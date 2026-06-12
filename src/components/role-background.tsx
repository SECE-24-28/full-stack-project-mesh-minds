'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';

export function RoleBackground({ children }: { children: React.ReactNode }) {
  const { data: session, loading } = useSession();
  const [role, setRole] = useState<string>('STUDENT');

  useEffect(() => {
    if (session?.user?.role) setRole(session.user.role);
  }, [session]);

  if (loading) {
    return (
      <div className="role-bg-student flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      </div>
    );
  }

  const bgClass =
    role === 'FACULTY' ? 'role-bg-faculty' :
    role === 'ADMIN'   ? 'role-bg-admin'   :
                         'role-bg-student';

  return (
    <div className={`${bgClass} relative min-h-screen`}>
      {/* Noise texture overlay */}
      <div className="pointer-events-none absolute inset-0 role-noise" />
      {children}
    </div>
  );
}
