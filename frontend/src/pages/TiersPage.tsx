import React, { useEffect, useState, useMemo } from 'react';
import { LoyaltyAPI } from '../services/api';
import { CustomSelect } from '../components/CustomSelect';
import {
  Award,
  Search,
  Hash,
  User,
  ShieldCheck,
  Calendar,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Filter,
  TrendingUp,
  Layers,
  FileText
} from 'lucide-react';

export const TiersPage: React.FC = () => {
  const [tiers, setTiers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15; // Standard 15 rows per page

  useEffect(() => {
    setLoading(true);
    Promise.all([
      LoyaltyAPI.getTiers(),
      LoyaltyAPI.getTierHistory(),
    ])
      .then(([t, h]) => {
        setTiers(t || []);
        setHistory(h || []);
      })
      .catch((err) => console.error('Failed to load tiers data:', err))
      .finally(() => setLoading(false));
  }, []);

  // Filter history
  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      if (selectedTierFilter && h.tier_id !== selectedTierFilter) return false;
      if (!search.trim()) return true;
      const term = search.toLowerCase().trim();
      return (
        h.id?.toLowerCase().includes(term) ||
        h.customer_id?.toLowerCase().includes(term) ||
        h.tier_id?.toLowerCase().includes(term) ||
        h.reason?.toLowerCase().includes(term)
      );
    });
  }, [history, selectedTierFilter, search]);

  const totalCount = filteredHistory.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const currentHistory = filteredHistory.slice(startIndex, endIndex);

  /**
   * Reference Embossed 3D Bulged Pill Badge (Borderless)
   * Exact style modeled after the user's "Absent" sample:
   * Vertical gradient from pure white top to soft pastel base,
   * subtle colored ambient glow, bold colored typography.
   */
  const renderTierBadge = (tierId: string) => {
    const t = (tierId || '').toUpperCase();
    if (t.includes('PLATINUM')) {
      return (
        <span
          className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-black select-none whitespace-nowrap"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #ede9fe 100%)',
            color: '#6d28d9',
            boxShadow:
              '0 1.5px 3.5px rgba(109, 40, 217, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(221, 214, 254, 0.5)',
          }}
        >
          {t}
        </span>
      );
    }
    if (t.includes('GOLD')) {
      return (
        <span
          className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-black select-none whitespace-nowrap"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #fef3c7 100%)',
            color: '#b45309',
            boxShadow:
              '0 1.5px 3.5px rgba(217, 119, 6, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(253, 230, 138, 0.5)',
          }}
        >
          {t}
        </span>
      );
    }
    if (t.includes('SILVER')) {
      return (
        <span
          className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-black select-none whitespace-nowrap"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%)',
            color: '#334155',
            boxShadow:
              '0 1.5px 3.5px rgba(100, 116, 139, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(203, 213, 225, 0.5)',
          }}
        >
          {t}
        </span>
      );
    }
    // BRONZE or DEFAULT
    return (
      <span
        className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-black select-none whitespace-nowrap"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #ffedd5 100%)',
          color: '#c2410c',
          boxShadow:
            '0 1.5px 3.5px rgba(194, 65, 12, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(254, 215, 170, 0.5)',
        }}
      >
        {t}
      </span>
    );
  };

  const getTierTheme = (name: string) => {
    const n = (name || '').toUpperCase();
    if (n.includes('PLATINUM')) {
      return {
        cardBg: 'linear-gradient(180deg, #ffffff 0%, #fbf8ff 100%)',
        cardBorder: 'border-purple-200/90',
        cardShadow: '0 4px 12px -2px rgba(147, 51, 234, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(168, 85, 247, 0.15)',
        titleColor: 'text-purple-900',
        specBg: 'linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)',
        specBorder: 'border-purple-200/70',
        specShadow: '0 2px 4px -1px rgba(147, 51, 234, 0.08), inset 0 1px 1px rgba(255, 255, 255, 1)',
        iconGradient: 'from-[#a855f7] via-[#8b5cf6] to-[#6d28d9]',
        iconShadow: '0 2px 6px rgba(109, 40, 217, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
        iconBorder: 'border-purple-300',
        accentColor: 'text-[#7c3aed]',
      };
    }
    if (n.includes('GOLD')) {
      return {
        cardBg: 'linear-gradient(180deg, #ffffff 0%, #fffdf5 100%)',
        cardBorder: 'border-amber-200/90',
        cardShadow: '0 4px 12px -2px rgba(217, 119, 6, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(245, 158, 11, 0.15)',
        titleColor: 'text-amber-950',
        specBg: 'linear-gradient(180deg, #ffffff 0%, #fffbeb 100%)',
        specBorder: 'border-amber-200/70',
        specShadow: '0 2px 4px -1px rgba(217, 119, 6, 0.08), inset 0 1px 1px rgba(255, 255, 255, 1)',
        iconGradient: 'from-[#fbbf24] via-[#f59e0b] to-[#d97706]',
        iconShadow: '0 2px 6px rgba(217, 119, 6, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
        iconBorder: 'border-amber-300',
        accentColor: 'text-[#d97706]',
      };
    }
    if (n.includes('SILVER')) {
      return {
        cardBg: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        cardBorder: 'border-slate-300/80',
        cardShadow: '0 4px 12px -2px rgba(100, 116, 139, 0.16), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(148, 163, 184, 0.15)',
        titleColor: 'text-slate-900',
        specBg: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
        specBorder: 'border-slate-200',
        specShadow: '0 2px 4px -1px rgba(100, 116, 139, 0.08), inset 0 1px 1px rgba(255, 255, 255, 1)',
        iconGradient: 'from-[#94a3b8] via-[#64748b] to-[#475569]',
        iconShadow: '0 2px 6px rgba(71, 85, 105, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
        iconBorder: 'border-slate-300',
        accentColor: 'text-[#475569]',
      };
    }
    // Bronze
    return {
      cardBg: 'linear-gradient(180deg, #ffffff 0%, #fffbf6 100%)',
      cardBorder: 'border-orange-200/90',
      cardShadow: '0 4px 12px -2px rgba(194, 65, 12, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(234, 88, 12, 0.15)',
      titleColor: 'text-orange-950',
      specBg: 'linear-gradient(180deg, #ffffff 0%, #fff7ed 100%)',
      specBorder: 'border-orange-200/70',
      specShadow: '0 2px 4px -1px rgba(194, 65, 12, 0.08), inset 0 1px 1px rgba(255, 255, 255, 1)',
      iconGradient: 'from-[#fb923c] via-[#ea580c] to-[#c2410c]',
      iconShadow: '0 2px 6px rgba(194, 65, 12, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
      iconBorder: 'border-orange-300',
      accentColor: 'text-[#c2410c]',
    };
  };

  return (
    <div className="space-y-3.5">
      {/* Top Header: Title & Subtitle + Tier Filter Dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6355f6] to-[#8d7dfb] text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
              Membership Tiers &amp; Spend Progression
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-1 leading-none">
              Configurable tier qualification rules calculated strictly on qualifying net spend
            </p>
          </div>
        </div>

        {/* Tier Filter Dropdown with 3D Bulged Styling */}
        <CustomSelect
          value={selectedTierFilter}
          onChange={(val) => {
            setSelectedTierFilter(val);
            setCurrentPage(1);
          }}
          options={[
            { value: '', label: 'All Logs' },
            ...tiers.map((t) => ({ value: t.id, label: t.name })),
          ]}
          icon={Filter}
          placeholder="All Logs"
        />
      </div>

      {/* Tier Configuration Cards (Redesigned 4-Column 3D Bulged Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tiers.map((t) => {
          const theme = getTierTheme(t.name);
          return (
            <div
              key={t.id}
              style={{
                background: theme.cardBg,
                boxShadow: theme.cardShadow,
              }}
              className={`rounded-2xl p-4 border ${theme.cardBorder} flex flex-col justify-between hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-200 group`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-black text-sm ${theme.titleColor} tracking-tight`}>{t.name}</span>
                  <div
                    style={{
                      boxShadow: theme.iconShadow,
                    }}
                    className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${theme.iconGradient} text-white flex items-center justify-center border ${theme.iconBorder} group-hover:scale-105 transition-transform`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mb-3 min-h-[30px] leading-snug">
                  {t.description || 'Tier qualification based on eligible qualifying net spend.'}
                </p>
              </div>

              {/* 3D Inset Spec Card */}
              <div
                style={{
                  background: theme.specBg,
                  boxShadow: theme.specShadow,
                }}
                className={`p-2.5 rounded-xl border ${theme.specBorder} space-y-1.5 text-xs`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Spend Threshold:</span>
                  <span className="font-bold text-slate-800 text-[11px]">
                    ₹{t.min_spend?.toLocaleString()}{' '}
                    {t.max_spend ? `– ₹${t.max_spend?.toLocaleString()}` : '+'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                  <span className="text-[11px] text-slate-500 font-medium">Points Multiplier:</span>
                  <span className={`inline-flex items-center gap-1 font-black text-xs ${theme.accentColor}`}>
                    <TrendingUp className="w-3 h-3" />
                    <span>{t.multiplier}&times;</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Table: Customer Tier Progression Log with 3D Inset Search */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
        {/* Table Container Header with Integrated 3D Inset Search Bar */}
        <div className="py-2.5 px-5 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-slate-800">Customer Tier Progression Log</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edeafc] text-[#6355f6] border border-indigo-100 shadow-2xs">
              {totalCount} Total
            </span>
            {selectedTierFilter && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                Filtered: {selectedTierFilter}
              </span>
            )}
          </div>

          {/* 3D Inset Beveled Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by log ID, customer, tier..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-1.5 bg-[#f4f6fc] border-t border-t-slate-300/80 border-l border-l-slate-300/70 border-b border-b-white border-r border-r-white rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6355f6]/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_1px_1px_rgba(255,255,255,0.8)] transition-all"
            />
          </div>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Lavender Table Header */}
            <thead className="bg-gradient-to-r from-[#f4f1fe] via-[#f7f5ff] to-[#f4f1fe] border-b border-[#e9e3fe] text-[#2e1d68] font-black tracking-tight">
              <tr>
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[140px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Hash className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Log ID</span>
                  </div>
                </th>

                <th className="px-4 py-2.5 whitespace-nowrap min-w-[130px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <User className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Customer ID</span>
                  </div>
                </th>

                <th className="px-4 py-2.5 whitespace-nowrap min-w-[130px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Layers className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Tier Assigned</span>
                  </div>
                </th>

                <th className="px-4 py-2.5 whitespace-nowrap min-w-[170px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <IndianRupee className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Qualifying Spend at Transition</span>
                  </div>
                </th>

                <th className="px-4 py-2.5 whitespace-nowrap min-w-[200px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <FileText className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Reason</span>
                  </div>
                </th>

                <th className="px-4 py-2.5 whitespace-nowrap min-w-[110px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Calendar className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Date</span>
                  </div>
                </th>
              </tr>
            </thead>

            {/* Compact Rows (py-2) */}
            <tbody className="divide-y divide-slate-100">
              {currentHistory.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-2 font-mono font-bold text-slate-900 tracking-tight text-[11px] whitespace-nowrap">
                    {h.id}
                  </td>
                  <td className="px-4 py-2 font-mono text-slate-700 font-semibold text-[11px] whitespace-nowrap">
                    {h.customer_id}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {renderTierBadge(h.tier_id)}
                  </td>
                  <td className="px-4 py-2 font-bold text-slate-900 text-xs whitespace-nowrap">
                    ₹{Number(h.spend_at_transition || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-slate-600 text-[11px] max-w-xs truncate whitespace-nowrap">
                    {h.reason || 'Qualifying net spend transition'}
                  </td>
                  <td className="px-4 py-2 text-slate-500 font-medium text-[11px] whitespace-nowrap">
                    {new Date(h.transition_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}

              {currentHistory.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 font-medium text-xs">
                    No tier transition logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 15 Rows per Page Pagination */}
        <div className="px-5 py-2.5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          <div className="text-slate-400 font-medium text-[11px]">
            Showing{' '}
            <span className="font-bold text-slate-700">
              {totalCount > 0 ? startIndex + 1 : 0} &ndash; {endIndex}
            </span>{' '}
            of <span className="font-bold text-slate-700">{totalCount}</span> entries
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === page
                    ? 'bg-[#6355f6] text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}

            {totalPages > 5 && (
              <>
                <span className="text-slate-300 text-xs px-1">&hellip;</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === totalPages
                      ? 'bg-[#6355f6] text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
             