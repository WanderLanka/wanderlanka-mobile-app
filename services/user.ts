import { ApiService } from './api';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'traveller' | 'guide' | 'admin' | 'accommodation_provider' | 'transport_provider' | 'traveler';
  status: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  platform?: string;
  phone?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
  guideDetails?: any;
}

export interface UserDetailsResponse {
  success: boolean;
  data?: UserProfile;
  error?: string;
  message?: string;
}

/**
 * User Service for fetching user information
 */
class UserServiceClass {
  /**
   * Get user details by user ID
   * @param userId User ID to fetch details for
   * @returns User profile information
   */
  async getUserById(userId: string): Promise<UserDetailsResponse> {
    try {
      console.log('📤 Fetching user details:', userId);

      const response = await ApiService.get<any>(`/api/auth/users/${userId}`);

      console.log('🔍 Raw response:', JSON.stringify(response, null, 2));

      // Support either shape:
      // 1) { message, user }
      // 2) { success, data: { user } }
      const user: UserProfile | undefined = response?.user || response?.data?.user;

      if (user) {
        console.log('✅ User details fetched:', user.username);
        return {
          success: true,
          data: user
        };
      }

      console.warn('⚠️ Unexpected response structure:', response);
      return {
        success: false,
        error: 'Invalid response structure'
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch user details:', error);
      return {
        success: false,
        error: error?.message || 'Failed to fetch user details'
      };
    }
  }

  /**
   * Get current user's profile (authenticated)
   * @returns Current user's profile
   */
  async getMyProfile(): Promise<UserDetailsResponse> {
    try {
      console.log('📤 Fetching my profile');

      const response = await ApiService.get<any>('/api/auth/profile');

      console.log('🔍 Profile response:', response);

      const user: UserProfile | undefined = response?.user || response?.data?.user;

      if (user) {
        console.log('✅ Profile fetched:', user.username);
        return {
          success: true,
          data: user
        };
      }

      return {
        success: false,
        error: 'Invalid response structure'
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch profile:', error);
      return {
        success: false,
        error: error?.message || 'Failed to fetch profile'
      };
    }
  }

  /**
   * Format phone number for display
   * @param phone Phone number to format
   * @returns Formatted phone number
   */
  formatPhoneNumber(phone?: string): string {
    if (!phone) return 'N/A';
    
    // Simple formatting for Sri Lankan numbers
    // Example: +94771234567 -> +94 77 123 4567
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('94') && cleaned.length === 11) {
      return `+94 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `0${cleaned.slice(1, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    
    return phone;
  }

  /**
   * Get user's display name
   * @param user User profile
   * @returns Display name
   */
  getDisplayName(user: UserProfile): string {
    if (user.fullName) return user.fullName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.username) return user.username;
    return 'Unknown User';
  }
}

export const UserService = new UserServiceClass();

