export interface Amenities {
  includedVi: string[];
  includedEn: string[];
  excludedVi: string[];
  excludedEn: string[];
}

export interface Room {
  id: string;
  name: string;
  nameEn: string;
  area: string;
  priceSunThu: string;
  priceSunThuEn: string;
  priceFriSat: string;
  priceFriSatEn: string;
  priceMonthUnder3: string;
  priceMonthUnder3En: string;
  priceMonthOver3: string;
  priceMonthOver3En: string;
  amenities: Amenities;
  longTermAmenities?: Amenities;
  imageUrls: string[];
  cloudinaryTag?: string;
  feesVi: string[];
  feesEn: string[];
  warningVi?: string;
  warningEn?: string;
}

export interface Accommodation {
  id: string;
  name: string;
  address: string;
  rooms: Room[];
  description?: string;
  policies?: any;
  policiesEn?: any;
  amenities?: Amenities;
  longTermAmenities?: Amenities;
}

export type Language = 'en' | 'vi';
