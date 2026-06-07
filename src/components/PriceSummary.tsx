import { format, parseISO } from 'date-fns';
import { Calculator, Tag, Percent, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { CalculationResult, GlobalAdjustment, EarlyCheckinLateCheckoutType } from './types';
import { EarlyLateOptions } from './EarlyLateOptions';

interface PriceSummaryProps {
    calculation: CalculationResult | null;
    globalAdjustment: GlobalAdjustment;
    includeVAT: boolean;
    vatRate: number;
    showNightlyDetails: boolean;
    onToggleNightlyDetails: () => void;
    onToggleVAT: (checked: boolean) => void;
    onVatRateChange: (rate: number) => void;
    formatCurrency: (amount: number) => string;
    selectedEarlyLateOptions: Set<EarlyCheckinLateCheckoutType>;
    onToggleEarlyLateOption: (type: EarlyCheckinLateCheckoutType) => void;
}

export function PriceSummary({
    calculation,
    globalAdjustment,
    includeVAT,
    vatRate,
    showNightlyDetails,
    onToggleNightlyDetails,
    onToggleVAT,
    onVatRateChange,
    formatCurrency,
    selectedEarlyLateOptions,
    onToggleEarlyLateOption,
}: PriceSummaryProps) {
    return (
        <section className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-4 sm:p-6 transition-all">
            {calculation ? (
                <>
                    {/* Header - Total */}
                    <div className="flex justify-between items-start mb-4 sm:mb-5">
                        <div>
                            <div className="text-[11px] sm:text-[13px] font-semibold text-slate-500 mb-0.5 sm:mb-1">Tổng tiền thanh toán</div>
                            <div className="text-[22px] sm:text-[28px] font-bold text-slate-900 tracking-tight">
                                {formatCurrency(calculation.finalTotal)}
                            </div>
                        </div>
                        <div className="bg-slate-100 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-[13px] font-semibold text-slate-600">
                            {calculation.nights.length} đêm
                        </div>
                    </div>

                    {/* Deposit & Remaining */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                        <div>
                            <div className="text-[11px] sm:text-[13px] font-medium text-slate-500">Đặt cọc (50%)</div>
                            <div className="text-[15px] sm:text-[18px] font-bold text-slate-900">{formatCurrency(calculation.deposit)}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[11px] sm:text-[13px] font-medium text-slate-500">Còn lại</div>
                            <div className="text-[15px] sm:text-[18px] font-bold text-slate-600">{formatCurrency(calculation.finalTotal - calculation.deposit)}</div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-100 mb-4 sm:mb-5"></div>

                    {/* Base Price */}
                    <div className="mb-4 sm:mb-5">
                        <div
                            onClick={onToggleNightlyDetails}
                            className="flex justify-between items-center cursor-pointer hover:text-slate-700 transition-colors"
                        >
                            <div className="flex items-center text-slate-500">
                                <span className="text-[14px] sm:text-[15px] font-medium">Giá gốc ({calculation.nights.length} đêm)</span>
                                <ChevronDown size={14} className={cn(
                                    "ml-1 opacity-70 transition-transform sm:ml-1.5",
                                    showNightlyDetails && "rotate-180"
                                )} />
                            </div>
                            <div className="font-bold text-[14px] sm:text-[16px] text-slate-900">{formatCurrency(calculation.totalBase)}</div>
                        </div>

                        <AnimatePresence>
                            {showNightlyDetails && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 border border-slate-100 mt-3">
                                        {calculation.nights.map((night, idx) => {
                                            const hasAdjustment = night.adjustments.length > 0;
                                            const isSurcharge = night.adjustments.some(a => a.type === 'surcharge');

                                            return (
                                                <div
                                                    key={idx}
                                                    className={cn(
                                                        "flex justify-between items-center p-2 rounded-lg transition-all",
                                                        hasAdjustment
                                                            ? isSurcharge
                                                                ? "bg-rose-50/50 border border-rose-100"
                                                                : "bg-emerald-50/50 border border-emerald-100"
                                                            : "text-slate-500"
                                                    )}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className={cn(
                                                            "text-[14px] font-medium",
                                                            hasAdjustment ? "text-slate-900" : "text-slate-500"
                                                        )}>
                                                            {format(parseISO(night.date), 'dd/MM')} ({night.isWeekend ? 'T6-T7' : 'CN-T5'})
                                                        </span>
                                                        {hasAdjustment && (
                                                            <div className="flex gap-1 mt-0.5">
                                                                {night.adjustments.map((adj, aIdx) => (
                                                                    <span key={aIdx} className={cn(
                                                                        "text-[11px] px-1.5 rounded uppercase font-semibold",
                                                                        adj.type === 'surcharge' ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                                                                    )}>
                                                                        {adj.note || (adj.type === 'surcharge' ? 'Phụ thu' : 'Giảm giá')}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={cn(
                                                            "text-[14px] font-bold",
                                                            hasAdjustment ? "text-slate-900" : "text-slate-500"
                                                        )}>
                                                            {formatCurrency(night.finalPrice)}
                                                        </div>
                                                        {night.vatPerNight > 0 && (
                                                            <div className="text-[12px] text-slate-400">
                                                                VAT: {formatCurrency(night.vatPerNight)}
                                                            </div>
                                                        )}
                                                        {hasAdjustment && (
                                                            <div className="text-[12px] text-slate-400 line-through">
                                                                {formatCurrency(night.basePrice)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="w-full h-px bg-slate-100 mb-4 sm:mb-5"></div>

                    {/* Stay Discount */}
                    {calculation.stayDiscount && (
                        <div className="flex justify-between items-center mb-4 sm:mb-5 p-3 sm:p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                            <div className="flex items-center gap-2 sm:gap-2.5">
                                <Percent size={14} className="text-indigo-500 shrink-0" />
                                <span className="text-[14px] sm:text-[15px] font-medium text-indigo-700">{calculation.stayDiscount.name}</span>
                            </div>
                            <span className="font-bold text-[14px] sm:text-[15px] text-indigo-700 whitespace-nowrap">- {formatCurrency(calculation.stayDiscountValue)}</span>
                        </div>
                    )}

                    {/* Early / Late Options */}
                    <EarlyLateOptions
                        selectedOptions={selectedEarlyLateOptions}
                        onToggle={onToggleEarlyLateOption}
                        calculation={calculation}
                        formatCurrency={formatCurrency}
                    />

                    <div className="w-full h-px bg-slate-100 mb-4 sm:mb-5"></div>

                    {/* Global Adjustment */}
                    {globalAdjustment.amount !== 0 && (
                        <div className={cn(
                            "flex justify-between items-center mb-3 sm:mb-4 p-3 sm:p-3.5 rounded-xl",
                            globalAdjustment.type === 'surcharge' ? "bg-rose-50/50 border border-rose-100" : "bg-emerald-50/50 border border-emerald-100"
                        )}>
                            <div className="flex items-center gap-2 sm:gap-2.5">
                                <Tag size={14} className={globalAdjustment.type === 'surcharge' ? "text-rose-500 shrink-0" : "text-emerald-500 shrink-0"} />
                                <span className="text-[14px] sm:text-[15px] font-medium text-slate-700">
                                    {globalAdjustment.type === 'surcharge' ? 'Phụ thu' : 'Giảm giá'} {globalAdjustment.isPercentage ? `${globalAdjustment.amount}%` : ''}
                                </span>
                            </div>
                            <span className={cn(
                                "font-bold text-[14px] sm:text-[15px] whitespace-nowrap",
                                globalAdjustment.type === 'surcharge' ? "text-rose-600" : "text-emerald-600"
                            )}>
                                {globalAdjustment.type === 'surcharge' ? '+' : '-'} {formatCurrency(calculation.globalAdjustmentValue)}
                            </span>
                        </div>
                    )}

                    {/* VAT Section */}
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="flex items-center cursor-pointer group">
                                <div
                                    className={cn(
                                        "w-5 h-5 rounded-[6px] border flex items-center justify-center mr-3.5 transition-colors duration-200",
                                        includeVAT
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'border-slate-300 bg-white group-hover:border-blue-400'
                                    )}
                                    onClick={(e) => { e.preventDefault(); onToggleVAT(!includeVAT); }}
                                >
                                    <Check className={cn(
                                        "w-3.5 h-3.5 text-white transition-transform duration-200",
                                        includeVAT ? 'scale-100' : 'scale-0'
                                    )} strokeWidth={3} />
                                </div>
                                <span
                                    className={cn(
                                        "text-[15px] transition-colors duration-200",
                                        includeVAT ? 'text-slate-900 font-medium' : 'text-slate-700'
                                    )}
                                    onClick={() => onToggleVAT(!includeVAT)}
                                >
                                    Bao gồm VAT
                                </span>
                            </label>
                            {includeVAT && (
                                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden w-[68px] sm:w-[76px] h-[30px] sm:h-[34px] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
                                    <input
                                        type="text"
                                        value={vatRate === 0 ? '' : vatRate}
                                        onChange={(e) => onVatRateChange(e.target.value === '' ? 0 : Number(e.target.value))}
                                        className="w-full h-full text-center text-blue-600 font-bold text-[13px] sm:text-[15px] focus:outline-none bg-transparent"
                                    />
                                    <span className="bg-slate-50 text-slate-500 px-2 sm:px-2.5 h-full flex items-center border-l border-slate-200 text-[12px] sm:text-[14px] font-medium">
                                        %
                                    </span>
                                </div>
                            )}
                        </div>

                        {includeVAT && (
                            <div className="flex justify-between items-center pl-[30px] sm:pl-[34px] transition-opacity duration-200 opacity-100">
                                <span className="text-[13px] sm:text-[14px] text-slate-500 font-medium">Thuế VAT ({vatRate}%)</span>
                                <span className="font-bold text-[14px] sm:text-[16px] text-slate-900">{formatCurrency(calculation.vatValue)}</span>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="text-center py-8 sm:py-10">
                    <Calculator size={32} className="mx-auto text-slate-200 mb-2 sm:mb-3" />
                    <p className="text-[14px] sm:text-[15px] text-slate-400 font-medium">Vui lòng chọn đầy đủ thông tin để xem báo giá</p>
                </div>
            )}
        </section>
    );
}