import { getDay, parseISO } from 'date-fns';
import type { CalculationResult, EarlyCheckinLateCheckoutType } from '../components/types.ts';

export function getEarlyLateDetails(calculation: CalculationResult, options: ReadonlySet<EarlyCheckinLateCheckoutType>, checkOut: string) {
    const lines: { label: string; amount: number }[] = [];
    const lateCheckin = options.has('checkin_2200');
    if (lateCheckin) lines.push({ label: 'Check-in từ 22:00', amount: -Math.round((calculation.nights[0]?.finalPrice ?? 0) * 0.2) });
    if (!lateCheckin && options.has('early_0800')) lines.push({ label: 'Check-in sớm từ 8:00', amount: Math.round(calculation.previousNightPrice * 0.5) });
    if (!lateCheckin && options.has('early_1230')) lines.push({ label: 'Check-in sớm từ 12:30', amount: 150000 });
    if (!lateCheckin && options.has('early_1300')) lines.push({ label: 'Check-in sớm từ 13:00', amount: 100000 });
    if (options.has('late_1300')) lines.push({ label: 'Check-out trễ trước 13:00', amount: 100000 });
    if (options.has('late_1800') && ![5, 6].includes(getDay(parseISO(checkOut)))) lines.push({ label: 'Check-out trễ trước 18:00', amount: Math.round(calculation.nextNightPrice * 0.8) });
    return lines;
}
