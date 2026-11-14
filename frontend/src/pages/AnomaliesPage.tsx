import React, { useEffect, useState, useMemo } from 'react';
import { LoyaltyAPI } from '../services/api';
import { CustomSelect } from '../components/CustomSelect';
import {
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Search,
  Hash,
  Activity,
  Layers,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Settings2
} from 'lucide-react';

export const AnomaliesPage: React.FC = () => {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);
  const pageSize = 15; // 15 rows per page standard

  const loadData = () => {
    setLoading(true);
    LoyaltyAPI.getAnomalies()
      .then((data) => {
        setAnomalies(data || []);
      })
      .catch((err) => console.error('Failed to load anomalies:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const criticalCount = anomalies.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = anomalies.filter((a) => a.severity === 'WARNING').length;

  // Filter anomalies
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter((a) => {
      if (severityFilter && a.severity !== severityFilter) return false;
      if (!search.trim()) return true;
      const term = search.toLowerCase().trim();
      return (
        a.anomaly_id?.toLowerCase().includes(term) ||
        a.issue_type?.toLowerCase().includes(term) ||
        a.entity_name?.toLowerCase().includes(term) ||
        a.entity_id?.toLowerCase().includes(term) ||
        a.expected_result?.toLowerCase().includes(term) ||
        a.actual_result?.toLowerCase().includes(term)
      );
    });
  }, [anomalies, severityFilter, search]);

  const totalCount = filteredAnomalies.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const currentAnomalies = filteredAnomalies.slice(startIndex, endIndex);

  /**
   * Format issue category text to clean lowercase without underscores
   * e.g. "BALANCE_MISMATCH" -> "balance mismatch"
   */
  const formatIssueCategory = (issueType: string) => {
    if (!issueType) return '';
    return issueType.toLowerCase().replace(/_/g, ' ');
  };

  /**
   * Reference Embossed 3D Bulged Pill Badge (Borderless)
   * Exact style modeled after the user's "Absent" sample:
   * Vertical gradient from pure white top to soft pastel base,
   * subtle colored ambient glow, bold colored typography.
   */
  const renderSeverityBadge = (severity: string) => {
    const s = (severity || 'WARNING').toUpperCase();
    if (s === 'CRITICAL') {
      return (
        <span
          className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-black select-none whitespace-nowrap"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #ffe4e6 100%)',
            color: '#be123c',
            boxShadow:
              '0 1.5px 3.5px rgba(225, 29, 72, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(254, 205, 211, 0.5)',
          }}
        >
          CRITICAL
        </span>
      );
    }
    // Warning
    return (
      <span
        className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-black select-none whitespace-nowrap"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #fef3c7 100%)',
          color: '#b45309',
          boxShadow:
            '0 1.5px 3.5px rgba(245, 158, 11, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(253, 230, 138, 0.5)',
        }}
      >
        WARNING
      </span>
    );
  };

  return (
    <div className="space-y-3.5">
      {/* Top Header: Title & Subtitle + Severity Filter Dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6355f6] to-[#8d7dfb] text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
              Business Anomaly Monitoring
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-1 leading-none">
              Real-time detection telemetry for deliberately injected and naturally occurring ledger violations
            </p>
          </div>
        </div>

        {/* Severity Filter Dropdown with 3D Bulged Styling */}
        <CustomSelect
          value={severityFilter}
          onChange={(val) => {
            setSeverityFilter(val);
            setCurrentPage(1);
          }}
          options={[
            { value: '', label: 'All Severity' },
            { value: 'CRITICAL', label: `Critical Only (${criticalCount})`, badge: 'High', badgeColor: 'bg-rose-100 text-rose-700' },
            { value: 'WARNING', label: `Warning Only (${warningCount})`, badge: 'Med', badgeColor: 'bg-amber-100 text-amber-700' },
          ]}
          icon={Filter}
          placeholder="All Severity"
        />
      </div>

      {/* 3 Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Total Anomalies Card */}
        <div
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%)',
            boxShadow: '0 4px 10px -2px rgba(99, 102, 241, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(99, 102, 241, 0.15)'
          }}
          className="rounded-2xl p-4 border border-indigo-200/90 flex items-center justify-between hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div>
            <span className="text-[11px] font-extrabold text-indigo-900/80 uppercase tracking-wider block">
              Total Anomalies Detected
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">{anomalies.length}</div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Active ledger integrity exceptions</p>
          </div>
          <div
            style={{
              boxShadow: '0 2px 5px rgba(99, 102, 241, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
            }}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6355f6] to-[#8d7dfb] text-white flex items-center justify-center border border-indigo-200 group-hover:scale-105 transition-transform"
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Critical Severity Card */}
        <div
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #fff1f2 100%)',
            boxShadow: '0 4px 10px -2px rgba(225, 29, 72, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(225, 29, 72, 0.15)'
          }}
          className="rounded-2xl p-4 border border-rose-200/90 flex items-center justify-between hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div>
            <span className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wider block">
              Critical Severity
            </span>
            <div className="text-2xl font-black text-rose-600 mt-1">{criticalCount}</div>
            <p className="text-[10px] text-rose-400 font-medium mt-0.5">Urgent ledger reconciliation mismatch</p>
          </div>
          <div
            style={{
              boxShadow: '0 2px 5px rgba(225, 29, 72, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
            }}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#e11d48] to-[#be123c] text-white flex items-center justify-center border border-rose-200 group-hover:scale-105 transition-transform"
          >
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Warning Severity Card */}
        <div
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #fffbeb 100%)',
            boxShadow: '0 4px 10px -2px rgba(245, 158, 11, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(245, 158, 11, 0.15)'
          }}
          className="rounded-2xl p-4 border border-amber-200/90 flex items-center justify-between hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div>
            <span className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wider block">
              Warning Severity
            </span>
            <div className="text-2xl font-black text-amber-600 mt-1">{warningCount}</div>
            <p className="text-[10px] text-amber-500/80 font-medium mt-0.5">Potential duplicate or out-of-order event</p>
          </div>
          <div
            style={{
              boxShadow: '0 2px 5px rgba(245, 158, 11, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
            }}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f59e0b] to-[#d97706] text-white flex items-center justify-center border border-amber-200 group-hover:scale-105 transition-transform"
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Anomalies Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
        {/* Table Container Header with Integrated 3D Inset Search Bar */}
        <div className="py-2.5 px-5 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-slate-800">Anomaly Audit Telemetry</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edeafc] text-[#6355f6] border border-indigo-100 shadow-2xs">
              {totalCount} Total
            </span>
            {severityFilter && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                Filtered: {severityFilter}
              </span>
            )}
          </div>

          {/* 3D Inset Beveled Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by ID, category, entity or result..."
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
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[130px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Hash className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Anomaly ID</span>
                  </div>
                </th>

                <th className="px-4 py-2.5 whitespace-nowrap min-w-[160px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Layers className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Issue Category</span>
                  </div>
                </th>

                <th className="px-4 py-2.5 whitespace-nowrap min-w-[170px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <FileText className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Entity Reference</span>
                  </div>
                </th>

                <th className="px-4 py-2.5 whitespace-nowrap min-w-[180px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Expected Result</span>
                  </div>
                </th>

                <th className="px-4 py-2.5 whitespace-nowrap min-w-[180px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <XCircle className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Actual Result</span>
                  </div>
                </th>

                <th className="px-4 py-2.5 whitespace-nowrap min-w-[100px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Activity className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Severity</span>
                  </div>
                </th>

                <th className="px-4 py-2.5 text-right whitespace-nowrap min-w-[90px]">
                  <div className="flex items-center justify-end gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Settings2 className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Action</span>
                  </div>
                </th>
              </tr>
            </thead>

            {/* Compact Rows (py-2) */}
            <tbody className="divide-y divide-slate-100">
              {currentAnomalies.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedAnomaly(a)}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                  {/* Anomaly ID */}
                  <td className="px-4 py-2 font-mono font-bold text-slate-900 tracking-tight text-[11px] whitespace-nowrap">
                    {a.anomaly_id}
                  </td>

                  {/* Issue Category (lowercase without underscores) */}
                  <td className="px-4 py-2 font-bold text-slate-800 text-xs whitespace-nowrap">
                    {formatIssueCategory(a.issue_type)}
                  </td>

                  {/* Entity Reference */}
                  <td className="px-4 py-2 font-mono text-xs text-[#2563eb] whitespace-nowrap">
                    <span className="font-semibold">{a.entity_name}:</span> {a.entity_id}
                  </td>

                  {/* Expected Result */}
                  <td className="px-4 py-2 text-slate-600 text-[11px] max-w-xs truncate whitespace-nowrap">
                    {a.expected_result}
                  </td>

                  {/* Actual Result */}
                  <td className="px-4 py-2 text-rose-600 font-bold text-[11px] max-w-xs truncate whitespace-nowrap">
                    {a.actual_result}
                  </td>

                  {/* Severity Badge: Borderless 3D Bulged Pill */}
                  <td className="px-4 py-2 whitespace-nowrap">
                    {renderSeverityBadge(a.severity)}
                  </td>

                  {/* View Action: Borderless 3D Bulged Pill Button */}
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAnomaly(a);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer whitespace-nowrap select-none hover:opacity-90 active:translate-y-0.5"
                      style={{
                        background: 'linear-gradient(180deg, #ffffff 0%, #f4edff 100%)',
                        color: '#6355f6',
                        boxShadow:
                          '0 1.5px 3.5px rgba(99, 85, 246, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(221, 214, 254, 0.5)',
                      }}
                    >
                      <Eye className="w-3 h-3 text-[#6355f6]" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}

              {currentAnomalies.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400 font-medium text-xs">
                    No anomalies found matching your filter
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
            of <span className="font-bold text-slate-700">{totalCount}</span> anomalies
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

      {/* Anomaly Inspection Modal for Full Complete Text */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#f4f1fe] via-[#f7f5ff] to-[#f4f1fe] border-b border-[#e9e3fe] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6355f6] to-[#8d7dfb] text-white flex items-center justify-center shadow-md">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Anomaly Detail &amp; Full Diagnostics</h3>
                  <p className="text-[10px] text-slate-500 font-mono font-medium">{selectedAnomaly.anomaly_id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Complete untruncated text */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">ISSUE CATEGORY</span>
                  <span className="font-bold text-slate-900 text-xs">{formatIssueCategory(selectedAnomaly.issue_type)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">AUDIT SEVERITY</span>
                  {renderSeverityBadge(selectedAnomaly.severity)}
                </div>
              </div>

              {/* Entity Reference Block */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">ENTITY REFERENCE</span>
                <span className="font-mono font-bold text-[#2563eb] text-xs">
                  {selectedAnomaly.entity_name}: {selectedAnomaly.entity_id}
                </span>
              </div>

              {/* Expected Result: Full Text */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px] mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Expected Ledger Condition (Full Specification)</span>
                </div>
                <p className="text-emerald-950 font-medium leading-relaxed break-words text-xs">
                  {selectedAnomaly.expected_result}
                </p>
              </div>

              {/* Actual Result: Full Text */}
              <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200/80">
                <div className="flex items-center gap-1.5 text-rose-800 font-bold text-[11px] mb-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Actual Detected Violation (Full Diagnostic)</span>
                </div>
                <p className="text-rose-950 font-bold leading-relaxed break-words text-xs">
                  {selectedAnomaly.actual_result}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
