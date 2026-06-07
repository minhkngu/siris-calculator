import { useMemo } from 'react';
import { format, addDays, getDay, eachDayOfInterval, parseISO, isValid } from 'date-fns';
import { RoomType, DateAdjustment, GlobalAdjustment, StayDiscount, EarlyCheckinLateCheckoutType, CalculationResult } from './types';

export function calculateForRoomLogic(
    room: RoomType,
    checkIn: string,
    checkOut: string,
    dateAdjustments: DateAdjustment[],
    globalAdjustment: GlobalAdjustment,
    stayDiscounts: StayDiscount[],
    includeVAT: boolean,
    vatRate: number,
    earlyLateOptions: Set<EarlyCheckinLateCheckoutType> = new Set()
): CalculationResult | null {
    const start = parseISO(checkIn);
    const end = parseISO(checkOut);

    if (!isValid(start) || !isValid(end) || end <= start) return null;

    const nights = eachDayOfInterval({
        start,
        end: addDays(end, -1)
    });

    let totalBase = 0;
    const breakdown = nights.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOfWeek = getDay(date);
        const isWknd = dayOfWeek === 5 || dayOfWeek === 6;
        const basePrice = isWknd ? room.weekendPrice : room.weekdayPrice;

        const adjustments = dateAdjustments.filter(adj => adj.date === dateStr);
        let adjustedPrice = basePrice;

        adjustments.forEach(adj => {
            const value = adj.isPercentage ? Math.round(basePrice * adj.amount / 100) : adj.amount;
            if (adj.type === 'surcharge') {
                adjustedPrice += value;
            } else {
                adjustedPrice -= value;
            }
        });

        totalBase += adjustedPrice;

        let vatPerNight = 0;
        if (includeVAT) {
            vatPerNight = Math.round(adjustedPrice * (vatRate / 100));
        }

        return {
            date: dateStr,
            isWeekend: isWknd,
            basePrice,
            adjustments,
            finalPrice: adjustedPrice,
            vatPerNight
        };
    });

    const nightCount = breakdown.length;
    const applicableStayDiscounts = stayDiscounts
        .filter(d => nightCount >= d.minNights)
        .sort((a, b) => b.minNights - a.minNights);

    const bestStayDiscount = applicableStayDiscounts[0];
    let stayDiscountValue = 0;
    if (bestStayDiscount) {
        stayDiscountValue = bestStayDiscount.isPercentage
            ? Math.round(totalBase * bestStayDiscount.discountAmount / 100)
            : bestStayDiscount.discountAmount;
    }

    let finalTotal = totalBase - stayDiscountValue;

    const globalValue = globalAdjustment.isPercentage
        ? Math.round(totalBase * globalAdjustment.amount / 100)
        : globalAdjustment.amount;

    if (globalAdjustment.type === 'surcharge') {
        finalTotal += globalValue;
    } else {
        finalTotal -= globalValue;
    }

    // Calculate early check-in / late check-out fees
    let earlyLateTotal = 0;
    if (earlyLateOptions.has('early_1230')) {
        earlyLateTotal += 150000;
    }
    if (earlyLateOptions.has('early_1300')) {
        earlyLateTotal += 100000;
    }
    if (earlyLateOptions.has('late_1300')) {
        earlyLateTotal += 100000;
    }
    if (earlyLateOptions.has('late_1800')) {
        // 80% of base price of the last night
        const lastNight = breakdown[breakdown.length - 1];
        if (lastNight) {
            earlyLateTotal += Math.round(lastNight.basePrice * 80 / 100);
        }
    }

    finalTotal += earlyLateTotal;

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
        vatValue,
        finalTotal,
        deposit
    };
}

export function useCalculateForRoom(
    room: RoomType | undefined,
    checkIn: string,
    checkOut: string,
    dateAdjustments: DateAdjustment[],
    globalAdjustment: GlobalAdjustment,
    stayDiscounts: StayDiscount[],
    includeVAT: boolean,
    vatRate: number,
    earlyLateOptions: Set<EarlyCheckinLateCheckoutType> = new Set()
): CalculationResult | null {
    return useMemo(() => {
        if (!room) return null;
        return calculateForRoomLogic(room, checkIn, checkOut, dateAdjustments, globalAdjustment, stayDiscounts, includeVAT, vatRate, earlyLateOptions);
    }, [room, checkIn, checkOut, dateAdjustments, globalAdjustment, stayDiscounts, includeVAT, vatRate, earlyLateOptions]);
}

export function useComparisons(
    roomTypes: RoomType[],
    branches: { id: string; name: string; address?: string }[],
    compareBranchIds: string[],
    compareRoomIds: string[],
    selectedRoom: RoomType | undefined,
    calculation: CalculationResult | null,
    checkIn: string,
    checkOut: string,
    dateAdjustments: DateAdjustment[],
    globalAdjustment: GlobalAdjustment,
    stayDiscounts: StayDiscount[],
    includeVAT: boolean,
    vatRate: number,
    earlyLateOptions: Set<EarlyCheckinLateCheckoutType> = new Set()
) {
    return useMemo(() => {
        if (!selectedRoom || !calculation) return [];

        return roomTypes
            .filter(r => compareBranchIds.includes(r.branchId) && compareRoomIds.includes(r.id))
            .map(r => {
                const calc = calculateForRoomLogic(r, checkIn, checkOut, dateAdjustments, globalAdjustment, stayDiscounts, includeVAT, vatRate, earlyLateOptions);
                const branch = branches.find(b => b.id === r.branchId);
                return {
                    room: r,
                    branch,
                    calculation: calc,
                    diff: calc ? calc.finalTotal - calculation.finalTotal : 0
                };
            })
            .sort((a, b) => (a.calculation?.finalTotal || 0) - (b.calculation?.finalTotal || 0));
    }, [calculation, roomTypes, branches, compareBranchIds, compareRoomIds, checkIn, checkOut, dateAdjustments, globalAdjustment, stayDiscounts, includeVAT, vatRate, earlyLateOptions]);
}