'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Role } from '@/types';

interface Props { role: Role; onSwitchToSignup: () => void; verificationToken?: string | null; }

export function LoginForm({ role, onSwitchToSignup, verificationToken: initialToken }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    setLoading(false);
    if (!res.ok) { toast.error('Invalid email or password'); return; }
    toast.success('Signed in successfully');
    router.push('/dashboard');
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Email address</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@university.edu" required
          className="w-full h-12 rounded-[14px] border border-[#E2E8F0] bg-white px-4 text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8] transition-all focus:border-[#6366F1] focus:ring-3 focus:ring-[rgba(99,102,241,0.18)]" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••" required
          className="w-full h-12 rounded-[14px] border border-[#E2E8F0] bg-white px-4 text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8] transition-all focus:border-[#6366F1] focus:ring-3 focus:ring-[rgba(99,102,241,0.18)]" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full h-12 rounded-[14px] bg-[#6366F1] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:scale-[1.01] hover:opacity-90 transition-all disabled:opacity-60 shadow-[0_4px_16px_rgba(99,102,241,0.28)]">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : 'Sign In'}
      </button>
      <p className="text-center text-sm text-[#64748B]">
        Don&apos;t have an account?{' '}
        <button type="button" onClick={onSwitchToSignup} className="font-semibold text-[#6366F1] hover:underline">
          Create Account
        </button>
      </p>
    </form>
  );
}
