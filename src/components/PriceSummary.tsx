import { format, parseISO } from 'date-fns';
import { Calculator, ChevronDown } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { AnimatedPanel } from './AnimatedPanel';
import { cn } from '../lib/utils';
import { CalculationResult, GlobalAdjustment, EarlyCheckinLateCheckoutType } from './types';
import { EarlyLateOptions } from './EarlyLateOptions';
import { GoogleReviewsOption } from './GoogleReviewsOption';
import { getPriceBreakdown } from '../lib/priceBreakdown';
import { getPaymentBalance } from '../lib/paymentBalance';

interface PriceSummaryProps {
    calculation: CalculationResult | null;
    comparisonDifference: number;
    comparisonName: string;
    originalRoomName: string;
    paidAmount: number;
    onPaidAmountChange: (amount: number) => void;
    globalAdjustment: GlobalAdjustment;
    onToggleGoogleReviews: (checked: boolean) => void;
    showNightlyDetails: boolean;
    onToggleNightlyDetails: () => void;
    formatCurrency: (amount: number) => string;
    selectedEarlyLateOptions: Set<EarlyCheckinLateCheckoutType>;
    onToggleEarlyLateOption: (type: EarlyCheckinLateCheckoutType) => void;
    checkOut: string;
}

export function PriceSummary({
    calculation,
    comparisonDifference,
    comparisonName,
    originalRoomName,
    paidAmount,
    onPaidAmountChange,
    globalAdjustment,
    onToggleGoogleReviews,
    showNightlyDetails,
    onToggleNightlyDetails,
    formatCurrency,
    selectedEarlyLateOptions,
    onToggleEarlyLateOption,
    checkOut,
}: PriceSummaryProps) {
    const total = (calculation?.finalTotal ?? 0) + comparisonDifference;
    const balance = getPaymentBalance(total, paidAmount);
    const detailLines = calculation ? getPriceBreakdown([{ calculation, options: selectedEarlyLateOptions, checkOut }], globalAdjustment, calculation.vatValue, calculation.finalTotal, false).filter(line => line.kind !== 'total') : [];
    if (comparisonName && comparisonDifference !== 0) detailLines.push({ label: `Chênh lệch: ${comparisonName}`, amount: comparisonDifference, kind: 'adjustment' });
    const formatDetail = (amount: number) => `${amount < 0 ? '− ' : '+ '}${formatCurrency(Math.abs(amount))}`;
    return (
        <section className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-4 sm:p-6 transition-all">
            {calculation ? (
                <>
                    {/* Header - Total */}
                    <div className="flex justify-between items-start mb-4 sm:mb-5">
                        <div>
                            <div className="text-[11px] sm:text-[13px] font-semibold text-slate-500 mb-0.5 sm:mb-1">Tổng tiền thanh toán</div>
                            <div className="text-[22px] sm:text-[28px] font-bold text-slate-900 tracking-tight">
                                {formatCurrency(total)}
                            </div>
                        </div>
                        <div className="bg-slate-100 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-[13px] font-semibold text-slate-600">
                            {calculation.nights.length} đêm
                        </div>
                    </div>

                    {comparisonName && (
                        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-sm text-slate-700 space-y-1">
                            <p><span className="font-semibold">Phòng cũ:</span> {originalRoomName}</p>
                            <p><span className="font-semibold">Phòng muốn đổi:</span> {comparisonName}</p>
                        </div>
                    )}

                    <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <label htmlFor="paid-amount" className="font-medium text-slate-700">Đã thanh toán</label>
                            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                                <input id="paid-amount" type="text" inputMode="numeric" value={paidAmount ? paidAmount.toLocaleString('vi-VN') : ''} onChange={event => onPaidAmountChange(Number(event.target.value.replace(/\D/g, '').slice(0, 15)) || 0)} placeholder="0" className="w-28 min-w-0 text-right font-semibold text-slate-900 outline-none" />
                                <span className="text-slate-500">đ</span>
                            </div>
                        </div>
                        <div className="flex justify-between gap-3 font-semibold text-slate-900"><span>Phải thanh toán thêm</span><span>{formatCurrency(balance.remaining)}</span></div>
                        {balance.excess > 0 && <div className="flex justify-between gap-3 text-emerald-700"><span>Thanh toán dư</span><span className="font-semibold">{formatCurrency(balance.excess)}</span></div>}
                    </div>

                    <div className="mb-4 sm:mb-6 space-y-2 text-sm">
                        <h3 className="font-semibold text-slate-800">Chi tiết thanh toán</h3>
                        {detailLines.map((line, index) => (
                            <div key={index}>
                                <div className="flex justify-between gap-3 text-slate-600">
                                    {line.kind === 'base' ? (
                                        <button type="button" onClick={onToggleNightlyDetails} aria-expanded={showNightlyDetails} className="flex items-center gap-1 text-left hover:text-slate-900">
                                            <span>{line.label}</span><ChevronDown size={14} className={cn('shrink-0 transition-transform', showNightlyDetails && 'rotate-180')} />
                                        </button>
                                    ) : <span>{line.label}</span>}
                                    <span className="shrink-0 font-semibold">{line.kind === 'base' ? formatCurrency(line.amount) : formatDetail(line.amount)}</span>
                                </div>
                                {line.kind === 'base' && (
                        <AnimatePresence>
                            {showNightlyDetails && (
                                <AnimatedPanel
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
                                                            {formatCurrency(night.basePrice)}
                                                        </div>
                                                        {hasAdjustment && (
                                                            <div className="text-[12px] text-slate-500">
                                                                Sau điều chỉnh: {formatCurrency(night.finalPrice)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </AnimatedPanel>
                            )}
                        </AnimatePresence>
                                )}
                            </div>
                        ))}
                        <div className="flex justify-between gap-3 border-t border-slate-200 pt-2 font-bold text-slate-900"><span>Giá cuối cùng</span><span>{formatCurrency(total)}</span></div>
                    </div>

                    <div className="w-full h-px bg-slate-100 mb-4 sm:mb-5"></div>

                    {/* Early / Late Options */}
                    <EarlyLateOptions
                        selectedOptions={selectedEarlyLateOptions}
                        onToggle={onToggleEarlyLateOption}
                        calculation={calculation}
                        formatCurrency={formatCurrency}
                        checkOut={checkOut}
                    />

                    <div className="w-full h-px bg-slate-100 mb-4 sm:mb-5"></div>

                    <GoogleReviewsOption checked={!!globalAdjustment.googleReviews} onChange={onToggleGoogleReviews} />
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
