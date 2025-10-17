import { ApiService } from './api';

export type CreateTourPackageBookingRequest = {
  tourPackageId: string;
  packageTitle: string;
  packageSlug?: string;
  guideId?: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  peopleCount: number;
  pricing: {
    currency: string;
    unitAmount: number;
    totalAmount: number;
    perPerson?: boolean;
  };
  notes?: string;
  paymentMethod?: 'mock' | 'card';
};

export type BookingResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export const BookingService = {
  async createTourPackageBooking(payload: CreateTourPackageBookingRequest): Promise<BookingResponse> {
    // Gateway path
    return ApiService.post<BookingResponse>(`/api/booking/tourpackage_booking/create`, payload);
  },
  async getBooking(id: string): Promise<BookingResponse> {
    return ApiService.get<BookingResponse>(`/api/booking/tourpackage_booking/get/${encodeURIComponent(id)}`);
  },
};
