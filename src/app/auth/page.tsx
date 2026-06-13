'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Role } from '@/types';
import { GraduationCap, BookOpen, Zap } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const modeParam = searchParams.get('mode');
  const token = searchParams.get('token');
  const [role, setRole] = useState<Role>('STUDENT');
  const [mode, setMode] = useState<'login' | 'signup'>(modeParam === 'signup' ? 'signup' : 'login');
  const [verificationToken, setVerificationToken] = useState<string | null>(token);

  useEffect(() => { if (token) { setVerificationToken(token); setMode('login'); } }, [token]);

  if (mode === 'signup') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F8F9FC' }}>
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-9 w-9 rounded-xl bg-[#6366F1] flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-[17px] font-bold text-[#0F172A]">CampusConnect</span>
          </div>

          <div className="bg-white rounded-[24px] border border-[#E9ECF5] p-8 shadow-[0_4px_32px_rgba(15,23,42,0.08)]">
            <h2 className="text-xl font-bold text-[#0F172A] mb-1">Create your account</h2>
            <p className="text-sm text-[#64748B] mb-6">Choose your role to get started</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Student', icon: GraduationCap, href: '/signup/student', color: '#3B9EFF', soft: '#EBF5FF' },
                { label: 'Faculty', icon: BookOpen, href: '/signup/faculty', color: '#4DC96A', soft: '#E8FAE9' },
              ].map((r) => (
                <button key={r.label} type="button" onClick={() => router.push(r.href)}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all hover:scale-[1.02]"
                  style={{ border: `2px solid ${r.soft}`, background: r.soft }}>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: r.color }}>
                    <r.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: r.color }}>{r.label}</span>
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-[#94A3B8] mb-4">
              Admin accounts are created by system administrators only.
            </p>
            <p className="text-center text-sm text-[#64748B]">
              Already have an account?{' '}
              <button onClick={() => router.push('/login')} className="font-semibold text-[#6366F1] hover:underline">
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F8F9FC' }}>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-9 w-9 rounded-xl bg-[#6366F1] flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-[17px] font-bold text-[#0F172A]">CampusConnect</span>
        </div>

        <div className="bg-white rounded-[24px] border border-[#E9ECF5] p-8 shadow-[0_4px_32px_rgba(15,23,42,0.08)]">
          <h2 className="text-xl font-bold text-[#0F172A] mb-1">Welcome back</h2>
          <p className="text-sm text-[#64748B] mb-6">Sign in to manage campus events</p>

          {/* Role tabs */}
          <div className="flex rounded-xl border border-[#E9ECF5] p-1 mb-6 gap-1">
            {(['STUDENT', 'FACULTY', 'ADMIN'] as Role[]).map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
                style={role === r
                  ? { background: '#6366F1', color: '#FFFFFF' }
                  : { color: '#64748B' }
                }>
                {r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <LoginForm role={role} onSwitchToSignup={() => setMode('signup')} verificationToken={verificationToken} />
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F8F9FC]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" />
    </div>}>
      <AuthContent />
    </Suspense>
  );
}
