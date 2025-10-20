import { ApiService } from './api';

/**
 * Accommodation API Service
 * Handles all accommodation-related API calls
 */
export class AccommodationApiService {
  private static readonly ACCOMMODATION_ENDPOINT = '/api/accommodation';

  /**
   * Get all accommodations (public endpoint)
   */
  static async getAllAccommodations(): Promise<AccommodationResponse> {
    try {
      console.log('🏨 Fetching all accommodations...');
      
      const response = await ApiService.get<AccommodationResponse>(
        `${this.ACCOMMODATION_ENDPOINT}/accommodations`
      );
      
      console.log('✅ Accommodations fetched successfully:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching accommodations:', error);
      throw new Error(error.message || 'Failed to fetch accommodations');
    }
  }

  /**
   * Get accommodation by ID
   */
  static async getAccommodationById(id: string): Promise<AccommodationDetailResponse> {
    try {
      console.log('🏨 Fetching accommodation by ID:', id);
      
      const response = await ApiService.get<AccommodationDetailResponse>(
        `${this.ACCOMMODATION_ENDPOINT}/accommodations/${id}`
      );
      
      console.log('✅ Accommodation details fetched successfully:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching accommodation details:', error);
      throw new Error(error.message || 'Failed to fetch accommodation details');
    }
  }

  /**
   * Search accommodations with filters
   */
  static async searchAccommodations(filters: AccommodationFilters): Promise<AccommodationResponse> {
    try {
      console.log('🔍 Searching accommodations with filters:', filters);
      
      const queryParams = new URLSearchParams();
      
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice.toString());
      if (filters.accommodationType) queryParams.append('accommodationType', filters.accommodationType);
      if (filters.minRating) queryParams.append('minRating', filters.minRating.toString());
      
      const queryString = queryParams.toString();
      const url = queryString 
        ? `${this.ACCOMMODATION_ENDPOINT}/accommodations?${queryString}`
        : `${this.ACCOMMODATION_ENDPOINT}/accommodations`;
      
      const response = await ApiService.get<AccommodationResponse>(url);
      
      console.log('✅ Accommodation search completed:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error searching accommodations:', error);
      throw new Error(error.message || 'Failed to search accommodations');
    }
  }
}

/**
 * Type definitions for accommodation data
 */
export interface Accommodation {
  _id: string;
  userId: string;
  name: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  accommodationType: 'hotel' | 'resort' | 'guesthouse' | 'homestay';
  totalRooms: number;
  phone: string;
  checkInTime: string;
  checkOutTime: string;
  price: number;
  images: string[];
  description: string;
  rating: number;
  amenities: string[];
  roomTypes: RoomType[];
  reviews: number;
  nearbyAttractions: NearbyAttraction[];
  policies: string[];
  userReviews: UserReview[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface RoomType {
  type: 'luxury' | 'deluxe' | 'normal';
  pricePerNight: number;
  totalRooms: number;
  availableRooms: number;
  size?: string;
  occupancy?: number;
}

export interface NearbyAttraction {
  name: string;
  type: string;
  distance: string;
}

export interface UserReview {
  name: string;
  profileImage: string;
  rating: number;
  review: string;
  date: string;
  helpful: number;
}

export interface AccommodationResponse {
  success: boolean;
  data: Accommodation[];
  count: number;
  message?: string;
}

export interface AccommodationDetailResponse {
  success: boolean;
  data: Accommodation;
  message?: string;
}

export interface AccommodationFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  accommodationType?: string;
  minRating?: number;
}

// Export the service as default
export default AccommodationApiService;
