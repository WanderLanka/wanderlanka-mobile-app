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

export type TourPackageBookingItem = {
  _id: string;
  userId: string;
  tourPackageId: string;
  packageTitle: string;
  packageSlug?: string;
  guideId?: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  peopleCount: number;
  pricing: {
    currency: string;
    unitAmount: number;
    totalAmount: number;
    perPerson?: boolean;
  };
  status: 'pending' | 'approved' | 'confirmed' | 'cancelled';
  payment?: any;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export const BookingService = {
  async createTourPackageBooking(payload: CreateTourPackageBookingRequest): Promise<BookingResponse> {
    // Gateway path
    return ApiService.post<BookingResponse>(`/api/booking/tourpackage_booking/create`, payload);
  },
  async getBooking(id: string): Promise<BookingResponse> {
    return ApiService.get<BookingResponse>(`/api/booking/tourpackage_booking/get/${encodeURIComponent(id)}`);
  },
  async listTourPackageBookings(params: { userId?: string; tourPackageId?: string; status?: string; guideId?: string } = {}): Promise<BookingResponse<TourPackageBookingItem[]>> {
    const qs = new URLSearchParams();
    if (params.userId) qs.set('userId', params.userId);
    if (params.tourPackageId) qs.set('tourPackageId', params.tourPackageId);
    if (params.status) qs.set('status', params.status);
    if (params.guideId) qs.set('guideId', params.guideId);
    const query = qs.toString();
    const url = `/api/booking/tourpackage_booking/list${query ? `?${query}` : ''}`;
    return ApiService.get<BookingResponse<TourPackageBookingItem[]>>(url);
  },
  async approveTourPackageBooking(id: string): Promise<BookingResponse<TourPackageBookingItem>> {
    return ApiService.post<BookingResponse>(`/api/booking/tourpackage_booking/approve/${encodeURIComponent(id)}`);
  },
  async payTourPackageBooking(id: string): Promise<BookingResponse<TourPackageBookingItem>> {
    return ApiService.post<BookingResponse>(`/api/booking/tourpackage_booking/pay/${encodeURIComponent(id)}`);
  }
  ,
  async cancelTourPackageBooking(id: string): Promise<BookingResponse<TourPackageBookingItem>> {
    return ApiService.post<BookingResponse>(`/api/booking/tourpackage_booking/cancel/${encodeURIComponent(id)}`);
  }
};
