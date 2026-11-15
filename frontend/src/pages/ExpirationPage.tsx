import React, { useEffect, useState, useMemo } from 'react';
import { LoyaltyAPI } from '../services/api';
import { Clock, Play, Layers, Hourglass, CheckCircle2, Archive, RefreshCw } from 'lucide-react';
import {
  PageHeader, Badge, StatusBadge, Pagination, SearchInput, EmptyState, InlineLoader, StatCard, Card
} from '../components/ui';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

export const ExpirationPage: React.FC = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  const [searchLot, setSearchLot] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterState, setFilterState] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');
  const pageSize = 15;

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

  const stats = useMemo(() => {
    const active = lots.filter((l) => !l.is_expired);
    return {
      activeLots: active.length,
      expiredLots: lots.length - active.length,
      remaining: active.reduce((a, l) => a + Number(l.remaining_points || 0), 0),
      expiredPts: batches.reduce((a, b) => a + Number(b.total_points_expired || 0), 0),
    };
  }, [lots, batches]);

  const totalLotsCount = filteredLots.length;
  const startIndex = (currentPage - 1) * pageSize;
  const currentLots = filteredLots.slice(startIndex, startIndex + pageSize);

  return (
    <div>
      <PageHeader
        icon={Clock}
        title="Points expiration"
        description="Lot-level FIFO expiry engine with idempotency and duplicate-run prevention."
        actions={
          <button onClick={handleRunExpiration} disabled={running} className="btn btn-danger">
            {running ? <RefreshCw className="animate-spin" /> : <Play className="fill-current" />}
            {running ? 'Processing batch…' : 'Run expiration batch'}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4 stagger">
        <StatCard compact label="Active lots" value={stats.activeLots} icon={Layers} tone="emerald" />
        <StatCard compact label="Points at risk" value={stats.remaining} icon={Hourglass} tone="amber" hint="Remaining in active lots" />
        <StatCard compact label="Expired lots" value={stats.expiredLots} icon={Archive} tone="rose" />
        <StatCard compact label="Points expired" value={stats.expiredPts} icon={CheckCircle2} tone="slate" hint={`${batches.length} batch${batches.length === 1 ? '' : 'es'} run`} />
      </div>

      <Card
        className="mb-4 animate-fade-up overflow-hidden"
        flush
        title={<span className="flex items-center gap-2.5">Expiry batches <Badge tone="brand">{batches.length}</Badge></span>}
        subtitle="History of completed expiration runs"
      >
        <div className="table-wrap">
          <table className="table rows-animate">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Cutoff date</th>
                <th className="cell-num">Accounts processed</th>
                <th className="cell-num">Points expired</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id}>
                  <td><span className="font-mono text-[13px] font-medium text-[var(--text)]">{b.id}</span></td>
                  <td className="whitespace-nowrap">{fmtDate(b.cutoff_date)}</td>
                  <td className="cell-num cell-strong">{b.total_accounts_processed}</td>
                  <td className="cell-num font-semibold text-rose-600">−{Number(b.total_points_expired).toLocaleString()}</td>
                  <td><StatusBadge status={b.status || 'COMPLETED'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && batches.length === 0 && <EmptyState icon={Clock} title="No expiry batches yet" description="Run a batch to expire lots past their cutoff." />}
        </div>
      </Card>

      <div className="card overflow-hidden animate-fade-up">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)]">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="card-title">FIFO points lots</h3>
            <Badge tone="brand">{totalLotsCount.toLocaleString()}</Badge>
            <div className="segmented">
              {(['ALL', 'ACTIVE', 'EXPIRED'] as const).map((s) => (
                <button key={s} data-active={filterState === s} onClick={() => { setFilterState(s); setCurrentPage(1); }}>
                  {s === 'ALL' ? 'All' : s === 'ACTIVE' ? 'Active' : 'Expired'}
                </button>
              ))}
            </div>
          </div>
          <SearchInput
            value={searchLot}
            onChange={(v) => { setSearchLot(v); setCurrentPage(1); }}
            placeholder="Search lot or account…"
            className="w-full lg:w-72"
          />
        </div>

        <div className="table-wrap">
          <table className="table rows-animate" key={`${currentPage}-${filterState}-${searchLot}`}>
            <thead>
              <tr>
                <th>Lot ID</th>
                <th>Account</th>
                <th className="cell-num">Initial</th>
                <th>Remaining</th>
                <th>Expires</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {currentLots.map((l) => {
                const pct = l.initial_points ? (l.remaining_points / l.initial_points) * 100 : 0;
                return (
                  <tr key={l.id}>
                    <td><span className="font-mono text-[13px] font-medium text-[var(--text)] whitespace-nowrap">{l.id}</span></td>
                    <td><span className="mono-chip">{l.account_id}</span></td>
                    <td className="cell-num">{l.initial_points}</td>
                    <td>
                      <div className="flex items-center gap-3 min-w-[140px]">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full origin-left animate-[grow-x_1s_var(--ease-out-expo)_both]"
                            style={{ width: `${pct}%`, background: l.is_expired ? '#cbd5e1' : 'linear-gradient(90deg,#7352f7,#22d3ee)' }}
                          />
                        </div>
                        <span className="w-10 text-right font-semibold text-[var(--text)] tabular">{l.remaining_points}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap">{fmtDate(l.expires_at)}</td>
                    <td>{l.is_expired ? <Badge tone="rose" dot>Expired</Badge> : <Badge tone="emerald" dot>Active</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {loading && lots.length === 0 && <InlineLoader label="Loading points lots…" />}
          {!loading && currentLots.length === 0 && <EmptyState icon={Layers} title="No lots match your filter" />}
        </div>

        <Pagination page={currentPage} pageSize={pageSize} total={totalLotsCount} onChange={setCurrentPage} noun="lots" />
      </div>
    </div>
  );
};
