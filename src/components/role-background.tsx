'use client';

import { useEffect } from 'react';
import { useSession } from '@/lib/auth-client';

export function RoleBackground({ children }: { children: React.ReactNode }) {
  const { data: session, loading } = useSession();
  const role = session?.user?.role ?? 'ADMIN';

  useEffect(() => {
    document.documentElement.setAttribute('data-role', role);
  }, [role]);

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: 'var(--role-bg, #F8F9FC)' }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-2"
          style={{ borderColor: 'var(--role-primary, #9FA1FF)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--role-bg)' }}
      data-role={role}
    >
      {children}
    </div>
  );
}
