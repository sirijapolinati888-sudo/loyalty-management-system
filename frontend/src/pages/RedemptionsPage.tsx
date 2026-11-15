import React, { useEffect, useState, useMemo } from 'react';
import { LoyaltyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CustomSelect } from '../components/CustomSelect';
import { Gift, Coins, Filter, Sparkles, CheckCircle2, AlertCircle, X, Lock } from 'lucide-react';
import {
  PageHeader, Badge, StatusBadge, Pagination, SearchInput, EmptyState, InlineLoader,
  AnimatedNumber, cx
} from '../components/ui';

// Accent per reward card: [gradient for the cover, glow colour]
const rewardAccents: [string, string][] = [
  ['from-brand-500 via-violet-500 to-fuchsia-500', '#7352f7'],
  ['from-teal-400 via-emerald-500 to-green-500', '#10b981'],
  ['from-sky-400 via-blue-500 to-indigo-500', '#3b82f6'],
  ['from-pink-400 via-rose-500 to-red-500', '#f43f5e'],
  ['from-amber-400 via-orange-500 to-rose-500', '#f59e0b'],
];

export const RedemptionsPage: React.FC = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [customerAccount, setCustomerAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRewardFilter, setSelectedRewardFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const pageSize = 15;

  const loadData = () => {
    setLoading(true);
    const promises: Promise<any>[] = [
      LoyaltyAPI.getRewards(),
      LoyaltyAPI.getRedemptions(),
    ];

    if (user?.customer_id) {
      promises.push(LoyaltyAPI.getCustomerAccount(user.customer_id));
    }

    Promise.all(promises)
      .then(([r, rdm, acc]) => {
        setRewards(r || []);
        setRedemptions(rdm || []);
        if (acc) setCustomerAccount(acc);
      })
      .catch((err) => console.error('Failed to load redemptions data:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleRedeem = async (reward: any) => {
    if (!user?.customer_id) {
      setRedeemError('Please sign in as a Customer to redeem rewards.');
      return;
    }

    setRedeemingId(reward.id);
    setRedeemError(null);
    setRedeemSuccess(null);

    try {
      await LoyaltyAPI.createRedemption({
        customer_id: user.customer_id,
        reward_id: reward.id,
      });
      setRedeemSuccess(`Redeemed ${reward.name} for ${reward.points_required} pts.`);
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Redemption failed';
      setRedeemError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setRedeemingId(null);
    }
  };

  const filteredRedemptions = useMemo(() => {
    return redemptions.filter((rdm) => {
      if (selectedRewardFilter && rdm.reward_id !== selectedRewardFilter) return false;
      if (!search.trim()) return true;
      const term = search.toLowerCase().trim();
      return (
        rdm.id?.toLowerCase().includes(term) ||
        rdm.customer_id?.toLowerCase().includes(term) ||
        rdm.reward_id?.toLowerCase().includes(term) ||
        rdm.status?.toLowerCase().includes(term)
      );
    });
  }, [redemptions, selectedRewardFilter, search]);

  const totalCount = filteredRedemptions.length;
  const startIndex = (currentPage - 1) * pageSize;
  const currentRedemptions = filteredRedemptions.slice(startIndex, startIndex + pageSize);
  const rewardName = (id: string) => rewards.find((r) => r.id === id)?.name;

  return (
    <div>
      <PageHeader
        icon={Gift}
        title="Redemptions"
        description="Browse the reward catalogue, redeem in real time and audit concurrency-safe history."
        actions={
          customerAccount && (
            <div className="flex items-center gap-3 h-12 pl-3 pr-4 rounded-2xl bg-white border border-[var(--border)] shadow-[var(--shadow-sm)]">
              <span className="icon-tile icon-tile-sm bg-gradient-to-br from-amber-400 to-orange-500 text-white"><Coins className="w-4 h-4" /></span>
              <div className="leading-tight">
                <p className="text-[12px] text-[var(--text-3)]">Available balance</p>
                <p className="text-[15px] font-bold text-[var(--text)]"><AnimatedNumber value={Number(customerAccount.cached_balance) || 0} /> pts</p>
              </div>
            </div>
          )
        }
      />

      {redeemSuccess && (
        <div className="callout bg-emerald-50 border-emerald-200 text-emerald-800 mb-4 animate-scale-in">
          <CheckCircle2 className="w-[18px] h-[18px] shrink-0 mt-px text-emerald-600" />
          <span className="flex-1 font-medium">{redeemSuccess}</span>
          <button onClick={() => setRedeemSuccess(null)} className="btn btn-ghost btn-sm btn-icon -my-1 -mr-2" aria-label="Dismiss"><X /></button>
        </div>
      )}
      {redeemError && (
        <div className="callout bg-rose-50 border-rose-200 text-rose-800 mb-4 animate-scale-in">
          <AlertCircle className="w-[18px] h-[18px] shrink-0 mt-px text-rose-600" />
          <span className="flex-1 font-medium">{redeemError}</span>
          <button onClick={() => setRedeemError(null)} className="btn btn-ghost btn-sm btn-icon -my-1 -mr-2" aria-label="Dismiss"><X /></button>
        </div>
      )}

      {/* Reward catalogue */}
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text)]">Reward catalogue</h2>
          <p className="text-[13px] text-[var(--text-3)]">{rewards.length} rewards available</p>
        </div>
      </div>

      {loading && rewards.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-[248px] rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 stagger">
          {rewards.map((r, index) => {
            const [grad, glow] = rewardAccents[index % rewardAccents.length];
            const affordable = !customerAccount || customerAccount.cached_balance >= r.points_required;
            const shortfall = customerAccount ? r.points_required - customerAccount.cached_balance : 0;
            const progress = customerAccount ? Math.min(100, (customerAccount.cached_balance / r.points_required) * 100) : 100;
            return (
              <div
                key={r.id}
                style={{ ['--glow-from' as string]: glow }}
                className="card card-hover glow-border group flex flex-col overflow-hidden"
              >
                <div className={cx('relative h-24 bg-gradient-to-br animate-gradient overflow-hidden', grad)}>
                  <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,.7) 0, transparent 40%)' }} />
                  <Gift className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 text-white/25 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110" />
                  <span className="absolute left-4 top-4 font-mono text-[11.5px] px-2 py-0.5 rounded-md bg-white/20 text-white backdrop-blur-sm">{r.id}</span>
                  <span className="absolute left-4 bottom-3 text-[13px] font-semibold text-white/95">₹{Number(r.monetary_value || 0).toLocaleString()} value</span>
                </div>
                <div className="flex flex-col flex-1 p-4">
                  <h4 className="text-[14.5px] font-semibold text-[var(--text)] line-clamp-1">{r.name}</h4>
                  <p className="mt-1 text-[13px] text-[var(--text-3)] line-clamp-2 leading-snug min-h-[36px]">
                    {r.description || 'Exclusive loyalty reward voucher.'}
                  </p>

                  <div className="mt-auto pt-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--text)]">
                        <Coins className="w-4 h-4 text-amber-500" /> {r.points_required?.toLocaleString()} <span className="font-normal text-[var(--text-3)]">pts</span>
                      </span>
                      {typeof r.stock_count === 'number' && <span className="text-[12px] text-[var(--text-3)]">{r.stock_count} left</span>}
                    </div>

                    {user?.customer_id && (
                      <>
                        {customerAccount && (
                          <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full origin-left animate-[grow-x_1.2s_var(--ease-out-expo)_both]" style={{ width: `${progress}%`, background: glow }} />
                          </div>
                        )}
                        <button
                          onClick={() => handleRedeem(r)}
                          disabled={redeemingId === r.id || !affordable}
                          className={cx('btn w-full mt-3', affordable ? 'btn-primary' : 'btn-secondary')}
                        >
                          {redeemingId === r.id ? (
                            <><span className="spinner !border-white/30 !border-t-white !w-4 !h-4" /> Processing…</>
                          ) : !affordable ? (
                            <><Lock /> Need {shortfall.toLocaleString()} more</>
                          ) : (
                            <><Sparkles /> Redeem</>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Redemption log */}
      <div className="card overflow-hidden mt-6 animate-fade-up">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <h3 className="card-title">Redemption history</h3>
            <Badge tone="brand">{totalCount.toLocaleString()}</Badge>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <CustomSelect
              value={selectedRewardFilter}
              onChange={(val) => { setSelectedRewardFilter(val); setCurrentPage(1); }}
              options={[
                { value: '', label: 'All rewards' },
                ...rewards.map((r) => ({ value: r.id, label: `${r.name} · ${r.points_required} pts` })),
              ]}
              icon={Filter}
              placeholder="All rewards"
              className="sm:w-56"
            />
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setCurrentPage(1); }}
              placeholder="Search ID, customer, reward…"
              className="w-full sm:w-72"
            />
          </div>
        </div>

        <div className="table-wrap">
          <table className="table rows-animate" key={`${currentPage}-${search}-${selectedRewardFilter}`}>
            <thead>
              <tr>
                <th>Redemption ID</th>
                <th>Customer</th>
                <th>Reward</th>
                <th className="cell-num">Points</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentRedemptions.map((rdm) => (
                <tr key={rdm.id}>
                  <td><span className="font-mono text-[13px] font-medium text-[var(--text)] whitespace-nowrap">{rdm.id}</span></td>
                  <td><span className="mono-chip">{rdm.customer_id}</span></td>
                  <td>
                    <div className="leading-tight">
                      <p className="font-medium text-[var(--text)]">{rewardName(rdm.reward_id) || rdm.reward_id}</p>
                      {rewardName(rdm.reward_id) && <p className="font-mono text-[12px] text-[var(--text-3)]">{rdm.reward_id}</p>}
                    </div>
                  </td>
                  <td className="cell-num font-semibold text-rose-600">−{rdm.points_redeemed}</td>
                  <td><StatusBadge status={rdm.status || 'SUCCESSFUL'} /></td>
                  <td className="whitespace-nowrap text-[13px]">
                    {new Date(rdm.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && redemptions.length === 0 && <InlineLoader label="Loading redemptions…" />}
          {!loading && currentRedemptions.length === 0 && <EmptyState icon={Gift} title="No redemptions found" />}
        </div>

        <Pagination page={currentPage} pageSize={pageSize} total={totalCount} onChange={setCurrentPage} noun="redemptions" />
      </div>
    </div>
  );
};
