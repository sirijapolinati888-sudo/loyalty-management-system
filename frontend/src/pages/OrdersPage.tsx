import React, { useEffect, useState } from 'react';
import { LoyaltyAPI } from '../services/api';
import {
  ShoppingCart, Search, Package, Hash, User, IndianRupee,
  Coins, Activity, ListFilter, ChevronLeft, ChevronRight
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedLines, setSelectedLines] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15; // Set to 15 rows per page as requested

  useEffect(() => {
    LoyaltyAPI.getOrders({ limit: 200 }).then((data) => {
      setOrders(data || []);
    });
  }, []);

  const viewLines = (orderId: string) => {
    setActiveOrder(orderId);
    LoyaltyAPI.getOrderLines(orderId).then(setSelectedLines);
  };

  // Filter orders by search query
  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.id?.toLowerCase().includes(q) ||
      o.customer_id?.toLowerCase().includes(q) ||
      o.status?.toLowerCase().includes(q)
    );
  });

  const totalCount = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Status Badge 3D styling helper (Completely Borderless, lowercase without underscores)
  const getStatusBadge = (status: string) => {
    const raw = status || 'completed';
    const s = raw.toLowerCase().replace(/_/g, ' ');

    if (s.includes('return')) {
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
          {s}
        </span>
      );
    }
    if (s.includes('cancel') || s.includes('refund')) {
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
          {s}
        </span>
      );
    }
    // Default completed
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
  };

  return (
    <div className="space-y-3">
      {/* Top Header: Title & Subtitle */}
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6355f6] to-[#8d7dfb] text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">Orders &amp; Eligible Spend Registry</h1>
            <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none">
              Track orders, itemized lines, net spend eligibility, and points accrued
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Orders Table (Expanded to span-5 in a 7-column layout or flex) */}
      <div className="grid grid-cols-1 xl:grid-cols-7 gap-3 items-start">
        {/* Left Column: Orders Table Card with Inset 3D Search & Ultra-Compact 15 Rows */}
        <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
          {/* Integrated 3D Inset Search Bar in Header */}
          <div className="py-2 px-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-slate-800">All Orders</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edeafc] text-[#6355f6] border border-indigo-100 shadow-2xs">
                {totalCount} Total
              </span>
            </div>

            {/* 3D Inset Beveled Search Bar */}
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by order ID, customer, status..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1 bg-[#f4f6fc] border-t border-t-slate-300/80 border-l border-l-slate-300/70 border-b border-b-white border-r border-r-white rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6355f6]/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_1px_1px_rgba(255,255,255,0.8)] transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              {/* Table Header: Lavender/Violet Gradient matching Customers Registry */}
              <thead className="bg-gradient-to-r from-[#f4f1fe] via-[#f7f5ff] to-[#f4f1fe] border-b border-[#e9e3fe] text-[#2e1d68] font-black tracking-tight">
                <tr>
                  <th className="px-3.5 py-2 whitespace-nowrap min-w-[190px]">
                    <div className="flex items-center gap-1.5 text-[#4338ca]">
                      <div className="w-4 h-4 rounded bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                        <Hash className="w-2.5 h-2.5 text-[#6355f6]" />
                      </div>
                      <span className="font-extrabold text-[11px] text-slate-800">Order ID</span>
                    </div>
                  </th>
                  <th className="px-3 py-2 whitespace-nowrap min-w-[110px]">
                    <div className="flex items-center gap-1.5 text-[#4338ca]">
                      <div className="w-4 h-4 rounded bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                        <User className="w-2.5 h-2.5 text-[#6355f6]" />
                      </div>
                      <span className="font-extrabold text-[11px] text-slate-800">Customer</span>
                    </div>
                  </th>
                  <th className="px-3 py-2 whitespace-nowrap min-w-[110px]">
                    <div className="flex items-center gap-1.5 text-[#4338ca]">
                      <div className="w-4 h-4 rounded bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                        <IndianRupee className="w-2.5 h-2.5 text-[#6355f6]" />
                      </div>
                      <span className="font-extrabold text-[11px] text-slate-800">Eligible Spend</span>
                    </div>
                  </th>
                  <th className="px-3 py-2 whitespace-nowrap min-w-[75px]">
                    <div className="flex items-center gap-1.5 text-[#4338ca]">
                      <div className="w-4 h-4 rounded bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                        <Coins className="w-2.5 h-2.5 text-[#6355f6]" />
                      </div>
                      <span className="font-extrabold text-[11px] text-slate-800">Points</span>
                    </div>
                  </th>
                  <th className="px-3 py-2 whitespace-nowrap min-w-[140px]">
                    <div className="flex items-center gap-1.5 text-[#4338ca]">
                      <div className="w-4 h-4 rounded bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                        <Activity className="w-2.5 h-2.5 text-[#6355f6]" />
                      </div>
                      <span className="font-extrabold text-[11px] text-slate-800">Status</span>
                    </div>
                  </th>
                  <th className="px-3 py-2 text-right whitespace-nowrap min-w-[80px]">
                    <div className="flex items-center justify-end gap-1 text-[#4338ca]">
                      <div className="w-4 h-4 rounded bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs shrink-0">
                        <ListFilter className="w-2.5 h-2.5 text-[#6355f6]" />
                      </div>
                      <span className="font-extrabold text-[11px] text-slate-800">Details</span>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Ultra-compact Rows (py-1.5), Strictly 1 Line for Order ID */}
              <tbody className="divide-y divide-slate-100">
                {currentOrders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => viewLines(o.id)}
                    className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                      activeOrder === o.id ? 'bg-[#f4f2ff]/70' : ''
                    }`}
                  >
                    {/* Order ID: strictly 1 single line with whitespace-nowrap */}
                    <td className="px-3.5 py-1.5 font-mono font-bold text-slate-900 tracking-tight text-[11px] whitespace-nowrap">
                      {o.id}
                    </td>

                    {/* Customer ID */}
                    <td className="px-3 py-1.5 font-mono text-[11px] text-slate-600 font-semibold whitespace-nowrap">
                      {o.customer_id}
                    </td>

                    {/* Eligible Net Spend */}
                    <td className="px-3 py-1.5 font-extrabold text-slate-900 text-xs whitespace-nowrap">
                      ₹{Number(o.eligible_net_spend || o.net_amount || 0).toLocaleString()}
                    </td>

                    {/* Points Earned */}
                    <td className="px-3 py-1.5 font-black text-[#2563eb] text-xs whitespace-nowrap">
                      +{o.points_earned}
                    </td>

                    {/* 3D Bulged Status Badge */}
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      {getStatusBadge(o.status)}
                    </td>

                    {/* 3D Action Button (Borderless Bulged Pill) */}
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewLines(o.id);
                        }}
                        className={`inline-flex items-center justify-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer whitespace-nowrap select-none ${
                          activeOrder === o.id
                            ? 'bg-[#6355f6] text-white shadow-[0_2px_5px_rgba(99,85,246,0.4)]'
                            : 'hover:opacity-90'
                        }`}
                        style={
                          activeOrder === o.id
                            ? undefined
                            : {
                                background: 'linear-gradient(180deg, #ffffff 0%, #f4edff 100%)',
                                color: '#6355f6',
                                boxShadow:
                                  '0 1.5px 3.5px rgba(99, 85, 246, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(221, 214, 254, 0.5)',
                              }
                        }
                      >
                        <Package className="w-2.5 h-2.5" />
                        <span>Orders</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {currentOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-medium text-xs">
                      No orders found matching "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer - 15 items per page */}
          <div className="px-4 py-2 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="text-slate-400 font-medium text-[11px]">
              Showing <span className="font-bold text-slate-700">{totalCount > 0 ? startIndex + 1 : 0} &ndash; {endIndex}</span> of{' '}
              <span className="font-bold text-slate-700">{totalCount}</span> orders (15/page)
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-6 h-6 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3 h-3" />
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
                      <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-bold select-none">
                        ...
                      </span>
                    );
                  }
                  const pageNum = item as number;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-6 h-6 flex items-center justify-center rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-[#6355f6] text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
                className="w-6 h-6 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Order Line Items Inspector Card */}
        <div className="xl:col-span-2 bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs h-fit space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
              <Package className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-xs tracking-tight leading-tight">Order Line Items</h3>
              <span className="text-[9px] text-slate-400 block mt-0.5 font-medium truncate max-w-[200px]">
                {activeOrder ? `Items for ${activeOrder}` : 'Select an order to view items'}
              </span>
            </div>
          </div>

          {selectedLines.length > 0 ? (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {selectedLines.map((line) => (
                <div key={line.id} className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70 text-xs space-y-1">
                  <div className="font-bold text-slate-800 text-[11px] leading-tight">{line.product_name}</div>
                  <div className="text-slate-400 font-mono text-[9px]">
                    SKU: {line.product_sku} &bull; {line.category}
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-500 text-[10px]">
                      Qty: {line.quantity} &times; ₹{line.unit_price}
                    </span>
                    <span className="font-black text-slate-900">₹{line.line_total}</span>
                  </div>
                  <div className="pt-0.5">
                    <span
                      style={{
                        background: line.is_eligible_for_points
                          ? 'linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%)'
                          : 'linear-gradient(180deg, #ffffff 0%, #fff1f2 100%)',
                        color: line.is_eligible_for_points ? '#065f46' : '#9f1239',
                        boxShadow: line.is_eligible_for_points
                          ? '0 1.5px 3.5px rgba(16, 185, 129, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(167, 243, 208, 0.5)'
                          : '0 1.5px 3.5px rgba(225, 29, 72, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(254, 205, 211, 0.5)'
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black select-none whitespace-nowrap"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${line.is_eligible_for_points ? 'bg-emerald-500 shadow-xs' : 'bg-rose-500 shadow-xs'}`}></span>
                      {line.is_eligible_for_points ? 'Eligible for Accrual' : 'Excluded from Points'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Package className="w-6 h-6 mx-auto mb-1 text-slate-300" />
              <span className="text-[11px]">No lines selected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
