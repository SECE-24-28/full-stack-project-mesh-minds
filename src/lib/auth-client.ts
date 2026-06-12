'use client';

import { useCallback, useEffect, useState } from 'react';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  rollNumber?: string | null;
  year?: number | null;
  section?: string | null;
  employeeId?: string | null;
  department?: string | null;
  profileImage?: string | null;
}

export interface Session {
  user: SessionUser;
}

export function useSession() {
  const [data, setData] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const value = await fetch('/api/auth/session')
      .then((res) => res.json())
      .finally(() => setLoading(false));
    setData(value.session ?? null);
    return value.session ?? null;
  }, []);

  useEffect(() => {
    refetch()
      .finally(() => setLoading(false));
  }, [refetch]);

  return { data, loading, refetch };
}

export async function signIn(credentials: { email: string; password: string }) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function signOut() {
  await fetch('/api/auth/logout', { method: 'POST' });
}
