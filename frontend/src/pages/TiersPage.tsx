import React, { useEffect, useState, useMemo } from 'react';
import { LoyaltyAPI } from '../services/api';
import { CustomSelect } from '../components/CustomSelect';
import { Award, Filter, TrendingUp, Crown, Medal, Gem, Shield } from 'lucide-react';
import {
  PageHeader, Badge, Pagination, SearchInput, EmptyState, InlineLoader, humanize, cx, type Tone
} from '../components/ui';

type TierTheme = { tone: Tone; icon: React.ComponentType<{ className?: string }>; grad: string; glow: string; level: number };

const tierTheme = (name: string): TierTheme => {
  const n = (name || '').toUpperCase();
  if (n.includes('PLATINUM')) return { tone: 'violet', icon: Gem, grad: 'from-violet-500 via-brand-600 to-indigo-700', glow: '#8b5cf6', level: 4 };
  if (n.includes('GOLD')) return { tone: 'amber', icon: Crown, grad: 'from-amber-300 via-amber-500 to-orange-600', glow: '#f59e0b', level: 3 };
  if (n.includes('SILVER')) return { tone: 'slate', icon: Medal, grad: 'from-slate-300 via-slate-400 to-slate-600', glow: '#94a3b8', level: 2 };
  return { tone: 'orange', icon: Shield, grad: 'from-orange-300 via-orange-500 to-amber-700', glow: '#f97316', level: 1 };
};

const TierBadge: React.FC<{ tierId: string }> = ({ tierId }) => {
  const t = tierTheme(tierId);
  return <Badge tone={t.tone} dot>{humanize(String(tierId || '').replace(/^TIER[-_]/i, ''))}</Badge>;
};

export const TiersPage: React.FC = () => {
  const [tiers, setTiers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

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
  const startIndex = (currentPage - 1) * pageSize;
  const currentHistory = filteredHistory.slice(startIndex, startIndex + pageSize);

  return (
    <div>
      <PageHeader
        icon={Award}
        title="Membership tiers"
        description="Tier qualification rules, calculated strictly on qualifying net spend."
      />

      {/* Tier ladder */}
      {loading && tiers.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-[220px] rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger">
          {tiers.map((t) => {
            const theme = tierTheme(t.name);
            const Icon = theme.icon;
            return (
              <div
                key={t.id}
                style={{ ['--glow-from' as string]: theme.glow }}
                className="card card-hover glow-border group relative overflow-hidden p-5"
              >
                <div className={cx('absolute -top-16 -right-16 w-44 h-44 rounded-full bg-gradient-to-br opacity-15 blur-2xl transition-all duration-700 group-hover:opacity-30 group-hover:scale-125', theme.grad)} />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)]">Level {theme.level}</p>
                    <h3 className="mt-1 text-xl font-bold text-[var(--text)]">{t.name}</h3>
                  </div>
                  <span className={cx('w-12 h-12 rounded-2xl bg-gradient-to-br text-white flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110', theme.grad)}>
                    <Icon className="w-6 h-6" />
                  </span>
                </div>
                <p className="relative mt-3 text-[13px] text-[var(--text-3)] leading-relaxed min-h-[40px]">
                  {t.description || 'Tier qualification based on eligible qualifying net spend.'}
                </p>
                <div className="relative mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-[var(--border)]">
                  <div>
                    <p className="text-[12px] text-[var(--text-3)]">Spend range</p>
                    <p className="mt-0.5 text-[13.5px] font-semibold text-[var(--text)] tabular">
                      ₹{t.min_spend?.toLocaleString()}{t.max_spend ? `–${Number(t.max_spend).toLocaleString()}` : '+'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[var(--text-3)]">Multiplier</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[13.5px] font-semibold text-[var(--text)]">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> {t.multiplier}×
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progression log */}
      <div className="card overflow-hidden mt-6 animate-fade-up">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <h3 className="card-title">Tier progression log</h3>
            <Badge tone="brand">{totalCount.toLocaleString()}</Badge>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <CustomSelect
              value={selectedTierFilter}
              onChange={(val) => { setSelectedTierFilter(val); setCurrentPage(1); }}
              options={[{ value: '', label: 'All tiers' }, ...tiers.map((t) => ({ value: t.id, label: t.name }))]}
              icon={Filter}
              placeholder="All tiers"
              className="sm:w-44"
            />
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setCurrentPage(1); }}
              placeholder="Search log, customer, tier…"
              className="w-full sm:w-72"
            />
          </div>
        </div>

        <div className="table-wrap">
          <table className="table rows-animate" key={`${currentPage}-${search}-${selectedTierFilter}`}>
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Customer</th>
                <th>Tier assigned</th>
                <th className="cell-num">Qualifying spend</th>
                <th>Reason</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentHistory.map((h) => (
                <tr key={h.id}>
                  <td><span className="font-mono text-[13px] font-medium text-[var(--text)] whitespace-nowrap">{h.id}</span></td>
                  <td><span className="mono-chip">{h.customer_id}</span></td>
                  <td><TierBadge tierId={h.tier_id} /></td>
                  <td className="cell-num cell-strong">₹{Number(h.spend_at_transition || 0).toLocaleString()}</td>
                  <td className="max-w-xs truncate">{h.reason || 'Qualifying net spend transition'}</td>
                  <td className="whitespace-nowrap">
                    {new Date(h.transition_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && history.length === 0 && <InlineLoader label="Loading tier history…" />}
          {!loading && currentHistory.length === 0 && <EmptyState icon={Award} title="No tier transitions found" />}
        </div>

        <Pagination page={currentPage} pageSize={pageSize} total={totalCount} onChange={setCurrentPage} noun="entries" />
      </div>
    </div>
  );
};
