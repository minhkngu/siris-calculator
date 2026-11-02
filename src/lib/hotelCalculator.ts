import { format, addDays, getDay, eachDayOfInterval, parseISO, isValid } from 'date-fns';
import type { RoomType, DateAdjustment, GlobalAdjustment, StayDiscount, EarlyCheckinLateCheckoutType, CalculationResult, SelectedRoomItem, MultiRoomCalculationItem, MultiRoomTotalSummary } from '../components/types.ts';

export const EMPTY_EARLY_LATE_OPTIONS: ReadonlySet<EarlyCheckinLateCheckoutType> = new Set();

const ROOM_CACHE_LIMIT = 300;

type RoomCacheBucket = Map<string, CalculationResult | null>;

// The adjustment/discount arrays are stable state references, so they make a
// cheap two-level cache key without serialising their contents on every render.
const roomCalculationCache = new WeakMap<
    ReadonlyArray<DateAdjustment>,
    WeakMap<ReadonlyArray<StayDiscount>, RoomCacheBucket>
>();

function roomCacheBucket(dateAdjustments: DateAdjustment[], stayDiscounts: StayDiscount[]): RoomCacheBucket {
    let byDiscounts = roomCalculationCache.get(dateAdjustments);
    if (!byDiscounts) {
        byDiscounts = new WeakMap();
        roomCalculationCache.set(dateAdjustments, byDiscounts);
    }
    let bucket = byDiscounts.get(stayDiscounts);
    if (!bucket) {
        bucket = new Map();
        byDiscounts.set(stayDiscounts, bucket);
    }
    return bucket;
}

function roomCacheKey(
    room: RoomType,
    checkIn: string,
    checkOut: string,
    globalAdjustment: GlobalAdjustment,
    includeVAT: boolean,
    vatRate: number,
    earlyLateOptions: ReadonlySet<EarlyCheckinLateCheckoutType>,
): string {
    const options = earlyLateOptions.size ? [...earlyLateOptions].sort().join('+') : '';
    return [
        room.id, room.branchId, room.weekdayPrice, room.weekendPrice, checkIn, checkOut,
        globalAdjustment.type, globalAdjustment.amount, globalAdjustment.isPercentage ? 1 : 0,
        globalAdjustment.googleReviews ? 1 : 0, [...(globalAdjustment.selectedPromotionIds ?? [])].sort().join(','), includeVAT ? 1 : 0, vatRate, options,
    ].join('|');
}

type ManualRoom = { room: RoomType; nights: CalculationResult['nights']; subtotal: number };

function calculateManualDiscounts(promotions: StayDiscount[], selected: string[], rooms: ManualRoom[]) {
    const result: { promotion: StayDiscount; amount: number }[] = [];
    let remaining = Math.max(0, rooms.reduce((sum, room) => sum + room.subtotal, 0));
    for (const promotion of promotions) {
        if (!promotion.isActive || promotion.selectionMode !== 'manual' || !selected.includes(promotion.id)) continue;
        let eligibleSubtotal = 0;
        const prices: number[] = [];
        for (const item of rooms) {
            if (item.nights.length < promotion.minNights || (promotion.branchId && promotion.branchId !== item.room.branchId) || (promotion.roomTypeId && promotion.roomTypeId !== item.room.id)) continue;
            const nights = item.nights.filter(n => (!promotion.stayStart || n.date >= promotion.stayStart) && (!promotion.stayEnd || n.date <= promotion.stayEnd));
            if (!nights.length) continue;
            const total = item.nights.reduce((sum, n) => sum + Math.max(0, n.finalPrice), 0);
            const ratio = total ? Math.max(0, item.subtotal) / total : 0;
            for (const night of nights) prices.push(Math.max(0, night.finalPrice) * ratio);
            eligibleSubtotal += nights.reduce((sum, n) => sum + Math.max(0, n.finalPrice) * ratio, 0);
        }
        if (!prices.length) continue;
        let amount = promotion.discountBasis === 'per_night'
            ? prices.reduce((sum, price) => sum + Math.min(price, promotion.isPercentage ? Math.round(price * promotion.discountAmount / 100) : promotion.discountAmount, promotion.maxDiscountPerNight ?? Infinity), 0)
            : promotion.isPercentage && promotion.maxDiscountPerNight != null
                ? prices.reduce((sum, price) => sum + Math.min(price, Math.round(price * promotion.discountAmount / 100), promotion.maxDiscountPerNight!), 0)
                : promotion.isPercentage ? Math.round(eligibleSubtotal * promotion.discountAmount / 100) : promotion.discountAmount;
        amount = Math.max(0, Math.round(Math.min(amount, promotion.maxDiscountPerStay ?? Infinity, eligibleSubtotal, remaining)));
        if (amount > 0) { result.push({ promotion, amount }); remaining -= amount; }
    }
    return result;
}

export function calculateForRoomLogic(
    room: RoomType,
    checkIn: string,
    checkOut: string,
    dateAdjustments: DateAdjustment[],
    globalAdjustment: GlobalAdjustment,
    stayDiscounts: StayDiscount[],
    includeVAT: boolean,
    vatRate: number,
    earlyLateOptions: ReadonlySet<EarlyCheckinLateCheckoutType> = EMPTY_EARLY_LATE_OPTIONS
): CalculationResult | null {
    const bucket = roomCacheBucket(dateAdjustments, stayDiscounts);
    const key = roomCacheKey(room, checkIn, checkOut, globalAdjustment, includeVAT, vatRate, earlyLateOptions);
    if (bucket.has(key)) return bucket.get(key) ?? null;

    const result = computeRoomCalculation(
        room, checkIn, checkOut, dateAdjustments, globalAdjustment,
        stayDiscounts, includeVAT, vatRate, earlyLateOptions,
    );
    if (bucket.size >= ROOM_CACHE_LIMIT) bucket.clear();
    bucket.set(key, result);
    return result;
}

function computeRoomCalculation(
    room: RoomType,
    checkIn: string,
    checkOut: string,
    dateAdjustments: DateAdjustment[],
    globalAdjustment: GlobalAdjustment,
    stayDiscounts: StayDiscount[],
    includeVAT: boolean,
    vatRate: number,
    earlyLateOptions: ReadonlySet<EarlyCheckinLateCheckoutType> = EMPTY_EARLY_LATE_OPTIONS
): CalculationResult | null {
    const start = parseISO(checkIn);
    const end = parseISO(checkOut);

    if (!isValid(start) || !isValid(end) || end <= start) return null;

    const nights = eachDayOfInterval({
        start,
        end: addDays(end, -1)
    });

    const adjustmentsByDate = new Map<string, DateAdjustment[]>();
    for (const adjustment of dateAdjustments) {
        const existing = adjustmentsByDate.get(adjustment.date);
        if (existing) existing.push(adjustment);
        else adjustmentsByDate.set(adjustment.date, [adjustment]);
    }

    // Use the same daily pricing rules for the stay and adjacent nights.
    const calculateNight = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const day = getDay(date);
        const isWeekend = day === 5 || day === 6;
        const basePrice = isWeekend ? room.weekendPrice : room.weekdayPrice;
        const adjustments = adjustmentsByDate.get(dateStr) ?? [];
        let finalPrice = basePrice;
        for (const adjustment of adjustments) {
            const value = adjustment.isPercentage
                ? Math.round(basePrice * adjustment.amount / 100)
                : adjustment.amount;
            finalPrice += adjustment.type === 'surcharge' ? value : -value;
        }
        return {
            date: dateStr,
            isWeekend,
            basePrice,
            adjustments,
            finalPrice,
            vatPerNight: includeVAT ? Math.round(finalPrice * (vatRate / 100)) : 0
        };
    };

    const previousNightPrice = calculateNight(addDays(start, -1)).finalPrice;
    const nextNightPrice = calculateNight(end).finalPrice;
    const breakdown = nights.map(calculateNight);
    const totalBase = breakdown.reduce((total, night) => total + night.finalPrice, 0);

    const nightCount = breakdown.length;
    let bestStayDiscount: StayDiscount | undefined;
    let stayDiscountValue = 0;
    for (const discount of stayDiscounts) {
        if (discount.selectionMode === 'manual' || !discount.isActive || nightCount < discount.minNights ||
            (discount.branchId && discount.branchId !== room.branchId) ||
            (discount.roomTypeId && discount.roomTypeId !== room.id)) continue;
        const eligible = breakdown.filter(night =>
            (!discount.stayStart || night.date >= discount.stayStart) &&
            (!discount.stayEnd || night.date <= discount.stayEnd));
        if (!eligible.length) continue;
        const base = eligible.reduce((sum, night) => sum + Math.max(0, night.finalPrice), 0);
        let value: number;
        if (discount.discountBasis === 'per_night') {
            value = eligible.reduce((sum, night) => {
                const price = Math.max(0, night.finalPrice);
                const amount = discount.isPercentage ? Math.round(price * discount.discountAmount / 100) : discount.discountAmount;
                return sum + Math.min(price, amount, discount.maxDiscountPerNight ?? Infinity);
            }, 0);
        } else if (discount.isPercentage && discount.maxDiscountPerNight != null) {
            value = eligible.reduce((sum, night) => sum + Math.min(Math.max(0, night.finalPrice), Math.round(Math.max(0, night.finalPrice) * discount.discountAmount / 100), discount.maxDiscountPerNight!), 0);
        } else {
            value = discount.isPercentage ? Math.round(base * discount.discountAmount / 100) : discount.discountAmount;
        }
        value = Math.min(base, value, discount.maxDiscountPerStay ?? Infinity);
        if (value > stayDiscountValue || (value > 0 && value === stayDiscountValue && discount.priority > (bestStayDiscount?.priority ?? -Infinity))) {
            bestStayDiscount = discount;
            stayDiscountValue = value;
        }
    }

    let finalTotal = totalBase - stayDiscountValue;

    // Calculate early check-in / late check-out fees
    const lateCheckin = earlyLateOptions.has('checkin_2200');
    let earlyLateTotal = lateCheckin ? -Math.round(breakdown[0].finalPrice * 20 / 100) : 0;
    if (!lateCheckin && earlyLateOptions.has('early_0800')) {
        // 50% of price of the previous night (the night before check-in)
        earlyLateTotal += Math.round(previousNightPrice * 50 / 100);
    }
    if (!lateCheckin && earlyLateOptions.has('early_1230')) {
        earlyLateTotal += 150000;
    }
    if (!lateCheckin && earlyLateOptions.has('early_1300')) {
        earlyLateTotal += 100000;
    }
    if (earlyLateOptions.has('late_1300')) {
        earlyLateTotal += 100000;
    }
    if (earlyLateOptions.has('late_1800')) {
        const checkoutDayOfWeek = getDay(end);
        const isWeekendCheckout = checkoutDayOfWeek === 5 || checkoutDayOfWeek === 6;
        if (!isWeekendCheckout) {
            // 80% of price of the next night (the night of check-out day), not allowed on Fri/Sat
            earlyLateTotal += Math.round(nextNightPrice * 80 / 100);
        }
    }

    finalTotal += earlyLateTotal;

    const manualDiscounts = calculateManualDiscounts(stayDiscounts, globalAdjustment.selectedPromotionIds ?? [], [{ room, nights: breakdown, subtotal: finalTotal }]);
    const manualTotal = manualDiscounts.reduce((sum, entry) => sum + entry.amount, 0);
    const googleReviewsDiscount = globalAdjustment.googleReviews
        ? Math.min(70000, Math.round(Math.max(0, finalTotal) * 0.1)) : 0;
    const globalValue = globalAdjustment.isPercentage
            ? Math.round(totalBase * globalAdjustment.amount / 100)
            : globalAdjustment.amount;
    finalTotal += globalAdjustment.type === 'surcharge' ? globalValue : -globalValue;
    finalTotal -= googleReviewsDiscount + manualTotal;

    let vatValue = 0;
    if (includeVAT) {
        vatValue = Math.round(finalTotal * (vatRate / 100));
        finalTotal += vatValue;
    }

    const deposit = Math.round(finalTotal * 0.5);

    return {
        nights: breakdown,
        totalBase,
        globalAdjustmentValue: globalValue,
        googleReviewsDiscount,
        manualDiscounts,
        stayDiscount: bestStayDiscount,
        stayDiscountValue,
        earlyLateTotal,
        previousNightPrice,
        nextNightPrice,
        vatValue,
        finalTotal,
        deposit
    };
}

export function calculateMultiRoomLogic(
    selectedRooms: SelectedRoomItem[],
    roomTypes: RoomType[],
    branches: { id: string; name: string; address?: string }[],
    dateAdjustments: DateAdjustment[],
    globalAdjustment: GlobalAdjustment,
    stayDiscounts: StayDiscount[],
    includeVAT: boolean,
    vatRate: number
): MultiRoomTotalSummary {
    const zeroGlobalAdj: GlobalAdjustment = { type: 'discount', amount: 0, isPercentage: false };

    let totalBase = 0;
    let totalStayDiscounts = 0;
    let totalEarlyLate = 0;
    let totalNights = 0;
    let includedRoomsCount = 0;

    const roomsById = new Map(roomTypes.map(room => [room.id, room]));
    const branchesById = new Map(branches.map(branch => [branch.id, branch]));
    const items: MultiRoomCalculationItem[] = selectedRooms.map(item => {
        const isIncluded = item.isIncluded !== false; // default to true if undefined
        const room = roomsById.get(item.roomId);
        const branch = branchesById.get(item.branchId);

        let calculation: CalculationResult | null = null;
        if (room && item.checkIn && item.checkOut) {
            calculation = calculateForRoomLogic(
                room,
                item.checkIn,
                item.checkOut,
                dateAdjustments,
                zeroGlobalAdj,
                stayDiscounts,
                false, // Don't apply VAT at per-room level, apply overall
                0,
                item.earlyLateOptions
            );

            if (calculation && isIncluded) {
                totalBase += calculation.totalBase;
                totalStayDiscounts += calculation.stayDiscountValue;
                totalEarlyLate += calculation.earlyLateTotal;
                totalNights += calculation.nights.length;
                includedRoomsCount++;
            }
        }

        return {
            item,
            room,
            branch,
            calculation
        };
    });

    const combinedSubtotal = totalBase - totalStayDiscounts + totalEarlyLate;

    const manualDiscounts = calculateManualDiscounts(stayDiscounts, globalAdjustment.selectedPromotionIds ?? [], items.flatMap(entry => entry.item.isIncluded !== false && entry.room && entry.calculation ? [{ room: entry.room, nights: entry.calculation.nights, subtotal: entry.calculation.finalTotal }] : []));
    const manualTotal = manualDiscounts.reduce((sum, entry) => sum + entry.amount, 0);
    // Apply global adjustment on combined subtotal
    const googleReviewsDiscount = globalAdjustment.googleReviews
        ? Math.min(70000, Math.round(Math.max(0, combinedSubtotal) * 0.1)) : 0;
    const globalValue = globalAdjustment.isPercentage
        ? Math.round(combinedSubtotal * globalAdjustment.amount / 100)
        : globalAdjustment.amount;

    let finalBeforeVat = combinedSubtotal;
    if (globalAdjustment.type === 'surcharge') {
        finalBeforeVat += globalValue;
    } else {
        finalBeforeVat -= globalValue;
    }
    finalBeforeVat = Math.max(0, finalBeforeVat - googleReviewsDiscount - manualTotal);

    let vatValue = 0;
    let finalTotal = finalBeforeVat;
    if (includeVAT) {
        vatValue = Math.round(finalBeforeVat * (vatRate / 100));
        finalTotal += vatValue;
    }

    const deposit = Math.round(finalTotal * 0.5);

    return {
        items,
        totalRooms: includedRoomsCount,
        totalNights,
        totalBase,
        totalStayDiscounts,
        totalEarlyLate,
        globalAdjustmentValue: globalValue,
        googleReviewsDiscount,
        manualDiscounts,
        vatValue,
        finalTotal,
        deposit
    };
}

