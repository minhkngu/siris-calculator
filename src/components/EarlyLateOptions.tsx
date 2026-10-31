import { useState } from 'react';
import { ChevronDown, Clock, Check, AlertCircle } from 'lucide-react';
import { parseISO, getDay, isValid, addDays } from 'date-fns';
import { cn } from '../lib/utils';
import { EarlyCheckinLateCheckoutType, EARLY_LATE_OPTIONS, CalculationResult } from './types';

interface EarlyLateOptionsProps {
  selectedOptions: Set<EarlyCheckinLateCheckoutType>;
  onToggle: (type: EarlyCheckinLateCheckoutType) => void;
  calculation: CalculationResult | null;
  formatCurrency: (amount: number) => string;
  checkOut?: string;
}

export function EarlyLateOptions({
  selectedOptions,
  onToggle,
  calculation,
  formatCurrency,
  checkOut,
}: EarlyLateOptionsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  let isWeekendCheckout = false;
  if (checkOut) {
    const co = parseISO(checkOut);
    if (isValid(co)) {
      const day = getDay(co);
      isWeekendCheckout = day === 5 || day === 6;
    }
  } else if (calculation?.nights && calculation.nights.length > 0) {
    const lastNight = calculation.nights[calculation.nights.length - 1];
    const nextDate = addDays(parseISO(lastNight.date), 1);
    const day = getDay(nextDate);
    isWeekendCheckout = day === 5 || day === 6;
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-slate-800">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs font-semibold hover:text-slate-900 transition-colors"
        >
          <Clock size={15} className="text-slate-500" />
          <span>Tùy chọn nhận sớm / trả muộn</span>
          {selectedOptions.size > 0 && (
            <span className="bg-brand-700 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums">
              {selectedOptions.size}
            </span>
          )}
          <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-150", isExpanded && "rotate-180")} />
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 gap-1.5 pt-1">
          {EARLY_LATE_OPTIONS.map((option) => {
            const isLate1800Disabled = option.type === 'late_1800' && isWeekendCheckout;
            const isSelected = !isLate1800Disabled && selectedOptions.has(option.type);

            let displayPrice = '';
            if (option.type === 'checkin_2200') {
              displayPrice = formatCurrency(Math.round((calculation?.nights[0]?.finalPrice || 0) * 20 / 100));
            } else if (option.type === 'early_0800') {
              const basePrice = calculation?.previousNightPrice || 0;
              const value = Math.round(basePrice * (option.percentageRate || 50) / 100);
              displayPrice = formatCurrency(value);
            } else if (option.type === 'late_1800') {
              const basePrice = calculation?.nextNightPrice || 0;
              const value = Math.round(basePrice * (option.percentageRate || 80) / 100);
              displayPrice = formatCurrency(value);
            } else {
              displayPrice = formatCurrency(option.price);
            }

            return (
              <div
                key={option.type}
                role="checkbox"
                aria-checked={isSelected}
                aria-disabled={isLate1800Disabled}
                tabIndex={isLate1800Disabled ? -1 : 0}
                onKeyDown={(event) => {
                  if (event.key === ' ' || event.key === 'Enter') {
                    event.preventDefault();
                    if (!isLate1800Disabled) onToggle(option.type);
                  }
                }}
                onClick={() => {
                  if (!isLate1800Disabled) onToggle(option.type);
                }}
                className={cn(
                  "flex items-center justify-between gap-3 px-3 py-2 rounded-lg border text-left transition-all select-none",
                  isLate1800Disabled
                    ? "bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                    : isSelected
                      ? "bg-brand-700 border-brand-700 text-white cursor-pointer shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={cn(
                      "w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors",
                      isLate1800Disabled
                        ? "border-slate-300 bg-slate-100"
                        : isSelected
                          ? "bg-white border-white text-slate-900"
                          : "border-slate-300 bg-white"
                    )}
                  >
                    {isSelected && <Check size={11} strokeWidth={3} />}
                  </div>
                  <div className="min-w-0">
                    <div className={cn("text-xs font-semibold leading-tight", isSelected ? "text-white" : "text-slate-900")}>
                      {option.label}
                    </div>
                    {isLate1800Disabled ? (
                      <div className="flex items-center gap-1 text-[11px] text-rose-600 font-medium mt-0.5">
                        <AlertCircle size={10} />
                        <span>Không áp dụng T6, T7</span>
                      </div>
                    ) : option.type === 'late_1800' ? (
                      <div className={cn("text-[11px] mt-0.5", isSelected ? "text-slate-300" : "text-slate-400")}>
                        80% giá đêm sau
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={cn(
                      "text-xs font-bold tabular-nums",
                      isLate1800Disabled
                        ? "text-slate-400"
                        : isSelected
                          ? "text-white"
                          : option.type === 'checkin_2200'
                            ? "text-emerald-700"
                            : "text-slate-900"
                    )}
                  >
                    {isLate1800Disabled ? '—' : `${option.type === 'checkin_2200' ? '−' : '+'}${displayPrice}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
