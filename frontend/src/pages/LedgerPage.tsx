import React, { useEffect, useState, useMemo } from 'react';
import { LoyaltyAPI } from '../services/api';
import { BookOpen, ArrowUpRight, ArrowDownRight, Coins, ShieldCheck, Copy, Check } from 'lucide-react';
import {
  PageHeader, Badge, StatusBadge, Pagination, Modal, SearchInput, EmptyState, InlineLoader,
  humanize, cx, type Tone
} from '../components/ui';

const typeTone: Record<string, Tone> = {
  ACCRUAL: 'brand',
  REDEMPTION: 'pink',
  REVERSAL: 'cyan',
  EXPIRATION: 'amber',
  ADJUSTMENT: 'emerald',
};

const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <Badge tone={typeTone[type] || 'slate'} dot>{type === 'EXPIRATION' ? 'Expired' : humanize(type || 'mutation')}</Badge>
);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

/** Formats e.g. "EXPIRY_BATCH" → "Expiry batch". */
const formatReferenceEntity = (entity: string) => {
  if (!entity) return 'System';
  const s = entity.toLowerCase().replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const types = [
  { id: '', label: 'All' },
  { id: 'ACCRUAL', label: 'Accruals' },
  { id: 'REDEMPTION', label: 'Redemptions' },
  { id: 'REVERSAL', label: 'Reversals' },
  { id: 'EXPIRATION', label: 'Expirations' },
  { id: 'ADJUSTMENT', label: 'Adjustments' },
];

export const LedgerPage: React.FC = () => {
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pageSize = 15;

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

  const totalCount = filteredTxns.length;
  const startIndex = (currentPage - 1) * pageSize;
  const currentTxns = filteredTxns.slice(startIndex, startIndex + pageSize);

  const totals = useMemo(() => {
    let credit = 0, debit = 0;
    filteredTxns.forEach((t) => {
      const v = Number(t.points_amount || 0);
      if (v > 0) credit += v; else debit += v;
    });
    return { credit, debit };
  }, [filteredTxns]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title="Points ledger"
        description="Immutable, append-only journal of every loyalty balance mutation."
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 h-[38px] px-3.5 rounded-[10px] bg-emerald-50 text-emerald-700 text-[13px] font-medium border border-emerald-100">
              <ArrowUpRight className="w-4 h-4" /> <span className="tabular">+{totals.credit.toLocaleString()}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 h-[38px] px-3.5 rounded-[10px] bg-rose-50 text-rose-700 text-[13px] font-medium border border-rose-100">
              <ArrowDownRight className="w-4 h-4" /> <span className="tabular">{totals.debit.toLocaleString()}</span>
            </span>
          </div>
        }
      />

      <div className="card overflow-hidden animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)]">
          <div className="segmented overflow-x-auto max-w-full">
            {types.map((t) => (
              <button
                key={t.id}
                data-active={filterType === t.id}
                onClick={() => { setFilterType(t.id); setCurrentPage(1); }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setCurrentPage(1); }}
            placeholder="Search ID, customer, reference…"
            className="w-full lg:w-80"
          />
        </div>

        <div className="table-wrap">
          <table className="table rows-animate" key={`${currentPage}-${filterType}-${search}`}>
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Timestamp</th>
                <th>Customer</th>
                <th>Type</th>
                <th className="cell-num">Points</th>
                <th>Status</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {!loading && currentTxns.map((t) => {
                const isPositive = (t.points_amount || 0) > 0;
                return (
                  <tr key={t.id} onClick={() => setSelectedTxn(t)} className="row-clickable group">
                    <td>
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="font-mono text-[13px] font-medium text-[var(--text)] group-hover:text-brand-600 transition-colors">{t.id}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(t.id); }}
                          title="Copy transaction ID"
                          className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 text-[var(--text-3)] hover:text-brand-600 hover:bg-brand-50 transition-all cursor-pointer"
                        >
                          {copiedId === t.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-[13px]">{formatDate(t.created_at)}</td>
                    <td><span className="mono-chip">{t.customer_id}</span></td>
                    <td><TypeBadge type={t.transaction_type} /></td>
                    <td className="cell-num whitespace-nowrap">
                      <span className={cx('inline-flex items-center gap-1 font-semibold', isPositive ? 'text-emerald-600' : 'text-rose-600')}>
                        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {isPositive ? `+${t.points_amount}` : t.points_amount}
                      </span>
                    </td>
                    <td><StatusBadge status={t.status || 'POSTED'} /></td>
                    <td className="max-w-[280px]">
                      <div className="truncate text-[13px]">
                        <span className="font-medium text-[var(--text)]">{formatReferenceEntity(t.reference_entity)}</span>
                        {t.reference_entity_id && <span className="font-mono text-[12px] text-[var(--text-3)]"> · {t.reference_entity_id}</span>}
                      </div>
                      {t.reason && <div className="truncate text-[12.5px] text-[var(--text-3)]">{t.reason}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {loading && <InlineLoader label="Loading ledger records…" />}
          {!loading && currentTxns.length === 0 && (
            <EmptyState icon={BookOpen} title="No transactions found" description="Try a different filter or search term." />
          )}
        </div>

        <Pagination page={currentPage} pageSize={pageSize} total={totalCount} onChange={setCurrentPage} noun="entries" />
      </div>

      <Modal
        open={!!selectedTxn}
        onClose={() => setSelectedTxn(null)}
        icon={ShieldCheck}
        title="Ledger entry"
        subtitle={selectedTxn && <span className="font-mono">{selectedTxn.id}</span>}
        footer={<button onClick={() => setSelectedTxn(null)} className="btn btn-secondary">Close</button>}
      >
        {selectedTxn && (
          <div className="space-y-5">
            <div className={cx(
              'relative overflow-hidden rounded-2xl p-5 border',
              (selectedTxn.points_amount || 0) > 0 ? 'bg-emerald-50/60 border-emerald-100' : 'bg-rose-50/60 border-rose-100',
            )}>
              <p className="text-[13px] text-[var(--text-3)]">Balance impact</p>
              <p className={cx('mt-1 text-[32px] font-bold tracking-tight leading-none', (selectedTxn.points_amount || 0) > 0 ? 'text-emerald-600' : 'text-rose-600')}>
                {(selectedTxn.points_amount || 0) > 0 ? `+${selectedTxn.points_amount}` : selectedTxn.points_amount}
                <span className="ml-1.5 text-base font-medium text-[var(--text-3)]">pts</span>
              </p>
              <div className="mt-3 flex items-center gap-2">
                <TypeBadge type={selectedTxn.transaction_type} />
                <StatusBadge status={selectedTxn.status || 'POSTED'} />
              </div>
              <Coins className="absolute -right-3 -bottom-3 w-24 h-24 text-black/[0.04]" />
            </div>

            <dl className="divide-y divide-[var(--border)] text-[13.5px]">
              {[
                ['Customer ID', <span className="font-mono">{selectedTxn.customer_id}</span>],
                ['Loyalty account', <span className="font-mono">{selectedTxn.loyalty_account_id}</span>],
                ['Timestamp', formatDate(selectedTxn.created_at)],
                ['Reference', <>{formatReferenceEntity(selectedTxn.reference_entity)}{selectedTxn.reference_entity_id && <span className="font-mono text-[var(--text-3)]"> · {selectedTxn.reference_entity_id}</span>}</>],
                ...(selectedTxn.rule_id ? [['Applied rule', <span className="font-mono">{selectedTxn.rule_id}</span>]] : []),
                ...(selectedTxn.idempotency_key ? [['Idempotency key', <span className="font-mono text-[12px] break-all">{selectedTxn.idempotency_key}</span>]] : []),
                ['Reason', selectedTxn.reason || 'None provided'],
              ].map(([label, value], i) => (
                <div key={i} className="flex justify-between gap-6 py-3">
                  <dt className="text-[var(--text-3)] shrink-0">{label}</dt>
                  <dd className="font-medium text-[var(--text)] text-right min-w-0">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Modal>
    </div>
  );
};
