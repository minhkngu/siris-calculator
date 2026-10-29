import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Check, Copy } from 'lucide-react';
import type { CalculationResult, EarlyCheckinLateCheckoutType, GlobalAdjustment } from './types';
import { getPriceBreakdown } from '../lib/priceBreakdown';
import { getPaymentBalance } from '../lib/paymentBalance';

interface BookingSummaryProps {
    calculation: CalculationResult | null;
    comparisonDifference: number;
    comparisonName: string;
    paidAmount: number;
    globalAdjustment: GlobalAdjustment;
    selectedEarlyLateOptions: Set<EarlyCheckinLateCheckoutType>;
    checkIn: string;
    checkOut: string;
    branchName: string;
    roomName: string;
    formatCurrency: (amount: number) => string;
}

export function BookingSummary({ calculation, comparisonDifference, comparisonName, paidAmount, globalAdjustment, selectedEarlyLateOptions, checkIn, checkOut, branchName, roomName, formatCurrency }: BookingSummaryProps) {
    const [copiedText, setCopiedText] = useState('');
    const [copyError, setCopyError] = useState('');
    if (!calculation || !branchName || !roomName) return null;
    const lines = getPriceBreakdown([{ calculation, options: selectedEarlyLateOptions, checkOut }], globalAdjustment, calculation.vatValue, calculation.finalTotal, false).filter(line => line.kind !== 'total');
    if (comparisonName && comparisonDifference !== 0) lines.push({ label: `Chênh lệch: ${comparisonName}`, amount: comparisonDifference, kind: 'adjustment' });
    const balance = getPaymentBalance(calculation.finalTotal + comparisonDifference, paidAmount);
    const quote = [
        `${comparisonName ? `Phòng cũ: ${branchName} · ${roomName} → Phòng muốn đổi: ${comparisonName}` : `${branchName} · ${roomName}`} · ${format(parseISO(checkIn), 'dd/MM/yyyy')} → ${format(parseISO(checkOut), 'dd/MM/yyyy')} · ${calculation.nights.length} đêm`,
        ...lines.map(line => `${line.kind === 'base' ? 'Giá phòng' : line.label}: ${line.kind === 'base' ? formatCurrency(line.amount) : `${line.amount < 0 ? '− ' : '+ '}${formatCurrency(Math.abs(line.amount))}`}`),
        `Tổng: ${formatCurrency(calculation.finalTotal + comparisonDifference)}`,
        ...(paidAmount > 0 ? [`Đã thanh toán: ${formatCurrency(paidAmount)}`, `Phải thanh toán thêm: ${formatCurrency(balance.remaining)}`] : []),
        ...(balance.excess > 0 ? [`Thanh toán dư: ${formatCurrency(balance.excess)}`] : []),
    ].join('\n');

    const handleCopy = async () => {
        setCopyError('');
        try {
            await navigator.clipboard.writeText(quote);
            setCopiedText(quote);
        } catch {
            setCopyError('Không thể sao chép tự động. Bạn có thể chọn nội dung bên dưới để sao chép.');
        }
    };

    return (
        <section className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-6">
            <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="single-room-quote" className="text-sm font-semibold text-slate-700">Tổng hợp đặt phòng</label>
                <button type="button" onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-indigo-500">
                    {copiedText === quote ? <Check size={14} /> : <Copy size={14} />}
                    <span aria-live="polite">{copiedText === quote ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
            </div>
            <textarea id="single-room-quote" readOnly value={quote} rows={Math.min(Math.max(quote.split('\n').length, 4), 12)} className="w-full min-w-0 resize-y rounded-lg border border-indigo-100 bg-white px-3 py-2 text-[13px] leading-5 text-slate-700 focus:outline-indigo-500" />
            {copyError && <p role="alert" className="mt-2 text-xs text-rose-600">{copyError}</p>}
        </section>
    );
}
