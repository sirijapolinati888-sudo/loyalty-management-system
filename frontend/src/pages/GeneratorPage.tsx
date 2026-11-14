import React, { useState } from 'react';
import { LoyaltyAPI } from '../services/api';
import {
  Database,
  Settings,
  Rocket,
  Layers,
  Dices,
  GitBranch,
  HardDrive,
  Sparkles,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export const GeneratorPage: React.FC = () => {
  const [mode, setMode] = useState<'starter' | 'full'>('starter');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setStatusMsg(`Generating dataset in ${mode} mode (Fixed seed: 20261022)...`);
    try {
      const res = await LoyaltyAPI.triggerGeneration(mode);
      setStatusMsg(res.message);
    } catch (e: any) {
      setStatusMsg(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header: Title & Subtitle */}
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6355f6] to-[#8d7dfb] text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/25">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
              Synthetic Data Generation Engine
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1 leading-none">
              Generate scalable, statistically sound, and fully reproducible loyalty datasets
            </p>
          </div>
        </div>
      </div>

      {/* Main Container Card */}
      <div 
        className="bg-white rounded-3xl p-7 border border-slate-100 space-y-6"
        style={{
          boxShadow: '0 20px 40px -15px rgba(99, 85, 246, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Section Header: Generation Mode */}
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#43269c] stroke-[2.2]" />
          <h2 className="text-sm font-black text-slate-900 tracking-tight">
            Generation Mode
          </h2>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Starter Mode Card */}
          <div
            onClick={() => setMode('starter')}
            className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between relative overflow-hidden group select-none`}
            style={{
              background: mode === 'starter'
                ? 'linear-gradient(135deg, #ffffff 0%, #f7f4ff 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
              boxShadow: mode === 'starter'
                ? '0 14px 28px -6px rgba(110, 47, 239, 0.22), 0 6px 12px -4px rgba(110, 47, 239, 0.12), inset 0 1px 2px rgba(255, 255, 255, 1), 0 0 0 2px #6e2fef'
                : '0 8px 18px -4px rgba(0, 0, 0, 0.06), 0 2px 6px -2px rgba(0, 0, 0, 0.04), inset 0 1px 2px rgba(255, 255, 255, 0.9), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              transform: mode === 'starter' ? 'translateY(-2px)' : 'translateY(0)'
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300`}
                style={{
                  background: mode === 'starter'
                    ? 'linear-gradient(135deg, #ede5fd 0%, #dfd1fa 100%)'
                    : 'linear-gradient(135deg, #f4f3fb 0%, #ebe7f7 100%)',
                  boxShadow: mode === 'starter'
                    ? '0 4px 10px rgba(110, 47, 239, 0.25), inset 0 1px 1px #fff'
                    : '0 2px 5px rgba(0,0,0,0.04), inset 0 1px 1px #fff',
                  color: mode === 'starter' ? '#410cce' : '#553b9f'
                }}
              >
                <Rocket className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900 tracking-tight">Starter Mode</div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  100 customers &bull; 500 orders &bull; 1,500 points txns
                </div>
              </div>
            </div>

            {/* Custom 3D Circular Radio Indicator */}
            <div className="shrink-0 pl-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  border: mode === 'starter' ? '2px solid #6e2fef' : '2px solid #d1d5db',
                  background: mode === 'starter' ? '#fff' : '#f9fafb',
                  boxShadow: mode === 'starter' ? '0 2px 6px rgba(110, 47, 239, 0.3)' : 'inset 0 1px 2px rgba(0,0,0,0.08)'
                }}
              >
                {mode === 'starter' && (
                  <div 
                    className="w-2.5 h-2.5 rounded-full bg-[#6e2fef]" 
                    style={{
                      boxShadow: '0 1px 3px rgba(110, 47, 239, 0.5)'
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Full Scale Mode Card */}
          <div
            onClick={() => setMode('full')}
            className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between relative overflow-hidden group select-none`}
            style={{
              background: mode === 'full'
                ? 'linear-gradient(135deg, #ffffff 0%, #f7f4ff 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
              boxShadow: mode === 'full'
                ? '0 14px 28px -6px rgba(110, 47, 239, 0.22), 0 6px 12px -4px rgba(110, 47, 239, 0.12), inset 0 1px 2px rgba(255, 255, 255, 1), 0 0 0 2px #6e2fef'
                : '0 8px 18px -4px rgba(0, 0, 0, 0.06), 0 2px 6px -2px rgba(0, 0, 0, 0.04), inset 0 1px 2px rgba(255, 255, 255, 0.9), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              transform: mode === 'full' ? 'translateY(-2px)' : 'translateY(0)'
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300`}
                style={{
                  background: mode === 'full'
                    ? 'linear-gradient(135deg, #ede5fd 0%, #dfd1fa 100%)'
                    : 'linear-gradient(135deg, #f4f3fb 0%, #ebe7f7 100%)',
                  boxShadow: mode === 'full'
                    ? '0 4px 10px rgba(110, 47, 239, 0.25), inset 0 1px 1px #fff'
                    : '0 2px 5px rgba(0,0,0,0.04), inset 0 1px 1px #fff',
                  color: mode === 'full' ? '#410cce' : '#553b9f'
                }}
              >
                <Layers className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900 tracking-tight">Full Scale Mode</div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  20,000 customers &bull; 100,000 orders &bull; 300,000 points txns
                </div>
              </div>
            </div>

            {/* Custom 3D Circular Radio Indicator */}
            <div className="shrink-0 pl-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  border: mode === 'full' ? '2px solid #6e2fef' : '2px solid #d1d5db',
                  background: mode === 'full' ? '#fff' : '#f9fafb',
                  boxShadow: mode === 'full' ? '0 2px 6px rgba(110, 47, 239, 0.3)' : 'inset 0 1px 2px rgba(0,0,0,0.08)'
                }}
              >
                {mode === 'full' && (
                  <div 
                    className="w-2.5 h-2.5 rounded-full bg-[#6e2fef]" 
                    style={{
                      boxShadow: '0 1px 3px rgba(110, 47, 239, 0.5)'
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Specifications Box with Vertical Divider & 3D styling */}
        <div 
          className="p-5 bg-gradient-to-br from-[#f8f6ff] to-[#f1edfd] rounded-2xl border border-[#e5ddfa] text-xs"
          style={{
            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.9), 0 4px 14px -3px rgba(110, 47, 239, 0.08)'
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Left Column: Icons & Labels */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <Dices className="w-4 h-4 text-[#6939c9] stroke-[2.2] shrink-0" />
                <span className="font-bold text-slate-800">Random Seed:</span>
              </div>
              <div className="flex items-center gap-2.5">
                <GitBranch className="w-4 h-4 text-[#6939c9] stroke-[2.2] shrink-0" />
                <span className="font-bold text-slate-800">Generation Pipeline:</span>
              </div>
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-[#6939c9] stroke-[2.2] shrink-0" />
                <span className="font-bold text-slate-800">Storage Target:</span>
              </div>
            </div>

            {/* Right Column: Values */}
            <div className="space-y-2.5 md:border-l md:border-slate-200/80 md:pl-6 text-right md:text-right">
              <div>
                <span className="font-black text-[#43269c]">20261022 (Fixed deterministic)</span>
              </div>
              <div>
                <span className="font-medium text-slate-700">
                  12-Step Dependency Order (Master &rarr; Orders &rarr; Returns &rarr; Ledger)
                </span>
              </div>
              <div>
                <span className="font-medium text-slate-700">
                  PostgreSQL `yottaflex` &amp; CSV/JSON Exports
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trigger Data Generator Action Button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-black text-sm text-white bg-gradient-to-r from-[#8245fa] via-[#6e2fef] to-[#5b1edb] hover:opacity-95 shadow-[0_4px_14px_rgba(110,47,239,0.35)] active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Sparkles className="w-4 h-4 text-white stroke-[2.2]" />
          )}
          <span>{loading ? 'Executing Pipeline...' : 'Trigger Data Generator'}</span>
        </button>

        {/* Status Message */}
        {statusMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
