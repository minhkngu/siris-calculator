import { useState } from 'react';
import { Tag, Check, Copy, CheckCheck, Hotel, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { GlobalAdjustment, MultiRoomTotalSummary } from './types';
import { format, parseISO } from 'date-fns';
import { GoogleReviewsOption } from './GoogleReviewsOption';
import { getEarlyLateDetails } from '../lib/earlyLateDetails';

interface MultiRoomSummaryProps {
    summary: MultiRoomTotalSummary;
    globalAdjustment: GlobalAdjustment;
    onToggleGoogleReviews: (checked: boolean) => void;
    includeVAT: boolean;
    vatRate: number;
    onToggleIncludeRoom?: (index: number) => void;
    formatCurrency: (amount: number) => string;
}

export function MultiRoomSummary({
    summary,
    globalAdjustment,
    onToggleGoogleReviews,
    includeVAT,
    vatRate,
    onToggleIncludeRoom,
    formatCurrency,
}: MultiRoomSummaryProps) {
    const [copied, setCopied] = useState(false);
    const [copiedSummary, setCopiedSummary] = useState(false);
    const [copySummaryError, setCopySummaryError] = useState('');

    const includedItems = summary.items.filter(it => it.item.isIncluded !== false);
    const earlyLateDetails = summary.items.flatMap((item, index) => item.item.isIncluded !== false && item.calculation
        ? getEarlyLateDetails(item.calculation, item.item.earlyLateOptions, item.item.checkOut).map(line => ({ ...line, label: `Phòng ${index + 1} · ${line.label}` })) : []);
    const formatDetail = (amount: number) => `${amount < 0 ? '− ' : '+ '}${formatCurrency(Math.abs(amount))}`;
    const roomSummaryLines = includedItems.map(item => {
        const branchName = item.branch?.name || '';
        const roomName = item.room?.name || 'Phòng';
        const checkInStr = item.item.checkIn ? format(parseISO(item.item.checkIn), 'dd/MM/yyyy') : '';
        const checkOutStr = item.item.checkOut ? format(parseISO(item.item.checkOut), 'dd/MM/yyyy') : '';
        const total = item.calculation?.finalTotal || 0;

        return `${branchName} | ${roomName} | Check-in: ${checkInStr} | Check-out: ${checkOutStr} | Tổng giá phòng: ${formatCurrency(total)}`;
    });
    const roomSummary = roomSummaryLines.length > 0
        ? [...roomSummaryLines, ...earlyLateDetails.map(line => `${line.label}: ${formatDetail(line.amount)}`), `Tổng giá tất cả phòng: ${formatCurrency(summary.finalTotal)}`].join('\n')
        : '';

    const handleCopySummary = async () => {
        setCopySummaryError('');
        try {
            await navigator.clipboard.writeText(roomSummary);
            setCopiedSummary(true);
            setTimeout(() => setCopiedSummary(false), 2000);
        } catch {
            setCopySummaryError('Không thể sao chép tự động. Bạn có thể chọn nội dung bên dưới để sao chép.');
        }
    };

    const handleCopyQuote = () => {
        let text = `📋 BÁO GIÁ ĐẶT PHÒNG SIRIS RESIDENCES\n`;
        text += `Số lượng: ${summary.totalRooms} phòng (${summary.totalNights} đêm tổng cộng)\n\n`;

        includedItems.forEach(item => {
            const roomName = item.room?.name || 'Phòng';
            const branchName = item.branch?.name || '';
            const checkInStr = item.item.checkIn ? format(parseISO(item.item.checkIn), 'dd/MM/yyyy') : '';
            const checkOutStr = item.item.checkOut ? format(parseISO(item.item.checkOut), 'dd/MM/yyyy') : '';
            const total = item.calculation?.finalTotal || 0;

            text += `${branchName} | ${roomName} | Check-in: ${checkInStr} | Check-out: ${checkOutStr} | Tổng giá phòng: ${formatCurrency(total)}\n\n`;
        });

        text += `💰 TỔNG CỘNG:\n`;
        text += `• Tổng tiền phòng gốc: ${formatCurrency(summary.totalBase)}\n`;
        if (summary.totalStayDiscounts > 0) {
            text += `• Giảm giá lưu trú dài ngày: -${formatCurrency(summary.totalStayDiscounts)}\n`;
        }
        for (const line of earlyLateDetails) text += `• ${line.label}: ${formatDetail(line.amount)}\n`;
        if (globalAdjustment.amount > 0) {
            text += `• ${globalAdjustment.type === 'surcharge' ? 'Phụ thu' : 'Giảm giá'}: ${globalAdjustment.type === 'surcharge' ? '+' : '-'}${formatCurrency(summary.globalAdjustmentValue)}\n`;
        }
        if (globalAdjustment.googleReviews) text += `• Google Maps Reviews: -${formatCurrency(summary.googleReviewsDiscount)}\n`;
        if (includeVAT) {
            text += `• Thuế VAT (${vatRate}%): +${formatCurrency(summary.vatValue)}\n`;
        }
        text += `➡️ TỔNG THANH TOÁN: ${formatCurrency(summary.finalTotal)}`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section className="bg-white rounded-xl sm:rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-3.5 sm:p-6 transition-all">
            {/* Header Total */}
            <div className="flex justify-between items-start mb-3 sm:mb-5">
                <div>
                    <div className="text-[11px] sm:text-[13px] font-semibold text-slate-500 mb-0.5 sm:mb-1">
                        Tổng thanh toán ({summary.totalRooms} phòng đã chọn)
                    </div>
                    <div className="text-xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
                        {formatCurrency(summary.finalTotal)}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="bg-indigo-50 text-indigo-700 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold">
                        {summary.totalNights} đêm tổng cộng
                    </span>
                </div>
            </div>

            {roomSummary && (
                <div className="mb-3 sm:mb-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <label htmlFor="multi-room-summary" className="text-xs font-semibold text-slate-700">
                            Tổng hợp đặt phòng
                        </label>
                        <button
                            type="button"
                            onClick={handleCopySummary}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-indigo-500"
                        >
                            {copiedSummary ? <Check size={14} /> : <Copy size={14} />}
                            <span aria-live="polite">{copiedSummary ? 'Đã sao chép' : 'Sao chép'}</span>
                        </button>
                    </div>
                    <textarea
                        id="multi-room-summary"
                        readOnly
                        value={roomSummary}
                        rows={Math.min(Math.max(includedItems.length + 1, 2), 6)}
                        onFocus={event => event.currentTarget.select()}
                        className="w-full resize-none rounded-lg border border-indigo-100 bg-white px-3 py-2 text-xs leading-5 text-slate-700 focus:outline-indigo-500"
                    />
                    {copySummaryError && <p role="alert" className="mt-2 text-xs text-rose-600">{copySummaryError}</p>}
                </div>
            )}

            {/* Room Breakdown List */}
            <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                    <span>Chi tiết từng phòng</span>
                    <span className="text-[10px] sm:text-[11px] font-normal normal-case text-slate-500">Tick để tính tiền</span>
                </div>
                {summary.items.map((it, idx) => {
                    const isIncluded = it.item.isIncluded !== false;
                    return (
                        <div
                            key={idx}
                            className={cn(
                                "flex items-center justify-between p-2 sm:p-2.5 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs transition-all",
                                isIncluded
                                    ? "bg-slate-50 border-slate-100"
                                    : "bg-slate-50/40 border-slate-100 opacity-60"
                            )}
                        >
                            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                                {onToggleIncludeRoom && (
                                    <button
                                        type="button"
                                        onClick={() => onToggleIncludeRoom(idx)}
                                        title={isIncluded ? "Bỏ chọn không tính phòng này" : "Chọn tính phòng này"}
                                        className={cn(
                                            "w-3.5 h-3.5 sm:w-4 sm:h-4 rounded flex items-center justify-center transition-all cursor-pointer shrink-0",
                                            isIncluded
                                                ? "bg-indigo-600 border border-indigo-600 text-white"
                                                : "border border-slate-300 bg-white"
                                        )}
                                    >
                                        {isIncluded && <span className="text-[8px] sm:text-[10px] font-black">✓</span>}
                                    </button>
                                )}
                                <span className={cn(
                                    "w-4 h-4 sm:w-5 sm:h-5 rounded sm:rounded-md font-bold flex items-center justify-center text-[9px] sm:text-[10px] shrink-0",
                                    isIncluded ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500"
                                )}>
                                    {idx + 1}
                                </span>
                                <div className="min-w-0">
                                    <div className={cn(
                                        "font-bold flex items-center gap-1 truncate",
                                        isIncluded ? "text-slate-800" : "text-slate-400 line-through"
                                    )}>
                                        <Hotel size={11} className={cn("shrink-0", isIncluded ? "text-indigo-500" : "text-slate-400")} />
                                        <span className="truncate">{it.room?.name || 'Chưa chọn phòng'}</span>
                                    </div>
                                    <div className="text-[9px] sm:text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                        <Calendar size={9} className="shrink-0" />
                                        <span>{it.item.checkIn ? format(parseISO(it.item.checkIn), 'dd/MM') : ''} - {it.item.checkOut ? format(parseISO(it.item.checkOut), 'dd/MM') : ''}</span>
                                        <span>({it.calculation?.nights.length || 0}đ)</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right shrink-0 ml-1">
                                <span className={cn(
                                    "font-bold text-xs sm:text-sm",
                                    isIncluded ? "text-slate-900" : "text-slate-400 line-through"
                                )}>
                                    {formatCurrency(it.calculation?.finalTotal || 0)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="w-full h-px bg-slate-100 mb-3 sm:mb-4"></div>

            {/* Summary Lines */}
            <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-slate-600 text-[11px] sm:text-sm">
                    <span>Tổng tiền gốc</span>
                    <span className="font-bold text-slate-900">{formatCurrency(summary.totalBase)}</span>
                </div>

                {summary.totalStayDiscounts > 0 && (
                    <div className="flex justify-between items-center text-indigo-700 bg-indigo-50/50 p-1.5 sm:p-2 rounded-lg border border-indigo-100 text-[11px] sm:text-sm">
                        <span>Giảm giá lưu trú</span>
                        <span className="font-bold">- {formatCurrency(summary.totalStayDiscounts)}</span>
                    </div>
                )}

                {earlyLateDetails.map((line, index) => (
                    <div key={index} className="flex justify-between gap-2 items-center text-blue-700 bg-blue-50/50 p-1.5 sm:p-2 rounded-lg border border-blue-100 text-[11px] sm:text-sm">
                        <span>{line.label}</span><span className="font-bold shrink-0">{formatDetail(line.amount)}</span>
                    </div>
                ))}

                {globalAdjustment.amount !== 0 && (
                    <div className={cn(
                        "flex justify-between items-center p-2 sm:p-2.5 rounded-lg sm:rounded-xl border text-[11px] sm:text-sm",
                        globalAdjustment.type === 'surcharge' ? "bg-rose-50/50 border-rose-100 text-rose-700" : "bg-emerald-50/50 border-emerald-100 text-emerald-700"
                    )}>
                        <div className="flex items-center gap-1.5">
                            <Tag size={12} />
                            <span>{globalAdjustment.type === 'surcharge' ? 'Phụ thu tổng' : 'Giảm giá tổng'} {globalAdjustment.isPercentage ? `(${globalAdjustment.amount}%)` : ''}</span>
                        </div>
                        <span className="font-bold">
                            {globalAdjustment.type === 'surcharge' ? '+' : '-'} {formatCurrency(summary.globalAdjustmentValue)}
                        </span>
                    </div>
                )}
            </div>

            {/* VAT Section */}
            <div className="space-y-2 sm:space-y-3 pt-2.5 sm:pt-3 border-t border-slate-100 mb-4 sm:mb-5">
                <GoogleReviewsOption checked={!!globalAdjustment.googleReviews} onChange={onToggleGoogleReviews} />
                {includeVAT && (
                    <div className="flex justify-between items-center ">
                        <span className="text-[11px] sm:text-sm text-slate-500 font-medium">Thuế VAT ({vatRate}%)</span>
                        <span className="font-bold text-[11px] sm:text-sm text-slate-900">{formatCurrency(summary.vatValue)}</span>
                    </div>
                )}
            </div>

            {/* Copy Quote Button */}
            <button
                type="button"
                onClick={handleCopyQuote}
                className={cn(
                    "w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-sm",
                    copied
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-900 hover:bg-slate-800 text-white hover:shadow-md active:scale-[0.99]"
                )}
            >
                {copied ? (
                    <>
                        <CheckCheck size={15} />
                        Đã sao chép báo giá!
                    </>
                ) : (
                    <>
                        <Copy size={15} />
                        Sao chép bảng báo giá chi tiết
                    </>
                )}
            </button>
        </section>
    );
}
