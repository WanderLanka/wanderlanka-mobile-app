import { apiClient } from '../src/services/api/client';

export interface PaymentIntentRequest {
  serviceType: 'accommodation' | 'transportation' | 'guide';
  serviceId: string;
  serviceProvider?: string;
  totalAmount: number;
  bookingDetails: any;
  contactInfo: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
  };
  guestDetails?: any;
  // Service-specific fields
  accommodationId?: string;
  checkInDate?: string;
  checkOutDate?: string;
  selectedRooms?: any[];
  transportId?: string;
  vehicleId?: string;
  transportProviderId?: string;
  startDate?: string;
  days?: number;
  passengers?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  estimatedDistance?: number;
  pricingPerKm?: number;
  pricePerKm?: number;
  vehicleType?: string;
  departureTime?: string;
}

export interface PaymentIntentResponse {
  success: boolean;
  clientSecret: string;
  paymentIntentId: string;
  bookingId: string;
  confirmationNumber: string;
  amount: number;
  currency: string;
}

export interface PaymentConfirmRequest {
  paymentIntentId: string;
  bookingId: string;
}

export interface PaymentConfirmResponse {
  success: boolean;
  message: string;
  data: {
    bookingId: string;
    confirmationNumber: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    currency: string;
  };
}

export interface PaymentStatusResponse {
  success: boolean;
  paymentIntentId: string;
  status: string;
  amount: number;
  currency: string;
}

/**
 * Payment Service for handling Stripe payments in the mobile app
 */
class PaymentService {
  /**
   * Create a payment intent for booking
   * @param data Payment intent request data
   * @returns Payment intent with client secret
   */
  async createPaymentIntent(data: PaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      console.log('💳 Creating payment intent:', {
        serviceType: data.serviceType,
        amount: data.totalAmount
      });

      const response = await apiClient.post<PaymentIntentResponse>(
        '/api/booking/payments/create-intent',
        data
      );

      console.log('✅ Payment intent created:', {
        paymentIntentId: response.data.paymentIntentId,
        bookingId: response.data.bookingId
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create payment intent:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to create payment intent'
      );
    }
  }

  /**
   * Confirm payment after successful Stripe payment
   * @param data Payment confirmation request
   * @returns Booking confirmation details
   */
  async confirmPayment(data: PaymentConfirmRequest): Promise<PaymentConfirmResponse> {
    try {
      console.log('✅ Confirming payment:', {
        paymentIntentId: data.paymentIntentId,
        bookingId: data.bookingId
      });

      const response = await apiClient.post<PaymentConfirmResponse>(
        '/api/booking/payments/confirm',
        data
      );

      console.log('✅ Payment confirmed:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to confirm payment:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to confirm payment'
      );
    }
  }

  /**
   * Get payment status
   * @param paymentIntentId Stripe payment intent ID
   * @returns Payment status
   */
  async getPaymentStatus(paymentIntentId: string): Promise<PaymentStatusResponse> {
    try {
      console.log('🔍 Getting payment status:', { paymentIntentId });

      const response = await apiClient.get<PaymentStatusResponse>(
        `/api/booking/payments/status/${paymentIntentId}`
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get payment status:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to get payment status'
      );
    }
  }

  /**
   * Cancel payment intent
   * @param paymentIntentId Stripe payment intent ID
   * @param bookingId Booking ID (optional)
   * @returns Cancellation confirmation
   */
  async cancelPaymentIntent(
    paymentIntentId: string,
    bookingId?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚫 Cancelling payment intent:', {
        paymentIntentId,
        bookingId
      });

      const response = await apiClient.post(
        '/api/booking/payments/cancel-intent',
        { paymentIntentId, bookingId }
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to cancel payment intent:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to cancel payment intent'
      );
    }
  }

  /**
   * Format amount for display
   * @param amount Amount in currency units
   * @param currency Currency code
   * @returns Formatted amount string
   */
  formatAmount(amount: number, currency: string = 'LKR'): string {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Calculate service fee
   * @param subtotal Subtotal amount
   * @param serviceType Type of service
   * @returns Service fee amount
   */
  calculateServiceFee(
    subtotal: number,
    serviceType: 'accommodation' | 'transportation' | 'guide'
  ): number {
    // Different service fees based on service type
    const feeStructure = {
      accommodation: 25, // Fixed fee
      transportation: 500, // Fixed fee
      guide: 100 // Fixed fee
    };

    return feeStructure[serviceType] || 0;
  }

  /**
   * Calculate total amount with service fee
   * @param subtotal Subtotal amount
   * @param serviceType Type of service
   * @returns Total amount including service fee
   */
  calculateTotalAmount(
    subtotal: number,
    serviceType: 'accommodation' | 'transportation' | 'guide'
  ): number {
    const serviceFee = this.calculateServiceFee(subtotal, serviceType);
    return subtotal + serviceFee;
  }
}

export const paymentService = new PaymentService();

