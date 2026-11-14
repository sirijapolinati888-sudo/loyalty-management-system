import React, { useEffect, useState, useMemo } from 'react';
import { LoyaltyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CustomSelect } from '../components/CustomSelect';
import {
  Gift,
  Search,
  Hash,
  User,
  Coins,
  Calendar,
  Activity,
  ChevronLeft,
  ChevronRight,
  Filter,
  Tag,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

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
  const pageSize = 15; // 15 rows per page standard

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
      setRedeemSuccess(`Successfully redeemed ${reward.name} for ${reward.points_required} pts!`);
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Redemption failed';
      setRedeemError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setRedeemingId(null);
    }
  };

  // Filter redemptions
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
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const currentRedemptions = filteredRedemptions.slice(startIndex, endIndex);

  /**
   * Reference Embossed 3D Bulged Pill Badge (Borderless)
   * Exact style modeled after the user's "Absent" sample:
   * Vertical gradient from pure white top to soft pastel base,
   * subtle colored ambient glow, bold colored typography.
   */
  const renderStatusBadge = (status: string) => {
    const raw = status || 'successful';
    const s = raw.toLowerCase().replace(/_/g, ' ');

    if (s.includes('success') || s.includes('complete')) {
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
    if (s.includes('fail') || s.includes('cancel')) {
      return (
        <span
          className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-bold select-none whitespace-nowrap"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #ffe4e6 100%)',
            color: '#be123c',
            boxShadow:
              '0 1.5px 3.5px rgba(225, 29, 72, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(254, 205, 211, 0.5)',
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
          background: 'linear-gradient(180deg, #ffffff 0%, #fef3c7 100%)',
          color: '#b45309',
          boxShadow:
            '0 1.5px 3.5px rgba(245, 158, 11, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(253, 230, 138, 0.5)',
        }}
      >
        {s}
      </span>
    );
  };

  return (
    <div className="space-y-3.5">
      {/* Top Header Section (No background card) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6355f6] to-[#8d7dfb] text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                Redemptions &amp; Reward Catalogue
              </h1>
              {customerAccount && (
                <span
                  style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%)',
                    color: '#065f46',
                    boxShadow:
                      '0 2px 5px rgba(16, 185, 129, 0.2), inset 0 1px 1px #fff, 0 0 0 1px rgba(16, 185, 129, 0.2)',
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black select-none"
                >
                  <Coins className="w-3 h-3 text-emerald-600" />
                  <span>Available Balance: {customerAccount.cached_balance?.toLocaleString()} pts</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1 leading-none">
              Configure rewards, process real-time redemptions, and inspect concurrency-safe audit history
            </p>
          </div>
        </div>

        {/* Reward Filter Dropdown with 3D Bulged Styling */}
        <CustomSelect
          value={selectedRewardFilter}
          onChange={(val) => {
            setSelectedRewardFilter(val);
            setCurrentPage(1);
          }}
          options={[
            { value: '', label: 'All Rewards (Show All)' },
            ...rewards.map((r) => ({
              value: r.id,
              label: `${r.name} (${r.points_required} pts)`,
            })),
          ]}
          icon={Filter}
          placeholder="All Rewards"
        />
      </div>

      {/* Redemption Feedback Alerts */}
      {redeemSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200/90 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{redeemSuccess}</span>
          </div>
          <button onClick={() => setRedeemSuccess(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-black cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {redeemError && (
        <div className="p-3 bg-rose-50 border border-rose-200/90 rounded-2xl flex items-center justify-between text-xs font-bold text-rose-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{redeemError}</span>
          </div>
          <button onClick={() => setRedeemError(null)} className="text-rose-700 hover:text-rose-900 text-xs font-black cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Rewards Catalogue Cards: 4 cards per row on laptops (lg:grid-cols-4), 5 on wide desktops (2xl:grid-cols-5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5">
        {rewards.map((r, index) => {
          // Color palettes based on reward index for visual distinction
          const palettes = [
            {
              cardBg: 'linear-gradient(180deg, #ffffff 0%, #fbf8ff 100%)',
              border: 'border-purple-200/90',
              shadow: '0 4px 10px -2px rgba(147, 51, 234, 0.16), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(168, 85, 247, 0.12)',
              badgeBg: 'linear-gradient(180deg, #ffffff 0%, #f3e8ff 100%)',
              badgeColor: '#6d28d9',
              badgeBorder: 'border-purple-200/80',
              accentColor: 'text-purple-600',
              iconGrad: 'from-purple-500 to-indigo-600',
            },
            {
              cardBg: 'linear-gradient(180deg, #ffffff 0%, #f0fdfa 100%)',
              border: 'border-teal-200/90',
              shadow: '0 4px 10px -2px rgba(20, 184, 166, 0.16), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(20, 184, 166, 0.12)',
              badgeBg: 'linear-gradient(180deg, #ffffff 0%, #ccfbf1 100%)',
              badgeColor: '#0f766e',
              badgeBorder: 'border-teal-200/80',
              accentColor: 'text-teal-600',
              iconGrad: 'from-teal-500 to-emerald-600',
            },
            {
              cardBg: 'linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)',
              border: 'border-blue-200/90',
              shadow: '0 4px 10px -2px rgba(59, 130, 246, 0.16), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(59, 130, 246, 0.12)',
              badgeBg: 'linear-gradient(180deg, #ffffff 0%, #dbeafe 100%)',
              badgeColor: '#1d4ed8',
              badgeBorder: 'border-blue-200/80',
              accentColor: 'text-blue-600',
              iconGrad: 'from-blue-500 to-indigo-600',
            },
            {
              cardBg: 'linear-gradient(180deg, #ffffff 0%, #fdf2f8 100%)',
              border: 'border-pink-200/90',
              shadow: '0 4px 10px -2px rgba(236, 72, 153, 0.16), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(236, 72, 153, 0.12)',
              badgeBg: 'linear-gradient(180deg, #ffffff 0%, #fce7f3 100%)',
              badgeColor: '#be185d',
              badgeBorder: 'border-pink-200/80',
              accentColor: 'text-pink-600',
              iconGrad: 'from-pink-500 to-rose-600',
            },
            {
              cardBg: 'linear-gradient(180deg, #ffffff 0%, #fffdf5 100%)',
              border: 'border-amber-200/90',
              shadow: '0 4px 10px -2px rgba(245, 158, 11, 0.16), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(245, 158, 11, 0.12)',
              badgeBg: 'linear-gradient(180deg, #ffffff 0%, #fef3c7 100%)',
              badgeColor: '#b45309',
              badgeBorder: 'border-amber-200/80',
              accentColor: 'text-amber-600',
              iconGrad: 'from-amber-500 to-orange-600',
            },
          ];

          const p = palettes[index % palettes.length];

          return (
            <div
              key={r.id}
              style={{
                background: p.cardBg,
                boxShadow: p.shadow,
              }}
              className={`rounded-2xl p-4 border ${p.border} flex flex-col justify-between hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 group`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    style={{
                      background: p.badgeBg,
                      color: p.badgeColor,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.9)'
                    }}
                    className={`font-mono text-[9.5px] font-black px-2 py-0.5 rounded-lg border ${p.badgeBorder}`}
                  >
                    {r.id}
                  </span>
                  <span className="text-[11px] font-black text-slate-800 tracking-tight">
                    ₹{Number(r.monetary_value || 0).toLocaleString()}
                  </span>
                </div>

                <h4 className="font-black text-slate-900 text-xs tracking-tight line-clamp-1">{r.name}</h4>
                <p className="text-[11px] text-slate-400 font-medium mt-1 line-clamp-2 leading-snug min-h-[32px]">
                  {r.description || 'Exclusive loyalty reward voucher.'}
                </p>
              </div>

              {/* 3D Bulged Cost & Redeem Action Footer */}
              <div className="mt-3.5 space-y-2">
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(248,250,252,0.9) 100%)',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.9), 0 1px 2px rgba(0,0,0,0.03)'
                  }}
                  className="p-2 rounded-xl border border-slate-200/60 flex items-center justify-between"
                >
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider">Points</span>
                  <span
                    className="inline-flex items-center gap-1 justify-center px-2.5 py-0.5 rounded-full text-[10px] font-black select-none whitespace-nowrap"
                    style={{
                      background: 'linear-gradient(180deg, #ffffff 0%, #fef3c7 100%)',
                      color: '#b45309',
                      boxShadow:
                        '0 1.5px 3.5px rgba(245, 158, 11, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(253, 230, 138, 0.6)',
                    }}
                  >
                    <Coins className="w-2.5 h-2.5 text-amber-500" />
                    <span>{r.points_required?.toLocaleString()} pts</span>
                  </span>
                </div>

                {/* Redeem Button (Enabled if customer has enough points) */}
                {user?.customer_id && (
                  <button
                    onClick={() => handleRedeem(r)}
                    disabled={
                      redeemingId === r.id ||
                      (customerAccount && customerAccount.cached_balance < r.points_required)
                    }
                    style={{
                      background:
                        customerAccount && customerAccount.cached_balance >= r.points_required
                          ? 'linear-gradient(180deg, #7161ef 0%, #5448ea 100%)'
                          : 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)',
                      boxShadow:
                        customerAccount && customerAccount.cached_balance >= r.points_required
                          ? '0 4px 10px rgba(99, 85, 246, 0.35), inset 0 1.5px 1px rgba(255, 255, 255, 0.5)'
                          : 'none',
                      color:
                        customerAccount && customerAccount.cached_balance >= r.points_required
                          ? '#ffffff'
                          : '#94a3b8',
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-all duration-200 active:translate-y-0.5"
                  >
                    {redeemingId === r.id ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </span>
                    ) : customerAccount && customerAccount.cached_balance < r.points_required ? (
                      <span>Need {r.points_required - customerAccount.cached_balance} more pts</span>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Redeem Reward</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Table: Processed Redemptions Log with Inset 3D Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
        {/* Table Container Header with Integrated 3D Inset Search Bar */}
        <div className="py-2.5 px-5 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-slate-800">Processed Redemptions Log</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edeafc] text-[#6355f6] border border-indigo-100 shadow-2xs">
              {totalCount} Total
            </span>
            {selectedRewardFilter && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                Filtered: {selectedRewardFilter}
              </span>
            )}
          </div>

          {/* 3D Inset Beveled Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by redemption ID, customer, reward..."
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
                <th className="px-4 py-2.5 whitespace-nowrap min-w-[150px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Hash className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Redemption ID</span>
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
                      <Tag className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Reward ID</span>
                  </div>
                </th>

                <th className="px-4 py-2.5 whitespace-nowrap min-w-[130px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Coins className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Points Deducted</span>
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

                <th className="px-4 py-2.5 whitespace-nowrap min-w-[120px]">
                  <div className="flex items-center gap-1.5 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                      <Calendar className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Timestamp</span>
                  </div>
                </th>
              </tr>
            </thead>

            {/* Compact Rows (py-2) */}
            <tbody className="divide-y divide-slate-100">
              {currentRedemptions.map((rdm) => (
                <tr key={rdm.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-2 font-mono font-bold text-slate-900 tracking-tight text-[11px] whitespace-nowrap">
                    {rdm.id}
                  </td>
                  <td className="px-4 py-2 font-mono text-slate-700 font-semibold text-[11px] whitespace-nowrap">
                    {rdm.customer_id}
                  </td>
                  <td className="px-4 py-2 font-mono text-[11px] font-bold text-[#6355f6] whitespace-nowrap">
                    {rdm.reward_id}
                  </td>
                  <td className="px-4 py-2 font-black text-rose-600 text-xs whitespace-nowrap">
                    -{rdm.points_redeemed}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {renderStatusBadge(rdm.status)}
                  </td>
                  <td className="px-4 py-2 text-slate-500 font-medium text-[11px] whitespace-nowrap">
                    {new Date(rdm.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}

              {currentRedemptions.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 font-medium text-xs">
                    No redemption records found
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
