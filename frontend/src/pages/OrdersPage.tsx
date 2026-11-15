import React, { useEffect, useMemo, useState } from 'react';
import { LoyaltyAPI } from '../services/api';
import { ShoppingCart, Package, ChevronRight, IndianRupee, Coins, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import {
  PageHeader, Badge, StatusBadge, Pagination, SearchInput, EmptyState, InlineLoader, StatCard, cx
} from '../components/ui';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLines, setSelectedLines] = useState<any[]>([]);
  const [linesLoading, setLinesLoading] = useState(false);
  const [activeOrder, setActiveOrder] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    LoyaltyAPI.getOrders({ limit: 200 })
      .then((data) => setOrders(data || []))
      .finally(() => setLoading(false));
  }, []);

  const viewLines = (orderId: string) => {
    setActiveOrder(orderId);
    setLinesLoading(true);
    LoyaltyAPI.getOrderLines(orderId).then(setSelectedLines).finally(() => setLinesLoading(false));
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.id?.toLowerCase().includes(q) ||
      o.customer_id?.toLowerCase().includes(q) ||
      o.status?.toLowerCase().includes(q)
    );
  });

  const totalCount = filteredOrders.length;
  const startIndex = (currentPage - 1) * pageSize;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  const summary = useMemo(() => {
    const spend = orders.reduce((a, o) => a + Number(o.eligible_net_spend || o.net_amount || 0), 0);
    const points = orders.reduce((a, o) => a + Number(o.points_earned || 0), 0);
    const returned = orders.filter((o) => /RETURN/i.test(o.status || '')).length;
    return { spend, points, returned };
  }, [orders]);

  const activeOrderData = orders.find((o) => o.id === activeOrder);
  const linesTotal = selectedLines.reduce((a, l) => a + Number(l.line_total || 0), 0);

  return (
    <div>
      <PageHeader
        icon={ShoppingCart}
        title="Orders"
        description="Track orders, itemised lines, eligible net spend and points accrued."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4 stagger">
        <StatCard compact label="Total orders" value={orders.length} icon={ShoppingCart} tone="brand" />
        <StatCard compact label="Eligible spend" value={Math.round(summary.spend)} prefix="₹" icon={IndianRupee} tone="emerald" />
        <StatCard compact label="Points accrued" value={summary.points} icon={Coins} tone="amber" />
        <StatCard compact label="Returned orders" value={summary.returned} icon={RotateCcw} tone="cyan" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
        {/* Orders table */}
        <div className="card overflow-hidden animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <h3 className="card-title">All orders</h3>
              <Badge tone="brand">{totalCount.toLocaleString()}</Badge>
            </div>
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setCurrentPage(1); }}
              placeholder="Search order, customer or status…"
              className="w-full sm:w-80"
            />
          </div>

          <div className="table-wrap">
            <table className="table rows-animate" key={`${currentPage}-${search}`}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th className="cell-num">Eligible spend</th>
                  <th className="cell-num">Points</th>
                  <th>Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {currentOrders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => viewLines(o.id)}
                    className={cx('row-clickable group', activeOrder === o.id && 'row-selected')}
                  >
                    <td><span className="font-mono text-[13px] font-medium text-[var(--text)] whitespace-nowrap">{o.id}</span></td>
                    <td><span className="mono-chip">{o.customer_id}</span></td>
                    <td className="cell-num cell-strong">₹{Number(o.eligible_net_spend || o.net_amount || 0).toLocaleString()}</td>
                    <td className="cell-num font-semibold text-brand-600">+{o.points_earned}</td>
                    <td><StatusBadge status={o.status || 'COMPLETED'} /></td>
                    <td className="text-right">
                      <ChevronRight className={cx(
                        'w-4 h-4 inline transition-all duration-300',
                        activeOrder === o.id ? 'text-brand-600 translate-x-0.5' : 'text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5',
                      )} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <InlineLoader label="Loading orders…" />}
            {!loading && currentOrders.length === 0 && (
              <EmptyState icon={ShoppingCart} title="No orders found" description={search ? `Nothing matches “${search}”.` : undefined} />
            )}
          </div>

          <Pagination page={currentPage} pageSize={pageSize} total={totalCount} onChange={setCurrentPage} noun="orders" />
        </div>

        {/* Line items inspector */}
        <aside className="card xl:sticky xl:top-2 animate-fade-up" style={{ animationDelay: '0.08s' }}>
          <div className="card-header pb-4 border-b border-[var(--border)]">
            <div className="flex items-start gap-3 min-w-0">
              <span className="icon-tile icon-tile-sm bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                <Package className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">Line items</h3>
                <p className="card-subtitle truncate">
                  {activeOrder ? <span className="font-mono">{activeOrder}</span> : 'Select an order to inspect'}
                </p>
              </div>
            </div>
            {activeOrderData && <StatusBadge status={activeOrderData.status || 'COMPLETED'} />}
          </div>

          <div className="p-4">
            {linesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-[92px] rounded-xl" />)}
              </div>
            ) : selectedLines.length > 0 ? (
              <>
                <div key={activeOrder} className="space-y-2.5 max-h-[520px] overflow-y-auto -mr-1 pr-1 stagger">
                  {selectedLines.map((line) => (
                    <div
                      key={line.id}
                      className="rounded-xl border border-[var(--border)] p-3.5 transition-all duration-300 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-medium text-[var(--text)] leading-snug">{line.product_name}</p>
                          <p className="mt-0.5 text-[12px] text-[var(--text-3)] truncate">
                            <span className="font-mono">{line.product_sku}</span> · {line.category}
                          </p>
                        </div>
                        <p className="text-[14px] font-semibold text-[var(--text)] tabular whitespace-nowrap">₹{Number(line.line_total).toLocaleString()}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-[12.5px] text-[var(--text-3)] tabular">{line.quantity} × ₹{Number(line.unit_price).toLocaleString()}</span>
                        {line.is_eligible_for_points ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Earns points</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-rose-600"><XCircle className="w-3.5 h-3.5" /> Excluded</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2 text-[13.5px]">
                  <div className="flex justify-between text-[var(--text-3)]">
                    <span>{selectedLines.length} item{selectedLines.length !== 1 && 's'}</span>
                    <span className="tabular">₹{linesTotal.toLocaleString()}</span>
                  </div>
                  {activeOrderData && (
                    <div className="flex justify-between font-semibold text-[var(--text)]">
                      <span>Points earned</span>
                      <span className="text-brand-600 tabular">+{activeOrderData.points_earned}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)]">
                <EmptyState icon={Package} title={activeOrder ? 'No line items' : 'No order selected'} description={activeOrder ? undefined : 'Click any row to see its items.'} />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
