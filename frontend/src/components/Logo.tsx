import React, { useId } from 'react';

/**
 * YottaFlex.ai brand mark: a "Y" whose arms converge like debits and credits
 * and whose stem is a stack of ledger entries, with a reward spark.
 * Kept in sync with public/logo.svg (used for the favicon).
 */
export const LogoMark: React.FC<{ size?: number; className?: string; title?: string }> = ({
  size = 36,
  className,
  title = 'Loyalty Points Management System',
}) => {
  // Unique gradient ids so several marks can render on one page
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" role="img" aria-label={title} className={className}>
      <defs>
        <linearGradient id={`${id}-tile`} x1="6" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8f6bff" />
          <stop offset="0.55" stopColor="#6236ec" />
          <stop offset="1" stopColor="#3b1fa8" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="32" y1="0" x2="32" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id}-tile)`} />
      <rect width="64" height="64" rx="16" fill={`url(#${id}-shine)`} />
      <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="15.25" stroke="#fff" strokeOpacity="0.14" strokeWidth="1.5" />
      <path d="M20.5 17 L32 30 L43.5 17" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="28.5" y="33.5" width="7" height="5" rx="2.5" fill="#fff" />
      <rect x="28.5" y="40.5" width="7" height="5" rx="2.5" fill="#fff" fillOpacity="0.78" />
      <rect x="28.5" y="47.5" width="7" height="5" rx="2.5" fill="#fff" fillOpacity="0.55" />
      <path
        className="logo-spark"
        d="M51 8 C51.4 10.6 52.4 11.6 55 12 C52.4 12.4 51.4 13.4 51 16 C50.6 13.4 49.6 12.4 47 12 C49.6 11.6 50.6 10.6 51 8 Z"
        fill="#67e8f9"
      />
    </svg>
  );
};

/** Mark plus "Loyalty Points Management / Auditable Ledger System" wordmark. */
export const Logo: React.FC<{ size?: number; tone?: 'light' | 'dark'; className?: string }> = ({
  size = 36,
  tone = 'dark',
  className,
}) => (
  <span className={`inline-flex items-center gap-3 ${className ?? ''}`}>
    <LogoMark size={size} />
    <span className="leading-tight">
      <span className={`block text-[14px] font-bold tracking-tight ${tone === 'dark' ? 'text-white' : 'text-[var(--text)]'}`}>
        Loyalty Points <span className={tone === 'dark' ? 'text-cyan-300' : 'text-brand-600'}>Management</span>
      </span>
      <span className={`block text-[11.5px] font-medium ${tone === 'dark' ? 'text-slate-400' : 'text-[var(--text-3)]'}`}>Auditable Ledger System</span>
    </span>
  </span>
);
