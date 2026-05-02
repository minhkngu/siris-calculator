import { format, parseISO } from 'date-fns';
import { Calculator, Tag, Percent, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { CalculationResult, GlobalAdjustment } from './types';

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
}: PriceSummaryProps) {
    return (
        <section className="bg-white rounded-3xl shadow-xl border border-zinc-200 overflow-hidden">
            <div className="p-8 bg-indigo-600 text-white">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1">Tổng tiền thanh toán</h2>
                        <div className="text-4xl font-black tracking-tight text-white">
                            {calculation ? formatCurrency(calculation.finalTotal) : '---'}
                        </div>
                    </div>
                    {calculation && (
                        <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase backdrop-blur-sm">
                            {calculation.nights.length} đêm
                        </div>
                    )}
                </div>

                {calculation && (
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
                        <div>
                            <div className="text-[10px] text-indigo-100 uppercase font-bold mb-1">Đặt cọc (50%)</div>
                            <div className="text-xl font-bold text-white">{formatCurrency(calculation.deposit)}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-indigo-100 uppercase font-bold mb-1">Còn lại</div>
                            <div className="text-xl font-bold text-indigo-100">{formatCurrency(calculation.finalTotal - calculation.deposit)}</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 space-y-4">
                {calculation ? (
                    <>
                        <div className="space-y-3">
                            <button
                                onClick={onToggleNightlyDetails}
                                className="w-full flex justify-between items-center text-sm group"
                            >
                                <span className="text-zinc-500 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                                    Giá gốc ({calculation.nights.length} đêm)
                                    <ChevronDown size={14} className={cn("transition-transform", showNightlyDetails && "rotate-180")} />
                                </span>
                                <span className="font-bold text-zinc-900">{formatCurrency(calculation.totalBase)}</span>
                            </button>

                            <AnimatePresence>
                                {showNightlyDetails && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="bg-zinc-50 rounded-xl p-3 space-y-2 border border-zinc-100">
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
                                                                : "text-zinc-500"
                                                        )}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className={cn(
                                                                "text-[10px] font-bold",
                                                                hasAdjustment ? "text-zinc-900" : "text-zinc-500"
                                                            )}>
                                                                {format(parseISO(night.date), 'dd/MM')} ({night.isWeekend ? 'T6-T7' : 'CN-T5'})
                                                            </span>
                                                            {hasAdjustment && (
                                                                <div className="flex gap-1 mt-0.5">
                                                                    {night.adjustments.map((adj, aIdx) => (
                                                                        <span key={aIdx} className={cn(
                                                                            "text-[8px] px-1 rounded uppercase font-black",
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
                                                                "text-[10px] font-black",
                                                                hasAdjustment ? "text-zinc-900" : "text-zinc-500"
                                                            )}>
                                                                {formatCurrency(night.finalPrice)}
                                                            </div>
                                                            {night.vatPerNight > 0 && (
                                                                <div className="text-[8px] text-zinc-500">
                                                                    VAT: {formatCurrency(night.vatPerNight)}
                                                                </div>
                                                            )}
                                                            {hasAdjustment && (
                                                                <div className="text-[8px] text-zinc-400 line-through">
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

                            {globalAdjustment.amount !== 0 && (
                                <div className={cn(
                                    "flex justify-between text-sm p-3 rounded-xl",
                                    globalAdjustment.type === 'surcharge' ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                                )}>
                                    <span className="flex items-center gap-2">
                                        <Tag size={14} />
                                        <span>{globalAdjustment.type === 'surcharge' ? 'Phụ thu' : 'Giảm giá'} {globalAdjustment.isPercentage ? `${globalAdjustment.amount}%` : ''}</span>
                                    </span>
                                    <span className="font-bold">
                                        {globalAdjustment.type === 'surcharge' ? '+' : '-'} {formatCurrency(calculation.globalAdjustmentValue)}
                                    </span>
                                </div>
                            )}

                            {calculation.stayDiscount && (
                                <div className="flex justify-between text-sm p-3 rounded-xl bg-indigo-50 text-indigo-700">
                                    <span className="flex items-center gap-2">
                                        <Percent size={14} />
                                        <span>{calculation.stayDiscount.name}</span>
                                    </span>
                                    <span className="font-bold">
                                        - {formatCurrency(calculation.stayDiscountValue)}
                                    </span>
                                </div>
                            )}

                            <div className="pt-4 border-t border-zinc-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={includeVAT}
                                            onChange={(e) => onToggleVAT(e.target.checked)}
                                            className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        Bao gồm VAT
                                    </label>
                                    {includeVAT && (
                                        <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1">
                                            <input
                                                type="number"
                                                value={vatRate === 0 ? '' : vatRate}
                                                onChange={(e) => onVatRateChange(e.target.value === '' ? 0 : Number(e.target.value))}
                                                className="w-10 text-right text-sm bg-transparent outline-none font-bold text-indigo-600"
                                                placeholder="10"
                                            />
                                            <span className="text-sm text-zinc-500 font-bold">%</span>
                                        </div>
                                    )}
                                </div>
                                {includeVAT && (
                                    <div className="flex justify-between text-sm text-zinc-600">
                                        <span>Thuế VAT ({vatRate}%)</span>
                                        <span className="font-bold">{formatCurrency(calculation.vatValue)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <Calculator size={40} className="mx-auto text-zinc-200 mb-3" />
                        <p className="text-sm text-zinc-400">Vui lòng chọn đầy đủ thông tin để xem báo giá</p>
                    </div>
                )}
            </div>
        </section>
    );
}