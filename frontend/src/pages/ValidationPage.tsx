import React, { useEffect, useState } from 'react';
import { LoyaltyAPI, API_BASE_URL } from '../services/api';
import { ShieldCheck, RefreshCw, Target, Crosshair, BarChart2, Trophy, Database, FileText, Check, Clock, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { PageHeader, StatCard, Card, AnimatedNumber, cx } from '../components/ui';

const downloads = [
  { file: 'customers.csv', path: 'master/customers.csv', desc: 'Master customer records', type: 'csv' },
  { file: 'points_transactions.csv', path: 'transactions/points_transactions.csv', desc: 'Full points ledger', type: 'csv' },
  { file: 'orders.csv', path: 'transactions/orders.csv', desc: 'Orders with eligible spend', type: 'csv' },
  { file: 'ground_truth.json', path: 'ground_truth/ground_truth.json', desc: 'Injected anomaly labels', type: 'json' },
];

const asNumber = (v: any) => (v === undefined || v === null || v === '' ? null : Number(v));

export const ValidationPage: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = () => {
    setLoading(true);
    LoyaltyAPI.getValidationReport()
      .then(setReport)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const vResults = report?.validation_results;
  const metrics = report?.ground_truth_metrics;

  const accuracy = asNumber(metrics?.accuracy_percentage);
  const precision = asNumber(metrics?.precision);
  const recall = asNumber(metrics?.recall);
  const f1 = asNumber(metrics?.f1_score);
  const tp = asNumber(metrics?.true_positives);
  const gt = asNumber(metrics?.ground_truth_count);
  const records = asNumber(vResults?.total_records_checked);
  const runtime = asNumber(vResults?.execution_time_seconds);

  const metric = (v: number | null, decimals = 2, suffix = '') => (v === null ? '—' : <AnimatedNumber value={v} decimals={decimals} suffix={suffix} />);

  return (
    <div>
      <PageHeader
        icon={ShieldCheck}
        title="Validation & reports"
        description="Benchmark the detection engine against ground-truth labels and export audit datasets."
        actions={
          <button onClick={fetchReport} disabled={loading} className="btn btn-secondary">
            <RefreshCw className={cx(loading && 'animate-spin')} />
            {loading ? 'Running checks…' : 'Re-run checks'}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        <StatCard label="Detection accuracy" value={accuracy === null ? '—' : accuracy} decimals={accuracy !== null && accuracy % 1 ? 1 : 0} suffix="%" icon={Target} tone="emerald" hint="Ground-truth match rate" />
        <StatCard label="Precision" value={precision === null ? '—' : precision} decimals={2} icon={Crosshair} tone="blue" hint="Flagged items that were real" />
        <StatCard label="Recall" value={recall === null ? '—' : recall} decimals={2} icon={BarChart2} tone="violet" hint="Real anomalies that were caught" />
        <StatCard label="F1 score" value={f1 === null ? '—' : f1} decimals={2} icon={Trophy} tone="amber" hint="Harmonic mean of precision & recall" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card className="lg:col-span-2 animate-fade-up" title="Ledger verification summary" subtitle="Results of the latest independent audit run" icon={Database} tone="brand">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 stagger">
            {[
              { label: 'Records checked', value: metric(records, 0), icon: FileText, cls: 'text-[var(--text)]' },
              { label: 'True positives', value: <>{metric(tp, 0)}<span className="text-[var(--text-3)] font-medium"> / {gt ?? '—'}</span></>, icon: Check, cls: 'text-emerald-600' },
              { label: 'Run time', value: runtime === null ? '—' : <AnimatedNumber value={runtime} decimals={4} suffix="s" />, icon: Clock, cls: 'text-[var(--text)]' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 transition-all duration-300 hover:bg-white hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5">
                <p className="flex items-center gap-2 text-[13px] text-[var(--text-3)]"><s.icon className="w-4 h-4" /> {s.label}</p>
                <p className={cx('mt-2 text-2xl font-bold leading-none', s.cls)}>{s.value}</p>
              </div>
            ))}
          </div>

          {gt !== null && tp !== null && gt > 0 && (
            <div className="mt-5">
              <div className="flex justify-between text-[13px] mb-2">
                <span className="text-[var(--text-3)]">Ground-truth coverage</span>
                <span className="font-semibold text-[var(--text)] tabular">{((tp / gt) * 100).toFixed(1)}%</span>
              </div>
              <div className="progress h-2.5"><span style={{ width: `${Math.min(100, (tp / gt) * 100)}%` }} /></div>
            </div>
          )}
        </Card>

        <Card className="animate-fade-up" title="Score breakdown" subtitle="0 – 1 scale" icon={BarChart2} tone="violet">
          <div className="space-y-4">
            {[
              { label: 'Precision', v: precision, color: 'linear-gradient(90deg,#3b82f6,#22d3ee)' },
              { label: 'Recall', v: recall, color: 'linear-gradient(90deg,#8b5cf6,#d946ef)' },
              { label: 'F1 score', v: f1, color: 'linear-gradient(90deg,#f59e0b,#f97316)' },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-[13.5px] mb-1.5">
                  <span className="font-medium text-[var(--text)]">{m.label}</span>
                  <span className="text-[var(--text-3)] tabular">{m.v === null ? '—' : m.v.toFixed(2)}</span>
                </div>
                <div className="progress"><span style={{ width: `${Math.min(100, (m.v ?? 0) * 100)}%`, background: m.color }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4 animate-fade-up" title="Download audit datasets" subtitle="Exports generated from the seeded dataset" icon={Download} tone="emerald">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 stagger">
          {downloads.map((d) => {
            const Icon = d.type === 'json' ? FileJson : FileSpreadsheet;
            return (
              <a
                key={d.file}
                href={`${API_BASE_URL}/exports/download/${d.path}`}
                download
                className="group flex items-center gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-white transition-all duration-300 hover:border-brand-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5"
              >
                <span className={cx(
                  'icon-tile icon-tile-sm ring-1 ring-inset',
                  d.type === 'json' ? 'bg-violet-50 text-violet-600 ring-violet-100' : 'bg-emerald-50 text-emerald-600 ring-emerald-100',
                )}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[13px] font-medium text-[var(--text)] truncate group-hover:text-brand-600 transition-colors">{d.file}</span>
                  <span className="block text-[12px] text-[var(--text-3)] truncate">{d.desc}</span>
                </span>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-3)] bg-[var(--surface-2)] transition-all duration-300 group-hover:bg-brand-600 group-hover:text-white">
                  <Download className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" />
                </span>
              </a>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
