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
  date: string; // ISO string YYYY-MM-DD
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
