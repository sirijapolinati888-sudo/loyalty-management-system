import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LoyaltyAPI, TabCache } from '../services/api';
import {
  Database, Rocket, Layers, Dices, GitBranch, HardDrive, Sparkles, CheckCircle2, AlertCircle,
  RefreshCw, Users, ShoppingCart, Receipt, Check, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { PageHeader, Card, cx } from '../components/ui';

const modes = [
  {
    id: 'starter' as const,
    name: 'Starter',
    icon: Rocket,
    tagline: 'Fast to generate (under a minute). Ideal for demos and local development.',
    stats: [{ icon: Users, v: '100', l: 'customers' }, { icon: ShoppingCart, v: '500', l: 'orders' }, { icon: Receipt, v: '~600', l: 'transactions' }],
  },
  {
    id: 'full' as const,
    name: 'Full scale',
    icon: Layers,
    tagline: 'Production-like volume. Can take a long time and needs plenty of memory.',
    stats: [{ icon: Users, v: '20K', l: 'customers' }, { icon: ShoppingCart, v: '100K', l: 'orders' }, { icon: Receipt, v: '100K+', l: 'transactions' }],
  },
];

// Pipeline steps, matched against the progress messages the backend reports
const pipeline: { label: string; match: RegExp }[] = [
  { label: 'Clear data', match: /Clearing/ },
  { label: 'Customers', match: /^1\.|Starting Synthetic/ },
  { label: 'Orders', match: /^2\./ },
  { label: 'Returns', match: /^3\./ },
  { label: 'Redemptions', match: /^4\./ },
  { label: 'Expiry', match: /^5\.|Completed Successfully/ },
  { label: 'Anomalies', match: /Injecting/ },
  { label: 'Validation', match: /detection/ },
];

type JobStatus = {
  state: 'idle' | 'running' | 'completed' | 'failed';
  mode: string | null;
  message: string;
  started_at: string | null;
  finished_at: string | null;
  counts: Record<string, number> | null;
  error: string | null;
};

export const GeneratorPage: React.FC = () => {
  const [mode, setMode] = useState<'starter' | 'full'>('starter');
  const [injectAnomalies, setInjectAnomalies] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(-1);
  const pollRef = useRef<number | null>(null);

  const running = status?.state === 'running';

  const stopPolling = () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = null;
  };

  const applyStatus = useCallback((s: JobStatus) => {
    setStatus(s);
    const idx = pipeline.findIndex((p) => p.match.test(s.message || ''));
    if (idx >= 0) setActiveStep((prev) => Math.max(prev, idx));
    if (s.state !== 'running') {
      stopPolling();
      // Every cached page is stale once the dataset is replaced
      if (s.state === 'completed') TabCache.invalidate();
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = window.setInterval(() => {
      LoyaltyAPI.getGenerationStatus().then(applyStatus).catch(() => {});
    }, 1200);
  }, [applyStatus]);

  // Resume tracking if a run is already in progress (e.g. after navigating away)
  useEffect(() => {
    LoyaltyAPI.getGenerationStatus()
      .then((s: JobStatus) => {
        applyStatus(s);
        if (s.state === 'running') startPolling();
      })
      .catch(() => {});
    return stopPolling;
  }, [applyStatus, startPolling]);

  const handleGenerate = async () => {
    setConfirming(false);
    setRequestError(null);
    setActiveStep(-1);
    try {
      const s = await LoyaltyAPI.triggerGeneration(mode, injectAnomalies);
      applyStatus(s);
      startPolling();
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setRequestError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const stepState = (i: number) => {
    if (!status || status.state === 'idle' || activeStep < 0) return 'pending';
    if (status.state === 'completed') return i <= activeStep ? 'done' : 'skipped';
    if (i < activeStep) return 'done';
    if (i === activeStep) return status.state === 'failed' ? 'failed' : 'active';
    return 'pending';
  };

  const elapsed = status?.started_at
    ? Math.max(0, Math.round(((status.finished_at ? new Date(status.finished_at) : new Date()).getTime() - new Date(status.started_at).getTime()) / 1000))
    : 0;

  return (
    <div>
      <PageHeader
        icon={Database}
        title="Data generator"
        description="Rebuild the loyalty dataset from the seeded synthetic generator. Fully reproducible."
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
            {modes.map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  disabled={running}
                  onClick={() => { setMode(m.id); setConfirming(false); }}
                  className={cx(
                    'card group relative text-left p-5 cursor-pointer overflow-hidden transition-all duration-500 disabled:cursor-not-allowed disabled:opacity-70',
                    active ? '!border-brand-500 ring-4 ring-brand-500/10 shadow-[var(--shadow-lg)] -translate-y-0.5' : 'card-hover',
                  )}
                >
                  <div className={cx(
                    'absolute -top-20 -right-20 w-56 h-56 rounded-full bg-gradient-to-br from-brand-400/25 to-cyan-300/20 blur-2xl transition-all duration-700',
                    active ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover:opacity-60',
                  )} />
                  <div className="relative flex items-start justify-between">
                    <span className={cx(
                      'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500',
                      active ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[var(--shadow-brand)]' : 'bg-brand-50 text-brand-600 group-hover:scale-105',
                    )}>
                      <m.icon className="w-[22px] h-[22px]" />
                    </span>
                    <span className={cx(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                      active ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300 text-transparent',
                    )}>
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </span>
                  </div>
                  <h3 className="relative mt-4 text-lg font-semibold text-[var(--text)]">{m.name} mode</h3>
                  <p className="relative mt-1 text-[13.5px] text-[var(--text-3)] leading-relaxed">{m.tagline}</p>
                  <div className="relative mt-5 grid grid-cols-3 gap-2">
                    {m.stats.map((s) => (
                      <div key={s.l} className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2.5">
                        <s.icon className="w-4 h-4 text-[var(--text-3)]" />
                        <p className="mt-1.5 text-[17px] font-bold text-[var(--text)] leading-none">{s.v}</p>
                        <p className="mt-1 text-[12px] text-[var(--text-3)]">{s.l}</p>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <Card
            className="animate-fade-up"
            title="Generation pipeline"
            subtitle={running ? status?.message : 'Runs in dependency order, deterministically'}
            icon={GitBranch}
            tone="violet"
            actions={status?.started_at && status.state !== 'idle' && (
              <span className="text-[13px] text-[var(--text-3)] tabular">{elapsed}s</span>
            )}
          >
            <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {pipeline.map((p, i) => {
                const st = stepState(i);
                return (
                  <li
                    key={p.label}
                    className={cx(
                      'flex items-center gap-2.5 h-11 px-3 rounded-xl border text-[13px] font-medium transition-all duration-500',
                      st === 'done' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                      st === 'active' && 'border-brand-300 bg-brand-50 text-brand-700 shadow-[0_0_0_4px_rgba(98,54,236,0.08)]',
                      st === 'failed' && 'border-rose-200 bg-rose-50 text-rose-700',
                      (st === 'pending' || st === 'skipped') && 'border-[var(--border)] bg-white text-[var(--text-3)]',
                      st === 'skipped' && 'opacity-50',
                    )}
                  >
                    <span className={cx(
                      'w-6 h-6 rounded-full text-[11px] flex items-center justify-center shrink-0 transition-colors duration-500',
                      st === 'done' ? 'bg-emerald-500 text-white' : st === 'active' ? 'bg-brand-600 text-white' : st === 'failed' ? 'bg-rose-500 text-white' : 'bg-slate-100',
                    )}>
                      {st === 'done' ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : st === 'active' ? <RefreshCw className="w-3 h-3 animate-spin" /> : i + 1}
                    </span>
                    <span className="truncate">{p.label}</span>
                  </li>
                );
              })}
            </ol>

            {status?.state === 'completed' && status.counts && (
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-2.5 stagger">
                {Object.entries(status.counts).map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3">
                    <p className="text-[12px] text-[var(--text-3)] capitalize">{k}</p>
                    <p className="mt-1 text-lg font-bold text-[var(--text)] tabular">{v.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="animate-fade-up h-fit xl:sticky xl:top-2" title="Run configuration" icon={Sparkles} tone="brand">
          <dl className="space-y-3 text-[13.5px]">
            {[
              { icon: Dices, label: 'Random seed', value: <span className="font-mono">20261022</span>, hint: 'Fixed & deterministic' },
              { icon: Layers, label: 'Mode', value: mode === 'starter' ? 'Starter' : 'Full scale' },
              { icon: HardDrive, label: 'Output', value: 'PostgreSQL + data/ CSV & JSON exports' },
            ].map((r) => (
              <div key={r.label} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <r.icon className="w-4 h-4 mt-0.5 text-brand-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <dt className="text-[12.5px] text-[var(--text-3)]">{r.label}</dt>
                  <dd className="font-medium text-[var(--text)]">{r.value}</dd>
                  {r.hint && <p className="text-[12px] text-[var(--text-3)]">{r.hint}</p>}
                </div>
              </div>
            ))}
          </dl>

          <label className={cx('mt-3 flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors', injectAnomalies ? 'border-brand-200 bg-brand-50/50' : 'border-[var(--border)] hover:bg-[var(--surface-2)]')}>
            <input
              type="checkbox"
              checked={injectAnomalies}
              disabled={running}
              onChange={(e) => setInjectAnomalies(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#6236ec] cursor-pointer"
            />
            <span>
              <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--text)]"><ShieldAlert className="w-4 h-4 text-brand-600" /> Inject benchmark anomalies</span>
              <span className="block text-[12.5px] text-[var(--text-3)]">Adds the 5 labelled anomalies used by the Validation page.</span>
            </span>
          </label>

          {!confirming ? (
            <button onClick={() => setConfirming(true)} disabled={running} className="btn btn-primary btn-lg w-full mt-5">
              {running ? <RefreshCw className="animate-spin" /> : <Sparkles />}
              {running ? 'Generating…' : 'Generate dataset'}
            </button>
          ) : (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 animate-scale-in">
              <p className="flex items-start gap-2 text-[13.5px] text-amber-900">
                <AlertTriangle className="w-[18px] h-[18px] shrink-0 mt-px" />
                <span>
                  This <strong>deletes all current loyalty data</strong> (customers, orders, ledger, redemptions) and
                  replaces it with a fresh {mode === 'starter' ? 'starter' : 'full-scale'} dataset. Demo logins are kept.
                </span>
              </p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setConfirming(false)} className="btn btn-secondary flex-1">Cancel</button>
                <button onClick={handleGenerate} className="btn btn-danger flex-1">Replace data</button>
              </div>
            </div>
          )}

          {requestError && (
            <div className="callout mt-4 bg-rose-50 border-rose-200 text-rose-800 animate-scale-in">
              <AlertCircle className="w-[18px] h-[18px] shrink-0 mt-px" />
              <span>{requestError}</span>
            </div>
          )}

          {status && status.state !== 'idle' && (
            <div className={cx(
              'callout mt-4 animate-scale-in',
              status.state === 'failed' ? 'bg-rose-50 border-rose-200 text-rose-800'
                : status.state === 'running' ? 'bg-brand-50 border-brand-100 text-brand-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800',
            )}>
              {status.state === 'failed' ? <AlertCircle className="w-[18px] h-[18px] shrink-0 mt-px" />
                : status.state === 'running' ? <span className="spinner mt-0.5 shrink-0" />
                : <CheckCircle2 className="w-[18px] h-[18px] shrink-0 mt-px" />}
              <span>{status.message}</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
