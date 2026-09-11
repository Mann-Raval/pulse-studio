import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export interface SignInScreenProps {
  onSignIn?: (credentials: { email: string; pass: string }) => void;
  systemStatusText?: string;
  clusterRegion?: string;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onSignIn,
  systemStatusText = '99.98% Operational',
  clusterRegion = 'US-EAST-1',
}) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('marcus.lead@pulsestudio.agency');
  const [password, setPassword] = useState('masterpassword');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: POST /api/auth/login with { email, password }
    if (onSignIn) {
      onSignIn({ email, pass: password });
    } else {
      navigate('/dashboard');
    }
  };

  const handleSSOLogin = (provider: 'google' | 'github') => {
    // TODO: Initiate OAuth SSO flow: window.location.href = `/api/auth/${provider}`
    console.log(`Initiating SSO login with provider: ${provider}`);
    navigate('/dashboard');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden select-none bg-surface-container-lowest">
      {/* Left Sign-in Form */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-between px-8 sm:px-14 lg:px-20 py-8 bg-surface-container-lowest border-r border-outline-variant/30 relative z-10 telemetry-grid">
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

        <main className="w-full max-w-md mx-auto my-auto py-4">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Welcome back</h1>
            <p className="text-xs text-on-surface-variant mt-1.5">
              Enter your agency credentials to access real-time ops.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => handleSSOLogin('google')}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-sm bg-surface-container-low hover:bg-surface-container border border-outline-variant/50 text-on-surface text-xs font-medium transition-colors"
            >
              <span className="text-xs font-semibold">Google SSO</span>
            </button>
            <button
              type="button"
              onClick={() => handleSSOLogin('github')}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-sm bg-surface-container-low hover:bg-surface-container border border-outline-variant/50 text-on-surface text-xs font-medium transition-colors"
            >
              <span className="text-xs font-semibold">GitHub Ent.</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-outline-variant/40 w-full"></div>
            <span className="bg-surface-container-lowest px-3 text-[10px] font-mono text-outline uppercase tracking-wider relative z-10">
              or sign in with email
            </span>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[11px] font-mono text-on-surface mb-1.5">Work Email</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-base">mail</span>
                <input
                  className="w-full h-9 pl-9 pr-3 bg-surface-container-low rounded-sm border border-outline-variant/60 text-on-surface text-xs focus:outline-none focus:border-primary"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono text-on-surface">Password</label>
                <span className="text-[11px] font-mono text-primary hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-base">lock</span>
                <input
                  className="w-full h-9 pl-9 pr-10 bg-surface-container-low rounded-sm border border-outline-variant/60 text-on-surface text-xs focus:outline-none focus:border-primary"
                  type={showPassword ? 'text' : 'password'}
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface-variant">
                <input
                  defaultChecked
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded-sm border-outline-variant bg-surface-container text-primary"
                />
                <span>Remember device for 30 days</span>
              </label>
              <span className="text-[11px] font-mono text-outline">SSO ready</span>
            </div>

            <button
              type="submit"
              className="w-full h-9 mt-2 flex items-center justify-center gap-2 rounded-sm bg-primary hover:bg-inverse-primary text-white text-xs font-semibold transition-all shadow-md active:scale-[0.99]"
            >
              <span>Sign in to Workspace</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </form>

          <div className="mt-6 p-3 rounded-sm bg-surface-container-low/60 border border-outline-variant/40 flex items-start gap-2.5 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-base">info</span>
            <p>
              Admins, PMs, and Developers sign in here. Direct navigation shortcuts:
              <br />
              <Link to="/dashboard" className="text-primary hover:underline mr-2">Admin Dashboard</Link> • 
              <Link to="/pm" className="text-primary hover:underline mx-2">PM Overview</Link> • 
              <Link to="/developer" className="text-primary hover:underline ml-2">Developer Workspace</Link>
            </p>
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
              <span>Marcus L. resolved blocker <strong className="text-primary font-mono">PLS-882</strong></span>
              <span className="text-[10px] font-mono text-emerald-400">PR Merged</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span>Sarah K. published 8 tokens to Nova AI v1.2</span>
              <span className="text-[10px] font-mono text-primary">Figma v1.2</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span>FinPulse Redesign: Hotfix deployed</span>
              <span className="text-[10px] font-mono text-secondary">Prod Live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
