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
      <div className="flex min-h-screen items-center justify-center bg-[#F4F6FA]">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--role-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--role-bg, #F8F9FC)' }} data-role={role}>
      {children}
    </div>
  );
}
