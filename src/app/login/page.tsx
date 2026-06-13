'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, Shield, Eye, EyeOff, Loader2, Zap,
  BookOpen, Calendar, Users, ArrowRight, Star, CheckCircle2, TrendingUp,
} from 'lucide-react';

type Role = 'STUDENT' | 'FACULTY' | 'ADMIN';

const roles = [
  { value: 'STUDENT' as Role, label: 'Student',  icon: GraduationCap, desc: 'Discover & propose', accent: '#3B9EFF', soft: '#EBF5FF', soft2: '#D6ECFF' },
  { value: 'FACULTY' as Role, label: 'Faculty',  icon: BookOpen,       desc: 'Review & mentor',   accent: '#4DC96A', soft: '#E8FAE9', soft2: '#D4F5D8' },
  { value: 'ADMIN'   as Role, label: 'Admin',    icon: Shield,         desc: 'Manage platform',  accent: '#6366F1', soft: '#EDEDFF', soft2: '#E0E0FF' },
];

const features = [
  { icon: Star,          text: 'Propose and vote on campus events in real-time' },
  { icon: Users,         text: 'Multi-role collaboration across the entire campus' },
  { icon: Calendar,      text: 'Smart calendar with role-based event tracking' },
  { icon: TrendingUp,    text: 'Live analytics dashboard with engagement data' },
];

const previewEvents = [
  { title: 'Tech Symposium 2025',  date: 'Jan 20', tag: 'Technical', color: '#6366F1' },
  { title: 'Cultural Fest Spring', date: 'Jan 28', tag: 'Cultural',  color: '#EC4899' },
  { title: 'Hackathon Pro',        date: 'Feb 5',  tag: 'Hackathon', color: '#3B9EFF' },
];

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const activeRole = roles.find((r) => r.value === role)!;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    setLoading(false);
    if (!res.ok) { setError('Incorrect email or password. Please try again.'); return; }
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F8F9FC' }}>

      {/* ── LEFT PANEL 42% ── */}
      <div
        className="hidden lg:flex w-[42%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${activeRole.soft} 0%, #FFFFFF 100%)` }}
      >
        {/* Decorative blob */}
        <div
          className="absolute -top-24 -right-16 h-64 w-64 rounded-full blur-3xl opacity-40 transition-all duration-700"
          style={{ background: activeRole.soft2 }}
        />
        <div
          className="absolute -bottom-20 -left-12 h-72 w-72 rounded-full blur-3xl opacity-30 transition-all duration-700"
          style={{ background: activeRole.soft }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
            style={{ background: activeRole.accent, boxShadow: `0 4px 16px ${activeRole.accent}40` }}
          >
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[17px] font-bold text-[#0F172A]">CampusConnect</p>
            <p className="text-xs text-[#64748B]">Event Management Platform</p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative space-y-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: activeRole.soft2, color: activeRole.accent, border: `1px solid ${activeRole.soft2}` }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: activeRole.accent }} />
            Platform is Live
          </div>

          <div>
            <h1 className="text-[40px] font-bold text-[#0F172A] leading-[1.15]">
              Where campus<br />
              <span style={{ color: activeRole.accent }}>ideas become events</span>
            </h1>
            <p className="mt-4 text-[15px] text-[#64748B] leading-relaxed">
              A unified platform for students, faculty, and admins to collaborate on event proposals, voting, and scheduling.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-2.5">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3"
                style={{ border: '1px solid #E9ECF5', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}
              >
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: activeRole.soft }}
                >
                  <f.icon className="h-4 w-4" style={{ color: activeRole.accent }} />
                </div>
                <span className="text-sm text-[#475569] font-medium">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Event preview card */}
          <div
            className="rounded-2xl overflow-hidden bg-white"
            style={{ border: '1px solid #E9ECF5', boxShadow: '0 4px 16px rgba(15,23,42,0.06)' }}
          >
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #F1F5F9' }}>
              <Calendar className="h-4 w-4" style={{ color: activeRole.accent }} />
              <span className="text-sm font-semibold text-[#0F172A]">Upcoming Events</span>
              <span
                className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: activeRole.soft, color: activeRole.accent }}
              >LIVE</span>
            </div>
            {previewEvents.map((ev, i) => (
              <div
                key={i}
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: i < 2 ? '1px solid #F8FAFC' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${ev.color}12` }}
                  >
                    <Star className="h-3.5 w-3.5" style={{ color: ev.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A]">{ev.title}</p>
                    <p className="text-[10px] text-[#94A3B8]">{ev.date}</p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${ev.color}12`, color: ev.color }}
                >
                  {ev.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-[#94A3B8]">© 2025 CampusConnect · Built for modern campuses</p>
      </div>

      {/* ── RIGHT PANEL 58% ── */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-14">
        <div className="w-full max-w-[420px] animate-fade-up">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center text-white"
              style={{ background: activeRole.accent }}
            >
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-[17px] font-bold text-[#0F172A]">CampusConnect</span>
          </div>

          {/* Card */}
          <div className="login-glass-card p-8">
            <div className="mb-6">
              <h2 className="text-[22px] font-bold text-[#0F172A]">Welcome back</h2>
              <p className="text-sm text-[#64748B] mt-1">Sign in to your account to continue</p>
            </div>

            {/* Role selector */}
            <div className="mb-6">
              <label className="saas-label">Select your role</label>
              <div className="grid grid-cols-3 gap-2.5">
                {roles.map((r) => {
                  const isActive = role === r.value;
                  const RoleIcon = r.icon;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-150"
                      style={{
                        background: isActive ? r.soft : '#F8FAFC',
                        border: `1.5px solid ${isActive ? r.soft2 : '#E9ECF5'}`,
                        boxShadow: isActive ? `0 2px 12px ${r.accent}20` : 'none',
                      }}
                    >
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center"
                        style={{ background: isActive ? r.accent : '#F1F5F9' }}
                      >
                        <RoleIcon className="h-4 w-4" style={{ color: isActive ? '#FFFFFF' : '#94A3B8' }} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold" style={{ color: isActive ? r.accent : '#64748B' }}>{r.label}</p>
                        <p className="text-[10px] mt-0.5 text-[#94A3B8]">{r.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="saas-label">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  required
                  className="login-input"
                />
              </div>

              <div>
                <label className="saas-label">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="login-input"
                    style={{ paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                  <div className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl text-white font-semibold text-[15px] h-[48px] mt-1 transition-all hover:scale-[1.01] disabled:opacity-60"
                style={{
                  background: activeRole.accent,
                  boxShadow: `0 4px 20px ${activeRole.accent}40`,
                }}
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                  : <>Sign In <ArrowRight className="h-4 w-4" /></>
                }
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-[#F1F5F9] space-y-2">
              <p className="text-center text-sm text-[#64748B]">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/auth?mode=signup')}
                  className="font-semibold hover:underline"
                  style={{ color: activeRole.accent }}
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
