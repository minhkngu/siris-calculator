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

  const includedItems = summary.items.filter((it) => it.item.isIncluded !== false);
  const earlyLateDetails = summary.items.flatMap((item, index) =>
    item.item.isIncluded !== false && item.calculation
      ? getEarlyLateDetails(item.calculation, item.item.earlyLateOptions, item.item.checkOut).map((line) => ({
          ...line,
          label: `Phòng ${index + 1} · ${line.label}`,
        }))
      : []
  );
  const formatDetail = (amount: number) =>
    `${amount < 0 ? '− ' : '+ '}${formatCurrency(Math.abs(amount))}`;

  const roomSummaryLines = includedItems.map((item) => {
    const branchName = item.branch?.name || '';
    const roomName = item.room?.name || 'Phòng';
    const checkInStr = item.item.checkIn ? format(parseISO(item.item.checkIn), 'dd/MM/yyyy') : '';
    const checkOutStr = item.item.checkOut ? format(parseISO(item.item.checkOut), 'dd/MM/yyyy') : '';
    const total = item.calculation?.finalTotal || 0;

    return `${branchName} | ${roomName} | Check-in: ${checkInStr} | Check-out: ${checkOutStr} | Tổng giá phòng: ${formatCurrency(total)}`;
  });

  const roomSummary =
    roomSummaryLines.length > 0
      ? [
          ...roomSummaryLines,
          ...earlyLateDetails.map((line) => `${line.label}: ${formatDetail(line.amount)}`),
          `Tổng giá tất cả phòng: ${formatCurrency(summary.finalTotal)}`,
        ].join('\n')
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
    let text = `BÁO GIÁ ĐẶT PHÒNG SIRIS RESIDENCES\n`;
    text += `Số lượng: ${summary.totalRooms} phòng (${summary.totalNights} đêm tổng cộng)\n\n`;

    includedItems.forEach((item) => {
      const roomName = item.room?.name || 'Phòng';
      const branchName = item.branch?.name || '';
      const checkInStr = item.item.checkIn ? format(parseISO(item.item.checkIn), 'dd/MM/yyyy') : '';
      const checkOutStr = item.item.checkOut ? format(parseISO(item.item.checkOut), 'dd/MM/yyyy') : '';
      const total = item.calculation?.finalTotal || 0;

      text += `${branchName} | ${roomName} | Check-in: ${checkInStr} | Check-out: ${checkOutStr} | Tổng giá phòng: ${formatCurrency(total)}\n\n`;
    });

    text += `TỔNG CỘNG:\n`;
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
    text += `TỔNG THANH TOÁN: ${formatCurrency(summary.finalTotal)}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header Total */}
      <div className="flex justify-between items-start pb-3 border-b border-slate-100">
        <div>
          <span className="text-xs font-medium text-slate-500">
            Tổng thanh toán ({summary.totalRooms} phòng)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums mt-0.5">
            {formatCurrency(summary.finalTotal)}
          </div>
        </div>
        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold tabular-nums">
          {summary.totalNights} đêm tổng cộng
        </span>
      </div>

      {roomSummary && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="multi-room-summary" className="text-xs font-semibold text-slate-800">
              Tóm tắt báo giá
            </label>
            <button
              type="button"
              onClick={handleCopySummary}
              className="flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-slate-700"
            >
              {copiedSummary ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedSummary ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          </div>
          <textarea
            id="multi-room-summary"
            readOnly
            value={roomSummary}
            rows={Math.min(Math.max(includedItems.length + 1, 2), 5)}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full resize-none rounded-md border border-slate-200 bg-white p-2 text-xs leading-relaxed text-slate-800 focus:outline-none"
          />
          {copySummaryError && <p role="alert" className="text-xs text-rose-600">{copySummaryError}</p>}
        </div>
      )}

      {/* Room Breakdown List */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Danh sách phòng tính tiền</span>
          <span className="text-[11px] text-slate-400 font-normal">Tick để bật/tắt</span>
        </div>

        <div className="space-y-1">
          {summary.items.map((it, idx) => {
            const isIncluded = it.item.isIncluded !== false;
            return (
              <div
                key={idx}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg border text-xs transition-colors",
                  isIncluded ? "bg-slate-50/80 border-slate-200" : "bg-slate-50/30 border-slate-200/50 opacity-50"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {onToggleIncludeRoom && (
                    <button
                      type="button"
                      onClick={() => onToggleIncludeRoom(idx)}
                      title={isIncluded ? "Bỏ tính phòng này" : "Tính phòng này"}
                      className={cn(
                        "w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0",
                        isIncluded ? "bg-brand-700 border-brand-700 text-white" : "border-slate-300 bg-white"
                      )}
                    >
                      {isIncluded && <Check size={11} strokeWidth={3} />}
                    </button>
                  )}
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">#{idx + 1}</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {it.room?.name || 'Chưa chọn'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                      <span>{it.item.checkIn ? format(parseISO(it.item.checkIn), 'dd/MM') : ''} → {it.item.checkOut ? format(parseISO(it.item.checkOut), 'dd/MM') : ''}</span>
                      <span>({it.calculation?.nights.length || 0}đ)</span>
                    </div>
                  </div>
                </div>

                <span className="font-bold text-slate-900 tabular-nums shrink-0 ml-2">
                  {formatCurrency(it.calculation?.finalTotal || 0)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary lines */}
      <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
        <div className="flex justify-between text-slate-600">
          <span>Tổng tiền phòng gốc</span>
          <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(summary.totalBase)}</span>
        </div>

        {summary.totalStayDiscounts > 0 && (
          <div className="flex justify-between text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
            <span>Giảm giá lưu trú dài ngày</span>
            <span className="font-semibold tabular-nums">−{formatCurrency(summary.totalStayDiscounts)}</span>
          </div>
        )}

        {earlyLateDetails.map((line, index) => (
          <div key={index} className="flex justify-between text-slate-700 bg-slate-50 px-2 py-1 rounded">
            <span>{line.label}</span>
            <span className="font-semibold tabular-nums">{formatDetail(line.amount)}</span>
          </div>
        ))}

        {globalAdjustment.amount !== 0 && (
          <div
            className={cn(
              "flex justify-between px-2 py-1 rounded font-medium",
              globalAdjustment.type === 'surcharge' ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-900"
            )}
          >
            <span>
              {globalAdjustment.type === 'surcharge' ? 'Phụ thu tổng' : 'Giảm giá tổng'}{' '}
              {globalAdjustment.isPercentage ? `(${globalAdjustment.amount}%)` : ''}
            </span>
            <span className="font-bold tabular-nums">
              {globalAdjustment.type === 'surcharge' ? '+' : '−'}
              {formatCurrency(summary.globalAdjustmentValue)}
            </span>
          </div>
        )}

        {includeVAT && (
          <div className="flex justify-between text-slate-600">
            <span>Thuế VAT ({vatRate}%)</span>
            <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(summary.vatValue)}</span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100">
        <GoogleReviewsOption checked={!!globalAdjustment.googleReviews} onChange={onToggleGoogleReviews} />
      </div>

      {/* Copy Quote Button */}
      <button
        type="button"
        onClick={handleCopyQuote}
        className={cn(
          "w-full py-2.5 px-4 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer",
          copied ? "bg-emerald-600 text-white" : "bg-brand-700 text-white hover:bg-brand-800"
        )}
      >
        {copied ? (
          <>
            <CheckCheck size={15} />
            <span>Đã sao chép toàn bộ báo giá</span>
          </>
        ) : (
          <>
            <Copy size={15} />
            <span>Sao chép bảng báo giá chi tiết</span>
          </>
        )}
      </button>
    </section>
  );
}
