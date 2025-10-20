import { ApiService } from './api';

/**
 * Transportation API Service
 * Handles all transportation-related API calls
 */
export class TransportationApiService {
  private static readonly TRANSPORTATION_ENDPOINT = '/api/transport';

  /**
   * Get all transportation vehicles (public endpoint)
   */
  static async getAllTransportation(): Promise<TransportationResponse> {
    try {
      console.log('🚗 Fetching all transportation...');
      
      const response = await ApiService.get<TransportationResponse>(
        `${this.TRANSPORTATION_ENDPOINT}/transportation`
      );
      
      console.log('✅ Transportation fetched successfully:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching transportation:', error);
      throw new Error(error.message || 'Failed to fetch transportation');
    }
  }

  /**
   * Get transportation by ID
   */
  static async getTransportationById(id: string): Promise<TransportationDetailResponse> {
    try {
      console.log('🚗 Fetching transportation by ID:', id);
      
      const response = await ApiService.get<TransportationDetailResponse>(
        `${this.TRANSPORTATION_ENDPOINT}/transportation/${id}`
      );
      
      console.log('✅ Transportation details fetched successfully:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching transportation details:', error);
      throw new Error(error.message || 'Failed to fetch transportation details');
    }
  }

  /**
   * Search transportation with filters
   */
  static async searchTransportation(filters: TransportationFilters): Promise<TransportationResponse> {
    try {
      console.log('🔍 Searching transportation with filters:', filters);
      
      const queryParams = new URLSearchParams();
      
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.vehicleType) queryParams.append('vehicleType', filters.vehicleType);
      if (filters.minSeats) queryParams.append('minSeats', filters.minSeats.toString());
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice.toString());
      if (filters.ac) queryParams.append('ac', filters.ac.toString());
      if (filters.fuelType) queryParams.append('fuelType', filters.fuelType);
      
      const queryString = queryParams.toString();
      const url = queryString 
        ? `${this.TRANSPORTATION_ENDPOINT}/transportation?${queryString}`
        : `${this.TRANSPORTATION_ENDPOINT}/transportation`;
      
      const response = await ApiService.get<TransportationResponse>(url);
      
      console.log('✅ Transportation search completed:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error searching transportation:', error);
      throw new Error(error.message || 'Failed to search transportation');
    }
  }
}

/**
 * Type definitions for transportation data
 */
export interface Transportation {
  _id: string;
  userId: string;
  vehicleType: 'car' | 'van' | 'bus';
  brand: string;
  model: string;
  seats: number;
  ac: boolean;
  availability: 'available' | 'unavailable';
  pricingPerKm: number;
  licensePlate: string;
  year: number;
  fuelType: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  driverName: string;
  driverPhone: string;
  driverLicense: string;
  insuranceNumber: string;
  description: string;
  features: string[];
  images: string[];
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransportationResponse {
  success: boolean;
  data: Transportation[];
  count: number;
  message?: string;
}

export interface TransportationDetailResponse {
  success: boolean;
  data: Transportation;
  message?: string;
}

export interface TransportationFilters {
  location?: string;
  vehicleType?: 'car' | 'van' | 'bus';
  minSeats?: number;
  maxPrice?: number;
  ac?: boolean;
  fuelType?: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
}

// Export the service as default
export default TransportationApiService;



