import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';

export interface SignInScreenProps {
  onSignIn?: (credentials: { email: string; pass: string }) => void;
  systemStatusText?: string;
  clusterRegion?: string;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  systemStatusText = '99.98% Operational',
  clusterRegion = 'US-EAST-1',
}) => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  
  // Sign in / Registration fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('ADMIN');

  const [isLoading, setIsLoading] = useState(false);
  const [quickLoadingRole, setQuickLoadingRole] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const routeByRole = (userRole: string) => {
    const roleLower = String(userRole).toLowerCase();
    if (roleLower === 'admin') {
      navigate('/dashboard');
    } else if (roleLower === 'pm') {
      navigate('/pm');
    } else {
      navigate('/developer');
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoRole: string) => {
    setErrorMessage(null);
    setQuickLoadingRole(demoRole);
    setIsLoading(true);
    setEmail(demoEmail);
    setPassword('password123');

    try {
      const user = await login({ email: demoEmail, password: 'password123' });
      routeByRole(user.role);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to log into demo account. Please check server connection.');
    } finally {
      setIsLoading(false);
      setQuickLoadingRole(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const user = await login({ email, password });
        routeByRole(user.role);
      } else {
        const user = await register({ name, email, password, role });
        routeByRole(user.role);
      }
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (mode === 'signin'
            ? 'Invalid email or password. Please try again.'
            : 'Registration failed. Please verify your details.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden select-none bg-surface-container-lowest">
      {/* Left Sign-in Form */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-between px-6 sm:px-12 lg:px-16 py-6 bg-surface-container-lowest border-r border-outline-variant/30 relative z-10 telemetry-grid overflow-y-auto">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-surface-container-high border border-outline-variant/60 flex items-center justify-center relative overflow-hidden shadow-inner">
              <span className="material-symbols-outlined text-primary text-base font-medium">bolt</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-on-surface">Pulse</span>
                <span className="text-[10px] font-mono text-primary px-1.5 py-0.5 rounded-sm bg-surface-container-high border border-outline-variant/50">
                  v2.4.0
                </span>
              </div>
              <p className="text-[11px] font-mono text-on-surface-variant/80">Enterprise Workspace</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-sm bg-surface-container-low border border-outline-variant/40">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span className="text-[11px] font-mono text-on-surface-variant">{clusterRegion}</span>
          </div>
        </header>

        <main className="w-full max-w-md mx-auto my-4">
          {/* Header titles */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">
              {mode === 'signin' ? 'Welcome to Pulse' : 'Create an Account'}
            </h1>
            <p className="text-xs text-on-surface-variant mt-1">
              {mode === 'signin'
                ? 'Sign in or select a 1-click demo role below to evaluate live features.'
                : 'Register a new profile to access live telemetry and sprint boards.'}
            </p>
          </div>

          {/* ⚡ 1-Click Demo Profiles (For Recruiters / Portfolio Evaluation) */}
          <div className="mb-4 p-3 rounded-sm bg-surface-container-low border border-outline-variant/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs">bolt</span>
                1-Click Demo Access
              </span>
              <span className="text-[10px] font-mono text-on-surface-variant/70">Instant Login</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@pulsestudio.io', 'Admin')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-2 rounded-sm bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 hover:border-primary/50 text-on-surface transition-all active:scale-[0.98] disabled:opacity-50 text-center"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">👑</span>
                  <span className="text-[11px] font-bold text-primary">Admin</span>
                </div>
                <span className="text-[9px] font-mono text-on-surface-variant mt-0.5 truncate w-full">
                  {quickLoadingRole === 'Admin' ? 'Loading...' : 'Sarah C.'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('pm@pulsestudio.io', 'PM')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-2 rounded-sm bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 hover:border-secondary/50 text-on-surface transition-all active:scale-[0.98] disabled:opacity-50 text-center"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">📁</span>
                  <span className="text-[11px] font-bold text-secondary">PM</span>
                </div>
                <span className="text-[9px] font-mono text-on-surface-variant mt-0.5 truncate w-full">
                  {quickLoadingRole === 'PM' ? 'Loading...' : 'Alex M.'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('dev@pulsestudio.io', 'Developer')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-2 rounded-sm bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 hover:border-tertiary/50 text-on-surface transition-all active:scale-[0.98] disabled:opacity-50 text-center"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">💻</span>
                  <span className="text-[11px] font-bold text-tertiary">Developer</span>
                </div>
                <span className="text-[9px] font-mono text-on-surface-variant mt-0.5 truncate w-full">
                  {quickLoadingRole === 'Developer' ? 'Loading...' : 'Elena R.'}
                </span>
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-sm bg-surface-container-low p-0.5 mb-4 border border-outline-variant/40">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-sm transition-all ${
                mode === 'signin'
                  ? 'bg-surface-container-high text-on-surface shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-sm transition-all ${
                mode === 'register'
                  ? 'bg-surface-container-high text-on-surface shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-sm bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-3" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-mono text-on-surface mb-1">Full Name</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-base">person</span>
                  <input
                    className="w-full h-9 pl-9 pr-3 bg-surface-container-low rounded-sm border border-outline-variant/60 text-on-surface text-xs focus:outline-none focus:border-primary"
                    type="text"
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono text-on-surface mb-1">Work Email</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-base">mail</span>
                <input
                  className="w-full h-9 pl-9 pr-3 bg-surface-container-low rounded-sm border border-outline-variant/60 text-on-surface text-xs focus:outline-none focus:border-primary"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-mono text-on-surface">Password</label>
                {mode === 'register' && (
                  <span className="text-[10px] font-mono text-on-surface-variant">Min. 8 characters</span>
                )}
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-base">lock</span>
                <input
                  className="w-full h-9 pl-9 pr-10 bg-surface-container-low rounded-sm border border-outline-variant/60 text-on-surface text-xs focus:outline-none focus:border-primary"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 text-outline hover:text-on-surface p-1"
                >
                  <span className="material-symbols-outlined text-sm">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-mono text-on-surface mb-1.5">Assign Workspace Role</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'ADMIN' as UserRole, label: 'Admin', icon: '👑', desc: 'Full Visibility' },
                    { id: 'PM' as UserRole, label: 'PM', icon: '📁', desc: 'Sprint Lead' },
                    { id: 'DEVELOPER' as UserRole, label: 'Developer', icon: '💻', desc: 'Task Board' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`p-2 rounded-sm border text-left flex flex-col transition-all ${
                        role === r.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:border-outline-variant'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-xs">{r.icon}</span>
                        <span className="text-xs font-semibold">{r.label}</span>
                      </div>
                      <span className="text-[9px] font-mono text-on-surface-variant/80 mt-0.5">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'signin' && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface-variant">
                  <input
                    defaultChecked
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded-sm border-outline-variant bg-surface-container text-primary"
                  />
                  <span>Remember session</span>
                </label>
                <span className="text-[11px] font-mono text-outline">JWT Encrypted</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 mt-3 flex items-center justify-center gap-2 rounded-sm bg-primary hover:bg-inverse-primary disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md active:scale-[0.99]"
            >
              {isLoading && !quickLoadingRole ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  <span>{mode === 'signin' ? 'Authenticating...' : 'Creating Account...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign in to Workspace' : 'Create & Launch Workspace'}</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Hint */}
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-[11px] font-mono text-on-surface-variant/70">
            <span>Demo Password: <strong className="text-on-surface">password123</strong></span>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@pulsestudio.io');
                setPassword('password123');
                setMode('signin');
              }}
              className="text-primary hover:underline"
            >
              Auto-fill Admin
            </button>
          </div>
        </main>

        <footer className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-outline-variant/30 text-outline text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-on-surface-variant">System Status:</span>
            <span className="text-emerald-400">{systemStatusText}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Security & Compliance</span>
            <span>•</span>
            <span>Terms of Service</span>
          </div>
        </footer>
      </div>

      {/* Right Live Visual Experience */}
      <div className="hidden lg:flex lg:w-1/2 h-full bg-surface-container-lowest relative overflow-hidden flex-col justify-between p-12 select-none border-l border-outline-variant/20">
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex flex-col gap-1 font-mono text-[11px] text-on-surface-variant/70">
            <span className="text-primary font-semibold">[42.8523° N, 71.0492° W]</span>
            <span>CLUSTER_ID // US-EAST-ENTERPRISE-01</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high/90 border border-outline-variant/60 text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-emerald-400">NODE_04 ACTIVE</span>
            <span className="text-outline">|</span>
            <span className="text-on-surface-variant">14ms</span>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-surface-container-high border border-outline-variant/60 mb-4 text-[11px] font-mono text-tertiary">
            <span className="material-symbols-outlined text-sm">speed</span>
            <span>Engineering Throughput Engine</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface tracking-tight leading-tight">
            "Managing 42+ concurrent client sprints with zero drop in velocity."
          </h2>
          <p className="text-xs text-on-surface-variant mt-2 font-light">
            Pulse synchronizes multi-repo tasks, automated Figma tokens, and client approval flows in one unified terminal.
          </p>
        </div>

        <div className="relative z-20 self-end w-full max-w-md bg-surface-container/90 backdrop-blur-xl border border-outline-variant/60 rounded-sm p-4 shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/40 text-xs">
            <span className="font-semibold text-on-surface flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Real-Time Activity Feed
            </span>
            <span className="font-mono text-[10px] text-outline">LIVE FEED</span>
          </div>
          <div className="divide-y divide-outline-variant/30 py-1 text-xs">
            <div className="py-2 flex items-center justify-between">
              <span>Sarah C. created project <strong className="text-primary font-mono">Pulse Dashboard</strong></span>
              <span className="text-[10px] font-mono text-emerald-400">Admin</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span>Alex M. assigned task to Elena R.</span>
              <span className="text-[10px] font-mono text-primary">PM Action</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span>Elena R. moved task to <strong className="text-secondary font-mono">In Progress</strong></span>
              <span className="text-[10px] font-mono text-secondary">Dev Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
