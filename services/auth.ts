import {
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  SignUpRequest,
  User,
} from '../types';

import { API_CONFIG } from './config';
import { ApiService } from './api';
import { StorageService } from './storage';

/**
 * Authentication Service for handling user authentication
 */
export class AuthService {
  private static readonly AUTH_ENDPOINT = API_CONFIG.ENDPOINTS.AUTH;

  /**
   * Sign up a new user
   */
  static async signUp(userData: SignUpRequest): Promise<AuthResponse> {
    try {
      const response = await ApiService.post<AuthResponse>(
        `${this.AUTH_ENDPOINT}/signup`,
        userData
      );

      // Store tokens if signup successful
      if (response.success && response.data) {
        await StorageService.setAccessToken(response.data.accessToken);
        await StorageService.setRefreshToken(response.data.refreshToken);
        await StorageService.setUserData(response.data.user);
      }

      return response;
    } catch (error) {
      console.error('Sign up error:', error);
      throw new Error(error instanceof Error ? error.message : 'Sign up failed');
    }
  }

  /**
   * Login user
   */
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await ApiService.post<AuthResponse>(
        `${this.AUTH_ENDPOINT}/login`,
        credentials
      );

      // Store tokens if login successful
      if (response.success && response.data) {
        await StorageService.setAccessToken(response.data.accessToken);
        await StorageService.setRefreshToken(response.data.refreshToken);
        await StorageService.setUserData(response.data.user);
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error instanceof Error ? error.message : 'Login failed');
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

      if (response.success && response.data) {
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
