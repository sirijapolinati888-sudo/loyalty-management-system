import React, { useEffect, useState, useMemo } from 'react';
import { LoyaltyAPI } from '../services/api';
import { CustomSelect } from '../components/CustomSelect';
import {
  Clock,
  Play,
  Search,
  Hash,
  Calendar,
  Users,
  Coins,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw
} from 'lucide-react';

export const ExpirationPage: React.FC = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search & Pagination for FIFO Lots
  const [searchLot, setSearchLot] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterState, setFilterState] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');
  const pageSize = 15; // standard 15 rows per page

  const loadData = () => {
    setLoading(true);
    Promise.all([
      LoyaltyAPI.getExpiryBatches(),
      LoyaltyAPI.getPointsLots(),
    ])
      .then(([b, l]) => {
        setBatches(b || []);
        setLots(l || []);
      })
      .catch((err) => console.error('Failed to load expiration data:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunExpiration = async () => {
    setRunning(true);
    try {
      await LoyaltyAPI.runExpiration({});
      loadData();
    } catch (err) {
      console.error('Error running expiration batch:', err);
    } finally {
      setRunning(false);
    }
  };

  // Filter lots by state and search string
  const filteredLots = useMemo(() => {
    return lots.filter((l) => {
      if (filterState === 'ACTIVE' && l.is_expired) return false;
      if (filterState === 'EXPIRED' && !l.is_expired) return false;
      if (!searchLot.trim()) return true;
      const term = searchLot.toLowerCase().trim();
      return (
        l.id?.toLowerCase().includes(term) ||
        l.account_id?.toLowerCase().includes(term)
      );
    });
  }, [lots, filterState, searchLot]);

  const totalLotsCount = filteredLots.length;
  const totalPages = Math.max(1, Math.ceil(totalLotsCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalLotsCount);
  const currentLots = filteredLots.slice(startIndex, endIndex);

  return (
    <div className="space-y-3.5">
      {/* Top Header: Title & Subtitle + 3D Run Action Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6355f6] to-[#8d7dfb] text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
              Points Expiration Management
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-1 leading-none">
              Lot-level FIFO point expiration engine with idempotency and duplicate run prevention
            </p>
          </div>
        </div>

        {/* 3D Bulged Action Button */}
        <button
          onClick={handleRunExpiration}
          disabled={running}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-b from-[#e11d48] to-[#be123c] hover:from-[#be123c] hover:to-[#9f1239] shadow-[0_3px_8px_rgba(225,29,72,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
        >
          {running ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{running ? 'Processing Expiry Batch...' : 'Run Expiration Batch'}</span>
        </button>
      </div>

      {/* Card 1: Completed Expiry Batches */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
        <div className="py-2.5 px-5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-slate-800">Completed Expiry Batches</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edeafc] text-[#6355f6] border border-indigo-100 shadow-2xs">
              {batches.length} Recorded
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Lavender Table Header */}
            <thead className="bg-gradient-to-r from-[#f4f1fe] via-[#f7f5ff] to-[#f4f1fe] border-b border-[#e9e3fe] text-[#2e1d68] font-black tracking-tight">
              <tr>
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[160px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Hash className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Batch ID</span>
                  </div>
                </th>
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[130px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Calendar className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Cutoff Date</span>
                  </div>
                </th>
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[140px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Users className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Accounts Processed</span>
                  </div>
                </th>
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[130px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Coins className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Points Expired</span>
                  </div>
                </th>
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[120px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Activity className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Status</span>
                  </div>
                </th>
              </tr>
            </thead>

            {/* Compact Rows */}
            <tbody className="divide-y divide-slate-100">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-2 font-mono font-bold text-slate-900 tracking-tight text-[11px] whitespace-nowrap">
                    {b.id}
                  </td>
                  <td className="px-4 py-2 text-slate-500 font-medium text-[11px] whitespace-nowrap">
                    {new Date(b.cutoff_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-2 font-bold text-slate-800 text-xs whitespace-nowrap">
                    {b.total_accounts_processed}
                  </td>
                  <td className="px-4 py-2 font-black text-rose-600 text-xs whitespace-nowrap">
                    -{b.total_points_expired} pts
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {/* Borderless 3D Embossed Pill Badge */}
                    <span
                      className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-bold select-none whitespace-nowrap"
                      style={{
                        background: 'linear-gradient(180deg, #ffffff 0%, #d1fae5 100%)',
                        color: '#065f46',
                        boxShadow:
                          '0 1.5px 3.5px rgba(16, 185, 129, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(167, 243, 208, 0.5)',
                      }}
                    >
                      {(b.status || 'completed').toLowerCase().replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}

              {batches.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-slate-400 font-medium text-xs">
                    No completed expiry batches yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 2: FIFO Points Lot Tracking with 3D Inset Search Bar and 15 Rows Pagination */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
        {/* Table Container Header with Integrated 3D Inset Search Bar */}
        <div className="py-2.5 px-5 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-slate-800">FIFO Points Lot Tracking</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edeafc] text-[#6355f6] border border-indigo-100 shadow-2xs">
              {totalLotsCount} Lots
            </span>

            {/* State Filter Dropdown with 3D Bulged Styling */}
            <CustomSelect
              value={filterState}
              onChange={(val) => {
                setFilterState(val as 'ALL' | 'ACTIVE' | 'EXPIRED');
                setCurrentPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Lots' },
                { value: 'ACTIVE', label: 'Active', badge: 'Active', badgeColor: 'bg-emerald-100 text-emerald-700' },
                { value: 'EXPIRED', label: 'Expired', badge: 'Expired', badgeColor: 'bg-rose-100 text-rose-700' },
              ]}
              icon={Filter}
              placeholder="All Lots"
              className="ml-2"
            />
          </div>

          {/* 3D Inset Beveled Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by lot ID or account..."
              value={searchLot}
              onChange={(e) => {
                setSearchLot(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-1.5 bg-[#f4f6fc] border-t border-t-slate-300/80 border-l border-l-slate-300/70 border-b border-b-white border-r border-r-white rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6355f6]/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_1px_1px_rgba(255,255,255,0.8)] transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Lavender Table Header */}
            <thead className="bg-gradient-to-r from-[#f4f1fe] via-[#f7f5ff] to-[#f4f1fe] border-b border-[#e9e3fe] text-[#2e1d68] font-black tracking-tight">
              <tr>
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[160px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Hash className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Lot ID</span>
                  </div>
                </th>
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[150px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Layers className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Account</span>
                  </div>
                </th>
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[110px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Coins className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Initial Points</span>
                  </div>
                </th>
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[110px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Coins className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Remaining</span>
                  </div>
                </th>
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[130px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Calendar className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Expires At</span>
                  </div>
                </th>
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[120px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Activity className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Expired State</span>
                  </div>
                </th>
              </tr>
            </thead>

            {/* Compact Rows (py-2) */}
            <tbody className="divide-y divide-slate-100">
              {currentLots.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-2 font-mono font-bold text-slate-900 tracking-tight text-[11px] whitespace-nowrap">
                    {l.id}
                  </td>
                  <td className="px-4 py-2 font-mono text-slate-600 font-semibold text-[11px] whitespace-nowrap">
                    {l.account_id}
                  </td>
                  <td className="px-4 py-2 font-bold text-slate-800 text-xs whitespace-nowrap">
                    {l.initial_points}
                  </td>
                  <td className="px-4 py-2 font-black text-[#2563eb] text-xs whitespace-nowrap">
                    {l.remaining_points}
                  </td>
                  <td className="px-4 py-2 text-slate-500 font-medium text-[11px] whitespace-nowrap">
                    {new Date(l.expires_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {/* Borderless 3D Bulged Pill Badge (lowercase) */}
                    {l.is_expired ? (
                      <span
                        className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-bold select-none whitespace-nowrap"
                        style={{
                          background: 'linear-gradient(180deg, #ffffff 0%, #ffe4e6 100%)',
                          color: '#e11d48',
                          boxShadow:
                            '0 1.5px 3.5px rgba(225, 29, 72, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(254, 205, 211, 0.5)',
                        }}
                      >
                        expired
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-bold select-none whitespace-nowrap"
                        style={{
                          background: 'linear-gradient(180deg, #ffffff 0%, #d1fae5 100%)',
                          color: '#065f46',
                          boxShadow:
                            '0 1.5px 3.5px rgba(16, 185, 129, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(167, 243, 208, 0.5)',
                        }}
                      >
                        active
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {currentLots.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 font-medium text-xs">
                    No points lots found matching your filter
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
              {totalLotsCount > 0 ? startIndex + 1 : 0} &ndash; {endIndex}
            </span>{' '}
            of <span className="font-bold text-slate-700">{totalLotsCount}</span> lots
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {(() => {
              const pages: (number | string)[] = [];
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                if (currentPage <= 4) {
                  pages.push(1, 2, 3, 4, 5, '...', totalPages);
                } else if (currentPage >= totalPages - 3) {
                  pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                } else {
                  pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                }
              }

              return pages.map((item, idx) => {
                if (item === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} className="text-slate-300 text-xs px-1 select-none">
                      &hellip;
                    </span>
                  );
                }
                const pageNum = item as number;
                return (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-[#6355f6] text-white shadow-xs'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              });
            })()}

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
