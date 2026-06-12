'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Users, Shield, Eye, EyeOff, Loader2, Zap, BookOpen, Calendar } from 'lucide-react';

type Role = 'STUDENT' | 'FACULTY' | 'ADMIN';

const roles: {
  value: Role;
  label: string;
  icon: React.ReactNode;
  description: string;
  gradient: string;
  activeGradient: string;
  activeBorder: string;
  activeText: string;
}[] = [
  {
    value: 'STUDENT',
    label: 'Student',
    icon: <GraduationCap className="h-5 w-5" />,
    description: 'Propose & vote on events',
    gradient: 'from-blue-500 to-cyan-500',
    activeGradient: 'from-blue-500/10 to-cyan-500/10',
    activeBorder: 'border-blue-500',
    activeText: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: 'FACULTY',
    label: 'Faculty',
    icon: <BookOpen className="h-5 w-5" />,
    description: 'Review & approve ideas',
    gradient: 'from-emerald-500 to-teal-500',
    activeGradient: 'from-emerald-500/10 to-teal-500/10',
    activeBorder: 'border-emerald-500',
    activeText: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    value: 'ADMIN',
    label: 'Admin',
    icon: <Shield className="h-5 w-5" />,
    description: 'Manage all operations',
    gradient: 'from-violet-500 to-indigo-500',
    activeGradient: 'from-violet-500/10 to-indigo-500/10',
    activeBorder: 'border-violet-500',
    activeText: 'text-violet-600 dark:text-violet-400',
  },
];

const features = [
  { icon: <Zap className="h-4 w-4" />, text: 'Real-time event voting' },
  { icon: <Users className="h-4 w-4" />, text: 'Community collaboration' },
  { icon: <Calendar className="h-4 w-4" />, text: 'Smart event calendar' },
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

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

  const activeRole = mode === 'login' ? roles.find((r) => r.value === loginRole)! : roles.find((r) => r.value === signupRole)!;

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
    if (!res.ok) { setLoginError('Incorrect email or password'); return; }
    router.push('/dashboard');
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');
    if (signupPassword !== confirmPassword) { setSignupError('Passwords do not match'); return; }
    if (signupPassword.length < 8) { setSignupError('Password must be at least 8 characters'); return; }
    setSignupLoading(true);
    const body: Record<string, unknown> = {
      name, email: signupEmail, password: signupPassword, role: signupRole,
      department: signupDepartment,
    };
    if (signupRole === 'STUDENT') {
      body.rollNumber = '';
    }
    if (signupRole === 'FACULTY') {
      body.employeeId = signupEmployeeId;
    }
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSignupLoading(false);
    if (res.status === 409) { setSignupError('An account with this email already exists'); return; }
    if (!res.ok) { setSignupError('Something went wrong. Please try again.'); return; }
    setSignupSuccess('Account created! You can now log in.');
    setName(''); setSignupEmail(''); setSignupPassword(''); setConfirmPassword('');
    setTimeout(() => setMode('login'), 1500);
  }

  function switchMode(m: 'login' | 'signup') {
    setMode(m);
    setLoginError('');
    setSignupError('');
    setSignupSuccess('');
  }

  function handleSignupRedirect() {
    if (signupRole === 'STUDENT') router.push('/signup/student');
    if (signupRole === 'FACULTY') router.push('/signup/faculty');
  }

return (
    <div className="relative flex min-h-screen overflow-hidden bg-slate-950">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br ${activeRole.gradient} opacity-10 blur-3xl transition-all duration-700`} />
        <div className={`absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br ${activeRole.gradient} opacity-10 blur-3xl transition-all duration-700`} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Left panel — branding */}
      <div className="relative hidden w-[45%] flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${activeRole.gradient} shadow-lg transition-all duration-500`}>
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">CampusConnect</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${activeRole.gradient} bg-opacity-10 px-4 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10`}>
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full bg-gradient-to-r ${activeRole.gradient} opacity-75`} />
                <span className={`relative inline-flex h-2 w-2 rounded-full bg-gradient-to-r ${activeRole.gradient}`} />
              </span>
              Platform is live
            </div>
            <h1 className="text-4xl font-bold leading-tight text-white">
              Where campus <br />
              <span className={`bg-gradient-to-r ${activeRole.gradient} bg-clip-text text-transparent`}>
                ideas become events
              </span>
            </h1>
            <p className="text-base leading-relaxed text-slate-400">
              A unified platform for students, faculty, and admins to collaborate on event proposals, voting, funding, and scheduling.
            </p>
          </div>

          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${activeRole.gradient} text-white`}>
                  {f.icon}
                </div>
                <span className="text-sm text-slate-300">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">© 2025 CampusConnect. Built for modern campuses.</p>
      </div>

      {/* Right panel — form */}
      <div className="relative flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo on mobile */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${activeRole.gradient}`}>
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold text-white">CampusConnect</span>
          </div>

          {/* Card */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
            <div className="p-7">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white">Welcome back</h2>
                <p className="mt-1 text-sm text-slate-400">Sign in to your account to continue</p>
              </div>

              {/* Role selector */}
              <div className="mb-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Select your role</p>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((r) => {
                    const isActive = loginRole === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setLoginRole(r.value)}
                        className={`group relative flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-200 ${
                          isActive
                            ? `border-opacity-80 bg-gradient-to-b ${r.activeGradient} ${r.activeBorder}`
                            : 'border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/6'
                        }`}
                      >
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                          isActive
                            ? `bg-gradient-to-br ${r.gradient} text-white shadow-lg`
                            : 'bg-white/8 text-slate-400 group-hover:text-slate-200'
                        }`}>
                          {r.icon}
                        </div>
                        <div className="text-center">
                          <p className={`text-xs font-semibold ${isActive ? r.activeText : 'text-slate-400'}`}>{r.label}</p>
                          <p className="mt-0.5 text-[10px] leading-tight text-slate-500">{r.description}</p>
                        </div>
                        {isActive && (
                          <div className={`absolute inset-0 rounded-xl ring-1 ${r.activeBorder} ring-inset opacity-50`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Email address</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@university.edu"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-white/25 focus:bg-white/8 focus:ring-2 focus:ring-white/5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Password</label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-11 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-white/25 focus:bg-white/8 focus:ring-2 focus:ring-white/5"
                    />
                    <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {loginError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    <p className="text-xs text-red-400">{loginError}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${activeRole.gradient} px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl active:scale-[0.98] disabled:opacity-60`}
                >
                  {loginLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : 'Sign In'}
                </button>
              </form>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <button type="button" onClick={() => router.push('/auth?mode=signup')} className="font-medium text-blue-600 hover:underline">
              Create one
            </button>
          </p>
          <p className="mt-6 text-center text-xs text-slate-600">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
