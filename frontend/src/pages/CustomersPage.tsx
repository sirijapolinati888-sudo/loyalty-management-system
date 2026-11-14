import React, { useEffect, useState } from 'react';
import { LoyaltyAPI } from '../services/api';
import {
  Search, Eye, X, Users, Mail, User, Activity, Settings2,
  ChevronLeft, ChevronRight, IdCard
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15; // More compact rows per page

  // Selected customer inspection modal
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [txns, setTxns] = useState<any[]>([]);

  useEffect(() => {
    LoyaltyAPI.getCustomers({ search }).then((data) => {
      setCustomers(data || []);
      setCurrentPage(1);
    });
  }, [search]);

  const viewDetails = (c: any) => {
    setSelectedCust(c);
    LoyaltyAPI.getCustomerAccount(c.id).then(setAccount);
    LoyaltyAPI.getCustomerOrders(c.id).then(setOrders);
    LoyaltyAPI.getCustomerTransactions(c.id).then(setTxns);
  };

  // Pagination calculation
  const totalCount = customers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const currentCustomers = customers.slice(startIndex, endIndex);

  return (
    <div className="space-y-3.5">
      {/* Top Header: Title & Subtitle */}
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6355f6] to-[#8d7dfb] text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">Customers Registry</h1>
            <p className="text-[11px] text-slate-400 font-medium mt-1 leading-none">
              Search customer profiles, view balances, tier status and order history
            </p>
          </div>
        </div>
      </div>

      {/* Main Customers Table Card with Inset 3D Search Bar and Compact Rows */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
        {/* Search Bar Inserted Directly Inside Table Container Header with Inset 3D Styling */}
        <div className="py-2.5 px-5 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-slate-800">All Customers</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edeafc] text-[#6355f6] border border-indigo-100 shadow-2xs">
              {totalCount} Total
            </span>
          </div>

          {/* 3D Inset Beveled Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-[#f4f6fc] border-t border-t-slate-300/80 border-l border-l-slate-300/70 border-b border-b-white border-r border-r-white rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6355f6]/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_1px_1px_rgba(255,255,255,0.8)] transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Table Header: Distinct Lavender/Violet Tint */}
            <thead className="bg-gradient-to-r from-[#f4f1fe] via-[#f7f5ff] to-[#f4f1fe] border-b border-[#e9e3fe] text-[#2e1d68] font-black tracking-tight">
              <tr>
                <th className="px-5 py-2.5">
                  <div className="flex items-center gap-2 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs">
                      <IdCard className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Customer ID</span>
                  </div>
                </th>
                <th className="px-5 py-2.5">
                  <div className="flex items-center gap-2 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs">
                      <User className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Name</span>
                  </div>
                </th>
                <th className="px-5 py-2.5">
                  <div className="flex items-center gap-2 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs">
                      <Mail className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Email</span>
                  </div>
                </th>
                <th className="px-5 py-2.5">
                  <div className="flex items-center gap-2 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs">
                      <Activity className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Status</span>
                  </div>
                </th>
                <th className="px-5 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2 text-[#4338ca]">
                    <div className="w-5 h-5 rounded-md bg-white/90 border border-[#ddd6fe] flex items-center justify-center shadow-2xs">
                      <Settings2 className="w-3 h-3 text-[#6355f6]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800">Actions</span>
                  </div>
                </th>
              </tr>
            </thead>

            {/* Table Rows with Compact Height (py-2.5 instead of py-4.5) */}
            <tbody className="divide-y divide-slate-100">
              {currentCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Customer ID */}
                  <td className="px-5 py-2.5 font-mono font-bold text-slate-900 tracking-tight text-xs">
                    {c.id}
                  </td>

                  {/* Name */}
                  <td className="px-5 py-2.5 font-bold text-slate-800 text-xs">
                    {c.first_name} {c.last_name}
                  </td>

                  {/* Email */}
                  <td className="px-5 py-2.5 text-slate-500 font-medium text-[11px]">
                    {c.email}
                  </td>

                  {/* Status Badge: Borderless 3D Bulged Pill (lowercase) */}
                  <td className="px-5 py-2.5">
                    <span
                      className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-bold select-none whitespace-nowrap"
                      style={{
                        background: 'linear-gradient(180deg, #ffffff 0%, #d1fae5 100%)',
                        color: '#065f46',
                        boxShadow:
                          '0 1.5px 3.5px rgba(16, 185, 129, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(167, 243, 208, 0.5)',
                      }}
                    >
                      {(c.status || 'active').toLowerCase().replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Action: Borderless 3D Bulged Purple View Ledger Button */}
                  <td className="px-5 py-2.5 text-right">
                    <button
                      onClick={() => viewDetails(c)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer whitespace-nowrap select-none hover:opacity-90 active:translate-y-0.5"
                      style={{
                        background: 'linear-gradient(180deg, #ffffff 0%, #f4edff 100%)',
                        color: '#6355f6',
                        boxShadow:
                          '0 1.5px 3.5px rgba(99, 85, 246, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(221, 214, 254, 0.5)',
                      }}
                    >
                      <Eye className="w-3 h-3 text-[#6355f6]" />
                      <span>View Ledger</span>
                    </button>
                  </td>
                </tr>
              ))}

              {currentCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400 font-medium text-xs">
                    No customers found matching "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination matching reference screenshot */}
        <div className="px-5 py-2.5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          <div className="text-slate-400 font-medium text-[11px]">
            Showing <span className="font-bold text-slate-700">{totalCount > 0 ? startIndex + 1 : 0} &ndash; {endIndex}</span> of{' '}
            <span className="font-bold text-slate-700">{totalCount}</span> customers
          </div>

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
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
                    <span key={`ellipsis-${idx}`} className="text-slate-400 font-bold px-1 select-none">
                      ...
                    </span>
                  );
                }
                const pageNum = item as number;
                return (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
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
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Inspection Modal */}
      {selectedCust && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {selectedCust.first_name} {selectedCust.last_name}
                </h3>
                <span className="font-mono text-xs text-slate-400">
                  {selectedCust.id} &bull; {selectedCust.email}
                </span>
              </div>
              <button
                onClick={() => setSelectedCust(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Account Info Cards */}
            {account && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Loyalty ID</div>
                  <div className="font-mono font-bold text-xs text-slate-900 mt-0.5 truncate">{account.id}</div>
                </div>
                <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200/70">
                  <div className="text-[10px] font-semibold text-blue-600 uppercase">Current Tier</div>
                  <div className="font-bold text-blue-700 mt-0.5 text-xs">{account.current_tier_id}</div>
                </div>
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/70">
                  <div className="text-[10px] font-semibold text-emerald-600 uppercase">Points Balance</div>
                  <div className="font-black text-emerald-700 text-sm mt-0.5">{account.cached_balance} pts</div>
                </div>
                <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200/70">
                  <div className="text-[10px] font-semibold text-purple-600 uppercase">Qualifying Spend</div>
                  <div className="font-bold text-purple-700 text-xs mt-0.5">₹{account.qualifying_net_spend?.toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Recent Orders */}
            <div className="mb-4">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1.5">Orders ({orders.length})</h4>
              <div className="border border-slate-200/80 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold">
                    <tr>
                      <th className="p-2">Order ID</th>
                      <th className="p-2">Net Spend</th>
                      <th className="p-2">Points Earned</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50">
                        <td className="p-2 font-mono font-medium text-slate-800">{o.id}</td>
                        <td className="p-2 font-bold text-slate-900">₹{o.net_amount}</td>
                        <td className="p-2 text-blue-600 font-bold">+{o.points_earned}</td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-3 text-center text-slate-400">No orders recorded</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Ledger Transactions */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1.5">Ledger Entries ({txns.length})</h4>
              <div className="border border-slate-200/80 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold">
                    <tr>
                      <th className="p-2">Txn ID</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {txns.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="p-2 font-mono text-slate-800">{t.id}</td>
                        <td className="p-2 font-semibold text-slate-700">{t.transaction_type}</td>
                        <td className={`p-2 font-black ${t.points_amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {t.points_amount > 0 ? `+${t.points_amount}` : t.points_amount}
                        </td>
                        <td className="p-2 text-slate-500 truncate max-w-xs">{t.reason}</td>
                      </tr>
                    ))}
                    {txns.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-3 text-center text-slate-400">No transactions recorded</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
