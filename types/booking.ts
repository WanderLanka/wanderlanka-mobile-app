export type CurrencyCode = 'USD' | 'LKR' | string;

export interface PricingInfo {
  currency: CurrencyCode;
  unitAmount: number;
  totalAmount: number;
  perPerson?: boolean;
}

export interface TourPackageBooking {
  _id: string;
  tourPackageId: string;
  packageTitle: string;
  packageSlug?: string;
  guideId?: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  peopleCount: number;
  pricing: PricingInfo;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt?: string;
}
