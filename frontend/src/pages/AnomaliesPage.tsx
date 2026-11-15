import React, { useEffect, useState, useMemo } from 'react';
import { LoyaltyAPI } from '../services/api';
import { AlertTriangle, AlertCircle, ShieldAlert, CheckCircle2, XCircle, Eye } from 'lucide-react';
import {
  PageHeader, Badge, Pagination, Modal, SearchInput, EmptyState, InlineLoader, StatCard, humanize
} from '../components/ui';

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) =>
  (severity || 'WARNING').toUpperCase() === 'CRITICAL'
    ? <Badge tone="rose" dot>Critical</Badge>
    : <Badge tone="amber" dot>Warning</Badge>;

export const AnomaliesPage: React.FC = () => {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);
  const pageSize = 15;

  const loadData = () => {
    setLoading(true);
    LoyaltyAPI.getAnomalies()
      .then((data) => setAnomalies(data || []))
      .catch((err) => console.error('Failed to load anomalies:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const criticalCount = anomalies.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = anomalies.filter((a) => a.severity === 'WARNING').length;

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
  const startIndex = (currentPage - 1) * pageSize;
  const currentAnomalies = filteredAnomalies.slice(startIndex, startIndex + pageSize);

  const filters = [
    { value: '', label: `All · ${anomalies.length}` },
    { value: 'CRITICAL', label: `Critical · ${criticalCount}` },
    { value: 'WARNING', label: `Warning · ${warningCount}` },
  ];

  return (
    <div>
      <PageHeader
        icon={AlertTriangle}
        title="Anomaly monitoring"
        description="Detection telemetry for injected and naturally occurring ledger violations."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 stagger">
        <StatCard label="Total anomalies" value={anomalies.length} icon={ShieldAlert} tone="brand" hint="Active integrity exceptions" onClick={() => { setSeverityFilter(''); setCurrentPage(1); }} />
        <StatCard label="Critical" value={criticalCount} icon={AlertCircle} tone="rose" hint="Urgent reconciliation mismatch" onClick={() => { setSeverityFilter('CRITICAL'); setCurrentPage(1); }} />
        <StatCard label="Warning" value={warningCount} icon={AlertTriangle} tone="amber" hint="Possible duplicate or out-of-order event" onClick={() => { setSeverityFilter('WARNING'); setCurrentPage(1); }} />
      </div>

      <div className="card overflow-hidden animate-fade-up">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)]">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="card-title">Audit telemetry</h3>
            <div className="segmented">
              {filters.map((f) => (
                <button key={f.value} data-active={severityFilter === f.value} onClick={() => { setSeverityFilter(f.value); setCurrentPage(1); }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setCurrentPage(1); }}
            placeholder="Search ID, category, entity…"
            className="w-full lg:w-80"
          />
        </div>

        <div className="table-wrap">
          <table className="table rows-animate" key={`${currentPage}-${severityFilter}-${search}`}>
            <thead>
              <tr>
                <th>Anomaly</th>
                <th>Category</th>
                <th>Entity</th>
                <th>Expected → actual</th>
                <th>Severity</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentAnomalies.map((a) => (
                <tr key={a.id} onClick={() => setSelectedAnomaly(a)} className="row-clickable group">
                  <td><span className="font-mono text-[13px] font-medium text-[var(--text)] whitespace-nowrap">{a.anomaly_id}</span></td>
                  <td className="cell-strong whitespace-nowrap">{humanize(a.issue_type)}</td>
                  <td className="whitespace-nowrap">
                    <span className="text-[12.5px] text-[var(--text-3)]">{a.entity_name}</span>
                    <span className="block font-mono text-[12.5px] text-brand-600">{a.entity_id}</span>
                  </td>
                  <td className="max-w-[360px]">
                    <p className="truncate text-[13px]">{a.expected_result}</p>
                    <p className="truncate text-[13px] font-medium text-rose-600">{a.actual_result}</p>
                  </td>
                  <td><SeverityBadge severity={a.severity} /></td>
                  <td className="text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedAnomaly(a); }}
                      className="btn btn-secondary btn-sm opacity-80 group-hover:opacity-100 group-hover:border-brand-200 group-hover:text-brand-700"
                    >
                      <Eye /> Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <InlineLoader label="Scanning ledger for anomalies…" />}
          {!loading && currentAnomalies.length === 0 && (
            <EmptyState icon={CheckCircle2} title="No anomalies found" description="Nothing matches the current filter." />
          )}
        </div>

        <Pagination page={currentPage} pageSize={pageSize} total={totalCount} onChange={setCurrentPage} noun="anomalies" />
      </div>

      <Modal
        open={!!selectedAnomaly}
        onClose={() => setSelectedAnomaly(null)}
        icon={AlertTriangle}
        tone={selectedAnomaly?.severity === 'CRITICAL' ? 'rose' : 'amber'}
        title={selectedAnomaly && humanize(selectedAnomaly.issue_type)}
        subtitle={selectedAnomaly && <span className="font-mono">{selectedAnomaly.anomaly_id}</span>}
        footer={<button onClick={() => setSelectedAnomaly(null)} className="btn btn-secondary">Close</button>}
      >
        {selectedAnomaly && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[var(--border)] p-3.5">
                <p className="text-[12.5px] text-[var(--text-3)]">Severity</p>
                <div className="mt-1.5"><SeverityBadge severity={selectedAnomaly.severity} /></div>
              </div>
              <div className="rounded-xl border border-[var(--border)] p-3.5 min-w-0">
                <p className="text-[12.5px] text-[var(--text-3)]">Entity</p>
                <p className="mt-1 text-[13.5px] font-medium text-[var(--text)] break-all">
                  {selectedAnomaly.entity_name} · <span className="font-mono text-brand-600">{selectedAnomaly.entity_id}</span>
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 animate-fade-up">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-emerald-800"><CheckCircle2 className="w-4 h-4" /> Expected</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-emerald-950 break-words">{selectedAnomaly.expected_result}</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 animate-fade-up" style={{ animationDelay: '0.08s' }}>
                <p className="flex items-center gap-2 text-[13px] font-semibold text-rose-800"><XCircle className="w-4 h-4" /> Actual</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed font-medium text-rose-950 break-words">{selectedAnomaly.actual_result}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
