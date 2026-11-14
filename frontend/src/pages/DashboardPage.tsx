import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoyaltyAPI } from '../services/api';
import {
  Users, Layers, ShoppingCart, Coins, Gift,
  Hourglass, Undo2, Database, ShieldCheck, AlertTriangle,
  RefreshCw, ArrowUpRight, CheckCircle2, LayoutDashboard
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const TXN_COLORS: { [key: string]: string } = {
  ACCRUAL: '#2563eb',
  REDEMPTION: '#9333ea',
  REVERSAL: '#06b6d4',
  EXPIRATION: '#ec4899',
  ADJUSTMENT: '#f59e0b',
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    LoyaltyAPI.getSummary()
      .then(setData)
      .catch((err) => {
        setError(err.message || 'Failed to load ledger telemetry');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-4">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500">Reconciling ledger transactions...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-white border border-rose-200 rounded-xl shadow-xs text-center space-y-3 max-w-lg mx-auto mt-12">
        <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center mx-auto">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-slate-900 text-sm">Failed to Connect to Analytics Telemetry</h3>
        <p className="text-xs text-rose-600">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const k = data.kpis;
  const r = data.reconciliation;
  const ds = data.dataset_info;

  // 10 KPI Cards with Individual Tinted 3D Bulged Gradients, Inset Bevels, and Drop Shadows
  const kpiRow1 = [
    {
      title: 'Total Customers',
      value: k.total_customers.toLocaleString(),
      change: '+2.0%',
      icon: Users,
      gradient: 'linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)',
      shadow: '0 4px 10px -2px rgba(59, 130, 246, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(59, 130, 246, 0.15)',
      cardBorder: 'border-blue-200/90',
      iconBg: 'bg-gradient-to-b from-blue-50 to-blue-100',
      iconBorder: 'border-blue-200/80',
      iconShadow: '0 2px 4px rgba(59, 130, 246, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
      iconColor: 'text-blue-600',
      valueColor: 'text-blue-950',
      titleColor: 'text-blue-800/80',
      badgeBg: 'bg-blue-100/90 text-blue-800 border border-blue-200 shadow-2xs',
    },
    {
      title: 'Active Loyalty Accounts',
      value: k.active_loyalty_accounts.toLocaleString(),
      change: '+2.0%',
      icon: Layers,
      gradient: 'linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)',
      shadow: '0 4px 10px -2px rgba(168, 85, 247, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(168, 85, 247, 0.15)',
      cardBorder: 'border-purple-200/90',
      iconBg: 'bg-gradient-to-b from-purple-50 to-purple-100',
      iconBorder: 'border-purple-200/80',
      iconShadow: '0 2px 4px rgba(168, 85, 247, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
      iconColor: 'text-purple-600',
      valueColor: 'text-purple-950',
      titleColor: 'text-purple-800/80',
      badgeBg: 'bg-purple-100/90 text-purple-800 border border-purple-200 shadow-2xs',
    },
    {
      title: 'Total Orders',
      value: k.total_orders.toLocaleString(),
      change: '+5.1%',
      icon: ShoppingCart,
      gradient: 'linear-gradient(180deg, #ffffff 0%, #fffbeb 100%)',
      shadow: '0 4px 10px -2px rgba(245, 158, 11, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(245, 158, 11, 0.15)',
      cardBorder: 'border-amber-200/90',
      iconBg: 'bg-gradient-to-b from-amber-50 to-amber-100',
      iconBorder: 'border-amber-200/80',
      iconShadow: '0 2px 4px rgba(245, 158, 11, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
      iconColor: 'text-amber-600',
      valueColor: 'text-amber-950',
      titleColor: 'text-amber-800/80',
      badgeBg: 'bg-amber-100/90 text-amber-800 border border-amber-200 shadow-2xs',
    },
    {
      title: 'Points Earned',
      value: k.points_earned.toLocaleString(),
      change: '+8.4%',
      icon: Coins,
      gradient: 'linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%)',
      shadow: '0 4px 10px -2px rgba(16, 185, 129, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(16, 185, 129, 0.15)',
      cardBorder: 'border-emerald-200/90',
      iconBg: 'bg-gradient-to-b from-emerald-50 to-emerald-100',
      iconBorder: 'border-emerald-200/80',
      iconShadow: '0 2px 4px rgba(16, 185, 129, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
      iconColor: 'text-emerald-600',
      valueColor: 'text-emerald-950',
      titleColor: 'text-emerald-800/80',
      badgeBg: 'bg-emerald-100/90 text-emerald-800 border border-emerald-200 shadow-2xs',
    },
    {
      title: 'Points Redeemed',
      value: k.points_redeemed.toLocaleString(),
      change: '+6.2%',
      icon: Gift,
      gradient: 'linear-gradient(180deg, #ffffff 0%, #fdf2f8 100%)',
      shadow: '0 4px 10px -2px rgba(236, 72, 153, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(236, 72, 153, 0.15)',
      cardBorder: 'border-pink-200/90',
      iconBg: 'bg-gradient-to-b from-pink-50 to-pink-100',
      iconBorder: 'border-pink-200/80',
      iconShadow: '0 2px 4px rgba(236, 72, 153, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
      iconColor: 'text-pink-600',
      valueColor: 'text-pink-950',
      titleColor: 'text-pink-800/80',
      badgeBg: 'bg-pink-100/90 text-pink-800 border border-pink-200 shadow-2xs',
    },
  ];

  const kpiRow2 = [
    {
      title: 'Points Expired',
      value: k.points_expired.toLocaleString(),
      change: '+1.5%',
      icon: Hourglass,
      gradient: 'linear-gradient(180deg, #ffffff 0%, #fff1f2 100%)',
      shadow: '0 4px 10px -2px rgba(244, 63, 94, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(244, 63, 94, 0.15)',
      cardBorder: 'border-rose-200/90',
      iconBg: 'bg-gradient-to-b from-rose-50 to-rose-100',
      iconBorder: 'border-rose-200/80',
      iconShadow: '0 2px 4px rgba(244, 63, 94, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
      iconColor: 'text-rose-600',
      valueColor: 'text-rose-950',
      titleColor: 'text-rose-800/80',
      badgeBg: 'bg-rose-100/90 text-rose-800 border border-rose-200 shadow-2xs',
    },
    {
      title: 'Points Reversed',
      value: k.points_reversed.toLocaleString(),
      change: '+3.8%',
      icon: Undo2,
      gradient: 'linear-gradient(180deg, #ffffff 0%, #ecfeff 100%)',
      shadow: '0 4px 10px -2px rgba(6, 182, 212, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(6, 182, 212, 0.15)',
      cardBorder: 'border-cyan-200/90',
      iconBg: 'bg-gradient-to-b from-cyan-50 to-cyan-100',
      iconBorder: 'border-cyan-200/80',
      iconShadow: '0 2px 4px rgba(6, 182, 212, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
      iconColor: 'text-cyan-600',
      valueColor: 'text-cyan-950',
      titleColor: 'text-cyan-800/80',
      badgeBg: 'bg-cyan-100/90 text-cyan-800 border border-cyan-200 shadow-2xs',
    },
    {
      title: 'Outstanding Balance',
      value: k.current_outstanding_points.toLocaleString(),
      change: null,
      icon: Database,
      gradient: 'linear-gradient(180deg, #ffffff 0%, #eef2ff 100%)',
      shadow: '0 4px 10px -2px rgba(99, 102, 241, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(99, 102, 241, 0.15)',
      cardBorder: 'border-indigo-200/90',
      iconBg: 'bg-gradient-to-b from-indigo-50 to-indigo-100',
      iconBorder: 'border-indigo-200/80',
      iconShadow: '0 2px 4px rgba(99, 102, 241, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
      iconColor: 'text-indigo-600',
      valueColor: 'text-indigo-950',
      titleColor: 'text-indigo-800/80',
      badgeBg: null,
    },
    {
      title: 'Reconciliation Rate',
      value: `${k.reconciliation_rate}%`,
      change: null,
      icon: ShieldCheck,
      gradient: 'linear-gradient(180deg, #ffffff 0%, #f0fdfa 100%)',
      shadow: '0 4px 10px -2px rgba(20, 184, 166, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(20, 184, 166, 0.15)',
      cardBorder: 'border-teal-200/90',
      iconBg: 'bg-gradient-to-b from-teal-50 to-teal-100',
      iconBorder: 'border-teal-200/80',
      iconShadow: '0 2px 4px rgba(20, 184, 166, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
      iconColor: 'text-teal-600',
      valueColor: 'text-teal-950',
      titleColor: 'text-teal-800/80',
      badgeBg: null,
    },
    {
      title: 'Anomalies Detected',
      value: k.anomalies_detected,
      change: null,
      icon: AlertTriangle,
      gradient: 'linear-gradient(180deg, #ffffff 0%, #fef2f2 100%)',
      shadow: '0 4px 10px -2px rgba(239, 68, 68, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(239, 68, 68, 0.15)',
      cardBorder: 'border-red-200/90',
      iconBg: 'bg-gradient-to-b from-red-50 to-red-100',
      iconBorder: 'border-red-200/80',
      iconShadow: '0 2px 4px rgba(239, 68, 68, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
      iconColor: 'text-red-600',
      valueColor: 'text-red-950',
      titleColor: 'text-red-800/80',
      badgeBg: null,
    },
  ];

  return (
    <div className="space-y-3.5">
      {/* Top Header: Title & Subtitle + Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#6355f6] to-[#8d7dfb] text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none truncate">
                Operations Manager Dashboard
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Telemetry
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-1 leading-none truncate">
              Real-time auditable ledger telemetry, FIFO point consumption, and mathematical reconciliation
            </p>
          </div>
        </div>

        {/* Action Controls & Dataset Indicators */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white border border-slate-200/70 rounded-xl text-xs font-semibold text-slate-600 shadow-2xs">
            <span className="font-bold text-slate-800">{ds.mode}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-medium text-[11px]">Seed: <span className="font-mono text-slate-800 font-bold">{ds.seed}</span></span>
          </div>

          <button
            onClick={loadData}
            style={{
              background: 'linear-gradient(180deg, #7161ef 0%, #5448ea 100%)',
              boxShadow: '0 3px 6px -1px rgba(99, 85, 246, 0.4), inset 0 1.5px 1px rgba(255, 255, 255, 0.4), inset 0 -1.5px 2px rgba(0, 0, 0, 0.2)'
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-xl text-xs font-bold transition-all cursor-pointer hover:brightness-105 active:translate-y-0.5"
          >
            <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Row 1 of 5 Colored KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {kpiRow1.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              style={{
                background: card.gradient,
                boxShadow: card.shadow,
              }}
              className={`${card.cardBorder} rounded-xl p-2.5 sm:p-3 border hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group min-w-0`}
            >
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div
                  style={{
                    boxShadow: card.iconShadow,
                  }}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md ${card.iconBg} ${card.iconBorder} ${card.iconColor} flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className={`text-[9px] sm:text-[10px] font-extrabold ${card.titleColor} leading-tight truncate`}>{card.title}</div>
                  <div className={`text-base sm:text-xl font-black ${card.valueColor} tracking-tight leading-none mt-0.5 truncate`}>{card.value}</div>
                </div>
              </div>
              {card.change && (
                <div className={`text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${card.badgeBg} hidden xs:block`}>
                  {card.change}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Row 2 of 5 Colored KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {kpiRow2.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              style={{
                background: card.gradient,
                boxShadow: card.shadow,
              }}
              className={`${card.cardBorder} rounded-xl p-2.5 sm:p-3 border hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group min-w-0`}
            >
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div
                  style={{
                    boxShadow: card.iconShadow,
                  }}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md ${card.iconBg} ${card.iconBorder} ${card.iconColor} flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className={`text-[9px] sm:text-[10px] font-extrabold ${card.titleColor} leading-tight truncate`}>{card.title}</div>
                  <div className={`text-base sm:text-xl font-black ${card.valueColor} tracking-tight leading-none mt-0.5 truncate`}>{card.value}</div>
                </div>
              </div>
              {card.change && (
                <div className={`text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${card.badgeBg} hidden xs:block`}>
                  {card.change}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Financial-Style Ledger Reconciliation Section */}
      <div className="bg-white rounded-xl p-4.5 border border-slate-200/70 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-xs tracking-tight leading-tight">Financial-Style Ledger Reconciliation</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Strict comparison of cached account balances vs posted immutable transaction sums
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/anomalies')}
            className="flex items-center gap-1 text-[11px] font-bold text-[#6355f6] hover:text-indigo-800 transition-colors"
          >
            <span>View Anomaly Monitor</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
          {/* Accounts Audited */}
          <div
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
              boxShadow: '0 3px 6px -1px rgba(100, 116, 139, 0.12), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(148, 163, 184, 0.12)'
            }}
            className="p-3 rounded-lg border border-slate-200 text-xs"
          >
            <span className="text-slate-600 font-bold block text-[10px]">Accounts Audited</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 block tracking-tight leading-none">{r.total_accounts_checked}</span>
            <span className="text-[9px] text-slate-400 font-medium mt-1 block">100% of master records</span>
          </div>

          {/* Reconciled Accounts */}
          <div
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%)',
              boxShadow: '0 3px 6px -1px rgba(16, 185, 129, 0.15), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(16, 185, 129, 0.12)'
            }}
            className="p-3 rounded-lg border border-emerald-200 text-xs"
          >
            <span className="text-emerald-700 font-bold block text-[10px]">Reconciled Accounts</span>
            <span className="text-lg font-black text-emerald-900 mt-0.5 block tracking-tight leading-none">{r.reconciled_accounts}</span>
            <span className="text-[9px] text-emerald-600 font-bold mt-1 block">{k.reconciliation_rate}% Match</span>
          </div>

          {/* Balance Mismatches */}
          <div
            onClick={() => navigate('/anomalies')}
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #fff1f2 100%)',
              boxShadow: '0 3px 6px -1px rgba(244, 63, 94, 0.15), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(244, 63, 94, 0.12)'
            }}
            className="p-3 hover:brightness-98 active:translate-y-0.5 transition-all cursor-pointer rounded-lg border border-rose-200 text-xs"
          >
            <span className="text-rose-700 font-bold block text-[10px]">Balance Mismatches</span>
            <span className="text-lg font-black text-rose-900 mt-0.5 block tracking-tight leading-none">{r.balance_mismatches}</span>
            <span className="text-[9px] text-rose-600 font-bold mt-1 block">Click to inspect &rarr;</span>
          </div>

          {/* Over-Redemptions */}
          <div
            onClick={() => navigate('/anomalies')}
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #fff1f2 100%)',
              boxShadow: '0 3px 6px -1px rgba(244, 63, 94, 0.15), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(244, 63, 94, 0.12)'
            }}
            className="p-3 hover:brightness-98 active:translate-y-0.5 transition-all cursor-pointer rounded-lg border border-rose-200 text-xs"
          >
            <span className="text-rose-700 font-bold block text-[10px]">Over-Redemptions</span>
            <span className="text-lg font-black text-rose-900 mt-0.5 block tracking-tight leading-none">{r.over_redemptions}</span>
            <span className="text-[9px] text-rose-600 font-bold mt-1 block">Click to inspect &rarr;</span>
          </div>

          {/* Missing Reversals */}
          <div
            onClick={() => navigate('/anomalies')}
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #fffbeb 100%)',
              boxShadow: '0 3px 6px -1px rgba(245, 158, 11, 0.15), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(245, 158, 11, 0.12)'
            }}
            className="p-3 hover:brightness-98 active:translate-y-0.5 transition-all cursor-pointer rounded-lg border border-amber-200 text-xs"
          >
            <span className="text-amber-700 font-bold block text-[10px]">Missing Reversals</span>
            <span className="text-lg font-black text-amber-900 mt-0.5 block tracking-tight leading-none">{r.missing_reversals}</span>
            <span className="text-[9px] text-amber-600 font-bold mt-1 block">Click to inspect &rarr;</span>
          </div>

          {/* Duplicate Expiries */}
          <div
            onClick={() => navigate('/anomalies')}
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)',
              boxShadow: '0 3px 6px -1px rgba(168, 85, 247, 0.15), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(168, 85, 247, 0.12)'
            }}
            className="p-3 hover:brightness-98 active:translate-y-0.5 transition-all cursor-pointer rounded-lg border border-purple-200 text-xs"
          >
            <span className="text-purple-700 font-bold block text-[10px]">Duplicate Expiries</span>
            <span className="text-lg font-black text-purple-900 mt-0.5 block tracking-tight leading-none">{r.double_expiries}</span>
            <span className="text-[9px] text-purple-600 font-bold mt-1 block">Click to inspect &rarr;</span>
          </div>
        </div>
      </div>

      {/* Row 1 Analytics: Monthly Points Accrual vs Redemption & Ledger Transaction Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Monthly Points Accrual vs Redemption */}
        <div
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)',
            boxShadow: '0 4px 12px -2px rgba(99, 102, 241, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(226, 232, 240, 0.6)'
          }}
          className="lg:col-span-2 rounded-xl p-4.5 border border-slate-200/80 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#2563eb] shadow-xs"></div>
                <h3 className="text-xs font-black text-slate-900 tracking-tight">Monthly Points Accrual vs Redemption</h3>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Net loyalty point volume movement over time</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1.5 text-[#2563eb]">
                <span className="w-2 h-2 rounded-full bg-[#2563eb]"></span> Points Earned
              </span>
              <span className="flex items-center gap-1.5 text-[#d97706]">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> Points Redeemed
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEarned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorRedeemed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={false}
                  position={{ y: 0 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div
                          style={{
                            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                            boxShadow: '0 3px 8px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 1)'
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200/80 text-[10px] flex items-center gap-2.5 z-50 pointer-events-none"
                        >
                          <span className="font-extrabold text-slate-800">{label}:</span>
                          {payload.map((entry: any) => {
                            const name = entry.dataKey === 'earned' ? 'Points Earned' : 'Points Redeemed';
                            const color = entry.dataKey === 'earned' ? '#2563eb' : '#d97706';
                            return (
                              <span key={entry.dataKey} className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-slate-500 font-medium">{name}:</span>
                                <span className="font-black text-slate-900">{Number(entry.value).toLocaleString()}</span>
                              </span>
                            );
                          })}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="natural" dataKey="earned" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEarned)" />
                <Area type="natural" dataKey="redeemed" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRedeemed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ledger Transaction Types */}
        <div
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)',
            boxShadow: '0 4px 12px -2px rgba(147, 51, 234, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(226, 232, 240, 0.6)'
          }}
          className="rounded-xl p-4.5 border border-slate-200/80 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-[#9333ea] shadow-xs"></div>
              <h3 className="text-xs font-black text-slate-900 tracking-tight">Ledger Transaction Types</h3>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mb-1">Real distribution calculated from persisted transactions</p>

            <div className="relative h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.txn_distribution}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={64}
                    paddingAngle={3}
                  >
                    {data.txn_distribution.map((entry: any) => (
                      <Cell key={`cell-${entry.type}`} fill={TXN_COLORS[entry.type] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    position={{ y: 0 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        const formattedName = (item.type || '')
                          .replace(/_/g, ' ')
                          .toLowerCase()
                          .replace(/\b\w/g, (c: string) => c.toUpperCase());
                        return (
                          <div
                            style={{
                              background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                              boxShadow: '0 3px 8px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 1)'
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-200/80 text-[10px] flex items-center gap-1.5"
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: TXN_COLORS[item.type] || '#94a3b8' }}
                            />
                            <span className="font-extrabold text-slate-800">{formattedName}:</span>
                            <span className="font-black text-indigo-600">{item.count} txns</span>
                            <span className="text-slate-400 font-semibold">({item.percentage}%)</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black text-slate-900 leading-none">
                  {data.txn_distribution.reduce((acc: number, curr: any) => acc + curr.count, 0)}
                </span>
                <span className="text-[9px] text-slate-400 font-bold mt-0.5">Transactions</span>
              </div>
            </div>
          </div>

          {/* Itemized Legend with formatted Title Case and clean percentages */}
          <div className="space-y-1 pt-2 border-t border-slate-100 text-xs">
            {data.txn_distribution.map((item: any) => {
              const formattedName = (item.type || '')
                .replace(/_/g, ' ')
                .toLowerCase()
                .replace(/\b\w/g, (c: string) => c.toUpperCase());

              return (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shadow-2xs" style={{ backgroundColor: TXN_COLORS[item.type] || '#94a3b8' }}></span>
                    <span className="font-bold text-slate-700 text-[10px]">{formattedName}</span>
                  </div>
                  <div className="font-extrabold text-slate-900 text-[10px]">
                    {item.count} <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2 Analytics: Expiration & Reversal Trends + Tier Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Expiration & Return Reversal Trends */}
        <div
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)',
            boxShadow: '0 4px 12px -2px rgba(225, 29, 72, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(226, 232, 240, 0.6)'
          }}
          className="rounded-xl p-4.5 border border-slate-200/80"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#e11d48] shadow-xs"></div>
                <h3 className="text-xs font-black text-slate-900 tracking-tight">Expiration &amp; Return Reversal Trends</h3>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Points forfeited via lot expiry and order return reversals</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1.5 text-[#9333ea]">
                <span className="w-2 h-2 rounded-full bg-[#9333ea]"></span> Expired
              </span>
              <span className="flex items-center gap-1.5 text-[#e11d48]">
                <span className="w-2 h-2 rounded-full bg-[#e11d48]"></span> Reversed
              </span>
            </div>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradExpired" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#7e22ce" />
                  </linearGradient>
                  <linearGradient id="barGradReversed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={false}
                  position={{ y: 0 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div
                          style={{
                            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                            boxShadow: '0 3px 8px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 1)'
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200/80 text-[10px] flex items-center gap-2.5 z-50 pointer-events-none"
                        >
                          <span className="font-extrabold text-slate-800">{label}:</span>
                          {payload.map((entry: any) => {
                            const name = entry.dataKey === 'expired' ? 'Expired' : 'Reversed';
                            const color = entry.dataKey === 'expired' ? '#9333ea' : '#e11d48';
                            return (
                              <span key={entry.dataKey} className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-slate-500 font-medium">{name}:</span>
                                <span className="font-black text-slate-900">{Number(entry.value).toLocaleString()}</span>
                              </span>
                            );
                          })}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="expired" fill="url(#barGradExpired)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reversed" fill="url(#barGradReversed)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Membership Tier Distribution */}
        <div
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)',
            boxShadow: '0 4px 12px -2px rgba(5, 150, 105, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(226, 232, 240, 0.6)'
          }}
          className="rounded-xl p-4.5 border border-slate-200/80"
        >
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2 h-2 rounded-full bg-[#059669] shadow-xs"></div>
            <h3 className="text-xs font-black text-slate-900 tracking-tight">Customer Membership Tier Distribution</h3>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mb-2">Calculated strictly using qualifying net spend thresholds</p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.tier_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tierGrad0" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="tierGrad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                  <linearGradient id="tierGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                  <linearGradient id="tierGrad3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="tier"
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  tickFormatter={(val: string) =>
                    val
                      .replace(/_/g, ' ')
                      .replace(/-/g, ' ')
                      .toLowerCase()
                      .replace(/\b\w/g, (c) => c.toUpperCase())
                  }
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={false}
                  position={{ y: 0 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const entry = payload[0];
                      const rawTier = String(entry.payload.tier || '');
                      const formattedTier = rawTier
                        .replace(/_/g, ' ')
                        .replace(/-/g, ' ')
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase());
                      return (
                        <div
                          style={{
                            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                            boxShadow: '0 3px 8px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 1)'
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200/80 text-[10px] flex items-center gap-1.5 z-50 pointer-events-none"
                        >
                          <span className="font-extrabold text-slate-800">{formattedTier}:</span>
                          <span className="font-black text-emerald-600">{Number(entry.value).toLocaleString()} members</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.tier_distribution.map((_: any, index: number) => (
                    <Cell key={`tier-${index}`} fill={`url(#tierGrad${index % 4})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3 Analytics: Transaction Status Distribution & Anomaly Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Transaction Status Distribution */}
        <div
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)',
            boxShadow: '0 4px 12px -2px rgba(5, 150, 105, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(226, 232, 240, 0.6)'
          }}
          className="rounded-xl p-4.5 border border-slate-200/80"
        >
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2 h-2 rounded-full bg-[#059669] shadow-xs"></div>
            <h3 className="text-xs font-black text-slate-900 tracking-tight">Transaction Status Distribution</h3>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mb-2">Financial posting status across all points ledger movements</p>
          <div className="space-y-2">
            {data.status_distribution.map((s: any) => (
              <div
                key={s.status}
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 2px 4px -1px rgba(100, 116, 139, 0.1), inset 0 1px 1px rgba(255, 255, 255, 1), inset 0 -1px 1px rgba(203, 213, 225, 0.4)'
                }}
                className="p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                  <span className="font-bold text-slate-800 text-[11px]">{s.status}</span>
                </div>
                <span className="font-extrabold text-slate-900 text-[11px]">{s.count} transactions</span>
              </div>
            ))}
          </div>
        </div>

        {/* Injected & Detected Anomaly Categories */}
        <div
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)',
            boxShadow: '0 4px 12px -2px rgba(220, 38, 38, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(226, 232, 240, 0.6)'
          }}
          className="rounded-xl p-4.5 border border-slate-200/80"
        >
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#dc2626] shadow-xs"></div>
              <h3 className="text-xs font-black text-slate-900 tracking-tight">Injected &amp; Detected Anomaly Categories</h3>
            </div>
            <span
              style={{
                boxShadow: '0 1.5px 3px rgba(220, 38, 38, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
              }}
              className="text-[10px] font-bold text-[#dc2626] bg-gradient-to-b from-red-50 to-red-100 px-2 py-0.5 rounded-md border border-[#fecdd3]"
            >
              {k.anomalies_detected} Total Detected
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mb-2">Independent mathematical anomaly classification</p>
          <div className="space-y-1.5">
            {data.anom_distribution.map((a: any) => {
              const formattedCategory = (a.category || '')
                .replace(/_/g, ' ')
                .toLowerCase()
                .replace(/\b\w/g, (char: string) => char.toUpperCase());

              return (
                <div
                  key={a.category}
                  style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, #fef2f2 100%)',
                    boxShadow: '0 2px 4px -1px rgba(220, 38, 38, 0.08), inset 0 1px 1px rgba(255, 255, 255, 1), inset 0 -1px 1px rgba(254, 205, 211, 0.4)'
                  }}
                  className="p-2.5 rounded-lg border border-red-200/70 flex items-center justify-between text-xs transition-all hover:scale-[1.01]"
                >
                  <span className="font-bold text-slate-800 text-[11px]">{formattedCategory}</span>
                  <span className="font-black text-[#dc2626] text-[11px] bg-white px-2 py-0.5 rounded border border-red-100 shadow-2xs">
                    {a.count} instance(s)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
