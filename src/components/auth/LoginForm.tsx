'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Role } from '@/types';

interface LoginFormProps {
  role: Role;
  onSwitchToSignup: () => void;
  verificationToken?: string | null;
}

export function LoginForm({ role, onSwitchToSignup, verificationToken: initialToken }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(!!initialToken);
  const [verificationToken, setVerificationToken] = useState<string | null>(initialToken ?? null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error('Invalid credentials');
      return;
    }

    const data = await res.json();

    if (data.needsVerification) {
      setNeedsVerification(true);
      if (data.verificationToken) {
        setVerificationToken(data.verificationToken);
      }
      toast.info('Please check your email for verification link');
      return;
    }

    toast.success('Signed in successfully');
    router.push('/dashboard');
  }

  async function verifyEmail() {
    if (!verificationToken) return;
    const res = await fetch(`/api/auth/verify?token=${verificationToken}`);
    if (res.redirected) {
      router.push(res.url);
    } else {
      const data = await res.json();
      if (data.message) {
        toast.success('Email verified!');
        setNeedsVerification(false);
      }
    }
  }

  return (
    <>
      {needsVerification && (
        <div className="rounded-md bg-amber-500/10 p-3 text-center text-sm text-amber-600">
          <p className="mb-2">Verification required. Check your email for the verification link.</p>
          <p className="mb-3 font-mono text-xs">Token: {verificationToken}</p>
          <Button type="button" size="sm" onClick={verifyEmail}>Verify Now</Button>
        </div>
      )}
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Role Selected: {role.charAt(0) + role.slice(1).toLowerCase()}</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={needsVerification} />
        <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={needsVerification} />
        <Button className="w-full" disabled={loading || needsVerification}>
          {loading ? 'Signing in...' : needsVerification ? 'Check your email' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
        Do&apos;t have an account?{' '}
        <button type="button" onClick={onSwitchToSignup} className="font-medium text-blue-600 hover:underline">
          Create Account
        </button>
      </p>
    </>
  );
}