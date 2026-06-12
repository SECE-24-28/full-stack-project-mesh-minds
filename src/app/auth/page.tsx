'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Role } from '@/types';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { LoginForm } from '@/components/auth/LoginForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function AuthContent() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');
  const token = searchParams.get('token');
  const verified = searchParams.get('verified');
  const [role, setRole] = useState<Role>('STUDENT');
  const [mode, setMode] = useState<'login' | 'signup'>(modeParam === 'signup' ? 'signup' : 'login');
  const [verificationToken, setVerificationToken] = useState<string | null>(token);

  useEffect(() => {
    if (token) {
      setVerificationToken(token);
      setMode('login');
    }
  }, [token]);

  useEffect(() => {
    if (verified === 'true') {
      setMode('login');
    }
  }, [verified]);

  if (mode === 'signup') {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Choose your role to get started. Student and Faculty can register below.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => window.location.href = '/signup/student'}
                className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950"
              >
                <span className="text-sm font-medium">Student</span>
              </button>
              <button
                type="button"
                onClick={() => window.location.href = '/signup/faculty'}
                className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950"
              >
                <span className="text-sm font-medium">Faculty</span>
              </button>
            </div>
            <p className="text-center text-xs text-slate-500">
              Admin accounts can only be created by system administrators.
            </p>
            <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('login')} className="font-medium text-blue-600 hover:underline">
                Sign In
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sign in to manage campus events and collaborate.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <RoleSelector selectedRole={role} onRoleChange={setRole} />
          <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <LoginForm role={role} onSwitchToSignup={() => setMode('signup')} verificationToken={verificationToken} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}