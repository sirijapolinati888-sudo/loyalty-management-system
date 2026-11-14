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
      {/* 3D Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f9f8fe 100%)',
          boxShadow: isOpen
            ? '0 0 0 2px #6e2fef, 0 8px 18px -4px rgba(110, 47, 239, 0.25), inset 0 1px 1px #fff'
            : '0 4px 12px -2px rgba(99, 85, 246, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.04), inset 0 1.5px 1px #ffffff, inset 0 -1px 2px rgba(99, 85, 246, 0.06)',
        }}
        className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-full border border-slate-200/90 text-xs font-black text-slate-800 hover:border-[#6e2fef]/50 cursor-pointer transition-all duration-200"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 truncate">
          {Icon && (
            <div className="w-4 h-4 rounded-full bg-[#ede5fd] text-[#6e2fef] flex items-center justify-center shrink-0">
              <Icon className="w-2.5 h-2.5 stroke-[2.5]" />
            </div>
          )}
          <span className="truncate text-slate-800">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#6e2fef]' : ''
          }`}
        />
      </button>

      {/* Floating 3D Bulged Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #faf8ff 100%)',
            boxShadow:
              '0 18px 38px -8px rgba(99, 85, 246, 0.22), 0 8px 16px -4px rgba(0, 0, 0, 0.06), inset 0 1.5px 1.5px #ffffff, 0 0 0 1px rgba(110, 47, 239, 0.15)',
          }}
          className="absolute right-0 mt-2 min-w-full w-max max-w-[320px] max-h-64 overflow-y-auto rounded-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, #ede5fd 0%, #dfd1fa 100%)'
                    : 'transparent',
                  boxShadow: isSelected
                    ? '0 2px 6px rgba(110, 47, 239, 0.15), inset 0 1px 1px #ffffff'
                    : 'none',
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 group gap-3 ${
                  isSelected
                    ? 'text-[#410cce] font-black'
                    : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-900'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="whitespace-nowrap">{option.label}</span>
                  {option.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                        option.badgeColor || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {option.badge}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#6e2fef] stroke-[2.8] shrink-0 ml-1.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
