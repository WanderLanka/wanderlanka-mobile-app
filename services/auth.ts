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
      // Ensure server connection before signup
      // Proceed without automatic server detection
      
      console.log('🔗 Signup request:', { ...userData, password: '[HIDDEN]' });
      
      // Use direct fetch for signup to match login implementation
  const response = await fetch(`${API_CONFIG.BASE_URL}${this.AUTH_ENDPOINT}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-type': 'mobile', // Server expects x-client-type, not x-platform
          'x-platform': 'mobile', // Keep for backwards compatibility
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
      // Ensure server connection before login
      // Proceed without automatic server detection
      
      // Use direct fetch for login to handle 403 responses properly
  const response = await fetch(`${API_CONFIG.BASE_URL}${this.AUTH_ENDPOINT}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-type': 'mobile', // Server expects x-client-type, not x-platform
          'x-platform': 'mobile', // Keep for backwards compatibility
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      
      console.log('📡 Login response status:', response.status);
      console.log('📡 Login response data:', JSON.stringify(data, null, 2));

      // Treat account status messages as non-exceptional flow regardless of status code
      const combinedMsg = `${data?.error || ''} ${data?.message || ''}`.toLowerCase();
      if (
        combinedMsg.includes('under review') ||
        combinedMsg.includes('pending approval') ||
        combinedMsg.includes('account pending')
      ) {
        return {
          success: false,
          message: data.message || 'Account pending approval',
          error: data.error || 'Account pending approval'
        } as unknown as AuthResponse;
      }

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
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
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
      // Ensure server connection before critical operation
      // Proceed without automatic server detection
      
      // Backend expects unified /register endpoint (with platform-aware handling)
      // For mobile guide registration, we must send role: 'guide' and guideDetails block
      const payload = {
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role, // 'guide'
        guideDetails: {
          firstName: data.guideDetails.firstName,
          lastName: data.guideDetails.lastName,
          nicNumber: data.guideDetails.nicNumber,
          dateOfBirth: data.guideDetails.dateOfBirth,
        },
      };

      // Primary endpoint: unified register
  const primaryUrl = `${API_CONFIG.BASE_URL}${this.AUTH_ENDPOINT}/register`;
      console.log('🔗 Guide registration primary URL:', primaryUrl);
      console.log('📤 Guide registration payload:', payload);
      
      // Make API call with JSON data; include platform header for backend logic
      let response = await fetch(primaryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-type': 'mobile', // Server expects x-client-type, not x-platform
          'x-platform': 'mobile', // Keep for backwards compatibility
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 Guide registration response status:', response.status);
      console.log('📡 Guide registration response headers:', Object.fromEntries(response.headers.entries()));

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      console.log('📄 Response content-type:', contentType);
      
      // If route not found on primary URL, try legacy mobile-compatible route
      if (response.status === 404) {
        console.warn('⚠️ /register returned 404. Retrying with legacy /api/auth/guide-registration');
  const legacyUrl = `${API_CONFIG.BASE_URL}${this.AUTH_ENDPOINT}/guide-registration`;
        console.log('🔗 Guide registration legacy URL:', legacyUrl);
        response = await fetch(legacyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-type': 'mobile', // Server expects x-client-type, not x-platform
            'x-platform': 'mobile', // Keep for backwards compatibility
          },
          // Legacy endpoint maps fields to guideDetails server-side
          body: JSON.stringify({
            username: data.username,
            email: data.email,
            password: data.password,
            role: data.role,
            firstName: data.guideDetails.firstName,
            lastName: data.guideDetails.lastName,
            nicNumber: data.guideDetails.nicNumber,
            dateOfBirth: data.guideDetails.dateOfBirth,
          }),
        });

        console.log('📡 Legacy guide registration status:', response.status);
      }

      // After potential retry, handle non-OK statuses
      if (!response.ok) {
        // Provide user-friendly network error messages
        if (response.status === 0) {
          throw new Error('Network connection failed. Please check your WiFi connection and server.');
        }
        
        if (contentType && contentType.includes('application/json')) {
          const errorResult = await response.json();
          console.error('❌ JSON error response:', errorResult);
          
          // Map common error messages to user-friendly versions
          const errorMsg = errorResult.message || errorResult.error || `Server error: ${response.status}`;
          if (errorMsg === 'Registration failed' || errorMsg.includes('Registration failed')) {
            throw new Error('Registration failed. Please check all required fields and try again.');
          }
          
          throw new Error(errorMsg);
        } else {
          const errorText = await response.text();
          console.error('❌ Non-JSON error response:', errorText);
          throw new Error(`Server error: ${response.status} - ${response.statusText || 'Unknown error'}`);
        }
      }

      // Parse JSON response only if content-type is JSON
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        console.log('✅ Guide registration success response:', result);
        // Expect result.success=true or data.user present for success
        if (!(result && (result.success === true || result.data || result.user))) {
          throw new Error(result?.message || 'Guide registration failed');
        }
      } else {
        // If server doesn't return JSON, assume success if status is OK
        const responseText = await response.text();
        console.log('✅ Non-JSON success response:', responseText);
      }

      // Registration successful - the user will need to wait for approval
    } catch (error) {
      console.error('Guide registration error:', error);
      console.error('Current API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);
      
      // Normalize common errors for better UX
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        
        // Network connection errors
        if (msg.includes('network request failed') || msg.includes('failed to fetch')) {
          throw new Error(`Cannot connect to server at ${API_CONFIG.BASE_URL}. Please check:\n1. Your WiFi connection\n2. Server is running\n3. You're on the same network as the server`);
        }
        
        if (msg.includes('route not found') || msg.includes('404')) {
          throw new Error('Registration endpoint not available. Please ensure the user-service is running and accessible on your network.');
        }
        
        if (msg.includes('network') || msg.includes('timeout')) {
          throw new Error(`Network timeout. Current server: ${API_CONFIG.BASE_URL}. Please try again or restart the app if you changed WiFi networks.`);
        }
        
        // If error message looks like it's from the server, pass it through
        if (msg.includes('required') || msg.includes('invalid') || msg.includes('already exists')) {
          throw error;
        }
        
        throw error;
      }
      throw new Error('Guide registration failed. Please try again.');
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      const refreshToken = await StorageService.getRefreshToken();
      
      // Call logout endpoint
  await ApiService.post<AuthResponse>(`${API_CONFIG.ENDPOINTS.AUTH}/logout`, {
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
        `${API_CONFIG.ENDPOINTS.AUTH}/profile`
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
        `${API_CONFIG.ENDPOINTS.AUTH}/refresh`,
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
