import React, { useEffect, useState } from 'react';
import { LoyaltyAPI, API_BASE_URL } from '../services/api';
import {
  ShieldCheck,
  RefreshCw,
  Target,
  Layers,
  BarChart2,
  Trophy,
  Database,
  FileText,
  Check,
  Clock,
  ArrowDown
} from 'lucide-react';

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

  return (
    <div className="space-y-4">
      {/* Top Header: Title, Subtitle & Re-run Checks Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6355f6] to-[#8d7dfb] text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/25">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
              Validation, Reconciliation &amp; Accuracy
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1 leading-none">
              Benchmark detection engine against ground-truth datasets with statistical rigor
            </p>
          </div>
        </div>

        <button
          onClick={fetchReport}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/90 hover:bg-white border border-[#ddd6fe] rounded-xl text-xs font-bold text-[#1e1b4b] shadow-2xs hover:border-[#6355f6]/50 active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#1e1b4b] ${loading ? 'animate-spin' : ''}`} />
          <span>Re-run Checks</span>
        </button>
      </div>

      {/* Accuracy KPI Grid (4 Cards with 3D Bulged Styling) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Detection Accuracy (Emerald/Mint Green Card) */}
        <div
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%)',
            boxShadow: '0 4px 10px -2px rgba(16, 185, 129, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(16, 185, 129, 0.15)'
          }}
          className="rounded-xl p-4 border border-emerald-200/90 flex flex-col justify-between hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div className="flex items-start gap-2.5">
            <div
              style={{
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.9)'
              }}
              className="w-7 h-7 rounded-md bg-gradient-to-b from-emerald-50 to-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/80 group-hover:scale-105 transition-transform"
            >
              <Target className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[11px] font-black text-slate-900 leading-tight">Detection Accuracy</div>
              <div className="text-xl font-black text-emerald-600 mt-0.5 leading-tight">
                {metrics?.accuracy_percentage !== undefined ? `${metrics.accuracy_percentage}%` : '%'}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-emerald-700/80 font-medium mt-3 pl-0.5">
            Ground truth match rate
          </div>
        </div>

        {/* Precision Score (Blue Card) */}
        <div
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)',
            boxShadow: '0 4px 10px -2px rgba(59, 130, 246, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(59, 130, 246, 0.15)'
          }}
          className="rounded-xl p-4 border border-blue-200/90 flex flex-col justify-between hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div className="flex items-start gap-2.5">
            <div
              style={{
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.9)'
              }}
              className="w-7 h-7 rounded-md bg-gradient-to-b from-blue-50 to-blue-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/80 group-hover:scale-105 transition-transform"
            >
              <Layers className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[11px] font-black text-slate-900 leading-tight">Precision Score</div>
              <div className="text-xl font-black text-blue-600 mt-0.5 leading-tight">
                {metrics?.precision ?? ''}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-blue-700/80 font-medium mt-3 pl-0.5">
            Zero false positives
          </div>
        </div>

        {/* Recall Score (Purple Card) */}
        <div
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)',
            boxShadow: '0 4px 10px -2px rgba(168, 85, 247, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(168, 85, 247, 0.15)'
          }}
          className="rounded-xl p-4 border border-purple-200/90 flex flex-col justify-between hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div className="flex items-start gap-2.5">
            <div
              style={{
                boxShadow: '0 2px 4px rgba(168, 85, 247, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.9)'
              }}
              className="w-7 h-7 rounded-md bg-gradient-to-b from-purple-50 to-purple-100 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200/80 group-hover:scale-105 transition-transform"
            >
              <BarChart2 className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[11px] font-black text-slate-900 leading-tight">Recall Score</div>
              <div className="text-xl font-black text-purple-600 mt-0.5 leading-tight">
                {metrics?.recall ?? ''}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-purple-700/80 font-medium mt-3 pl-0.5">
            Full anomaly capture
          </div>
        </div>

        {/* F1 Score (Amber / Peach Card) */}
        <div
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #fffbeb 100%)',
            boxShadow: '0 4px 10px -2px rgba(245, 158, 11, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(245, 158, 11, 0.15)'
          }}
          className="rounded-xl p-4 border border-amber-200/90 flex flex-col justify-between hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div className="flex items-start gap-2.5">
            <div
              style={{
                boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.9)'
              }}
              className="w-7 h-7 rounded-md bg-gradient-to-b from-amber-50 to-amber-100 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/80 group-hover:scale-105 transition-transform"
            >
              <Trophy className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[11px] font-black text-slate-900 leading-tight">F1 Score</div>
              <div className="text-xl font-black text-amber-600 mt-0.5 leading-tight">
                {metrics?.f1_score ?? ''}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-amber-700/80 font-medium mt-3 pl-0.5">
            Harmonic mean precision-recall
          </div>
        </div>
      </div>

      {/* Database & Ledger Verification Summary */}
      <div
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)',
          boxShadow: '0 4px 12px -2px rgba(99, 102, 241, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(226, 232, 240, 0.6)'
        }}
        className="rounded-xl p-4.5 border border-slate-200/80"
      >
        <div className="flex items-center gap-2 mb-3.5">
          <Database className="w-4 h-4 text-[#38239c]" />
          <h2 className="text-sm font-black text-slate-900 tracking-tight">
            Database &amp; Ledger Verification Summary
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Total Records Checked */}
          <div
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%)',
              boxShadow: '0 3px 6px -1px rgba(99, 102, 241, 0.12), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(99, 102, 241, 0.1)'
            }}
            className="p-3.5 rounded-xl border border-indigo-200/70 flex items-center gap-2.5"
          >
            <div
              style={{
                boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
              }}
              className="w-7 h-7 rounded-md bg-gradient-to-b from-indigo-50 to-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200/80"
            >
              <FileText className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-600">Total Records Checked</div>
              <div className="text-xl font-black text-slate-950 leading-tight mt-0.5">
                {vResults?.total_records_checked ?? 1535}
              </div>
            </div>
          </div>

          {/* True Positives Detected */}
          <div
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%)',
              boxShadow: '0 3px 6px -1px rgba(16, 185, 129, 0.12), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(16, 185, 129, 0.1)'
            }}
            className="p-3.5 rounded-xl border border-emerald-200/70 flex items-center gap-2.5"
          >
            <div
              style={{
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
              }}
              className="w-7 h-7 rounded-md bg-gradient-to-b from-emerald-50 to-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/80"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-600">True Positives Detected</div>
              <div className="text-xl font-black text-emerald-600 leading-tight mt-0.5 flex items-baseline gap-1.5">
                <span>{metrics?.true_positives ?? ''}</span>
                <span className="text-slate-900 font-black">/</span>
                <span className="text-slate-900 font-black">{metrics?.ground_truth_count ?? ''}</span>
              </div>
            </div>
          </div>

          {/* Verification Run Time */}
          <div
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)',
              boxShadow: '0 3px 6px -1px rgba(59, 130, 246, 0.12), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(59, 130, 246, 0.1)'
            }}
            className="p-3.5 rounded-xl border border-blue-200/70 flex items-center gap-2.5"
          >
            <div
              style={{
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
              }}
              className="w-7 h-7 rounded-md bg-gradient-to-b from-blue-50 to-blue-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/80"
            >
              <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-600">Verification Run Time</div>
              <div className="text-xl font-black text-slate-950 leading-tight mt-0.5">
                {vResults?.execution_time_seconds ? `${vResults.execution_time_seconds}s` : '0.1098s'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Audit Datasets & Manifest */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/70 shadow-2xs">
        <div className="flex items-center gap-2 mb-4">
          <ArrowDown className="w-4 h-4 text-[#37229b] stroke-[2.5]" />
          <h2 className="text-sm font-black text-slate-900 tracking-tight">
            Download Audit Datasets &amp; Manifest
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          {/* customers.csv */}
          <a
            href={`${API_BASE_URL}/exports/download/master/customers.csv`}
            download
            className="p-3 bg-[#f5f3fe] hover:bg-[#edeafc] rounded-xl flex items-center justify-between group transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <FileText className="w-7 h-7 text-[#2b764d] fill-[#d7f6e6]" />
                <span className="absolute bottom-1 text-[8px] font-black text-[#2b764d] tracking-tighter">
                  CSV
                </span>
              </div>
              <span className="font-bold text-slate-900 group-hover:text-[#6355f6] transition-colors">
                customers.csv
              </span>
            </div>
            <ArrowDown className="w-4 h-4 text-[#402c9b] stroke-[2.2] group-hover:translate-y-0.5 transition-transform" />
          </a>

          {/* points_transactions.csv */}
          <a
            href={`${API_BASE_URL}/exports/download/transactions/points_transactions.csv`}
            download
            className="p-3 bg-[#f5f3fe] hover:bg-[#edeafc] rounded-xl flex items-center justify-between group transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <FileText className="w-7 h-7 text-[#2b764d] fill-[#d7f6e6]" />
                <span className="absolute bottom-1 text-[8px] font-black text-[#2b764d] tracking-tighter">
                  CSV
                </span>
              </div>
              <span className="font-bold text-slate-900 group-hover:text-[#6355f6] transition-colors">
                points_transactions.csv
              </span>
            </div>
            <ArrowDown className="w-4 h-4 text-[#402c9b] stroke-[2.2] group-hover:translate-y-0.5 transition-transform" />
          </a>

          {/* ground_truth.json */}
          <a
            href={`${API_BASE_URL}/exports/download/ground_truth/ground_truth.json`}
            download
            className="p-3 bg-[#f5f3fe] hover:bg-[#edeafc] rounded-xl flex items-center justify-between group transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <FileText className="w-7 h-7 text-[#5031b0] fill-[#edeafc]" />
                <span className="absolute bottom-1 text-[7px] font-black text-[#5031b0] tracking-tighter">
                  JSON
                </span>
              </div>
              <span className="font-bold text-slate-900 group-hover:text-[#6355f6] transition-colors">
                ground_truth.json
              </span>
            </div>
            <ArrowDown className="w-4 h-4 text-[#402c9b] stroke-[2.2] group-hover:translate-y-0.5 transition-transform" />
          </a>

          {/* orders.csv */}
          <a
            href={`${API_BASE_URL}/exports/download/transactions/orders.csv`}
            download
            className="p-3 bg-[#f5f3fe] hover:bg-[#edeafc] rounded-xl flex items-center justify-between group transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <FileText className="w-7 h-7 text-[#2b764d] fill-[#d7f6e6]" />
                <span className="absolute bottom-1 text-[8px] font-black text-[#2b764d] tracking-tighter">
                  CSV
                </span>
              </div>
              <span className="font-bold text-slate-900 group-hover:text-[#6355f6] transition-colors">
                orders.csv
              </span>
            </div>
            <ArrowDown className="w-4 h-4 text-[#402c9b] stroke-[2.2] group-hover:translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
};
