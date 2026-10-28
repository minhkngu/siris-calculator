import { format, addDays, getDay, eachDayOfInterval, parseISO, isValid } from 'date-fns';
import type { RoomType, DateAdjustment, GlobalAdjustment, StayDiscount, EarlyCheckinLateCheckoutType, CalculationResult, SelectedRoomItem, MultiRoomCalculationItem, MultiRoomTotalSummary } from '../components/types.ts';

export const EMPTY_EARLY_LATE_OPTIONS: ReadonlySet<EarlyCheckinLateCheckoutType> = new Set();

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
    for (const discount of stayDiscounts) {
        if (nightCount >= discount.minNights &&
            (!bestStayDiscount || discount.minNights > bestStayDiscount.minNights)) {
            bestStayDiscount = discount;
        }
    }
    let stayDiscountValue = 0;
    if (bestStayDiscount) {
        stayDiscountValue = bestStayDiscount.isPercentage
            ? Math.round(totalBase * bestStayDiscount.discountAmount / 100)
            : bestStayDiscount.discountAmount;
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

    const globalValue = globalAdjustment.preset === 'google_reviews'
        ? Math.min(70000, Math.round(Math.max(0, finalTotal) * 0.1))
        : globalAdjustment.isPercentage
            ? Math.round(totalBase * globalAdjustment.amount / 100)
            : globalAdjustment.amount;
    finalTotal += globalAdjustment.type === 'surcharge' ? globalValue : -globalValue;

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

    // Apply global adjustment on combined subtotal
    const globalValue = globalAdjustment.preset === 'google_reviews'
        ? Math.min(70000, Math.round(Math.max(0, combinedSubtotal) * 0.1))
        : globalAdjustment.isPercentage
        ? Math.round(combinedSubtotal * globalAdjustment.amount / 100)
        : globalAdjustment.amount;

    let finalBeforeVat = combinedSubtotal;
    if (globalAdjustment.type === 'surcharge') {
        finalBeforeVat += globalValue;
    } else {
        finalBeforeVat -= globalValue;
    }
    if (finalBeforeVat < 0) finalBeforeVat = 0;

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
        vatValue,
        finalTotal,
        deposit
    };
}

