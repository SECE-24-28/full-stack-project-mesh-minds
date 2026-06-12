'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Artificial Intelligence and Machine Learning',
  'Artificial Intelligence and Data Science',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Cyber Security',
  'MBA',
  'MCA',
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SECTIONS = ['A', 'B', 'C', 'D'];

export default function StudentSignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rollNumber || !department || !year || !section) {
      toast.error('Please fill all required fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        role: 'STUDENT',
        rollNumber,
        department,
        year: YEARS.indexOf(year) + 1,
        section,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.message || 'Unable to register');
      return;
    }

    router.push('/auth');
    toast.success('Account created! Please sign in.');
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Student Registration</CardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Create your student account to propose events and participate.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input placeholder="Roll Number" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} required />
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Select placeholder="Select Department" value={department} onChange={(e) => setDepartment(e.target.value)} required>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
            <Select placeholder="Select Year" value={year} onChange={(e) => setYear(e.target.value)} required>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
            <Select placeholder="Select Section" value={section} onChange={(e) => setSection(e.target.value)} required>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            <Input placeholder="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required />
            <Button className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <button type="button" onClick={() => router.push('/auth')} className="font-medium text-blue-600 hover:underline">
              Sign In
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}