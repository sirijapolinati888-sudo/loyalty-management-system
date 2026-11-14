import React, { useEffect, useState, useMemo } from 'react';
import { LoyaltyAPI } from '../services/api';
import { CustomSelect } from '../components/CustomSelect';
import {
  Search,
  BookOpen,
  Hash,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Activity,
  Coins,
  ShieldCheck,
  X,
  Copy,
  Check
} from 'lucide-react';

export const LedgerPage: React.FC = () => {
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pageSize = 15; // 15 rows per page matching customer & order standards

  useEffect(() => {
    setLoading(true);
    LoyaltyAPI.getTransactions({ limit: 200, txn_type: filterType || undefined })
      .then((data) => {
        setTxns(data || []);
        setCurrentPage(1);
      })
      .catch((err) => console.error('Failed to load transactions:', err))
      .finally(() => setLoading(false));
  }, [filterType]);

  // Client-side search across Txn ID, Customer ID, Reference ID, Reason
  const filteredTxns = useMemo(() => {
    if (!search.trim()) return txns;
    const term = search.toLowerCase().trim();
    return txns.filter(
      (t) =>
        t.id?.toLowerCase().includes(term) ||
        t.customer_id?.toLowerCase().includes(term) ||
        t.reference_entity_id?.toLowerCase().includes(term) ||
        t.reference_entity?.toLowerCase().includes(term) ||
        t.reason?.toLowerCase().includes(term) ||
        t.transaction_type?.toLowerCase().includes(term)
    );
  }, [txns, search]);

  // Pagination calculation
  const totalCount = filteredTxns.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const currentTxns = filteredTxns.slice(startIndex, endIndex);

  // Type filter pills
  const types = [
    { id: '', label: 'All Transactions' },
    { id: 'ACCRUAL', label: 'Accruals' },
    { id: 'REDEMPTION', label: 'Redemptions' },
    { id: 'REVERSAL', label: 'Reversals' },
    { id: 'EXPIRATION', label: 'Expirations' },
    { id: 'ADJUSTMENT', label: 'Adjustments' },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1800);
  };

  /**
   * Format entity reference text to clean lowercase without underscores
   * e.g. "EXPIRY_BATCH" -> "expiry batch", "REDEMPTION" -> "redemption"
   */
  const formatReferenceEntity = (entity: string) => {
    if (!entity) return 'system';
    return entity.toLowerCase().replace(/_/g, ' ');
  };

  /**
   * Reference Embossed 3D Bulged Pill Badge (Borderless)
   * Exact style modeled after the user's "Absent" sample:
   * Vertical gradient from pure white top to soft pastel base,
   * ultra-subtle colored rim shadow, soft ambient glow, bold colored typography.
   */
  const renderTypeBadge = (type: string) => {
    const raw = type || 'mutation';
    const t = raw.toLowerCase().replace(/_/g, ' ');

    switch (t) {
      case 'accrual':
        return (
          <span
            className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-bold select-none whitespace-nowrap"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #ebf4ff 100%)',
              color: '#1d4ed8',
              boxShadow:
                '0 1.5px 3.5px rgba(37, 99, 235, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(191, 219, 254, 0.5)',
            }}
          >
            accrual
          </span>
        );
      case 'redemption':
        return (
          <span
            className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-bold select-none whitespace-nowrap"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f4edff 100%)',
              color: '#7e22ce',
              boxShadow:
                '0 1.5px 3.5px rgba(126, 34, 206, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(233, 213, 255, 0.5)',
            }}
          >
            redemption
          </span>
        );
      case 'reversal':
        return (
          <span
            className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-bold select-none whitespace-nowrap"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #fff4e6 100%)',
              color: '#c2410c',
              boxShadow:
                '0 1.5px 3.5px rgba(234, 88, 12, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(254, 215, 170, 0.5)',
            }}
          >
            reversal
          </span>
        );
      case 'expiration':
        return (
          <span
            className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-bold select-none whitespace-nowrap"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #ffe4e6 100%)',
              color: '#e11d48',
              boxShadow:
                '0 1.5px 3.5px rgba(225, 29, 72, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(254, 205, 211, 0.5)',
            }}
          >
            Expired
          </span>
        );
      case 'adjustment':
        return (
          <span
            className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-bold select-none whitespace-nowrap"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #e0f2fe 100%)',
              color: '#0369a1',
              boxShadow:
                '0 1.5px 3.5px rgba(2, 132, 199, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(186, 230, 253, 0.5)',
            }}
          >
            adjustment
          </span>
        );
      default:
        return (
          <span
            className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-bold select-none whitespace-nowrap"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
              color: '#475569',
              boxShadow:
                '0 1.5px 3.5px rgba(100, 116, 139, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(226, 232, 240, 0.5)',
            }}
          >
            {t}
          </span>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    const raw = status || 'posted';
    const s = raw.toLowerCase().replace(/_/g, ' ');

    if (s === 'posted') {
      return (
        <span
          className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-bold select-none whitespace-nowrap"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #d1fae5 100%)',
            color: '#065f46',
            boxShadow:
              '0 1.5px 3.5px rgba(16, 185, 129, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(167, 243, 208, 0.5)',
          }}
        >
          {s}
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span
          className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-bold select-none whitespace-nowrap"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #fef3c7 100%)',
            color: '#92400e',
            boxShadow:
              '0 1.5px 3.5px rgba(245, 158, 11, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(253, 230, 138, 0.5)',
          }}
        >
          {s}
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-bold select-none whitespace-nowrap"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
          color: '#475569',
          boxShadow:
            '0 1.5px 3.5px rgba(100, 116, 139, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(226, 232, 240, 0.5)',
        }}
      >
        {s}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Top Header: Title, Subtitle & Type Filter Dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6355f6] to-[#8d7dfb] text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
              Points Ledger &amp; Audit Journal
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-1 leading-none">
              Immutable, append-only double-entry financial ledger of all loyalty balance mutations
            </p>
          </div>
        </div>

        {/* Type Filter Dropdown with 3D Bulged Styling */}
        <CustomSelect
          value={filterType}
          onChange={(val) => {
            setFilterType(val);
            setCurrentPage(1);
          }}
          options={types.map((t) => ({ value: t.id, label: t.label }))}
          icon={Filter}
          placeholder="All Transactions"
        />
      </div>

      {/* Main Ledger Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
        {/* Table Container Header with Integrated 3D Inset Search Bar */}
        <div className="py-2.5 px-5 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-slate-800">All Ledger Entries</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edeafc] text-[#6355f6] border border-indigo-100 shadow-2xs">
              {totalCount} Total
            </span>
            {filterType && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                Filtered: {filterType}
              </span>
            )}
          </div>

          {/* 3D Inset Beveled Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Txn ID, customer, reference or reason..."
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
            {/* Table Header: Lavender/Violet Gradient matching Customers & Orders Registry */}
            <thead className="bg-gradient-to-r from-[#f4f1fe] via-[#f7f5ff] to-[#f4f1fe] border-b border-[#e9e3fe] text-[#2e1d68] font-black tracking-tight">
              <tr>
                {/* Txn ID */}
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[170px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Hash className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Txn ID</span>
                  </div>
                </th>

                {/* Timestamp */}
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[140px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Clock className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Timestamp</span>
                  </div>
                </th>

                {/* Customer */}
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[120px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <User className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Customer</span>
                  </div>
                </th>

                {/* Mutation Type */}
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[120px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Layers className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Type</span>
                  </div>
                </th>

                {/* Signed Amount */}
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[110px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Coins className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Signed Points</span>
                  </div>
                </th>

                {/* Status */}
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[100px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Activity className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Status</span>
                  </div>
                </th>

                {/* Reference Entity */}
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[150px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <FileText className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Reference / Audit Reason</span>
                  </div>
                </th>
              </tr>
            </thead>

            {/* Compact Rows (py-2) with Single-Line Enforced Layout */}
            <tbody className="divide-y divide-slate-100">
              {currentTxns.map((t) => {
                const isPositive = (t.points_amount || 0) > 0;
                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTxn(t)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    {/* Txn ID (1 single line, copyable, monospaced) */}
                    <td className="px-4 py-2 font-mono font-bold text-slate-900 tracking-tight text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 group-hover:text-[#6355f6] transition-colors">
                          {t.id}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(t.id);
                          }}
                          title="Copy Transaction ID"
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-[#6355f6] transition-all"
                        >
                          {copiedId === t.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Timestamp (1 single line) */}
                    <td className="px-4 py-2 text-slate-500 font-medium text-[11px] whitespace-nowrap">
                      {formatDate(t.created_at)}
                    </td>

                    {/* Customer ID (1 single line) */}
                    <td className="px-4 py-2 font-mono text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                      {t.customer_id}
                    </td>

                    {/* Mutation Type: Reference Borderless 3D Embossed Pill */}
                    <td className="px-4 py-2 whitespace-nowrap">
                      {renderTypeBadge(t.transaction_type)}
                    </td>

                    {/* Signed Points Mutation */}
                    <td className="px-4 py-2 font-black text-xs whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          isPositive ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                        )}
                        <span>{isPositive ? `+${t.points_amount}` : t.points_amount}</span>
                      </span>
                    </td>

                    {/* Status: Reference Borderless 3D Embossed Pill */}
                    <td className="px-4 py-2 whitespace-nowrap">
                      {renderStatusBadge(t.status)}
                    </td>

                    {/* Reference Entity & Reason (Single Line with clean lowercase formatting) */}
                    <td className="px-4 py-2 text-[11px] text-slate-600 max-w-xs truncate whitespace-nowrap">
                      <span className="font-bold text-slate-700">
                        {formatReferenceEntity(t.reference_entity)}
                      </span>
                      {t.reference_entity_id && (
                        <span className="text-slate-400 font-mono text-[10px]">
                          {' '}({t.reference_entity_id})
                        </span>
                      )}
                      {t.reason && (
                        <span className="text-slate-500 ml-1.5 font-normal">
                          &bull; {t.reason}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {currentTxns.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-medium text-xs">
                    No transactions found matching your filters
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-medium text-xs">
                    Loading immutable points ledger records...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 15 Rows Per Page Pagination Bar */}
        <div className="px-5 py-2.5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          <div className="text-slate-400 font-medium text-[11px]">
            Showing{' '}
            <span className="font-bold text-slate-700">
              {totalCount > 0 ? startIndex + 1 : 0} &ndash; {endIndex}
            </span>{' '}
            of <span className="font-bold text-slate-700">{totalCount}</span> entries
          </div>

          {/* Page Numeric Cycling */}
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Dynamic sliding window pagination */}
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

      {/* Transaction Inspection Drawer / Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#f4f1fe] via-[#f7f5ff] to-[#f4f1fe] border-b border-[#e9e3fe] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6355f6] to-[#8d7dfb] text-white flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Ledger Entry Audit Trail</h3>
                  <p className="text-[10px] text-slate-500 font-mono font-medium">{selectedTxn.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">MUTATION TYPE</span>
                  {renderTypeBadge(selectedTxn.transaction_type)}
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">AUDIT STATUS</span>
                  {renderStatusBadge(selectedTxn.status)}
                </div>
              </div>

              <div className="p-3.5 bg-[#f8faff] rounded-xl border border-blue-100/70 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">SIGNED POINTS BALANCE IMPACT</span>
                  <span
                    className={`text-lg font-black ${
                      (selectedTxn.points_amount || 0) > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {(selectedTxn.points_amount || 0) > 0
                      ? `+${selectedTxn.points_amount}`
                      : selectedTxn.points_amount}{' '}
                    Points
                  </span>
                </div>
                <Coins className="w-6 h-6 text-indigo-400/40" />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">Customer ID</span>
                  <span className="font-mono font-bold text-slate-800">{selectedTxn.customer_id}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">Loyalty Account</span>
                  <span className="font-mono text-slate-700">{selectedTxn.loyalty_account_id}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">Timestamp</span>
                  <span className="text-slate-700 font-semibold">{formatDate(selectedTxn.created_at)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">Reference Entity</span>
                  <span className="font-bold text-slate-800">
                    {formatReferenceEntity(selectedTxn.reference_entity)}{' '}
                    {selectedTxn.reference_entity_id && (
                      <span className="font-mono text-slate-500 font-normal">
                        ({selectedTxn.reference_entity_id})
                      </span>
                    )}
                  </span>
                </div>
                {selectedTxn.rule_id && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 font-medium">Applied Rule ID</span>
                    <span className="font-mono text-slate-700">{selectedTxn.rule_id}</span>
                  </div>
                )}
                {selectedTxn.idempotency_key && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 font-medium">Idempotency Key</span>
                    <span className="font-mono text-[10px] text-slate-600 truncate max-w-[200px]">
                      {selectedTxn.idempotency_key}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">Audit Reason</span>
                  <span className="text-slate-800 font-semibold text-right max-w-[240px]">
                    {selectedTxn.reason || 'None provided'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedTxn(null)}
                className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close Audit Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
