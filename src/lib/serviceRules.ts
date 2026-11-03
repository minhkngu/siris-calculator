import { getDay, isValid, parseISO } from 'date-fns';

export interface ServiceRule {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: 'early_checkin' | 'late_checkout' | 'extra_guest' | 'other';
  amountType: 'fixed' | 'percentage';
  amount: number;
  calculationBase: 'previous_night' | 'next_night' | 'first_night' | 'subtotal' | null;
  timeFrom: string | null;
  timeTo: string | null;
  excludedWeekdays: number[];
  exclusiveGroup: string | null;
  isActive: boolean;
  sortOrder: number;
  promotionCalcuate?: boolean;
}

export interface ServicePriceContext {
  previousNight: number;
  nextNight: number;
  firstNight: number;
  subtotal: number;
}

export const LATE_CHECKIN_CODE = 'checkin_2200';

export function serviceAvailable(rule: ServiceRule, checkIn: string, checkOut: string): boolean {
  if (!rule.isActive) return false;
  const date = parseISO(rule.category === 'late_checkout' ? checkOut : checkIn);
  return isValid(date) && !rule.excludedWeekdays.includes(getDay(date) || 7);
}

export function serviceAmount(rule: ServiceRule, prices: ServicePriceContext): number {
  if (rule.amountType === 'fixed') return Math.round(rule.amount);
  const base = rule.calculationBase === 'previous_night' ? prices.previousNight
    : rule.calculationBase === 'next_night' ? prices.nextNight
    : rule.calculationBase === 'first_night' ? prices.firstNight
    : rule.calculationBase === 'subtotal' ? prices.subtotal : 0;
  return Math.round(base * rule.amount / 100);
}

export function normalizeServiceSelection(codes: Iterable<string>, rules: readonly ServiceRule[], checkIn: string, checkOut: string): Set<string> {
  const byCode = new Map(rules.map(rule => [rule.code, rule]));
  const result = new Set<string>();
  const groups = new Set<string>();
  for (const saved of codes) {
    const code = saved === 'early_0800' && !byCode.has(saved) && byCode.has('early_0900') ? 'early_0900' : saved;
    if (code === LATE_CHECKIN_CODE) {
      const rule = byCode.get(code);
      if (rule && serviceAvailable(rule, checkIn, checkOut) && ![...result].some(value => byCode.get(value)?.category === 'early_checkin')) result.add(code);
      continue;
    }
    const rule = byCode.get(code);
    if (!rule || !serviceAvailable(rule, checkIn, checkOut) || (rule.category === 'early_checkin' && result.has(LATE_CHECKIN_CODE))) continue;
    if (rule.exclusiveGroup && groups.has(rule.exclusiveGroup)) continue;
    result.add(code);
    if (rule.exclusiveGroup) groups.add(rule.exclusiveGroup);
  }
  return result;
}

export function toggleServiceSelection(selected: ReadonlySet<string>, code: string, rules: readonly ServiceRule[], checkIn: string, checkOut: string): Set<string> {
  const next = normalizeServiceSelection(selected, rules, checkIn, checkOut);
  if (next.has(code)) { next.delete(code); return next; }
  if (code === LATE_CHECKIN_CODE) {
    const lateRule = rules.find(rule => rule.code === code);
    if (!lateRule || !serviceAvailable(lateRule, checkIn, checkOut)) return next;
    for (const rule of rules) if (rule.category === 'early_checkin') next.delete(rule.code);
    next.add(code);
    return next;
  }
  const rule = rules.find(item => item.code === code);
  if (!rule || !serviceAvailable(rule, checkIn, checkOut)) return next;
  if (rule.category === 'early_checkin') next.delete(LATE_CHECKIN_CODE);
  if (rule.exclusiveGroup) for (const item of rules) if (item.exclusiveGroup === rule.exclusiveGroup) next.delete(item.code);
  next.add(code);
  return next;
}

/** Allocates a VND fee evenly across nights; leftover đồng go to earlier nights. */
export function allocateServiceCharge(amount: number, nightCount: number): number[] {
  if (!Number.isSafeInteger(amount) || !Number.isSafeInteger(nightCount) || nightCount <= 0) return [];
  const sign = Math.sign(amount);
  const absolute = Math.abs(amount);
  const each = Math.floor(absolute / nightCount);
  const remainder = absolute % nightCount;
  return Array.from({ length: nightCount }, (_, index) => sign * (each + (index < remainder ? 1 : 0)));
}
