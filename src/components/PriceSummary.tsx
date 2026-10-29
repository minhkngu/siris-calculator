import type { ReactNode } from 'react';
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
  comparisonVatDifference: number;
  mobileBookingSummary: ReactNode;
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
  comparisonVatDifference,
  mobileBookingSummary,
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
  const detailLines = calculation
    ? getPriceBreakdown(
        [{ calculation, options: selectedEarlyLateOptions, checkOut }],
        globalAdjustment,
        calculation.vatValue + comparisonVatDifference,
        calculation.finalTotal,
        false
      ).filter((line) => line.kind !== 'total')
    : [];

  if (comparisonName && comparisonDifference !== 0) {
    detailLines.splice(detailLines.findIndex(line => line.label === 'Thuế VAT') < 0 ? detailLines.length : detailLines.findIndex(line => line.label === 'Thuế VAT'), 0, {
      label: `Chênh lệch đổi sang ${comparisonName}`,
      amount: comparisonDifference - comparisonVatDifference,
      kind: 'adjustment',
    });
  }

  const formatDetail = (amount: number) =>
    `${amount < 0 ? '− ' : '+ '}${formatCurrency(Math.abs(amount))}`;

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
      {calculation ? (
        <>
          {/* Header - Total Price Statement */}
          <div className="pb-3 border-b border-slate-100 flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-medium text-slate-500">Tổng thanh toán</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums mt-0.5">
                {formatCurrency(total)}
              </div>
            </div>
            <div className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold tabular-nums">
              {calculation.nights.length} đêm
            </div>
          </div>

          {/* Room comparison notification if active */}
          {comparisonName && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700 space-y-0.5">
              <p>
                <span className="font-semibold text-slate-900">Phòng ban đầu:</span> {originalRoomName}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Phòng đổi:</span> {comparisonName}
              </p>
            </div>
          )}

          {/* Paid & Remaining Balance Desk */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1 text-xs">
            <div className="flex min-h-10 items-center justify-between gap-3">
              <label htmlFor="paid-amount" className="font-medium text-slate-600">
                Đã thanh toán
              </label>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2.5 py-1 focus-within:border-slate-900">
                <input
                  id="paid-amount"
                  type="text"
                  inputMode="numeric"
                  value={paidAmount ? paidAmount.toLocaleString('vi-VN') : ''}
                  onChange={(e) =>
                    onPaidAmountChange(
                      Number(e.target.value.replace(/\D/g, '').slice(0, 15)) || 0
                    )
                  }
                  placeholder="0"
                  className="w-24 text-right font-semibold text-slate-900 outline-none tabular-nums"
                />
              </div>
            </div>

            <div className="flex min-h-10 items-center justify-between gap-3 border-t border-slate-200/60 font-semibold text-slate-900">
              <span>Còn lại cần thu</span>
              <span className="pr-2.5 text-sm font-bold tabular-nums">
                {formatCurrency(balance.remaining)}
              </span>
            </div>

            {balance.excess > 0 && (
              <div className="flex items-center justify-between text-emerald-700 font-medium pt-0.5">
                <span>Khách thanh toán dư</span>
                <span className="font-bold tabular-nums">+{formatCurrency(balance.excess)}</span>
              </div>
            )}
          </div>

          {/* Breakdown items */}
          <div className="space-y-1.5 text-xs">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Chi tiết các khoản
            </div>

            {detailLines.map((line, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-slate-700 py-0.5">
                  {line.kind === 'base' ? (
                    <button
                      type="button"
                      onClick={onToggleNightlyDetails}
                      aria-expanded={showNightlyDetails}
                      className="flex items-center gap-1 font-medium hover:text-slate-900 transition-colors"
                    >
                      <span>{line.label}</span>
                      <ChevronDown
                        size={13}
                        className={cn(
                          'text-slate-400 transition-transform duration-150',
                          showNightlyDetails && 'rotate-180 text-slate-700'
                        )}
                      />
                    </button>
                  ) : (
                    <span className="font-medium text-slate-600">{line.label}</span>
                  )}
                  <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                    {line.kind === 'base' ? formatCurrency(line.amount) : formatDetail(line.amount)}
                  </span>
                </div>

                {/* Nightly breakdown accordion */}
                {line.kind === 'base' && (
                  <AnimatePresence>
                    {showNightlyDetails && (
                      <AnimatedPanel
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-slate-50 rounded-lg p-2.5 my-1 space-y-1 border border-slate-200/80">
                          {calculation.nights.map((night, idx) => {
                            const hasAdjustment = night.adjustments.length > 0;
                            const isSurcharge = night.adjustments.some((a) => a.type === 'surcharge');

                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "flex items-center justify-between p-1.5 rounded text-xs",
                                  hasAdjustment
                                    ? isSurcharge
                                      ? "bg-amber-50/80 text-amber-950"
                                      : "bg-emerald-50/80 text-emerald-950"
                                    : "text-slate-600 hover:bg-slate-100/60"
                                )}
                              >
                                <div>
                                  <span className="font-medium">
                                    {format(parseISO(night.date), 'dd/MM')}
                                  </span>{' '}
                                  <span className="text-[11px] text-slate-400">
                                    ({night.isWeekend ? 'Cuối tuần' : 'Ngày thường'})
                                  </span>
                                  {hasAdjustment && (
                                    <div className="flex gap-1 mt-0.5">
                                      {night.adjustments.map((adj, aIdx) => (
                                        <span
                                          key={aIdx}
                                          className={cn(
                                            "text-[10px] px-1.5 py-0.2 rounded font-medium",
                                            adj.type === 'surcharge'
                                              ? "bg-amber-100 text-amber-900"
                                              : "bg-emerald-100 text-emerald-900"
                                          )}
                                        >
                                          {adj.note || (adj.type === 'surcharge' ? 'Phụ thu' : 'Giảm')}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right tabular-nums">
                                  <div className="font-semibold text-slate-900">
                                    {formatCurrency(night.finalPrice)}
                                  </div>
                                  {hasAdjustment && (
                                    <div className="text-[10px] text-slate-400 line-through">
                                      {formatCurrency(night.basePrice)}
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
          </div>

          <div className="lg:hidden">{mobileBookingSummary}</div>
          <div className="pt-2 border-t border-slate-100">
            {/* Early / Late options */}
            <EarlyLateOptions
              selectedOptions={selectedEarlyLateOptions}
              onToggle={onToggleEarlyLateOption}
              calculation={calculation}
              formatCurrency={formatCurrency}
              checkOut={checkOut}
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            {/* Google Reviews Promo */}
            <GoogleReviewsOption
              checked={!!globalAdjustment.googleReviews}
              onChange={onToggleGoogleReviews}
            />
          </div>
        </>
      ) : (
        <div className="text-center py-10">
          <Calculator size={28} className="mx-auto text-slate-300 mb-2" />
          <p className="text-xs text-slate-400">Vui lòng chọn thông tin để xem báo giá chi tiết</p>
        </div>
      )}
    </section>
  );
}
