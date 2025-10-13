import {
  AuthResponse,
  LoginRequest,
  SignUpRequest,
  User,
} from '../types';

import { API_CONFIG } from './config';
import { ApiService } from './api';
import { StorageService } from './storage';

/**
 * Authentication Service with dynamic server detection
 */
export class AuthService {
  private static readonly AUTH_ENDPOINT = API_CONFIG.ENDPOINTS.AUTH;

  /**
   * Sign up a new user
   */
  static async signUp(userData: SignUpRequest): Promise<AuthResponse> {
    try {
      console.log('🔗 Signup request:', { ...userData, password: '[HIDDEN]' });
      
      // Use direct fetch for signup to match login implementation
      const response = await fetch(`${API_CONFIG.BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-platform': 'mobile',
        },
        body: JSON.stringify(userData),
      });

      console.log('📡 Signup response status:', response.status);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        console.error('❌ Non-JSON signup response:', text);
        throw new Error('Server returned invalid response format');
      }

      console.log('📡 Signup response data:', data);

      // Handle success responses
      if (response.ok && data.success) {
        // Store tokens if signup successful and tokens are provided
        if (data.data?.accessToken && data.data?.refreshToken) {
          await StorageService.setAccessToken(data.data.accessToken);
          await StorageService.setRefreshToken(data.data.refreshToken);
          await StorageService.setUserData(data.data.user);
        }
        return data;
      }

      // Handle error responses
      if (!response.ok) {
        const errorMessage = data.message || data.error || `HTTP ${response.status}`;
        console.error('❌ Signup error:', errorMessage);
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      
      // Handle different types of signup errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        // Network or timeout errors
        if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        
        // Server errors (5xx)
        if (errorMessage.includes('http 5') || errorMessage.includes('internal server error')) {
          throw new Error('Server error. Please try again later.');
        }
        
        // Validation errors (400)
        if (errorMessage.includes('http 400') || errorMessage.includes('validation')) {
          throw new Error(error.message);
        }
        
        // User already exists (400)
        if (errorMessage.includes('already exists')) {
          throw new Error(error.message);
        }
        
        // Use original message for other errors
        throw error;
      }
      
      // Fallback for unknown errors
      throw new Error('Sign up failed. Please try again.');
    }
  }

  /**
   * Login user
   */
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Use direct fetch for login to handle 403 responses properly
      const response = await fetch(`${API_CONFIG.BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-platform': 'mobile',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      
      console.log('📡 Login response status:', response.status);
      console.log('📡 Login response data:', JSON.stringify(data, null, 2));

      // Handle success responses
      if (response.ok && data.success) {
        // Store tokens if login successful
        if (data.data?.accessToken && data.data?.refreshToken) {
          await StorageService.setAccessToken(data.data.accessToken);
          await StorageService.setRefreshToken(data.data.refreshToken);
          await StorageService.setUserData(data.data.user);
        }
        return data;
      }

      // Handle 403 Forbidden (account status issues) as valid responses
      if (response.status === 403) {
        return {
          success: false,
          message: data.message || 'Account status issue',
          error: data.error || data.message || 'Account access restricted'
        };
      }

      // Handle other error responses
      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different types of login errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        // Network or timeout errors
        if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        
        // Server errors (5xx)
        if (errorMessage.includes('http 5') || errorMessage.includes('internal server error')) {
          throw new Error('Server error. Please try again later.');
        }
        
        // Invalid credentials (401)
        if (errorMessage.includes('http 401') || 
            errorMessage.includes('invalid credentials') || 
            errorMessage.includes('unauthorized')) {
          throw new Error('Invalid username/email or password. Please check your credentials and try again.');
        }
        
        // Use original message for other errors
        throw error;
      }
      
      // Fallback for unknown errors
      throw new Error('Login failed. Please try again.');
    }
  }

  /**
   * Complete guide registration with additional details
   */
  static async completeGuideRegistration(data: {
    username: string;
    email: string;
    password: string;
    role: 'guide';
    guideDetails: {
      firstName: string;
      lastName: string;
      nicNumber: string;
      dateOfBirth: string;
      proofDocument: {
        uri: string;
        name: string;
        type: string;
      };
    };
  }): Promise<void> {
    try {
      // For now, send as JSON instead of FormData to simplify debugging
      const requestData = {
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role,
        firstName: data.guideDetails.firstName,
        lastName: data.guideDetails.lastName,
        nicNumber: data.guideDetails.nicNumber,
        dateOfBirth: data.guideDetails.dateOfBirth,
        // Skip file upload for now - just indicate document was provided
        proofDocumentProvided: true
      };

      // Construct the API URL
      const apiUrl = `${API_CONFIG.BASE_URL}${this.AUTH_ENDPOINT}/guide-registration`;
      console.log('🔗 Guide registration API URL:', apiUrl);
      console.log('📤 Guide registration data:', requestData);
      
      // Make API call with JSON data
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('📡 Guide registration response status:', response.status);
      console.log('📡 Guide registration response headers:', Object.fromEntries(response.headers.entries()));

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      console.log('📄 Response content-type:', contentType);
      
      if (!response.ok) {
        // Handle non-JSON error responses (like HTML error pages)
        if (contentType && contentType.includes('application/json')) {
          const errorResult = await response.json();
          console.error('❌ JSON error response:', errorResult);
          throw new Error(errorResult.message || `Server error: ${response.status}`);
        } else {
          const errorText = await response.text();
          console.error('❌ Non-JSON error response:', errorText);
          throw new Error(`Server error: ${response.status} - ${response.statusText}`);
        }
      }

      // Parse JSON response only if content-type is JSON
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        console.log('✅ Guide registration success response:', result);
        if (!result.success) {
          throw new Error(result.message || 'Guide registration failed');
        }
      } else {
        // If server doesn't return JSON, assume success if status is OK
        const responseText = await response.text();
        console.log('✅ Non-JSON success response:', responseText);
      }

      // Registration successful - the user will need to wait for approval
    } catch (error) {
      console.error('Guide registration error:', error);
      throw new Error(error instanceof Error ? error.message : 'Guide registration failed');
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      const refreshToken = await StorageService.getRefreshToken();
      
      // Call logout endpoint
      await ApiService.post<AuthResponse>(`${this.AUTH_ENDPOINT}/logout`, {
        refreshToken,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local storage
      await StorageService.clearAuthData();
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<User | null> {
    try {
      const response = await ApiService.get<AuthResponse>(
        `${this.AUTH_ENDPOINT}/profile`
      );

      if (response.success && response.data) {
        // Update stored user data
        await StorageService.setUserData(response.data.user);
        return response.data.user;
      }

      return null;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await StorageService.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await ApiService.post<AuthResponse>(
        `${this.AUTH_ENDPOINT}/refresh`,
        { refreshToken }
      );

      if (response.success && response.data?.accessToken && response.data?.refreshToken) {
        await StorageService.setAccessToken(response.data.accessToken);
        await StorageService.setRefreshToken(response.data.refreshToken);
        await StorageService.setUserData(response.data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const isLoggedIn = await StorageService.isLoggedIn();
      if (!isLoggedIn) {
        return false;
      }

      // Try to get profile to validate token
      const profile = await this.getProfile();
      return profile !== null;
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  }

  /**
   * Get current user from storage
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      return await StorageService.getUserData();
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Check if user has specific role
   */
  static async hasRole(role: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user?.role === role;
    } catch (error) {
      console.error('Role check error:', error);
      return false;
    }
  }

  /**
   * Check if user is a traveller
   */
  static async isTraveller(): Promise<boolean> {
    return this.hasRole('traveller');
  }

  /**
   * Check if user is a guide
   */
  static async isGuide(): Promise<boolean> {
    return this.hasRole('guide');
  }
}
