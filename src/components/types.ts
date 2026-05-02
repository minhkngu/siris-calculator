export interface StayDiscount {
    id: string;
    minNights: number;
    discountAmount: number;
    isPercentage: boolean;
    name: string;
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
}

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
    stayDiscount: StayDiscount | undefined;
    stayDiscountValue: number;
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