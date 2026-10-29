import type { CalculationResult, EarlyCheckinLateCheckoutType, GlobalAdjustment } from '../components/types.ts';
import { getEarlyLateDetails } from './earlyLateDetails.ts';

export interface PriceLine { label: string; amount: number; kind: 'base' | 'adjustment' | 'total'; }
export interface BreakdownRoom { calculation: CalculationResult; options: ReadonlySet<EarlyCheckinLateCheckoutType>; checkOut: string; }

export function getPriceBreakdown(rooms: BreakdownRoom[], adjustment: GlobalAdjustment, vatValue: number, finalTotal: number, clampBeforeVat: boolean): PriceLine[] {
    const lines: PriceLine[] = [];
    const add = (label: string, amount: number) => {
        if (!amount) return;
        const existing = lines.find(line => line.label === label && line.kind === 'adjustment');
        if (existing) existing.amount += amount;
        else lines.push({ label, amount, kind: 'adjustment' });
    };
    const base = rooms.reduce((sum, room) => sum + room.calculation.nights.reduce((n, night) => n + night.basePrice, 0), 0);
    lines.push({ label: 'Giá phòng trước khuyến mãi và phụ thu', amount: base, kind: 'base' });
    for (const { calculation, options, checkOut } of rooms) {
        for (const night of calculation.nights) for (const entry of night.adjustments) {
            const amount = entry.isPercentage ? Math.round(night.basePrice * entry.amount / 100) : entry.amount;
            add(entry.note || (entry.type === 'surcharge' ? 'Phụ thu theo ngày' : 'Giảm giá theo ngày'), entry.type === 'surcharge' ? amount : -amount);
        }
        if (calculation.stayDiscount) add(calculation.stayDiscount.name || 'Giảm giá lưu trú', -calculation.stayDiscountValue);
        for (const line of getEarlyLateDetails(calculation, options, checkOut)) add(line.label, line.amount);
    }
    if (adjustment.googleReviews) add('Google Reviews', -Math.min(70000, Math.round(Math.max(0, rooms.reduce((s, r) => s + r.calculation.totalBase - r.calculation.stayDiscountValue + r.calculation.earlyLateTotal, 0)) * 0.1)));
    const subtotal = rooms.reduce((s, r) => s + r.calculation.totalBase - r.calculation.stayDiscountValue + r.calculation.earlyLateTotal, 0);
    const adjustmentBase = rooms.length === 1 && !clampBeforeVat ? rooms[0].calculation.totalBase : subtotal;
    const globalValue = adjustment.isPercentage ? Math.round(adjustmentBase * adjustment.amount / 100) : adjustment.amount;
    add(adjustment.type === 'surcharge' ? 'Phụ thu tổng đơn' : 'Giảm giá tổng đơn', adjustment.type === 'surcharge' ? globalValue : -globalValue);
    const beforeVat = lines.reduce((s, line) => s + line.amount, 0);
    if (clampBeforeVat && beforeVat < 0) add('Điều chỉnh về mức tối thiểu', -beforeVat);
    if (vatValue) add('Thuế VAT', vatValue);
    lines.push({ label: 'Giá cuối cùng', amount: finalTotal, kind: 'total' });
    return lines;
}
