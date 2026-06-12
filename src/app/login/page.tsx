'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Shield, Eye, EyeOff, Loader2, Zap, BookOpen, Calendar, Users, ArrowRight, TrendingUp, Star, CheckCircle2 } from 'lucide-react';

type Role = 'STUDENT' | 'FACULTY' | 'ADMIN';

const roles = [
  { value: 'STUDENT' as Role, label: 'Student', icon: GraduationCap, desc: 'Propose & vote',   color: '#76ABAE', bg: '#31363F', textBg: 'rgba(118,171,174,0.12)' },
  { value: 'FACULTY' as Role, label: 'Faculty', icon: BookOpen,      desc: 'Review & approve', color: '#BF953F', bg: '#FBF3D5', textBg: 'rgba(191,149,63,0.10)'  },
  { value: 'ADMIN'   as Role, label: 'Admin',   icon: Shield,        desc: 'Manage all',       color: '#7879F1', bg: '#EEEEFF', textBg: 'rgba(120,121,241,0.10)'  },
];

const stats = [
  { label: 'Active Events',    value: '24',  icon: Calendar,    color: '#76ABAE' },
  { label: 'Students',         value: '1.2k', icon: Users,       color: '#7879F1' },
  { label: 'Proposals',        value: '86',  icon: TrendingUp,  color: '#BF953F' },
  { label: 'Approved',         value: '58',  icon: CheckCircle2, color: '#4DC96A' },
];

const upcomingEvents = [
  { title: 'Tech Symposium 2025',   date: 'Jan 20', tag: 'Technology', color: '#7879F1' },
  { title: 'Cultural Fest',         date: 'Jan 25', tag: 'Culture',    color: '#BF953F' },
  { title: 'Hackathon Spring',      date: 'Feb 3',  tag: 'Coding',     color: '#76ABAE' },
];

export default function LoginPage() {
  const router = useRouter();
  const [loginRole, setLoginRole] = useState<Role>('STUDENT');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [signupRole, setSignupRole] = useState<Role>('STUDENT');
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupDepartment, setSignupDepartment] = useState('');
  const [signupEmployeeId, setSignupEmployeeId] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const DEPARTMENTS = [
    'Computer Science and Engineering',
    'Information Technology',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Artificial Intelligence and Data Science',
    'Cyber Security',
    'MBA',
    'MCA',
  ];

  const activeRole = roles.find((r) => r.value === loginRole)!;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password: loginPassword, role: loginRole }),
    });
    setLoginLoading(false);
    if (!res.ok) { setLoginError('Incorrect email or password. Please try again.'); return; }
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F4F6FA' }}>
      {/* Left branding panel */}
      <div
        className="hidden lg:flex w-[48%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1a1f2e 0%, #222831 50%, #2a3040 100%)' }}
      >
        {/* Floating shapes */}
        <div className="absolute top-16 right-12 h-40 w-40 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #76ABAE, transparent)' }} />
        <div className="absolute bottom-24 left-8 h-56 w-56 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #7879F1, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #BF953F, transparent)' }} />
        <div className="absolute top-32 left-32 h-4 w-4 rounded-full opacity-40" style={{ background: '#76ABAE' }} />
        <div className="absolute bottom-48 right-24 h-3 w-3 rounded-full opacity-30" style={{ background: '#7879F1' }} />
        <div className="absolute top-2/3 left-16 h-2 w-2 rounded-full opacity-50" style={{ background: '#BF953F' }} />

        <div className="relative flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white" style={{ background: activeRole.color }}>
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-[17px] font-bold text-white">CampusConnect</span>
        </div>

        <div className="relative space-y-8">
          {/* Headline */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5" style={{ background: 'rgba(118,171,174,0.15)', color: '#76ABAE' }}>
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#76ABAE' }} />
              Platform is live
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Where Campus<br />
              <span style={{ color: activeRole.color }}>Ideas Become Events</span>
            </h1>
            <p className="mt-4 text-[#AAAAAA] text-base leading-relaxed">
              A unified platform for students, faculty, and admins to collaborate on event proposals, voting, and scheduling.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-2">
            {stats.map((s, i) => (
              <div key={i} className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <s.icon className="h-4 w-4 mx-auto mb-1.5" style={{ color: s.color }} />
                <p className="text-lg font-bold text-white leading-none">{s.value}</p>
                <p className="text-[10px] mt-1" style={{ color: '#888' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Upcoming events preview */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <Calendar className="h-4 w-4" style={{ color: '#76ABAE' }} />
              <span className="text-xs font-semibold text-white">Upcoming Events</span>
            </div>
            {upcomingEvents.map((ev, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${ev.color}22` }}>
                    <Star className="h-3.5 w-3.5" style={{ color: ev.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{ev.title}</p>
                    <p className="text-[10px]" style={{ color: '#888' }}>{ev.date}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${ev.color}22`, color: ev.color }}>{ev.tag}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs" style={{ color: '#555' }}>© 2025 CampusConnect. Built for modern campuses.</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white" style={{ background: activeRole.color }}>
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-[17px] font-bold text-[#0F172A]">CampusConnect</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-[24px] border border-[#E4E8F0] p-8 shadow-[0px_4px_32px_rgba(15,23,42,0.08)]">
            <div className="mb-7">
              <h2 className="text-[22px] font-bold text-[#0F172A]">Welcome back</h2>
              <p className="text-sm text-[#64748B] mt-1">Sign in to your account to continue</p>
            </div>

            {/* Role Selector */}
            <div className="mb-6">
              <label className="saas-label">Select your role</label>
              <div className="grid grid-cols-3 gap-2.5">
                {roles.map((r) => {
                  const isActive = loginRole === r.value;
                  const RoleIcon = r.icon;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setLoginRole(r.value)}
                      className="relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-150"
                      style={{
                        borderColor: isActive ? r.color : '#E4E8F0',
                        background: isActive ? r.textBg : '#FAFBFF',
                      }}
                    >
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: isActive ? r.color : '#F1F5F9' }}>
                        <RoleIcon className="h-4 w-4" style={{ color: isActive ? '#FFFFFF' : '#94A3B8' }} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold" style={{ color: isActive ? r.color : '#64748B' }}>{r.label}</p>
                        <p className="text-[10px] text-[#94A3B8] leading-tight mt-0.5">{r.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="saas-label">Email address</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@university.edu"
                  required
                  className="saas-input"
                />
              </div>

              <div>
                <label className="saas-label">Password</label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="saas-input"
                    style={{ paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                  <div className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-600">{loginError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl text-white font-semibold text-sm h-[48px] mt-1 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: activeRole.color, boxShadow: `0 4px 16px ${activeRole.color}40` }}
              >
                {loginLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                ) : (
                  <>Sign In <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-[#F1F5F9] flex flex-col gap-2.5">
              <p className="text-center text-sm text-[#64748B]">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/auth?mode=signup')}
                  className="font-semibold hover:underline"
                  style={{ color: activeRole.color }}
                >
                  Create one
                </button>
              </p>
              <p className="text-center text-xs text-[#94A3B8]">
                By signing in, you agree to our Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
