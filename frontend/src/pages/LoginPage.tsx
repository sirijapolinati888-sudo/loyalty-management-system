import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import logoImg from '../assets/Logo.png';
import {
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Store,
  BarChart3,
  Settings2,
  LogIn,
  Layers,
  Database
} from 'lucide-react';

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
  };

  return (
    <div className="min-h-screen lg:h-screen w-full relative flex flex-col lg:flex-row bg-[#ece8f9] text-slate-900 font-sans antialiased overflow-y-auto lg:overflow-hidden">
      {/* =========================================================================
          BACKGROUND AMBIENT CANVAS & CURVED WAVE SHAPE
          ========================================================================= */}
      {/* Base Dark Deep Indigo/Navy to Purple Gradient on Left */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c0d28] via-[#1b1046] to-[#4c168f] pointer-events-none" />

      {/* SVG Wave Shape dividing the Left Dark Brand Area and Right Lavender Canvas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden lg:block">
        <svg
          className="absolute top-0 right-0 h-full w-[60%] xl:w-[58%] text-[#ece8f9]"
          viewBox="0 0 600 800"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M 120 0 C 40 120, 20 220, 70 360 C 130 520, 80 680, 0 800 L 600 800 L 600 0 Z" />
        </svg>

        {/* Ambient decorative subtle wave glow along curve */}
        <div className="absolute top-[35%] left-[34%] w-64 h-64 bg-[#7c3aed]/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* =========================================================================
          LEFT BRANDING PANEL (Hidden or compact on mobile, prominent on desktop)
          ========================================================================= */}
      <div className="hidden lg:flex w-full lg:w-[46%] xl:w-[44%] p-6 lg:p-10 xl:p-12 flex-col justify-between text-white relative z-10 shrink-0 h-full overflow-hidden">
        {/* Top: Y Logo Image & Brand text */}
        <div className="flex items-center gap-3">
          <img
            src={logoImg}
            alt="YottaFlex.ai Logo"
            className="w-9 h-9 object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(124,58,237,0.5)]"
          />
          <div>
            <div className="font-extrabold text-white text-base tracking-tight leading-none">
              YottaFlex.ai
            </div>
            <div className="text-[11px] text-indigo-200/80 font-medium mt-1 leading-none">
              Loyalty Ledger
            </div>
          </div>
        </div>

        {/* Middle: Headline, Description & 4 Pillars */}
        <div className="my-auto py-2 space-y-5 xl:space-y-6">
          <div>
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-white leading-tight">
              Enterprise <br />
              <span className="text-white">
                Loyalty Ledger
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/75 font-medium mt-2 max-w-sm leading-relaxed">
              Enterprise Loyalty Ledger &amp; Auditable Rules Engine
            </p>
          </div>

          {/* 4 Feature Highlights */}
          <div className="space-y-3 pt-1">
            {/* Feature 1 */}
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-[#2a1d52] border border-white/10 flex items-center justify-center shrink-0 shadow-sm text-indigo-200">
                <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm text-white">
                  Auditable &amp; Accurate
                </div>
                <div className="text-[11px] text-indigo-200/65 font-medium mt-0.5">
                  Full ledger audit and reconciliation
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-[#2a1d52] border border-white/10 flex items-center justify-center shrink-0 shadow-sm text-indigo-200">
                <Layers className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm text-white">
                  Scalable &bull; Reliable
                </div>
                <div className="text-[11px] text-indigo-200/65 font-medium mt-0.5">
                  Handle millions of customers and transactions
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-[#2a1d52] border border-white/10 flex items-center justify-center shrink-0 shadow-sm text-indigo-200">
                <BarChart3 className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm text-white">
                  Anomaly Monitoring
                </div>
                <div className="text-[11px] text-indigo-200/65 font-medium mt-0.5">
                  Detect and explain loyalty data issues
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-[#2a1d52] border border-white/10 flex items-center justify-center shrink-0 shadow-sm text-indigo-200">
                <Database className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm text-white">
                  Synthetic Data Ready
                </div>
                <div className="text-[11px] text-indigo-200/65 font-medium mt-0.5">
                  Generate realistic, reproducible datasets
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom subtle copyright / seed */}
        <div className="text-[11px] text-indigo-300/50 font-medium">
          Seed: 20261022 &bull; YottaFlex 2.0
        </div>
      </div>

      {/* =========================================================================
          RIGHT AUTHENTICATION PANEL (Clean Floating Login Card - Non-scrolling Fit)
          ========================================================================= */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-6 xl:p-8 relative z-10 w-full min-h-screen lg:min-h-0 lg:h-full py-8 lg:py-6 overflow-y-auto lg:overflow-hidden">
        <div className="w-full max-w-[430px] bg-white rounded-3xl p-5 sm:p-6 xl:p-7 shadow-[0_12px_40px_rgba(99,85,246,0.07)] border border-slate-200/60 my-auto">
          {/* Header with Centered Logo.png & Title */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 mb-1">
              <img
                src={logoImg}
                alt="YottaFlex.ai Logo"
                className="w-7 h-7 object-contain drop-shadow-[0_2px_6px_rgba(110,47,239,0.4)]"
              />
              <span className="text-xl font-black text-slate-900 tracking-tight">
                YottaFlex.ai
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Sign in to your account
            </p>
          </div>

          {/* Form */}
          <form className="space-y-3" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-2 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-[11px] font-semibold text-rose-700">{error}</div>
              </div>
            )}

            {/* Work Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@yottaflex.ai"
                  style={{
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06), 0 1px 1px rgba(255,255,255,0.9)'
                  }}
                  className="w-full pl-10 pr-3.5 py-2 bg-[#f4f6fc] border-t border-t-slate-300/80 border-l border-l-slate-300/70 border-b border-b-white border-r border-r-white rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6355f6]/30 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06), 0 1px 1px rgba(255,255,255,0.9)'
                  }}
                  className="w-full pl-10 pr-10 py-2 bg-[#f4f6fc] border-t border-t-slate-300/80 border-l border-l-slate-300/70 border-b border-b-white border-r border-r-white rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6355f6]/30 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign In to Console Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-1.5 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black text-xs text-white bg-gradient-to-r from-[#6e2fef] via-[#5b1edb] to-[#45108a] hover:opacity-95 shadow-[0_4px_14px_rgba(110,47,239,0.35)] active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4 stroke-[2.2]" />
              <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-3.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/70" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-2.5 font-bold text-slate-400 tracking-wider">
                OR
              </span>
            </div>
          </div>

          {/* Quick Demo Switcher (2x2 Grid) */}
          <div>
            <p className="text-[11px] font-bold text-slate-600 text-center mb-2.5">
              One-Click Role Demonstration Accounts
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Ops Manager */}
              <button
                type="button"
                onClick={() => handleQuickLogin('ops@yottaflex.ai')}
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #f4f7ff 100%)',
                  boxShadow: '0 3px 6px -1px rgba(59, 130, 246, 0.16), 0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(59, 130, 246, 0.12)'
                }}
                className="p-2.5 rounded-xl border border-blue-200/80 hover:border-blue-400 text-left transition-all flex items-center gap-2.5 group cursor-pointer active:translate-y-0.5 active:shadow-inner"
              >
                <div
                  style={{
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
                  }}
                  className="w-8 h-8 rounded-lg bg-gradient-to-b from-blue-50 to-blue-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/80 group-hover:scale-105 transition-transform"
                >
                  <Settings2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-[11px] text-slate-900 group-hover:text-blue-600 transition-colors">
                    Ops Manager
                  </div>
                  <div className="text-[9.5px] text-slate-500 font-medium leading-none mt-0.5">
                    Full Audit Access
                  </div>
                </div>
              </button>

              {/* Store Operator */}
              <button
                type="button"
                onClick={() => handleQuickLogin('operator@yottaflex.ai')}
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)',
                  boxShadow: '0 3px 6px -1px rgba(16, 185, 129, 0.16), 0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(16, 185, 129, 0.12)'
                }}
                className="p-2.5 rounded-xl border border-emerald-200/80 hover:border-emerald-400 text-left transition-all flex items-center gap-2.5 group cursor-pointer active:translate-y-0.5 active:shadow-inner"
              >
                <div
                  style={{
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
                  }}
                  className="w-8 h-8 rounded-lg bg-gradient-to-b from-emerald-50 to-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/80 group-hover:scale-105 transition-transform"
                >
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-[11px] text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Store Operator
                  </div>
                  <div className="text-[9.5px] text-slate-500 font-medium leading-none mt-0.5">
                    Returns &amp; Refunds
                  </div>
                </div>
              </button>

              {/* Analyst */}
              <button
                type="button"
                onClick={() => handleQuickLogin('analyst@yottaflex.ai')}
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #fffbeb 100%)',
                  boxShadow: '0 3px 6px -1px rgba(245, 158, 11, 0.16), 0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(245, 158, 11, 0.12)'
                }}
                className="p-2.5 rounded-xl border border-amber-200/80 hover:border-amber-400 text-left transition-all flex items-center gap-2.5 group cursor-pointer active:translate-y-0.5 active:shadow-inner"
              >
                <div
                  style={{
                    boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
                  }}
                  className="w-8 h-8 rounded-lg bg-gradient-to-b from-amber-50 to-amber-100 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/80 group-hover:scale-105 transition-transform"
                >
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-[11px] text-slate-900 group-hover:text-amber-600 transition-colors">
                    Analyst
                  </div>
                  <div className="text-[9.5px] text-slate-500 font-medium leading-none mt-0.5">
                    Analytics &amp; Rules
                  </div>
                </div>
              </button>

              {/* Customer */}
              <button
                type="button"
                onClick={() => handleQuickLogin('customer@yottaflex.ai')}
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)',
                  boxShadow: '0 3px 6px -1px rgba(168, 85, 247, 0.16), 0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(168, 85, 247, 0.12)'
                }}
                className="p-2.5 rounded-xl border border-purple-200/80 hover:border-purple-400 text-left transition-all flex items-center gap-2.5 group cursor-pointer active:translate-y-0.5 active:shadow-inner"
              >
                <div
                  style={{
                    boxShadow: '0 2px 4px rgba(168, 85, 247, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
                  }}
                  className="w-8 h-8 rounded-lg bg-gradient-to-b from-purple-50 to-purple-100 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200/80 group-hover:scale-105 transition-transform"
                >
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-[11px] text-slate-900 group-hover:text-purple-600 transition-colors">
                    Customer
                  </div>
                  <div className="text-[9.5px] text-slate-500 font-medium leading-none mt-0.5">
                    Points &amp; Rewards
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Security Information Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-[#6355f6]" />
              <span>Cryptographic Session Tokens &bull; Role-Based Boundary Enforcement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
