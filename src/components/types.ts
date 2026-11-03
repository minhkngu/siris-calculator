import type { ServiceRule } from '../lib/serviceRules';

export interface StayDiscount {
    id: string;
    minNights: number;
    discountAmount: number;
    isPercentage: boolean;
    name: string;
    description?: string | null;
    branchId: string | null;
    roomTypeId: string | null;
    stayStart: string | null;
    stayEnd: string | null;
    discountBasis: 'per_night' | 'per_stay';
    maxDiscountPerNight: number | null;
    maxDiscountPerStay: number | null;
    priority: number;
    isActive: boolean;
    selectionMode?: 'automatic' | 'manual';
}

export interface Branch {
    id: string;
    name: string;
    address?: string;
}

export interface RoomType {
    id: string;
    branchId: string;
    name: string;
    weekdayPrice: number;
    weekendPrice: number;
    isHidden?: boolean;
}

export interface DateAdjustment {
    id: string;
    date: string;
    type: 'surcharge' | 'discount';
    amount: number;
    isPercentage: boolean;
    note: string;
}

export interface GlobalAdjustment {
    type: 'surcharge' | 'discount';
    amount: number;
    isPercentage: boolean;
    googleReviews?: boolean;
    selectedPromotionIds?: string[];
    serviceRules?: readonly ServiceRule[];
}

export type EarlyCheckinLateCheckoutType = string;

export interface NightBreakdown {
    date: string;
    isWeekend: boolean;
    basePrice: number;
    adjustments: DateAdjustment[];
    finalPrice: number;
    vatPerNight: number;
}

export interface CalculationResult {
    nights: NightBreakdown[];
    totalBase: number;
    globalAdjustmentValue: number;
    googleReviewsDiscount: number;
    manualDiscounts: { promotion: StayDiscount; amount: number }[];
    stayDiscount: StayDiscount | undefined;
    stayDiscountValue: number;
    earlyLateTotal: number;
    serviceDetails?: { label: string; amount: number }[];
    promotionNightPrices?: number[];
    previousNightPrice: number;
    nextNightPrice: number;
    vatValue: number;
    finalTotal: number;
    deposit: number;
}

export interface ComparisonItem {
    room: RoomType;
    branch: Branch | undefined;
    calculation: CalculationResult | null;
    diff: number;
}

export interface Item {
    id: string;
    item_name: string;
    kind: string | null;
    quantity: number;
    unit_price: number;
}

export interface SelectedRoomItem {
    id: string;
    branchId: string;
    roomId: string;
    checkIn: string;
    checkOut: string;
    earlyLateOptions: Set<EarlyCheckinLateCheckoutType>;
    isIncluded?: boolean;
}

export interface MultiRoomCalculationItem {
    item: SelectedRoomItem;
    room: RoomType | undefined;
    branch: Branch | undefined;
    calculation: CalculationResult | null;
}

export interface MultiRoomTotalSummary {
    items: MultiRoomCalculationItem[];
    totalRooms: number;
    totalNights: number;
    totalBase: number;
    totalStayDiscounts: number;
    totalEarlyLate: number;
    globalAdjustmentValue: number;
    googleReviewsDiscount: number;
    manualDiscounts: { promotion: StayDiscount; amount: number }[];
    vatValue: number;
    finalTotal: number;
    deposit: number;
}
