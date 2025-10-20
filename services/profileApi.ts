import { ApiService } from './api';

// TypeScript interfaces
export interface EmergencyContact {
  name: string | null;
  phone: string | null;
  relationship: string | null;
}

export interface UserPreferences {
  budget: 'Budget' | 'Mid-range' | 'Luxury' | null;
  accommodation: 'Hotel' | 'Hostel' | 'Guesthouse' | 'Resort' | 'Airbnb' | null;
  dietary: string | null;
  interests: string[];
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  status: 'active' | 'pending' | 'suspended' | 'rejected';
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  platform: 'web' | 'mobile';
  memberSince: string;
  verified: boolean;
  bio: string | null;
  dateOfBirth: string | null;
  gender: 'Male' | 'Female' | 'Other' | null;
  nationality: string | null;
  passportNumber: string | null;
  emergencyContact: EmergencyContact;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  nationality?: string;
  passportNumber?: string;
  emergencyContact?: EmergencyContact;
  preferences?: UserPreferences;
}

export interface AccountStatus {
  status: 'active' | 'pending' | 'suspended' | 'rejected';
  isActive: boolean;
  emailVerified: boolean;
}

/**
 * Get user profile
 * @returns Promise<UserProfile>
 */
export const getProfile = async (): Promise<UserProfile> => {
  const response = await ApiService.get<any>('/api/auth/profile');
  // Backend returns { message, user: {...} }
  // We need to extract the user property
  return response.user || response.data || response;
};

/**
 * Update user profile
 * @param data - Profile data to update (username, email)
 * @returns Promise<UserProfile>
 */
export const updateProfile = async (data: UpdateProfileData): Promise<UserProfile> => {
  const response = await ApiService.put<any>('/api/auth/profile', data);
  // Backend returns { message, user: {...} }
  return response.user || response.data || response;
};

/**
 * Get account status
 * @returns Promise<AccountStatus>
 */
export const getAccountStatus = async (): Promise<AccountStatus> => {
  const response = await ApiService.get<any>('/api/auth/profile/status');
  // Backend returns { message, data: {...} }
  return response.data || response;
};

/**
 * Toggle account status (activate/deactivate)
 * @param isActive - true to activate, false to deactivate
 * @returns Promise<any>
 */
export const toggleAccountStatus = async (isActive: boolean): Promise<any> => {
  const response = await ApiService.put<any>('/api/auth/profile/account-status', { isActive });
  return response.data || response;
};

/**
 * Delete account (soft delete - deactivates account)
 * @param password - User password for verification
 * @param confirmation - Must be "DELETE MY ACCOUNT"
 * @returns Promise<any>
 */
export const deleteAccount = async (password: string, confirmation: string): Promise<any> => {
  const response = await ApiService.delete<any>('/api/auth/profile/delete-account', {
    password,
    confirmation
  });
  return response.data || response;
};

export default {
  getProfile,
  updateProfile,
  getAccountStatus,
  toggleAccountStatus,
  deleteAccount,
};
