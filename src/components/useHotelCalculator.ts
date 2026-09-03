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

    // Calculate previous night price (for early check-in from 8:00)
    const previousNightDate = addDays(start, -1);
    const previousNightDayOfWeek = getDay(previousNightDate);
    const previousNightIsWeekend = previousNightDayOfWeek === 5 || previousNightDayOfWeek === 6;
    const previousNightBasePrice = previousNightIsWeekend ? room.weekendPrice : room.weekdayPrice;
    const previousNightDateStr = format(previousNightDate, 'yyyy-MM-dd');
    const previousNightAdjustments = dateAdjustments.filter(adj => adj.date === previousNightDateStr);
    let previousNightPrice = previousNightBasePrice;
    previousNightAdjustments.forEach(adj => {
        const value = adj.isPercentage ? Math.round(previousNightBasePrice * adj.amount / 100) : adj.amount;
        if (adj.type === 'surcharge') {
            previousNightPrice += value;
        } else {
            previousNightPrice -= value;
        }
    });

    // Calculate next night price (for late check-out before 18:00 - the night of check-out day)
    const nextNightDate = end;
    const nextNightDayOfWeek = getDay(nextNightDate);
    const nextNightIsWeekend = nextNightDayOfWeek === 5 || nextNightDayOfWeek === 6;
    const nextNightBasePrice = nextNightIsWeekend ? room.weekendPrice : room.weekdayPrice;
    const nextNightDateStr = format(nextNightDate, 'yyyy-MM-dd');
    const nextNightAdjustments = dateAdjustments.filter(adj => adj.date === nextNightDateStr);
    let nextNightPrice = nextNightBasePrice;
    nextNightAdjustments.forEach(adj => {
        const value = adj.isPercentage ? Math.round(nextNightBasePrice * adj.amount / 100) : adj.amount;
        if (adj.type === 'surcharge') {
            nextNightPrice += value;
        } else {
            nextNightPrice -= value;
        }
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
    if (earlyLateOptions.has('early_0800')) {
        // 50% of price of the previous night (the night before check-in)
        earlyLateTotal += Math.round(previousNightPrice * 50 / 100);
    }
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
        const checkoutDayOfWeek = getDay(end);
        const isWeekendCheckout = checkoutDayOfWeek === 5 || checkoutDayOfWeek === 6;
        if (!isWeekendCheckout) {
            // 80% of price of the next night (the night of check-out day), not allowed on Fri/Sat
            earlyLateTotal += Math.round(nextNightPrice * 80 / 100);
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
        previousNightPrice,
        nextNightPrice,
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

export function calculateMultiRoomLogic(
    selectedRooms: import('./types').SelectedRoomItem[],
    roomTypes: RoomType[],
    branches: { id: string; name: string; address?: string }[],
    dateAdjustments: DateAdjustment[],
    globalAdjustment: GlobalAdjustment,
    stayDiscounts: StayDiscount[],
    includeVAT: boolean,
    vatRate: number
): import('./types').MultiRoomTotalSummary {
    const zeroGlobalAdj: GlobalAdjustment = { type: 'discount', amount: 0, isPercentage: false };

    let totalBase = 0;
    let totalStayDiscounts = 0;
    let totalEarlyLate = 0;
    let totalNights = 0;
    let includedRoomsCount = 0;

    const items: import('./types').MultiRoomCalculationItem[] = selectedRooms.map(item => {
        const isIncluded = item.isIncluded !== false; // default to true if undefined
        const room = roomTypes.find(r => r.id === item.roomId);
        const branch = branches.find(b => b.id === item.branchId);

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

    let combinedSubtotal = totalBase - totalStayDiscounts + totalEarlyLate;

    // Apply global adjustment on combined subtotal
    const globalValue = globalAdjustment.isPercentage
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

export function useMultiRoomCalculator(
    selectedRooms: import('./types').SelectedRoomItem[],
    roomTypes: RoomType[],
    branches: { id: string; name: string; address?: string }[],
    dateAdjustments: DateAdjustment[],
    globalAdjustment: GlobalAdjustment,
    stayDiscounts: StayDiscount[],
    includeVAT: boolean,
    vatRate: number
) {
    return useMemo(() => {
        return calculateMultiRoomLogic(
            selectedRooms,
            roomTypes,
            branches,
            dateAdjustments,
            globalAdjustment,
            stayDiscounts,
            includeVAT,
            vatRate
        );
    }, [selectedRooms, roomTypes, branches, dateAdjustments, globalAdjustment, stayDiscounts, includeVAT, vatRate]);
}