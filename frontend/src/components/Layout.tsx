import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import logoImg from '../assets/Logo.png';
import {
  LayoutDashboard, Users, ShoppingCart, Receipt, Award,
  Clock, ShieldCheck, AlertTriangle, Database, FileSpreadsheet,
  Store, BarChart3, Settings2, LogOut, ChevronDown, Search, Bell,
  Menu, X
} from 'lucide-react';

interface NavItemConfig {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItemConfig[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['OPERATIONS_MANAGER', 'ANALYST'] },
  { name: 'Customers', path: '/customers', icon: Users, roles: ['OPERATIONS_MANAGER', 'ANALYST', 'STORE_OPERATOR', 'CUSTOMER'] },
  { name: 'Orders', path: '/orders', icon: ShoppingCart, roles: ['OPERATIONS_MANAGER', 'STORE_OPERATOR', 'CUSTOMER'] },
  { name: 'Points Ledger', path: '/ledger', icon: Receipt, roles: ['OPERATIONS_MANAGER', 'CUSTOMER'] },
  { name: 'Redemptions', path: '/redemptions', icon: Award, roles: ['OPERATIONS_MANAGER', 'CUSTOMER', 'ANALYST'] },
  { name: 'Expiration', path: '/expiration', icon: Clock, roles: ['OPERATIONS_MANAGER'] },
  { name: 'Membership Tiers', path: '/tiers', icon: ShieldCheck, roles: ['OPERATIONS_MANAGER', 'ANALYST'] },
  { name: 'Anomaly Monitoring', path: '/anomalies', icon: AlertTriangle, roles: ['OPERATIONS_MANAGER'] },
  { name: 'Data Generator', path: '/generator', icon: Database, roles: ['OPERATIONS_MANAGER'] },
  { name: 'Validation & Reports', path: '/validation', icon: FileSpreadsheet, roles: ['OPERATIONS_MANAGER', 'ANALYST'] },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close mobile drawer when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleMeta: Record<UserRole, { title: string; badge: string; icon: React.ComponentType<{ className?: string }> }> = {
    OPERATIONS_MANAGER: {
      title: 'Operations Manager',
      badge: 'Full Ledger Audit & Batch Control',
      icon: Settings2,
    },
    STORE_OPERATOR: {
      title: 'Store/Warehouse Operator',
      badge: 'Order & Return Processing',
      icon: Store,
    },
    ANALYST: {
      title: 'Merchandising Analyst',
      badge: 'Tiers, Rules & Catalogue Strategy',
      icon: BarChart3,
    },
    CUSTOMER: {
      title: 'Customer Experience',
      badge: user?.customer_id ? `Account ${user.customer_id}` : 'Earned Points, History & Rewards',
      icon: Users,
    },
  };

  const currentRole = user ? roleMeta[user.role] : {
    title: 'Operations Manager',
    badge: 'Full Ledger Audit & Batch Control',
    icon: Settings2,
  };

  const visibleNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex h-screen w-full max-w-full bg-[#f1f3fb] text-slate-900 antialiased overflow-hidden relative">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* Sidebar (Desktop Persistent + Mobile Drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-[240px] bg-gradient-to-b from-[#080720] via-[#0b0c2a] to-[#160d3d] text-slate-300 flex flex-col shrink-0 z-50 transition-transform duration-300 ease-in-out overflow-hidden lg:static ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 hidden lg:flex'
        }`}
      >
        {/* Decorative subtle wavy luminous glow at the bottom matching reference */}
        <div className="absolute -bottom-10 -left-10 -right-10 h-44 bg-gradient-to-t from-[#6355f6]/25 via-[#8d7dfb]/10 to-transparent blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 left-0 right-0 h-32 opacity-40 pointer-events-none">
          <svg viewBox="0 0 240 120" preserveAspectRatio="none" className="w-full h-full fill-[#6355f6]/30">
            <path d="M0,60 C40,90 80,30 140,70 C190,100 210,40 240,60 L240,120 L0,120 Z" />
          </svg>
        </div>

        {/* Brand header */}
        <div className="h-[60px] flex items-center justify-between px-5 z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src={logoImg}
              alt="YottaFlex.ai Logo"
              className="w-7 h-7 object-contain drop-shadow-[0_2px_8px_rgba(99,85,246,0.6)] shrink-0"
            />
            <div>
              <h1 className="font-extrabold text-white text-[15px] tracking-tight leading-tight">YottaFlex.ai</h1>
              <span className="text-[10px] text-indigo-300/80 font-medium tracking-wide">Loyalty Ledger</span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dynamic Navigation (Compact, no scrollbar) */}
        <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-hidden flex flex-col justify-evenly z-10">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 rounded-full text-[12px] tracking-tight transition-all relative ${
                    isActive
                      ? 'bg-gradient-to-r from-[#6e2fef] via-[#7b3df3] to-[#8d54f8] text-white font-bold shadow-[0_3px_10px_rgba(110,47,239,0.4)]'
                      : 'text-slate-300/80 hover:text-white hover:bg-white/[0.06] font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-white/15 text-white'
                          : 'text-slate-300/80'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                    <span className="truncate">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 pt-1 space-y-1.5 z-10 shrink-0">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">Sign Out ({user?.role?.replace('_', ' ')})</span>
          </button>

          <div className="text-[9.5px] text-slate-500 px-1 font-medium">
            Seed: 20261022 &bull; YottaFlex 2.0
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden bg-[#f1f3fb]">
        {/* Top Navbar */}
        <header className="h-[64px] sm:h-[72px] bg-white/80 backdrop-blur-md px-3 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-10 border-b border-indigo-50/50">
          {/* Left: Mobile Toggle & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger Button for Mobile/Tablet */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <h2 className="text-xs sm:text-base font-black text-slate-900 tracking-tight leading-none truncate">
                  Enterprise Loyalty Ledger
                </h2>
                <div
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 whitespace-nowrap select-none"
                  style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, #ede8fe 100%)',
                    color: '#53389e',
                    boxShadow:
                      '0 2px 4px rgba(99, 85, 246, 0.16), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(199, 185, 255, 0.45)',
                  }}
                >
                  <Users className="w-2.5 h-2.5 text-[#6355f6] stroke-[2.5]" />
                  <span>{currentRole.title}</span>
                </div>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-1 leading-none hidden sm:block truncate">
                Full Ledger Audit &amp; Batch Control
              </p>
            </div>
          </div>

          {/* Right: Search, Notification & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3.5 shrink-0">
            {/* 3D Inset Beveled Search Bar */}
            <div className="relative hidden md:block w-56 lg:w-64 xl:w-72 2xl:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                readOnly
                placeholder="Search customers, orders, transactions..."
                className="w-full pl-9 pr-4 py-1.5 bg-[#f4f6fc] border-t border-t-slate-300/80 border-l border-l-slate-300/70 border-b border-b-white border-r border-r-white rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_1px_1px_rgba(255,255,255,0.8)] transition-all cursor-default"
              />
            </div>

            {/* Notification bell */}
            <button className="relative w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0">
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Interactive Profile Dropdown */}
            <div className="relative shrink-0" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-1 sm:gap-2 p-0.5 rounded-full hover:bg-white/60 transition-colors cursor-pointer focus:outline-none group"
                aria-expanded={profileMenuOpen}
              >
                <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-gradient-to-tr from-[#6355f6] to-[#8d7dfb] flex items-center justify-center font-bold text-white shadow-xs text-[10px] sm:text-[11px] shrink-0">
                  {user?.full_name
                    ? user.full_name
                        .split(' ')
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join('')
                    : 'SC'}
                </div>
                <div className="text-left hidden md:block pr-0.5">
                  <div className="font-bold text-[11px] text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                    {user?.full_name || 'Sarah Connor'}
                  </div>
                  <div className="text-[9px] text-slate-400 font-medium leading-none">
                    {currentRole.title}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform shrink-0" />
              </button>

              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <div 
                  style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, #faf8ff 100%)',
                    boxShadow: '0 20px 42px -8px rgba(99, 85, 246, 0.25), 0 8px 18px -4px rgba(0, 0, 0, 0.08), inset 0 1.5px 1.5px #ffffff, 0 0 0 1px rgba(110, 47, 239, 0.12)',
                  }}
                  className="absolute right-0 mt-2 min-w-[260px] max-w-[340px] rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
                >
                  <div className="px-3.5 py-2.5 border-b border-indigo-50/70">
                    <div className="font-extrabold text-xs text-slate-900 leading-tight">
                      {user?.full_name || 'Sarah Connor'}
                    </div>
                    <div className="text-[11px] text-slate-500 break-all font-medium mt-0.5 select-all">
                      {user?.email || 'ops@yottaflex.ai'}
                    </div>
                    <div className="mt-2">
                      <span
                        style={{
                          background: 'linear-gradient(180deg, #ffffff 0%, #ede8fe 100%)',
                          color: '#53389e',
                          boxShadow:
                            '0 3px 6px -1px rgba(99, 85, 246, 0.22), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(199, 185, 255, 0.5), 0 0 0 1px rgba(110, 47, 239, 0.15)',
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-tight select-none"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6355f6] shadow-xs" />
                        <span>{currentRole.title}</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-1 pt-1.5">
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50/80 rounded-xl transition-colors font-bold text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500 stroke-[2.2]" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Page Body with Responsive Padding */}
        <main className="flex-1 p-2.5 sm:p-4 lg:p-6 overflow-y-auto overflow-x-hidden w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
