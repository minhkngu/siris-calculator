import { useId, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Check, Copy } from 'lucide-react';
import type { CalculationResult, EarlyCheckinLateCheckoutType, GlobalAdjustment } from './types';
import { getPriceBreakdown } from '../lib/priceBreakdown';
import { getPaymentBalance } from '../lib/paymentBalance';
import { cn } from '../lib/utils';

interface BookingSummaryProps {
  calculation: CalculationResult | null;
  comparisonCalculation: CalculationResult | null;
  comparisonDifference: number;
  comparisonVatDifference: number;
  comparisonName: string;
  comparisonBranchName: string;
  comparisonRoomName: string;
  paidAmount: number;
  globalAdjustment: GlobalAdjustment;
  selectedEarlyLateOptions: Set<EarlyCheckinLateCheckoutType>;
  checkIn: string;
  checkOut: string;
  branchName: string;
  roomName: string;
  formatCurrency: (amount: number) => string;
}

export function BookingSummary({
  calculation,
  comparisonCalculation,
  comparisonDifference,
  comparisonVatDifference,
  comparisonName,
  comparisonBranchName,
  comparisonRoomName,
  paidAmount,
  globalAdjustment,
  selectedEarlyLateOptions,
  checkIn,
  checkOut,
  branchName,
  roomName,
  formatCurrency,
}: BookingSummaryProps) {
  const quoteId = useId();
  const [copiedText, setCopiedText] = useState('');
  const [copyError, setCopyError] = useState('');

  if (!calculation || !branchName || !roomName) return null;

  const lines = getPriceBreakdown(
    [{ calculation, options: selectedEarlyLateOptions, checkOut }],
    globalAdjustment,
    calculation.vatValue + comparisonVatDifference,
    calculation.finalTotal,
    false
  ).filter((line) => line.kind !== 'total');

  const baseLine = lines.find((line) => line.kind === 'base');
  const adjustments = lines.filter((line) => line.kind !== 'base');

  if (comparisonName && comparisonDifference !== 0) {
    adjustments.unshift({
      label: 'Chênh lệch',
      amount: comparisonDifference - comparisonVatDifference,
      kind: 'adjustment',
    });
  }

  const balance = getPaymentBalance(calculation.finalTotal + comparisonDifference, paidAmount);

  const quote = [
    ...(comparisonName ? [
      `Phòng cũ: ${branchName} | ${roomName} | ${format(parseISO(checkIn), 'dd/MM/yyyy')} → ${format(parseISO(checkOut), 'dd/MM/yyyy')} | ${formatCurrency(baseLine?.amount ?? 0)}`,
      `Phòng đổi: ${comparisonBranchName} | ${comparisonRoomName} | ${format(parseISO(checkIn), 'dd/MM/yyyy')} → ${format(parseISO(checkOut), 'dd/MM/yyyy')} | ${formatCurrency(comparisonCalculation?.nights.reduce((sum, night) => sum + night.basePrice, 0) ?? 0)}`,
    ] : [`Phòng: ${branchName} | ${roomName} | ${format(parseISO(checkIn), 'dd/MM/yyyy')} → ${format(parseISO(checkOut), 'dd/MM/yyyy')} | ${formatCurrency(baseLine?.amount ?? 0)}`]),
    ...adjustments.map((line) => `${line.label}: ${line.amount < 0 ? '− ' : '+ '}${formatCurrency(Math.abs(line.amount))}`),
    `Tổng: ${formatCurrency(calculation.finalTotal + comparisonDifference)}`,
    ...(paidAmount > 0
      ? [`Đã thanh toán: ${formatCurrency(paidAmount)}`, `Phải thanh toán thêm: ${formatCurrency(balance.remaining)}`]
      : []),
    ...(balance.excess > 0 ? [`Thanh toán dư: ${formatCurrency(balance.excess)}`] : []),
  ].join('\n');

  const handleCopy = async () => {
    setCopyError('');
    try {
      await navigator.clipboard.writeText(quote);
      setCopiedText(quote);
      setTimeout(() => setCopiedText(''), 2500);
    } catch {
      setCopyError('Không thể sao chép tự động. Bạn có thể chọn nội dung bên dưới để sao chép.');
    }
  };

  const isCopied = copiedText === quote;

  return (
    <section className="bg-slate-50/70 sm:bg-white rounded-xl border border-slate-200 p-3 sm:p-5 sm:shadow-sm space-y-2 sm:space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label htmlFor={quoteId} className="text-xs font-semibold text-slate-900 block">
            Báo giá nhanh
          </label>
          <span className="hidden sm:block text-[11px] text-slate-500">Soạn sẵn để gửi khách qua tin nhắn</span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer",
            isCopied
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-slate-900 text-white hover:bg-slate-800"
          )}
        >
          {isCopied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />}
          <span aria-live="polite">{isCopied ? 'Đã sao chép' : 'Sao chép'}</span>
        </button>
      </div>

      <textarea
        id={quoteId}
        readOnly
        value={quote}
        rows={Math.min(Math.max(quote.split('\n').length, 3), 9)}
        className="w-full min-w-0 resize-y rounded-lg border border-slate-200 bg-white sm:bg-slate-50/70 p-2.5 text-xs leading-relaxed text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
      />
      {copyError && <p role="alert" className="text-xs text-rose-600 font-medium">{copyError}</p>}
    </section>
  );
}
