import type { StayDiscount } from './types';

interface Props {
  promotions: StayDiscount[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  applied: { id: string; label: string; amount: number }[];
  formatCurrency: (amount: number) => string;
}

export function PromotionList({ promotions, selectedIds, onToggle, applied, formatCurrency }: Props) {
  const active = promotions.filter(promotion => promotion.isActive);
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs" aria-label="Khuyến mãi đang có">
      <h3 className="font-semibold text-slate-900">Khuyến mãi đang có</h3>
      {active.length === 0 ? <p className="mt-2 text-slate-500">Hiện chưa có chương trình nào.</p> : (
        <ul className="mt-2 space-y-2">
          {active.map(promotion => {
            const selected = applied.filter(item => item.id === promotion.id);
            const manual = promotion.selectionMode === 'manual';
            const checked = selectedIds.includes(promotion.id);
            const details = selected.map(item => `${item.label ? `${item.label}: ` : ''}−${formatCurrency(item.amount)}`).join(' · ');
            const content = (
              <>
                <div className="flex items-start gap-2.5">
                  {manual && <input type="checkbox" checked={checked} onChange={() => onToggle(promotion.id)} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-emerald-700" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 font-semibold leading-5 text-slate-900">{promotion.name}</span>
                      <span className="w-28 shrink-0 overflow-x-auto whitespace-nowrap text-right text-xs font-bold tabular-nums text-emerald-900" aria-live="polite">
                        {selected.length > 0 ? details : ''}
                      </span>
                    </div>
                    {promotion.description && <p className="mt-0.5 break-words leading-relaxed text-slate-600">{promotion.description}</p>}
                    <p className="mt-1 leading-relaxed text-slate-500">Giảm {promotion.isPercentage ? `${promotion.discountAmount}%` : formatCurrency(promotion.discountAmount)} {promotion.discountBasis === 'per_night' ? 'mỗi đêm' : 'mỗi lượt'} · Tối thiểu {promotion.minNights} đêm</p>
                    {(promotion.stayStart || promotion.stayEnd) && <p className="mt-1 text-slate-500">Đêm lưu trú: {promotion.stayStart || 'Không giới hạn'} – {promotion.stayEnd || 'Không giới hạn'}</p>}
                  </div>
                </div>
              </>
            );
            const className = `block rounded-lg border px-3 py-2 transition-colors ${manual ? 'cursor-pointer hover:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-1 ' : ''}${selected.length ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`;
            return <li key={promotion.id}>{manual ? <label className={className}>{content}</label> : <div className={className}>{content}</div>}</li>;
          })}
        </ul>
      )}
    </section>
  );
}
