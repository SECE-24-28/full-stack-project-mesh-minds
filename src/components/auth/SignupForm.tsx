'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Role } from '@/types';

interface SignupFormProps {
  role: Role;
  onSwitchToLogin: () => void;
}

export function SignupForm({ role, onSwitchToLogin }: SignupFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);

  const showFacultyFields = role === 'FACULTY';

  if (role === 'ADMIN') {
    return (
      <>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Role Selected: Admin</p>
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Admin accounts can only be created by system administrators.
        </p>
        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToLogin} className="font-medium text-blue-600 hover:underline">
            Sign In
          </button>
        </p>
      </>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    const body: Record<string, string> = {
      name,
      email,
      password,
      role,
    };
    if (showFacultyFields) {
      body.department = department;
      body.employeeId = employeeId;
    }

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error('Unable to register');
      return;
    }

    const data = await res.json();
    if (data.user?.verificationToken) {
      router.push(`/auth?mode=login&token=${data.user.verificationToken}`);
      toast.success('Account created! Check the verification token below.');
    } else {
      router.push('/auth');
      toast.success('Account created');
    }
  }

  return (
    <>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Role Selected: {role.charAt(0) + role.slice(1).toLowerCase()}</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        <Input placeholder="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required />
        {showFacultyFields && (
          <>
            <Input placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} required />
            <Input placeholder="Employee ID" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required />
          </>
        )}
        <Button className="w-full" disabled={loading}>
          {loading ? 'Creating...' : 'Create Account'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="font-medium text-blue-600 hover:underline">
          Sign In
        </button>
      </p>
    </>
  );
}