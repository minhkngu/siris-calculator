import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { EarlyCheckinLateCheckoutType, EARLY_LATE_OPTIONS, CalculationResult } from './types';

interface EarlyLateOptionsProps {
    selectedOptions: Set<EarlyCheckinLateCheckoutType>;
    onToggle: (type: EarlyCheckinLateCheckoutType) => void;
    calculation: CalculationResult | null;
    formatCurrency: (amount: number) => string;
}

export function EarlyLateOptions({ selectedOptions, onToggle, calculation, formatCurrency }: EarlyLateOptionsProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4 text-slate-700">
                <div className="flex items-center font-semibold text-[14px] sm:text-[15px]">
                    <Clock className="w-[15px] h-[15px] sm:w-[18px] sm:h-[18px] mr-2 sm:mr-2.5 text-blue-500 shrink-0" />
                    <span>Check-in sớm / Check-out trễ</span>
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
                        const isSelected = selectedOptions.has(option.type);

                        let displayPrice = '';
                        if (option.type === 'early_0800') {
                            const basePrice = calculation?.previousNightPrice || 0;
                            const value = Math.round(basePrice * (option.percentageRate || 50) / 100);
                            displayPrice = formatCurrency(value);
                        } else if (option.type === 'late_1800') {
                            const lastNight = calculation?.nights?.[calculation.nights.length - 1];
                            const basePrice = lastNight?.basePrice || 0;
                            const value = Math.round(basePrice * (option.percentageRate || 80) / 100);
                            displayPrice = formatCurrency(value);
                        } else {
                            displayPrice = formatCurrency(option.price);
                        }

                        return (
                            <div
                                key={option.type}
                                className={cn(
                                    "group flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all duration-200",
                                    isSelected
                                        ? 'border-blue-500 bg-blue-50/40 shadow-sm'
                                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/50 hover:shadow-sm'
                                )}
                                onClick={() => onToggle(option.type)}
                            >
                                <div className="flex items-center">
                                    <div className={cn(
                                        "w-5 h-5 rounded-[6px] border flex items-center justify-center mr-3.5 transition-colors duration-200",
                                        isSelected
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'border-slate-300 bg-white group-hover:border-blue-400'
                                    )}>
                                        <Check className={cn(
                                            "w-3.5 h-3.5 text-white transition-transform duration-200",
                                            isSelected ? 'scale-100' : 'scale-0'
                                        )} strokeWidth={3} />
                                    </div>
                                    <span className={cn(
                                        "text-[15px] transition-colors duration-200",
                                        isSelected ? 'text-slate-900 font-medium' : 'text-slate-700'
                                    )}>
                                        {option.label}
                                        {option.type === 'late_1800' && (
                                            <span className="text-slate-400 font-normal text-[13px] ml-[6px]">
                                                (80% giá đêm cuối)
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className={cn(
                                    "px-2.5 py-1 rounded-md text-[13px] font-semibold transition-colors duration-200",
                                    isSelected
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                                )}>
                                    +{displayPrice}
                                </div>
                            </div>
                        );
                    })}

                    {calculation && calculation.earlyLateTotal > 0 && (
                        <div className="flex justify-between items-center text-[14px] pt-2">
                            <span className="font-semibold text-slate-700">Tổng phí check-in/check-out</span>
                            <span className="font-bold text-blue-600">+{formatCurrency(calculation.earlyLateTotal)}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}