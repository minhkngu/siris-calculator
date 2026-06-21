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
}

export type EarlyCheckinLateCheckoutType =
    | 'early_0800'
    | 'early_1230'
    | 'early_1300'
    | 'late_1300'
    | 'late_1800';

export const EARLY_LATE_OPTIONS: { type: EarlyCheckinLateCheckoutType; label: string; description: string; price: number; isPercentage: boolean; percentageRate?: number }[] = [
    { type: 'early_0800', label: 'Check-in sớm từ 8:00', description: 'Nhận phòng từ 8:00 - 12:30', price: 0, isPercentage: true, percentageRate: 50 },
    { type: 'early_1230', label: 'Check-in sớm từ 12:30', description: 'Nhận phòng từ 12:30', price: 150000, isPercentage: false },
    { type: 'early_1300', label: 'Check-in sớm từ 13:00', description: 'Nhận phòng từ 13:00', price: 100000, isPercentage: false },
    { type: 'late_1300', label: 'Check-out trễ trước 13:00', description: 'Trả phòng trước 13:00', price: 100000, isPercentage: false },
    { type: 'late_1800', label: 'Check-out trễ trước 18:00', description: 'Trả phòng trước 18:00', price: 80, isPercentage: true, percentageRate: 80 },
];

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
    earlyLateTotal: number;
    previousNightPrice: number;
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
    id: number;
    item_name: string;
    kind: string | null;
    quantity: number;
    unit_price: number;
}
