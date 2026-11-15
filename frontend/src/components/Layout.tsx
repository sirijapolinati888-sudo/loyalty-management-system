import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import { Logo } from './Logo';
import {
  LayoutDashboard, Users, ShoppingCart, Receipt, Award,
  Clock, ShieldCheck, AlertTriangle, Database, FileSpreadsheet,
  Store, BarChart3, Settings2, LogOut, ChevronDown, Search, Bell,
  Menu, X, ChevronRight
} from 'lucide-react';
import { cx } from './ui';

interface NavItemConfig {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  roles: UserRole[];
  group: 'Overview' | 'Operations' | 'Programme' | 'Audit & Data';
}

const navItems: NavItemConfig[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['OPERATIONS_MANAGER', 'ANALYST'], group: 'Overview' },
  { name: 'Customers', path: '/customers', icon: Users, roles: ['OPERATIONS_MANAGER', 'ANALYST', 'STORE_OPERATOR', 'CUSTOMER'], group: 'Operations' },
  { name: 'Orders', path: '/orders', icon: ShoppingCart, roles: ['OPERATIONS_MANAGER', 'STORE_OPERATOR', 'CUSTOMER'], group: 'Operations' },
  { name: 'Points Ledger', path: '/ledger', icon: Receipt, roles: ['OPERATIONS_MANAGER', 'CUSTOMER'], group: 'Operations' },
  { name: 'Redemptions', path: '/redemptions', icon: Award, roles: ['OPERATIONS_MANAGER', 'CUSTOMER', 'ANALYST'], group: 'Operations' },
  { name: 'Expiration', path: '/expiration', icon: Clock, roles: ['OPERATIONS_MANAGER'], group: 'Operations' },
  { name: 'Membership Tiers', path: '/tiers', icon: ShieldCheck, roles: ['OPERATIONS_MANAGER', 'ANALYST'], group: 'Programme' },
  { name: 'Anomaly Monitoring', path: '/anomalies', icon: AlertTriangle, roles: ['OPERATIONS_MANAGER'], group: 'Audit & Data' },
  { name: 'Validation & Reports', path: '/validation', icon: FileSpreadsheet, roles: ['OPERATIONS_MANAGER', 'ANALYST'], group: 'Audit & Data' },
  { name: 'Data Generator', path: '/generator', icon: Database, roles: ['OPERATIONS_MANAGER'], group: 'Audit & Data' },
];

const groupOrder: NavItemConfig['group'][] = ['Overview', 'Operations', 'Programme', 'Audit & Data'];

const roleMeta: Record<UserRole, { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }> = {
  OPERATIONS_MANAGER: { title: 'Operations Manager', subtitle: 'Full ledger audit & batch control', icon: Settings2 },
  STORE_OPERATOR: { title: 'Store Operator', subtitle: 'Order & return processing', icon: Store },
  ANALYST: { title: 'Merchandising Analyst', subtitle: 'Tiers, rules & catalogue strategy', icon: BarChart3 },
  CUSTOMER: { title: 'Customer', subtitle: 'Earned points, history & rewards', icon: Users },
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();

  // Close mobile drawer and reset scroll when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
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

  const currentRole = user ? roleMeta[user.role] : roleMeta.OPERATIONS_MANAGER;
  const RoleIcon = currentRole.icon;
  const visibleNavItems = navItems.filter(item => user && item.roles.includes(user.role));
  const activeItem = visibleNavItems.find(i => i.path === location.pathname);
  const initials = (user?.full_name || 'User')
    .replace(/\(.*\)/, '')
    .trim()
    .split(/\s+/)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const displayName = (user?.full_name || 'User').replace(/\s*\(.*\)\s*/, '');

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg)]">
      {/* Mobile drawer backdrop */}
      <div
        onClick={() => setMobileMenuOpen(false)}
        className={cx(
          'fixed inset-0 z-40 bg-[#0b0a1f]/50 backdrop-blur-sm lg:hidden transition-opacity duration-300',
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Sidebar */}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 w-[264px] flex flex-col shrink-0 overflow-hidden text-slate-300',
          'bg-[#0b0a1f] lg:static lg:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Ambient light */}
        <div className="pointer-events-none absolute -top-24 -left-20 w-72 h-72 rounded-full bg-brand-600/25 blur-3xl animate-drift" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl animate-drift" style={{ animationDelay: '-9s' }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        {/* Brand */}
        <div className="relative h-[68px] flex items-center justify-between px-5 shrink-0">
          <NavLink to={visibleNavItems[0]?.path || '/'} className="group logo-hover">
            <Logo size={38} tone="dark" />
          </NavLink>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 overflow-y-auto px-3 pb-4 pt-2 [&::-webkit-scrollbar-thumb]:bg-white/10">
          {groupOrder.map((group) => {
            const items = visibleNavItems.filter(i => i.group === group);
            if (!items.length) return null;
            return (
              <div key={group} className="mb-5">
                <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{group}</p>
                <div className="space-y-0.5">
                  {items.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end
                        style={{ animationDelay: `${0.04 * idx}s` }}
                        className={({ isActive }) => cx(
                          'group relative flex items-center gap-3 h-10 px-3 rounded-[10px] text-[13.5px] font-medium transition-all duration-300 animate-[slide-in-left_0.5s_var(--ease-out-expo)_both]',
                          isActive
                            ? 'text-white bg-gradient-to-r from-brand-600/90 to-brand-500/60 shadow-[0_8px_24px_-8px_rgba(98,54,236,0.8)]'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.05]',
                        )}
                      >
                        {({ isActive }) => (
                          <>
                            <span className={cx(
                              'absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-white transition-all duration-300',
                              isActive ? 'opacity-100' : 'opacity-0 -translate-x-1',
                            )} />
                            <Icon
                              className={cx('w-[18px] h-[18px] shrink-0 transition-transform duration-300', !isActive && 'group-hover:scale-110')}
                              strokeWidth={isActive ? 2.2 : 1.9}
                            />
                            <span className="truncate">{item.name}</span>
                            {!isActive && (
                              <ChevronRight className="ml-auto w-3.5 h-3.5 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-60 group-hover:translate-x-0" />
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer: user card */}
        <div className="relative p-3 shrink-0 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06]">
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-cyan-400 flex items-center justify-center text-[12px] font-semibold text-white shrink-0">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-white truncate">{displayName}</p>
              <p className="text-[11.5px] text-slate-400 truncate">{currentRole.title}</p>
            </div>
            <button
              onClick={() => logout()}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-2.5 px-1 text-[11px] text-slate-600">Seed 20261022 · v2.0</p>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={cx(
            'h-[68px] shrink-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 transition-all duration-300',
            scrolled
              ? 'bg-white/80 backdrop-blur-xl border-b border-[var(--border)] shadow-[0_1px_0_rgba(16,18,40,0.02)]'
              : 'bg-transparent border-b border-transparent',
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden btn btn-secondary btn-icon"
              aria-label="Open navigation"
            >
              <Menu />
            </button>
            <nav className="hidden sm:flex items-center gap-2 text-[13.5px] min-w-0" aria-label="Breadcrumb">
              <span className="text-[var(--text-3)]">{activeItem?.group || 'Workspace'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span key={activeItem?.path} className="font-semibold text-[var(--text)] truncate animate-[fade-down_0.4s_ease_both]">
                {activeItem?.name || 'Overview'}
              </span>
            </nav>
            <span className="sm:hidden font-semibold text-[var(--text)] truncate">{activeItem?.name}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative hidden md:block group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] pointer-events-none transition-colors group-focus-within:text-brand-600" />
              <input
                type="text"
                placeholder="Search…"
                className="input input-with-icon h-[38px] w-56 lg:w-64 pr-14 transition-[width] duration-500 focus:w-72 lg:focus:w-80"
              />
              <span className="kbd absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">Ctrl K</span>
            </div>

            <button className="btn btn-secondary btn-icon relative" aria-label="Notifications">
              <Bell />
              <span className="absolute top-2 right-2.5 text-rose-500 live-dot" style={{ width: 7, height: 7 }} />
            </button>

            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2.5 h-[38px] pl-1 pr-2.5 rounded-full bg-white border border-[var(--border)] shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)] hover:border-[var(--border-strong)] transition-all cursor-pointer"
                aria-expanded={profileMenuOpen}
              >
                <span className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-[11.5px] font-semibold text-white">
                  {initials}
                </span>
                <span className="hidden md:block text-left leading-tight">
                  <span className="block text-[13px] font-semibold text-[var(--text)] max-w-[140px] truncate">{displayName}</span>
                </span>
                <ChevronDown className={cx('w-4 h-4 text-[var(--text-3)] transition-transform duration-300', profileMenuOpen && 'rotate-180')} />
              </button>

              {profileMenuOpen && (
                <div className="dropdown-panel absolute right-0 mt-2 w-72 p-2 z-50">
                  <div className="p-3 flex items-start gap-3">
                    <span className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-[13px] font-semibold text-white shrink-0">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text)] truncate">{displayName}</p>
                      <p className="text-[12.5px] text-[var(--text-3)] truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="mx-3 mb-2 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-3">
                    <span className="icon-tile icon-tile-sm bg-brand-50 text-brand-600"><RoleIcon className="w-4 h-4" /></span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[var(--text)]">{currentRole.title}</p>
                      <p className="text-[12px] text-[var(--text-3)] truncate">
                        {user?.role === 'CUSTOMER' && user?.customer_id ? `Account ${user.customer_id}` : currentRole.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="divider my-1" />
                  <button
                    onClick={() => { setProfileMenuOpen(false); logout(); }}
                    className="w-full flex items-center gap-2.5 px-3 h-10 rounded-lg text-[13.5px] font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main
          ref={mainRef}
          id="app-main-container"
          onScroll={(e) => setScrolled((e.target as HTMLElement).scrollTop > 4)}
          className="flex-1 overflow-y-auto overflow-x-hidden"
        >
          <div key={location.pathname} className="page-enter mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-8 pt-2 pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
