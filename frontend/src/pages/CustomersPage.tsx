import React, { useEffect, useState } from 'react';
import { LoyaltyAPI } from '../services/api';
import { Eye, Users, ShoppingCart, Receipt, Coins, Award, Wallet, IdCard, ArrowUpRight } from 'lucide-react';
import {
  PageHeader, Badge, StatusBadge, Pagination, Modal, SearchInput, EmptyState, InlineLoader,
  IconTile, humanize, cx, type Tone
} from '../components/ui';

const avatarTones = ['from-brand-400 to-brand-600', 'from-cyan-400 to-blue-500', 'from-pink-400 to-rose-500', 'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500'];

const Avatar: React.FC<{ first?: string; last?: string; id?: string; size?: number }> = ({ first = '', last = '', id = '', size = 34 }) => {
  const idx = (id.charCodeAt(id.length - 1) || 0) % avatarTones.length;
  return (
    <span
      className={cx('inline-flex items-center justify-center rounded-full bg-gradient-to-br text-white font-semibold shrink-0', avatarTones[idx])}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {(first[0] || '') + (last[0] || '')}
    </span>
  );
};

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 15;

  // Selected customer inspection modal
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [txns, setTxns] = useState<any[]>([]);
  const [detailTab, setDetailTab] = useState<'orders' | 'ledger'>('orders');

  useEffect(() => {
    const skip = (currentPage - 1) * pageSize;
    setLoading(true);
    LoyaltyAPI.getCustomers({ skip, limit: pageSize, search }).then((data) => {
      if (data && typeof data === 'object' && 'items' in data) {
        setCustomers(data.items || []);
        setTotalCount(data.total || 0);
      } else if (Array.isArray(data)) {
        setCustomers(data);
        setTotalCount(data.length);
      } else {
        setCustomers([]);
        setTotalCount(0);
      }
    }).finally(() => setLoading(false));
  }, [search, currentPage]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const viewDetails = (c: any) => {
    setSelectedCust(c);
    setAccount(null);
    setOrders([]);
    setTxns([]);
    setDetailTab('orders');
    LoyaltyAPI.getCustomerAccount(c.id).then(setAccount);
    LoyaltyAPI.getCustomerOrders(c.id).then(setOrders);
    LoyaltyAPI.getCustomerTransactions(c.id).then(setTxns);
  };

  const accountStats: { label: string; value: React.ReactNode; icon: any; tone: Tone }[] = account ? [
    { label: 'Loyalty ID', value: <span className="font-mono text-[13px]">{account.id}</span>, icon: IdCard, tone: 'slate' },
    { label: 'Current tier', value: humanize(account.current_tier_id), icon: Award, tone: 'amber' },
    { label: 'Points balance', value: `${Number(account.cached_balance).toLocaleString()} pts`, icon: Coins, tone: 'emerald' },
    { label: 'Qualifying spend', value: `₹${account.qualifying_net_spend?.toLocaleString()}`, icon: Wallet, tone: 'violet' },
  ] : [];

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Customers"
        description="Search member profiles and inspect balances, tier status and order history."
      />

      <div className="card overflow-hidden animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <h3 className="card-title">All customers</h3>
            <Badge tone="brand">{totalCount.toLocaleString()}</Badge>
          </div>
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, email or ID…"
            className="w-full sm:w-80"
          />
        </div>

        <div className="table-wrap">
          <table className="table rows-animate" key={`${currentPage}-${search}`}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Customer ID</th>
                <th>Email</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="row-clickable group" onClick={() => viewDetails(c)}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar first={c.first_name} last={c.last_name} id={c.id} />
                      <span className="cell-strong">{c.first_name} {c.last_name}</span>
                    </div>
                  </td>
                  <td><span className="mono-chip">{c.id}</span></td>
                  <td>{c.email}</td>
                  <td><StatusBadge status={c.status || 'ACTIVE'} /></td>
                  <td className="text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); viewDetails(c); }}
                      className="btn btn-secondary btn-sm opacity-80 group-hover:opacity-100 group-hover:border-brand-200 group-hover:text-brand-700"
                    >
                      <Eye /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && customers.length === 0 && <InlineLoader label="Loading customers…" />}
          {!loading && customers.length === 0 && (
            <EmptyState icon={Users} title="No customers found" description={search ? `Nothing matches “${search}”.` : 'No customer records yet.'} />
          )}
        </div>

        <Pagination page={currentPage} pageSize={pageSize} total={totalCount} onChange={setCurrentPage} noun="customers" />
      </div>

      <Modal
        open={!!selectedCust}
        onClose={() => setSelectedCust(null)}
        size="lg"
        title={selectedCust && (
          <span className="flex items-center gap-3">
            <Avatar first={selectedCust.first_name} last={selectedCust.last_name} id={selectedCust.id} size={40} />
            <span>
              <span className="block">{selectedCust.first_name} {selectedCust.last_name}</span>
              <span className="block text-[13px] font-normal text-[var(--text-3)]">
                <span className="font-mono">{selectedCust.id}</span> · {selectedCust.email}
              </span>
            </span>
          </span>
        )}
      >
        {!account ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-[76px] rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
            {accountStats.map((s) => (
              <div key={s.label} className="rounded-xl border border-[var(--border)] p-3.5 transition-all duration-300 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5">
                <div className="flex items-center gap-2 text-[12.5px] text-[var(--text-3)]">
                  <IconTile icon={s.icon} tone={s.tone} size="sm" className="!w-6 !h-6 !rounded-md [&_svg]:!w-3.5 [&_svg]:!h-3.5" />
                  {s.label}
                </div>
                <p className="mt-2 text-[15px] font-semibold text-[var(--text)] truncate">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="segmented">
            <button data-active={detailTab === 'orders'} onClick={() => setDetailTab('orders')}>
              <span className="inline-flex items-center gap-1.5"><ShoppingCart className="w-3.5 h-3.5" /> Orders · {orders.length}</span>
            </button>
            <button data-active={detailTab === 'ledger'} onClick={() => setDetailTab('ledger')}>
              <span className="inline-flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5" /> Ledger · {txns.length}</span>
            </button>
          </div>
        </div>

        <div key={detailTab} className="mt-4 rounded-xl border border-[var(--border)] overflow-hidden animate-fade-up">
          <div>
            {detailTab === 'orders' ? (
              <table className="table">
                <thead>
                  <tr><th>Order ID</th><th className="cell-num">Net spend</th><th className="cell-num">Points</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td><span className="mono-chip">{o.id}</span></td>
                      <td className="cell-num cell-strong">₹{Number(o.net_amount).toLocaleString()}</td>
                      <td className="cell-num font-medium text-brand-600">+{o.points_earned}</td>
                      <td><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Txn ID</th><th>Type</th><th className="cell-num">Amount</th><th>Reason</th></tr>
                </thead>
                <tbody>
                  {txns.map((t) => (
                    <tr key={t.id}>
                      <td><span className="mono-chip">{t.id}</span></td>
                      <td>{humanize(t.transaction_type)}</td>
                      <td className={cx('cell-num font-semibold', t.points_amount > 0 ? 'text-emerald-600' : 'text-rose-600')}>
                        {t.points_amount > 0 ? `+${t.points_amount}` : t.points_amount}
                      </td>
                      <td className="max-w-xs truncate">{t.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {detailTab === 'orders' && orders.length === 0 && <EmptyState icon={ShoppingCart} title="No orders recorded" />}
            {detailTab === 'ledger' && txns.length === 0 && <EmptyState icon={ArrowUpRight} title="No transactions recorded" />}
          </div>
        </div>
      </Modal>
    </div>
  );
};
