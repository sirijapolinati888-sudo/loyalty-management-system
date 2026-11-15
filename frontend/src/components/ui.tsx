import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, RefreshCw, Search, TrendingUp, X } from 'lucide-react';

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>;

/* ==========================================================================
   Tones: one palette shared by icon tiles, badges and stat cards
   ========================================================================== */
export type Tone =
  | 'brand' | 'blue' | 'emerald' | 'amber' | 'rose' | 'violet'
  | 'cyan' | 'teal' | 'pink' | 'slate' | 'orange';

export const toneStyles: Record<Tone, { tile: string; badge: string; text: string; hex: string; glow: string }> = {
  brand:   { tile: 'bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100',      badge: 'bg-brand-50 text-brand-700 border-brand-100',       text: 'text-brand-600',   hex: '#6236ec', glow: '#7352f7' },
  blue:    { tile: 'bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100',         badge: 'bg-blue-50 text-blue-700 border-blue-100',          text: 'text-blue-600',    hex: '#2563eb', glow: '#3b82f6' },
  emerald: { tile: 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', text: 'text-emerald-600', hex: '#059669', glow: '#10b981' },
  amber:   { tile: 'bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100',      badge: 'bg-amber-50 text-amber-700 border-amber-100',       text: 'text-amber-600',   hex: '#d97706', glow: '#f59e0b' },
  rose:    { tile: 'bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100',         badge: 'bg-rose-50 text-rose-700 border-rose-100',          text: 'text-rose-600',    hex: '#e11d48', glow: '#f43f5e' },
  violet:  { tile: 'bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-100',   badge: 'bg-violet-50 text-violet-700 border-violet-100',    text: 'text-violet-600',  hex: '#7c3aed', glow: '#8b5cf6' },
  cyan:    { tile: 'bg-cyan-50 text-cyan-600 ring-1 ring-inset ring-cyan-100',         badge: 'bg-cyan-50 text-cyan-700 border-cyan-100',          text: 'text-cyan-600',    hex: '#0891b2', glow: '#06b6d4' },
  teal:    { tile: 'bg-teal-50 text-teal-600 ring-1 ring-inset ring-teal-100',         badge: 'bg-teal-50 text-teal-700 border-teal-100',          text: 'text-teal-600',    hex: '#0d9488', glow: '#14b8a6' },
  pink:    { tile: 'bg-pink-50 text-pink-600 ring-1 ring-inset ring-pink-100',         badge: 'bg-pink-50 text-pink-700 border-pink-100',          text: 'text-pink-600',    hex: '#db2777', glow: '#ec4899' },
  orange:  { tile: 'bg-orange-50 text-orange-600 ring-1 ring-inset ring-orange-100',   badge: 'bg-orange-50 text-orange-700 border-orange-100',    text: 'text-orange-600',  hex: '#ea580c', glow: '#f97316' },
  slate:   { tile: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',     badge: 'bg-slate-100 text-slate-700 border-slate-200',      text: 'text-slate-600',   hex: '#475569', glow: '#64748b' },
};

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');

/** Title-cases SNAKE_CASE / kebab-case enum values for display. */
export const humanize = (value: string | null | undefined) =>
  String(value ?? '')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** Maps common status strings to a badge tone. */
export const statusTone = (status: string | null | undefined): Tone => {
  const s = String(status ?? '').toUpperCase();
  if (/(ACTIVE|POSTED|COMPLETED|SUCCESS|FULFILLED|DELIVERED|RECONCILED|PASS|APPROVED|LOW)/.test(s)) return 'emerald';
  if (/(PENDING|PROCESSING|PARTIAL|MEDIUM|WARN|OPEN|SCHEDULED)/.test(s)) return 'amber';
  if (/(FAIL|REJECT|CANCEL|ERROR|SUSPEND|INACTIVE|CRITICAL|HIGH|BLOCKED|CLOSED|EXPIRED|MISMATCH)/.test(s)) return 'rose';
  if (/(RETURN|REVERS|REFUND)/.test(s)) return 'cyan';
  return 'slate';
};

/* ==========================================================================
   Primitives
   ========================================================================== */
export const IconTile: React.FC<{ icon: IconType; tone?: Tone; size?: 'sm' | 'md'; className?: string }> = ({
  icon: Icon, tone = 'brand', size = 'md', className,
}) => (
  <span className={cx('icon-tile', size === 'sm' && 'icon-tile-sm', toneStyles[tone].tile, className)}>
    <Icon className={size === 'sm' ? 'w-4 h-4' : 'w-[18px] h-[18px]'} strokeWidth={2} />
  </span>
);

export const Badge: React.FC<{ tone?: Tone; dot?: boolean; children: React.ReactNode; className?: string }> = ({
  tone = 'slate', dot, children, className,
}) => (
  <span className={cx('badge', toneStyles[tone].badge, className)}>
    {dot && <span className="badge-dot" />}
    {children}
  </span>
);

export const StatusBadge: React.FC<{ status: string | null | undefined; className?: string }> = ({ status, className }) => (
  <Badge tone={statusTone(status)} dot className={className}>{humanize(status) || '—'}</Badge>
);

/** Counts up from 0 to `value` with an ease-out curve. */
export const AnimatedNumber: React.FC<{
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}> = ({ value, decimals = 0, prefix = '', suffix = '', duration = 1100 }) => {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const target = Number.isFinite(value) ? value : 0;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setDisplay(target); return; }
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setDisplay(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span className="tabular">
      {prefix}
      {display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
};

/** Tracks the pointer so `.spotlight` cards can render a moving highlight. */
const trackPointer = (e: React.MouseEvent<HTMLElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
};

/* ==========================================================================
   Layout blocks
   ========================================================================== */
export const PageHeader: React.FC<{
  icon?: IconType;
  title: string;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ icon: Icon, title, description, badge, actions }) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6 animate-fade-up">
    <div className="flex items-start gap-4 min-w-0">
      {Icon && (
        <span className="hidden sm:inline-flex w-12 h-12 shrink-0 items-center justify-center rounded-2xl text-white bg-gradient-to-br from-brand-500 to-brand-700 shadow-[var(--shadow-brand)]">
          <Icon className="w-[22px] h-[22px]" strokeWidth={2} />
        </span>
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-[22px] sm:text-2xl font-bold text-[var(--text)] leading-tight">{title}</h1>
          {badge}
        </div>
        {description && <p className="mt-1.5 text-sm text-[var(--text-3)] max-w-2xl leading-relaxed">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
  </div>
);

export const Card: React.FC<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: IconType;
  tone?: Tone;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  hover?: boolean;
  flush?: boolean;
}> = ({ title, subtitle, icon, tone = 'brand', actions, children, className, bodyClassName, hover, flush }) => (
  <section className={cx('card', hover && 'card-hover', className)}>
    {(title || actions) && (
      <div className={cx('card-header', flush && 'pb-4 border-b border-[var(--border)]')}>
        <div className="flex items-start gap-3 min-w-0">
          {icon && <IconTile icon={icon} tone={tone} size="sm" />}
          <div className="min-w-0">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    )}
    <div className={cx(flush ? '' : 'card-body', bodyClassName)}>{children}</div>
  </section>
);

export const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: IconType;
  tone?: Tone;
  hint?: React.ReactNode;
  trend?: string | null;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  onClick?: () => void;
  compact?: boolean;
}> = ({ label, value, icon, tone = 'brand', hint, trend, decimals, suffix, prefix, onClick, compact }) => {
  const t = toneStyles[tone];
  return (
    <div
      onClick={onClick}
      onMouseMove={trackPointer}
      style={{ ['--glow-from' as string]: t.glow, ['--glow-to' as string]: '#22d3ee' }}
      className={cx(
        'card card-hover glow-border spotlight group overflow-hidden',
        compact ? 'p-4' : 'p-5',
        onClick && 'card-interactive',
      )}
    >
      <div className="relative z-[1] flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[var(--text-3)] truncate">{label}</p>
          <p className={cx('mt-2 font-bold text-[var(--text)] leading-none tracking-tight', compact ? 'text-[22px]' : 'text-[26px]')}>
            {typeof value === 'number'
              ? <AnimatedNumber value={value} decimals={decimals} suffix={suffix} prefix={prefix} />
              : value}
          </p>
        </div>
        <IconTile icon={icon} tone={tone} size={compact ? 'sm' : 'md'} />
      </div>
      {(hint || trend) && (
        <div className="relative z-[1] mt-3.5 flex items-center gap-2 text-[12.5px]">
          {trend && (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" /> {trend}
            </span>
          )}
          {hint && <span className="text-[var(--text-3)] truncate">{hint}</span>}
        </div>
      )}
      <span
        className="absolute -right-8 -bottom-10 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 pointer-events-none"
        style={{ background: `${t.glow}22` }}
      />
    </div>
  );
};

/* ==========================================================================
   States
   ========================================================================== */
export const LoadingState: React.FC<{ label?: string; rows?: number }> = ({ label = 'Loading…', rows = 3 }) => (
  <div className="space-y-6 animate-fade-in" aria-busy="true" aria-label={label}>
    <div className="flex items-center gap-4">
      <div className="skeleton w-12 h-12 rounded-2xl" />
      <div className="space-y-2.5">
        <div className="skeleton h-5 w-56" />
        <div className="skeleton h-3.5 w-80 max-w-[60vw]" />
      </div>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <div className="skeleton h-3.5 w-24" />
          <div className="skeleton h-7 w-20" />
          <div className="skeleton h-3 w-32" />
        </div>
      ))}
    </div>
    <div className="card p-5 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-10 w-full" />
      ))}
    </div>
    <p className="flex items-center gap-2.5 text-sm text-[var(--text-3)]"><span className="spinner" /> {label}</p>
  </div>
);

export const InlineLoader: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-sm text-[var(--text-3)]">
    <span className="spinner" /> {label}
  </div>
);

export const ErrorState: React.FC<{ title?: string; message?: string | null; onRetry?: () => void }> = ({
  title = 'Something went wrong', message, onRetry,
}) => (
  <div className="card max-w-md mx-auto mt-16 p-8 text-center animate-scale-in">
    <span className="icon-tile mx-auto bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100">
      <AlertTriangle className="w-5 h-5" />
    </span>
    <h3 className="mt-4 text-base font-semibold text-[var(--text)]">{title}</h3>
    {message && <p className="mt-1.5 text-sm text-[var(--text-3)]">{message}</p>}
    {onRetry && (
      <button onClick={onRetry} className="btn btn-primary mt-5">
        <RefreshCw /> Try again
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{ icon?: IconType; title: string; description?: React.ReactNode; action?: React.ReactNode }> = ({
  icon: Icon = Inbox, title, description, action,
}) => (
  <div className="flex flex-col items-center justify-center text-center py-14 px-6 animate-fade-in">
    <span className="icon-tile bg-slate-100 text-slate-500 animate-float" style={{ animationDuration: '4s' }}>
      <Icon className="w-5 h-5" />
    </span>
    <p className="mt-4 text-sm font-semibold text-[var(--text)]">{title}</p>
    {description && <p className="mt-1 text-sm text-[var(--text-3)] max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

/* ==========================================================================
   Pagination
   ========================================================================== */
export const Pagination: React.FC<{
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  noun?: string;
}> = ({ page, pageSize, total, onChange, noun = 'results' }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (page <= 4) {
    pages.push(1, 2, 3, 4, 5, '…', totalPages);
  } else if (page >= totalPages - 3) {
    pages.push(1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, '…', page - 1, page, page + 1, '…', totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-[var(--border)]">
      <p className="text-[13px] text-[var(--text-3)]">
        Showing <span className="font-medium text-[var(--text)] tabular">{start}–{end}</span> of{' '}
        <span className="font-medium text-[var(--text)] tabular">{total.toLocaleString()}</span> {noun}
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onChange(Math.max(1, page - 1))}
          className="btn btn-ghost btn-sm btn-icon"
          aria-label="Previous page"
        >
          <ChevronLeft />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="w-8 text-center text-[var(--text-3)] select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={cx(
                'h-8 min-w-8 px-2 rounded-lg text-[13px] font-medium tabular transition-all duration-200 cursor-pointer',
                p === page
                  ? 'bg-brand-600 text-white shadow-[0_4px_12px_-4px_rgba(98,54,236,0.7)]'
                  : 'text-[var(--text-2)] hover:bg-slate-100',
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          className="btn btn-ghost btn-sm btn-icon"
          aria-label="Next page"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
};

/* ==========================================================================
   Modal
   ========================================================================== */
export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: IconType;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ open, onClose, title, subtitle, icon, tone = 'brand', size = 'md', footer, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);

    // Lock scrolling on document.body AND main app container while modal is open
    const prevBodyOverflow = document.body.style.overflow;
    const mainEl = document.getElementById('app-main-container');
    const prevMainOverflow = mainEl ? mainEl.style.overflowY : '';

    document.body.style.overflow = 'hidden';
    if (mainEl) mainEl.style.overflowY = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevBodyOverflow;
      if (mainEl) mainEl.style.overflowY = prevMainOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];

  return createPortal(
    <div
      className="modal-backdrop fixed inset-0 z-40 lg:left-[264px] flex items-center justify-center p-4 sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cx('modal-panel my-auto flex flex-col', width)} role="dialog" aria-modal="true">
        {(title || subtitle) && (
          <div className="shrink-0 flex items-start justify-between gap-4 px-6 py-5 bg-white/95 backdrop-blur border-b border-[var(--border)]">
            <div className="flex items-start gap-3.5 min-w-0">
              {icon && <IconTile icon={icon} tone={tone} />}
              <div className="min-w-0">
                {title && <h3 className="text-[17px] font-semibold text-[var(--text)] leading-snug">{title}</h3>}
                {subtitle && <div className="mt-0.5 text-[13px] text-[var(--text-3)]">{subtitle}</div>}
              </div>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-icon -mr-2 shrink-0" aria-label="Close">
              <X className="transition-transform duration-300 hover:rotate-90" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="shrink-0 flex flex-wrap items-center justify-end gap-2.5 px-6 py-4 bg-[var(--surface-2)] border-t border-[var(--border)]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

/* ==========================================================================
   Search / toolbar
   ========================================================================== */
export const SearchInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = 'Search…', className }) => (
  <div className={cx('relative group', className)}>
    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] pointer-events-none transition-colors group-focus-within:text-brand-600" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input input-with-icon h-[38px] pr-9"
    />
    {value && (
      <button
        onClick={() => onChange('')}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-3)] hover:bg-slate-100 hover:text-[var(--text)] cursor-pointer animate-scale-in"
        aria-label="Clear search"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

/* ==========================================================================
   Charts
   ========================================================================== */
export const CHART_AXIS = { fontSize: 12, fill: '#7c829a' };

export const ChartTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  label?: React.ReactNode;
  formatLabel?: (label: any) => React.ReactNode;
  formatName?: (name: string, entry: any) => React.ReactNode;
  formatValue?: (value: any, entry: any) => React.ReactNode;
}> = ({ active, payload, label, formatLabel, formatName, formatValue }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="dropdown-panel px-3.5 py-2.5 text-[12.5px] min-w-[160px]" style={{ animationDuration: '0.15s' }}>
      {label !== undefined && label !== '' && (
        <p className="font-semibold text-[var(--text)] mb-1.5">{formatLabel ? formatLabel(label) : label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-[var(--text-3)]">
              <span className="w-2 h-2 rounded-full" style={{ background: entry.color || entry.payload?.fill || entry.fill }} />
              {formatName ? formatName(entry.name, entry) : entry.name}
            </span>
            <span className="font-semibold text-[var(--text)] tabular">
              {formatValue ? formatValue(entry.value, entry) : Number(entry.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Legend: React.FC<{ items: { label: string; color: string }[] }> = ({ items }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-[var(--text-3)]">
    {items.map((i) => (
      <span key={i.label} className="inline-flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: i.color }} />
        {i.label}
      </span>
    ))}
  </div>
);
