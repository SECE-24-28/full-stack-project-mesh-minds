'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, BookOpen, Zap } from 'lucide-react';

const DEPARTMENTS = [
  'Computer Science and Engineering', 'Artificial Intelligence and Machine Learning',
  'Artificial Intelligence and Data Science', 'Information Technology',
  'Electronics and Communication Engineering', 'Electrical and Electronics Engineering',
  'Mechanical Engineering', 'Civil Engineering', 'Cyber Security', 'MBA', 'MCA',
];

const inputCls = 'w-full h-12 rounded-[14px] border border-[#E2E8F0] bg-white px-4 text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8] transition-all focus:border-[#4DC96A] focus:ring-3 focus:ring-[rgba(77,201,106,0.18)]';

export default function FacultySignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', employeeId: '', email: '', department: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeId || !form.department) { toast.error('Please fill all required fields'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }

    setLoading(true);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: 'FACULTY',
        employeeId: form.employeeId, department: form.department }),
    });
    setLoading(false);
    if (!res.ok) { const d = await res.json(); toast.error(d.message || 'Unable to register'); return; }
    toast.success('Account created! Please sign in.');
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F8FFF9' }}>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: '#4DC96A' }}>
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-[17px] font-bold text-[#0F172A]">CampusConnect</span>
        </div>

        <div className="bg-white rounded-[24px] border border-[#DDEEDD] p-8 shadow-[0_4px_32px_rgba(77,201,106,0.08)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[#E8FAE9]">
              <BookOpen className="h-5 w-5 text-[#4DC96A]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Faculty Registration</h2>
              <p className="text-xs text-[#64748B]">Create your faculty account</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Full Name *</label>
                <input className={inputCls} placeholder="Your name" value={form.name} onChange={set('name')} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Employee ID *</label>
                <input className={inputCls} placeholder="e.g. FAC001" value={form.employeeId} onChange={set('employeeId')} required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Email *</label>
              <input className={inputCls} type="email" placeholder="you@college.edu" value={form.email} onChange={set('email')} required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Department *</label>
              <select className={inputCls} value={form.department} onChange={set('department')} required>
                <option value="">Select department...</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Password *</label>
                <input className={inputCls} type="password" placeholder="Min 8 chars" value={form.password} onChange={set('password')} minLength={8} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Confirm *</label>
                <input className={inputCls} type="password" placeholder="Repeat" value={form.confirmPassword} onChange={set('confirmPassword')} minLength={8} required />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-[14px] text-white font-semibold text-sm flex items-center justify-center gap-2 mt-2 transition-all hover:scale-[1.01] hover:opacity-90 disabled:opacity-60"
              style={{ background: '#4DC96A', boxShadow: '0 4px 16px rgba(77,201,106,0.30)' }}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : 'Create Faculty Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-[#64748B]">
            Already have an account?{' '}
            <button onClick={() => router.push('/login')} className="font-semibold text-[#4DC96A] hover:underline">Sign In</button>
          </p>
        </div>
      </div>
    </div>
  );
}
