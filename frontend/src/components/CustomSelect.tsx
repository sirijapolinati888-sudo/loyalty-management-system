import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  badgeColor?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  icon?: React.ComponentType<{ className?: string }>;
  placeholder?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  icon: Icon,
  placeholder = 'Select option',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative inline-block text-left select-none ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[38px] flex items-center justify-between gap-2 pl-3 pr-2.5 rounded-[10px] bg-white border text-[13.5px] font-medium text-[var(--text)] cursor-pointer transition-all duration-200 shadow-[var(--shadow-xs)] ${
          isOpen ? 'border-brand-500 shadow-[var(--ring)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon className="w-4 h-4 text-[var(--text-3)] shrink-0" />}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-3)] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-600' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="dropdown-panel absolute right-0 mt-2 min-w-full w-max max-w-[320px] max-h-72 overflow-y-auto p-1.5 z-50"
        >
          {options.map((option, i) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={{ animation: `fade-up 0.3s var(--ease-out-expo) ${i * 0.02}s both` }}
                className={`flex items-center justify-between gap-3 px-3 h-9 rounded-lg text-[13.5px] cursor-pointer transition-colors duration-150 ${
                  isSelected
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-[var(--text-2)] hover:bg-slate-50 hover:text-[var(--text)]'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <span className="flex items-center gap-2 whitespace-nowrap">
                  {option.label}
                  {option.badge && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${option.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                      {option.badge}
                    </span>
                  )}
                </span>
                {isSelected && <Check className="w-4 h-4 text-brand-600 shrink-0" strokeWidth={2.5} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
