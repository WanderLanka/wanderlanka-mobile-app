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

// Enhanced booking interfaces for accommodation and transportation
export type CreateAccommodationBookingRequest = {
  serviceType: 'accommodation';
  serviceId: string; // accommodation ID
  serviceName: string;
  serviceProvider: string; // accommodation provider ID
  totalAmount: number;
  currency?: string;
  bookingDetails: {
    checkInDate: string; // ISO date
    checkOutDate: string; // ISO date
    rooms: number;
    adults: number;
    children?: number;
    nights: number;
    roomBreakdown: Array<{
      roomType: string;
      quantity: number;
      pricePerNight: number;
    }>;
  };
  contactInfo: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    emergencyContact?: string;
  };
  paymentDetails: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
  };
};

export type CreateTransportationBookingRequest = {
  serviceType: 'transportation';
  serviceId: string; // transportation ID
  serviceName: string;
  serviceProvider: string; // transportation provider ID
  totalAmount: number;
  currency?: string;
  bookingDetails: {
    startDate: string; // ISO date
    days: number;
    passengers: number;
    pickupLocation: string;
    dropoffLocation: string;
    estimatedDistance?: number;
    pricingPerKm: number;
    vehicleType: string;
    departureTime?: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    emergencyContact?: string;
  };
  paymentDetails: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
  };
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
  status: 'pending' | 'approved' | 'confirmed' | 'completed' | 'cancelled' | 'declined';
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

  // Enhanced booking methods for accommodation and transportation
  async createAccommodationBooking(payload: CreateAccommodationBookingRequest): Promise<BookingResponse> {
    try {
      console.log('🏨 Creating accommodation booking:', payload);
      const response = await ApiService.post<BookingResponse>('/api/booking/enhanced', payload);
      console.log('✅ Accommodation booking created:', response);
      return response;
    } catch (error) {
      console.error('❌ Error creating accommodation booking:', error);
      throw error;
    }
  },

  async createTransportationBooking(payload: CreateTransportationBookingRequest): Promise<BookingResponse> {
    try {
      console.log('🚗 Creating transportation booking:', payload);
      const response = await ApiService.post<BookingResponse>('/api/booking/enhanced', payload);
      console.log('✅ Transportation booking created:', response);
      return response;
    } catch (error) {
      console.error('❌ Error creating transportation booking:', error);
      throw error;
    }
  },

  async createCheckoutSession(payload: CreateAccommodationBookingRequest | CreateTransportationBookingRequest): Promise<BookingResponse> {
    try {
      console.log('💳 Creating checkout session:', payload);
      const response = await ApiService.post<BookingResponse>('/api/booking/payments/create-session', payload);
      console.log('✅ Checkout session created:', response);
      return response;
    } catch (error) {
      console.error('❌ Error creating checkout session:', error);
      throw error;
    }
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
  async declineTourPackageBooking(id: string, reason?: string): Promise<BookingResponse<TourPackageBookingItem>> {
    return ApiService.post<BookingResponse>(`/api/booking/tourpackage_booking/decline/${encodeURIComponent(id)}`, { reason });
  },
  async payTourPackageBooking(id: string): Promise<BookingResponse<TourPackageBookingItem>> {
    return ApiService.post<BookingResponse>(`/api/booking/tourpackage_booking/pay/${encodeURIComponent(id)}`);
  },
  async completeTourPackageBooking(id: string): Promise<BookingResponse<TourPackageBookingItem>> {
    return ApiService.post<BookingResponse>(`/api/booking/tourpackage_booking/complete/${encodeURIComponent(id)}`);
  },
  async cancelTourPackageBooking(id: string): Promise<BookingResponse<TourPackageBookingItem>> {
    return ApiService.post<BookingResponse>(`/api/booking/tourpackage_booking/cancel/${encodeURIComponent(id)}`);
  }
};
