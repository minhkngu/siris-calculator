import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Check, AlertCircle } from 'lucide-react';
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

export function EarlyLateOptions({ selectedOptions, onToggle, calculation, formatCurrency, checkOut }: EarlyLateOptionsProps) {
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
        <div className="mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4 text-slate-700">
                <div className="flex items-center font-semibold text-[14px] sm:text-[15px]">
                    <Clock className="w-[15px] h-[15px] sm:w-[18px] sm:h-[18px] mr-2 sm:mr-2.5 text-blue-500 shrink-0" />
                    <span>Tùy chọn Check-in / Check-out</span>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
                >
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>
            </div>

            {isExpanded && (
                <div className="space-y-2 sm:space-y-2.5">
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
                                className={cn(
                                    "group flex items-center justify-between p-3.5 border rounded-xl transition-all duration-200",
                                    isLate1800Disabled
                                        ? 'border-slate-200 bg-slate-50/70 opacity-65 cursor-not-allowed select-none'
                                        : isSelected
                                            ? 'border-blue-500 bg-blue-50/40 shadow-sm cursor-pointer'
                                            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/50 hover:shadow-sm cursor-pointer'
                                )}
                                onClick={() => {
                                    if (!isLate1800Disabled) {
                                        onToggle(option.type);
                                    }
                                }}
                            >
                                <div className="flex items-center">
                                    <div className={cn(
                                        "w-5 h-5 rounded-[6px] border flex items-center justify-center mr-3.5 transition-colors duration-200 shrink-0",
                                        isLate1800Disabled
                                            ? 'border-slate-200 bg-slate-100 text-transparent'
                                            : isSelected
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'border-slate-300 bg-white group-hover:border-blue-400'
                                    )}>
                                        <Check className={cn(
                                            "w-3.5 h-3.5 text-white transition-transform duration-200",
                                            isSelected ? 'scale-100' : 'scale-0'
                                        )} strokeWidth={3} />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center flex-wrap gap-1.5">
                                            <span className={cn(
                                                "text-[15px] transition-colors duration-200",
                                                isLate1800Disabled
                                                    ? 'text-slate-400 font-normal line-through decoration-slate-300'
                                                    : isSelected
                                                        ? 'text-slate-900 font-medium'
                                                        : 'text-slate-700'
                                            )}>
                                                {option.label}
                                                {option.type === 'late_1800' && !isLate1800Disabled && (
                                                    <span className="text-slate-400 font-normal text-[13px] ml-[6px]">
                                                        (80% giá đêm sau)
                                                    </span>
                                                )}
                                            </span>
                                            {isLate1800Disabled && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-full shrink-0">
                                                    <AlertCircle size={11} className="shrink-0 text-rose-500" />
                                                    Không áp dụng T6, T7
                                                </span>
                                            )}
                                        </div>
                                        {isLate1800Disabled && (
                                            <span className="text-[12px] text-amber-700/90 font-normal mt-0.5">
                                                Khách sạn không hỗ trợ check-out 18:00 vào Thứ 6 & Thứ 7
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {isLate1800Disabled ? (
                                    <div className="px-2.5 py-1 rounded-md text-[12px] font-semibold bg-slate-100 text-slate-400 border border-slate-200/60 shrink-0 ml-2">
                                        Không hỗ trợ
                                    </div>
                                ) : (
                                    <div className={cn(
                                        "px-2.5 py-1 rounded-md text-[13px] font-semibold transition-colors duration-200 shrink-0 ml-2",
                                        isSelected
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                                    )}>
                                        {option.type === 'checkin_2200' ? '−' : '+'}{displayPrice}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {calculation && calculation.earlyLateTotal !== 0 && (
                        <div className="flex justify-between items-center text-[14px] pt-2">
                            <span className="font-semibold text-slate-700">Điều chỉnh check-in/check-out</span>
                            <span className="font-bold text-blue-600">{calculation.earlyLateTotal > 0 ? '+' : ''}{formatCurrency(calculation.earlyLateTotal)}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}