import { API_CONFIG, HTTP_STATUS } from './config';
import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  SignUpRequest,
} from '../types';

import { StorageService } from './storage';

/**
 * API Service for making HTTP requests
 */
export class ApiService {
  private static baseURL = API_CONFIG.BASE_URL;

  /**
   * Make HTTP request with automatic token handling
   */
  private static async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if access token exists
    const accessToken = await StorageService.getAccessToken();
    if (accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${accessToken}`,
      };
    }

    try {
      const response = await fetch(`${this.baseURL}${url}`, config);
      const data = await response.json();

      // Handle token refresh if needed
      if (response.status === HTTP_STATUS.UNAUTHORIZED && accessToken) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the original request with new token
          const newAccessToken = await StorageService.getAccessToken();
          if (newAccessToken) {
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${newAccessToken}`,
            };
            const retryResponse = await fetch(`${this.baseURL}${url}`, config);
            return await retryResponse.json();
          }
        }
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Network error');
    }
  }

  /**
   * GET request
   */
  static async get<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  static async post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  static async put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  static async delete<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' });
  }

  /**
   * Refresh access token
   */
  private static async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await StorageService.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.data) {
        await StorageService.setAccessToken(data.data.accessToken);
        await StorageService.setRefreshToken(data.data.refreshToken);
        await StorageService.setUserData(data.data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Check service health
   */
  static async checkHealth(): Promise<ApiResponse<any>> {
    try {
      return await this.get<ApiResponse<any>>(API_CONFIG.ENDPOINTS.HEALTH);
    } catch (error) {
      throw new Error('Service is not available');
    }
  }
}
