import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoyaltyAPI } from '../services/api';
import {
  Users, Layers, ShoppingCart, Coins, Gift,
  Hourglass, Undo2, Database, ShieldCheck, AlertTriangle,
  RefreshCw, ArrowUpRight, CheckCircle2, LayoutDashboard, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';
import {
  PageHeader, StatCard, Card, Badge, LoadingState, ErrorState, ChartTooltip, Legend,
  AnimatedNumber, CHART_AXIS, humanize, cx, toneStyles, type Tone
} from '../components/ui';

const TXN_COLORS: { [key: string]: string } = {
  ACCRUAL: '#6236ec',
  REDEMPTION: '#ec4899',
  REVERSAL: '#06b6d4',
  EXPIRATION: '#f59e0b',
  ADJUSTMENT: '#10b981',
};

const TIER_COLORS = ['#b45309', '#94a3b8', '#eab308', '#6236ec'];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = (force = false) => {
    if (!data) setLoading(true);
    else setRefreshing(true);
    setError(null);
    LoyaltyAPI.getSummary(force)
      .then(setData)
      .catch((err) => {
        setError(err.message || 'Failed to load ledger telemetry');
      })
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingState label="Reconciling ledger transactions…" />;
  if (error || !data) return <ErrorState title="Couldn't load analytics" message={error} onRetry={() => loadData(true)} />;

  const k = data.kpis;
  const r = data.reconciliation;
  const ds = data.dataset_info;
  const totalTxns = data.txn_distribution.reduce((acc: number, curr: any) => acc + curr.count, 0);

  const primaryKpis: { label: string; value: number; icon: any; tone: Tone; hint: string }[] = [
    { label: 'Total customers', value: k.total_customers, icon: Users, tone: 'blue', hint: 'Registered members' },
    { label: 'Active accounts', value: k.active_loyalty_accounts, icon: Layers, tone: 'violet', hint: 'Loyalty accounts in good standing' },
    { label: 'Total orders', value: k.total_orders, icon: ShoppingCart, tone: 'amber', hint: 'Across all channels' },
    { label: 'Outstanding points', value: k.current_outstanding_points, icon: Database, tone: 'brand', hint: 'Current programme liability' },
  ];

  const flowKpis: { label: string; value: number; icon: any; tone: Tone }[] = [
    { label: 'Points earned', value: k.points_earned, icon: Coins, tone: 'emerald' },
    { label: 'Points redeemed', value: k.points_redeemed, icon: Gift, tone: 'pink' },
    { label: 'Points expired', value: k.points_expired, icon: Hourglass, tone: 'orange' },
    { label: 'Points reversed', value: k.points_reversed, icon: Undo2, tone: 'cyan' },
  ];

  const reconciliationItems: { label: string; value: number; tone: Tone; hint: string; link?: boolean }[] = [
    { label: 'Balance mismatches', value: r.balance_mismatches, tone: 'rose', hint: 'Cached vs. ledger sum', link: true },
    { label: 'Over-redemptions', value: r.over_redemptions, tone: 'rose', hint: 'Redeemed beyond balance', link: true },
    { label: 'Missing reversals', value: r.missing_reversals, tone: 'amber', hint: 'Returns not clawed back', link: true },
    { label: 'Duplicate expiries', value: r.double_expiries, tone: 'violet', hint: 'Lots expired twice', link: true },
  ];

  const rate = Number(k.reconciliation_rate) || 0;
  const ringR = 52;
  const ringC = 2 * Math.PI * ringR;

  return (
    <div>
      <PageHeader
        icon={LayoutDashboard}
        title="Operations dashboard"
        badge={<Badge tone="emerald" dot className="!h-6"><span className="live-dot text-emerald-500 -ml-0.5 mr-0.5" style={{ width: 6, height: 6 }} />Live</Badge>}
        description="Real-time ledger telemetry, FIFO point consumption and independent reconciliation."
        actions={
          <>
            <span className="hidden sm:inline-flex items-center gap-2 h-[38px] px-3.5 rounded-[10px] bg-white border border-[var(--border)] text-[13px] text-[var(--text-3)] shadow-[var(--shadow-xs)]">
              <span className="font-medium text-[var(--text)]">{ds.mode}</span>
              <span className="w-px h-4 bg-[var(--border)]" />
              Seed <span className="font-mono text-[var(--text)]">{ds.seed}</span>
            </span>
            <button onClick={() => loadData(true)} disabled={refreshing} className="btn btn-primary">
              <RefreshCw className={cx(refreshing && 'animate-spin')} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </>
        }
      />

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        {primaryKpis.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} tone={c.tone} hint={c.hint} />
        ))}
      </div>

      {/* Points flow + reconciliation */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card
          className="xl:col-span-2 animate-fade-up"
          title="Points flow"
          subtitle="Lifetime movement through the ledger"
          icon={Coins}
          tone="emerald"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
            {flowKpis.map((f) => {
              const pct = k.points_earned ? Math.min(100, (f.value / k.points_earned) * 100) : 0;
              return (
                <div key={f.label} className="group rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 transition-all duration-300 hover:bg-white hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5">
                  <div className="flex items-center gap-2 text-[13px] text-[var(--text-3)]">
                    <f.icon className={cx('w-4 h-4', toneStyles[f.tone].text)} />
                    {f.label}
                  </div>
                  <p className="mt-2 text-[22px] font-bold text-[var(--text)] leading-none"><AnimatedNumber value={f.value} /></p>
                  <div className="mt-3 h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                    <div
                      className="h-full rounded-full animate-[grow-x_1.2s_var(--ease-out-expo)_both] origin-left"
                      style={{ width: `${pct}%`, background: toneStyles[f.tone].glow }}
                    />
                  </div>
                  <p className="mt-1.5 text-[12px] text-[var(--text-3)] tabular">{pct.toFixed(1)}% of earned</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Monthly accrual vs. redemption</p>
              <p className="text-[13px] text-[var(--text-3)]">Net loyalty point volume over time</p>
            </div>
            <Legend items={[{ label: 'Earned', color: '#6236ec' }, { label: 'Redeemed', color: '#ec4899' }]} />
          </div>
          <div className="h-64 mt-4 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthly_trends} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gEarned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6236ec" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#6236ec" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRedeemed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eef0f5" />
                <XAxis dataKey="month" tick={CHART_AXIS} axisLine={false} tickLine={false} dy={8} />
                <YAxis tick={CHART_AXIS} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ stroke: '#d4d7e3', strokeDasharray: '4 4' }} content={<ChartTooltip />} />
                <Area name="Earned" type="monotone" dataKey="earned" stroke="#6236ec" strokeWidth={2.5} fill="url(#gEarned)" animationDuration={1400} activeDot={{ r: 5, strokeWidth: 3, stroke: '#fff' }} />
                <Area name="Redeemed" type="monotone" dataKey="redeemed" stroke="#ec4899" strokeWidth={2.5} fill="url(#gRedeemed)" animationDuration={1400} animationBegin={200} activeDot={{ r: 5, strokeWidth: 3, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Reconciliation */}
        <Card
          className="animate-fade-up"
          title="Ledger reconciliation"
          subtitle="Cached balances vs. posted transactions"
          icon={ShieldCheck}
          tone="teal"
          actions={
            <button onClick={() => navigate('/anomalies')} className="btn btn-ghost btn-sm">
              Details <ArrowUpRight />
            </button>
          }
        >
          <div className="flex items-center gap-5">
            <div className="relative w-[132px] h-[132px] shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r={ringR} fill="none" stroke="#eef0f5" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r={ringR} fill="none"
                  stroke="url(#ringGrad)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={ringC}
                  strokeDashoffset={ringC * (1 - rate / 100)}
                  style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)' }}
                  className="animate-[ring-in_1.4s_var(--ease-out-expo)_both]"
                />
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[24px] font-bold text-[var(--text)] leading-none"><AnimatedNumber value={rate} decimals={rate % 1 ? 1 : 0} suffix="%" /></span>
                <span className="text-[12px] text-[var(--text-3)] mt-1">reconciled</span>
              </div>
            </div>
            <div className="space-y-3 min-w-0">
              <div>
                <p className="text-[13px] text-[var(--text-3)]">Accounts audited</p>
                <p className="text-lg font-semibold text-[var(--text)]"><AnimatedNumber value={r.total_accounts_checked} /></p>
              </div>
              <div>
                <p className="text-[13px] text-[var(--text-3)]">Reconciled</p>
                <p className="text-lg font-semibold text-emerald-600"><AnimatedNumber value={r.reconciled_accounts} /></p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2 stagger">
            {reconciliationItems.map((it) => (
              <button
                key={it.label}
                onClick={() => navigate('/anomalies')}
                className="group w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-white text-left cursor-pointer transition-all duration-300 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)] hover:translate-x-0.5"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: toneStyles[it.tone].glow }} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] font-medium text-[var(--text)]">{it.label}</span>
                  <span className="block text-[12px] text-[var(--text-3)]">{it.hint}</span>
                </span>
                <span className={cx('text-base font-semibold tabular', it.value > 0 ? toneStyles[it.tone].text : 'text-[var(--text-3)]')}>{it.value}</span>
                <ChevronRight className="w-4 h-4 text-slate-300 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-slate-500" />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Distribution charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card className="animate-fade-up" title="Transaction types" subtitle="Distribution of persisted transactions" icon={Layers} tone="violet">
          <div className="relative h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.txn_distribution}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={86}
                  paddingAngle={3}
                  cornerRadius={6}
                  stroke="none"
                  animationDuration={1200}
                >
                  {data.txn_distribution.map((entry: any) => (
                    <Cell key={entry.type} fill={TXN_COLORS[entry.type] || '#94a3b8'} className="transition-opacity duration-200 hover:opacity-80" />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip formatName={(n) => humanize(n)} formatValue={(v, e) => `${v} (${e.payload.percentage}%)`} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-[var(--text)] leading-none"><AnimatedNumber value={totalTxns} /></span>
              <span className="text-[12px] text-[var(--text-3)] mt-1">transactions</span>
            </div>
          </div>
          <div className="mt-4 space-y-2.5">
            {data.txn_distribution.map((item: any) => (
              <div key={item.type} className="flex items-center gap-3 text-[13px]">
                <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: TXN_COLORS[item.type] || '#94a3b8' }} />
                <span className="flex-1 text-[var(--text-2)]">{humanize(item.type)}</span>
                <span className="font-semibold text-[var(--text)] tabular">{item.count}</span>
                <span className="w-12 text-right text-[var(--text-3)] tabular">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card
          className="animate-fade-up"
          title="Expirations & reversals"
          subtitle="Points forfeited per month"
          icon={Hourglass}
          tone="orange"
          actions={<Legend items={[{ label: 'Expired', color: '#f59e0b' }, { label: 'Reversed', color: '#06b6d4' }]} />}
        >
          <div className="h-[296px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_trends} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={4}>
                <CartesianGrid vertical={false} stroke="#eef0f5" />
                <XAxis dataKey="month" tick={CHART_AXIS} axisLine={false} tickLine={false} dy={8} />
                <YAxis tick={CHART_AXIS} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(98,54,236,0.05)', radius: 6 }} content={<ChartTooltip />} />
                <Bar name="Expired" dataKey="expired" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={18} animationDuration={1100} />
                <Bar name="Reversed" dataKey="reversed" fill="#06b6d4" radius={[6, 6, 0, 0]} maxBarSize={18} animationDuration={1100} animationBegin={150} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="animate-fade-up" title="Membership tiers" subtitle="Based on qualifying net spend" icon={ShieldCheck} tone="amber">
          <div className="h-[296px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.tier_distribution} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#eef0f5" />
                <XAxis dataKey="tier" tick={CHART_AXIS} tickFormatter={(v: string) => humanize(v.replace(/^TIER[-_]/i, ''))} axisLine={false} tickLine={false} dy={8} />
                <YAxis tick={CHART_AXIS} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(98,54,236,0.05)', radius: 6 }}
                  content={<ChartTooltip formatLabel={(l) => humanize(String(l).replace(/^TIER[-_]/i, ''))} formatValue={(v) => `${Number(v).toLocaleString()} members`} />}
                />
                <Bar name="Members" dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={48} animationDuration={1200}>
                  {data.tier_distribution.map((_: any, index: number) => (
                    <Cell key={index} fill={TIER_COLORS[index % TIER_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Status & anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card className="animate-fade-up" title="Transaction status" subtitle="Posting status across all ledger movements" icon={CheckCircle2} tone="emerald">
          <div className="space-y-3">
            {data.status_distribution.map((s: any) => {
              const pct = totalTxns ? (s.count / totalTxns) * 100 : 0;
              return (
                <div key={s.status} className="group">
                  <div className="flex items-center justify-between text-[13.5px] mb-1.5">
                    <span className="flex items-center gap-2 font-medium text-[var(--text)]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {humanize(s.status)}
                    </span>
                    <span className="text-[var(--text-3)] tabular"><span className="font-semibold text-[var(--text)]">{s.count.toLocaleString()}</span> · {pct.toFixed(1)}%</span>
                  </div>
                  <div className="progress"><span style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#10b981,#14b8a6)' }} /></div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card
          className="animate-fade-up"
          title="Anomaly categories"
          subtitle="Independent mathematical classification"
          icon={AlertTriangle}
          tone="rose"
          actions={<Badge tone="rose">{k.anomalies_detected} detected</Badge>}
        >
          <div className="space-y-2">
            {data.anom_distribution.map((a: any) => (
              <button
                key={a.category}
                onClick={() => navigate('/anomalies')}
                className="group w-full flex items-center justify-between gap-3 px-3.5 h-11 rounded-xl border border-[var(--border)] text-left cursor-pointer transition-all duration-300 hover:border-rose-200 hover:bg-rose-50/40 hover:translate-x-0.5"
              >
                <span className="flex items-center gap-2.5 text-[13.5px] font-medium text-[var(--text)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {humanize(a.category)}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-rose-600 tabular">{a.count}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </button>
            ))}
            {!data.anom_distribution.length && (
              <p className="text-sm text-[var(--text-3)] py-6 text-center">No anomalies detected.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
