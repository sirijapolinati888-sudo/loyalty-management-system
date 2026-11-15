import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import {
  ShieldCheck, Lock, Mail, AlertCircle, Eye, EyeOff, UserCheck,
  Store, BarChart3, Settings2, ArrowRight, Layers, Database, Check
} from 'lucide-react';
import { cx, toneStyles, type Tone } from '../components/ui';

const features = [
  { icon: ShieldCheck, title: 'Auditable & accurate', text: 'Immutable ledger with full reconciliation' },
  { icon: Layers, title: 'Scalable & reliable', text: 'Built for millions of members and transactions' },
  { icon: BarChart3, title: 'Anomaly monitoring', text: 'Detect and explain loyalty data issues' },
  { icon: Database, title: 'Synthetic data ready', text: 'Reproducible, seeded datasets on demand' },
];

const demoAccounts: { email: string; label: string; hint: string; icon: React.ComponentType<{ className?: string }>; tone: Tone }[] = [
  { email: 'ops@yottaflex.ai', label: 'Ops Manager', hint: 'Full audit access', icon: Settings2, tone: 'brand' },
  { email: 'operator@yottaflex.ai', label: 'Store Operator', hint: 'Returns & refunds', icon: Store, tone: 'emerald' },
  { email: 'analyst@yottaflex.ai', label: 'Analyst', hint: 'Analytics & rules', icon: BarChart3, tone: 'amber' },
  { email: 'customer@yottaflex.ai', label: 'Customer', hint: 'Points & rewards', icon: UserCheck, tone: 'pink' },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as any)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        const defaultRouteMap: Record<UserRole, string> = {
          OPERATIONS_MANAGER: '/',
          STORE_OPERATOR: '/orders',
          ANALYST: '/validation',
          CUSTOMER: '/ledger',
        };
        navigate(defaultRouteMap[user.role] || '/', { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="h-screen w-full flex bg-[var(--bg)] overflow-hidden">
      {/* ================= Brand panel ================= */}
      <aside className="hidden lg:flex relative w-[46%] xl:w-[44%] flex-col justify-between overflow-hidden bg-[#0b0a1f] p-8 xl:p-10 text-white">
        {/* Animated mesh */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full bg-brand-600/40 blur-[110px] animate-drift" />
          <div className="absolute top-1/3 -right-40 w-[460px] h-[460px] rounded-full bg-cyan-500/20 blur-[110px] animate-drift" style={{ animationDelay: '-6s' }} />
          <div className="absolute -bottom-40 left-1/4 w-[420px] h-[420px] rounded-full bg-fuchsia-500/20 blur-[110px] animate-drift" style={{ animationDelay: '-12s' }} />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              maskImage: 'radial-gradient(ellipse at 30% 40%, black 20%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse at 30% 40%, black 20%, transparent 70%)',
            }}
          />
        </div>

        <div className="relative animate-fade-up group logo-hover w-fit">
          <Logo size={38} tone="dark" />
        </div>

        <div className="relative max-w-md my-auto py-4">
          <span className="inline-flex items-center gap-2 h-6 px-2.5 rounded-full bg-white/[0.06] ring-1 ring-white/10 text-[12px] text-slate-300 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <span className="live-dot text-emerald-400" /> Ledger online · v2.0
          </span>
          <h1 className="mt-4 text-[36px] xl:text-[42px] font-bold leading-[1.08] tracking-[-0.03em] animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Every point,
            <br />
            <span className="bg-gradient-to-r from-brand-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent animate-gradient">
              accounted for.
            </span>
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-400 animate-fade-up" style={{ animationDelay: '0.15s' }}>
            The enterprise loyalty ledger with an auditable rules engine, FIFO expiry and independent reconciliation.
          </p>

          <ul className="mt-6 space-y-2">
            {features.map((f, i) => (
              <li
                key={f.title}
                style={{ animationDelay: `${0.22 + i * 0.07}s` }}
                className="group flex items-center gap-3 p-2 -mx-2 rounded-xl transition-colors duration-300 hover:bg-white/[0.04] animate-fade-up"
              >
                <span className="w-8 h-8 rounded-lg bg-white/[0.06] ring-1 ring-white/10 flex items-center justify-center text-brand-200 transition-all duration-500 group-hover:bg-brand-500/30 group-hover:text-white group-hover:scale-105 shrink-0">
                  <f.icon className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-[13.5px] font-medium text-white">{f.title}</p>
                  <p className="text-[12px] text-slate-400">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12px] text-slate-500">© 2026 Loyalty Points Management · Seed 20261022</p>
      </aside>

      {/* ================= Form panel ================= */}
      <main className="flex-1 flex items-center justify-center px-5 py-4 sm:px-8 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 right-0 w-[480px] h-[480px] rounded-full bg-brand-200/40 blur-[120px]" />

        <div className="relative w-full max-w-[420px]">
          <div className="lg:hidden mb-4 animate-fade-up group logo-hover w-fit">
            <Logo size={36} tone="light" />
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <h2 className="text-[26px] font-bold tracking-tight text-[var(--text)]">Welcome back</h2>
            <p className="mt-1 text-[14px] text-[var(--text-3)]">Sign in to your loyalty console.</p>
          </div>

          <form className="mt-5 space-y-3.5 animate-fade-up" style={{ animationDelay: '0.1s' }} onSubmit={handleSubmit}>
            {error && (
              <div className="callout bg-rose-50 border-rose-200 text-rose-700 animate-scale-in py-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                <span className="text-[13px]">{error}</span>
              </div>
            )}

            <div>
              <label className="label text-[13px]" htmlFor="email">Work email</label>
              <div className="relative group">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] pointer-events-none transition-colors group-focus-within:text-brand-600" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@yottaflex.ai"
                  className="input input-with-icon h-10 text-[13.5px]"
                />
              </div>
            </div>

            <div>
              <label className="label text-[13px]" htmlFor="password">Password</label>
              <div className="relative group">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] pointer-events-none transition-colors group-focus-within:text-brand-600" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input input-with-icon h-10 pr-10 text-[13.5px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-[var(--text)] hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full group py-2.5">
              {isSubmitting ? (
                <><span className="spinner !border-white/30 !border-t-white" /> Signing in…</>
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" /></>
              )}
            </button>
          </form>

          <div className="relative my-5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="divider" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 bg-[var(--bg)] text-[12px] text-[var(--text-3)]">
              or use a demo account
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 stagger">
            {demoAccounts.map((acc) => {
              const selected = email === acc.email;
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email)}
                  className={cx(
                    'card card-hover group relative p-2.5 text-left cursor-pointer flex items-center gap-2.5',
                    selected && '!border-brand-400 ring-4 ring-brand-500/10',
                  )}
                >
                  <span className={cx('icon-tile icon-tile-sm !w-8 !h-8', toneStyles[acc.tone].tile)}>
                    <acc.icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-[var(--text)] truncate">{acc.label}</span>
                    <span className="block text-[11px] text-[var(--text-3)] truncate">{acc.hint}</span>
                  </span>
                  {selected && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center animate-scale-in">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-5 flex items-center justify-center gap-2 text-[12px] text-[var(--text-3)] animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            Signed session tokens · Role-based access control
          </p>
        </div>
      </main>
    </div>
  );
};
