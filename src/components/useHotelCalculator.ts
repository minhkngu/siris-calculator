import { useMemo } from 'react';
import type { RoomType, DateAdjustment, GlobalAdjustment, StayDiscount, EarlyCheckinLateCheckoutType, CalculationResult } from './types';
import { calculateForRoomLogic, calculateMultiRoomLogic, EMPTY_EARLY_LATE_OPTIONS } from '../lib/hotelCalculator';

export function useCalculateForRoom(
    room: RoomType | undefined,
    checkIn: string,
    checkOut: string,
    dateAdjustments: DateAdjustment[],
    globalAdjustment: GlobalAdjustment,
    stayDiscounts: StayDiscount[],
    includeVAT: boolean,
    vatRate: number,
    earlyLateOptions: ReadonlySet<EarlyCheckinLateCheckoutType> = EMPTY_EARLY_LATE_OPTIONS
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
    earlyLateOptions: ReadonlySet<EarlyCheckinLateCheckoutType> = EMPTY_EARLY_LATE_OPTIONS
) {
    return useMemo(() => {
        if (!selectedRoom || !calculation) return [];

        const branchIds = new Set(compareBranchIds);
        const roomIds = new Set(compareRoomIds);
        const branchesById = new Map(branches.map(branch => [branch.id, branch]));
        return roomTypes
            .filter(r =>
                (branchIds.size === 0 || branchIds.has(r.branchId)) &&
                (roomIds.size === 0 || roomIds.has(r.id))
            )
            .map(r => {
                const calc = r === selectedRoom ? calculation : calculateForRoomLogic(r, checkIn, checkOut, dateAdjustments, globalAdjustment, stayDiscounts, includeVAT, vatRate, earlyLateOptions);
                const branch = branchesById.get(r.branchId);
                return {
                    room: r,
                    branch,
                    calculation: calc,
                    diff: calc ? calc.finalTotal - calculation.finalTotal : 0
                };
            })
            .sort((a, b) => (a.calculation?.finalTotal || 0) - (b.calculation?.finalTotal || 0));
    }, [selectedRoom, calculation, roomTypes, branches, compareBranchIds, compareRoomIds, checkIn, checkOut, dateAdjustments, globalAdjustment, stayDiscounts, includeVAT, vatRate, earlyLateOptions]);
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