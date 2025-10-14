import { API_CONFIG, HTTP_STATUS } from './config';
import {
  ApiResponse,
  AuthResponse,
} from '../types';

import { StorageService } from './storage';
import { 
  checkInternetConnection, 
  classifyNetworkError, 
  retryWithBackoff 
} from '../utils/networkUtils';
import { NetworkDetection } from '../utils/serverDetection';

/**
 * API Service for making HTTP requests
 */
export class ApiService {
  // Always resolve BASE_URL at call time to pick up dynamic changes
  private static get baseURL() {
    return API_CONFIG.BASE_URL;
  }

  /**
   * Make HTTP request with automatic token handling and timeout
   */
  private static async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Check internet connection first
    const networkState = await checkInternetConnection();
    if (!networkState.isConnected) {
      // Don't hard-fail in dev; local server might still be reachable on LAN
      console.warn('⚠️ Network check reported offline; attempting request anyway (LAN server may be reachable).');
    }

    const makeRequest = async (): Promise<T> => {
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

      console.log('🔗 Making API request:', `${this.baseURL}${url}`);
      
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Network request timed out')), API_CONFIG.TIMEOUT)
      );

      // Make request with timeout
      const responsePromise = fetch(`${this.baseURL}${url}`, config);
      const response = await Promise.race([responsePromise, timeoutPromise]);

      console.log('📡 API response status:', response.status);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        console.warn('Non-JSON response received:', text);
        throw new Error('Server returned invalid response format');
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}`);
      }

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
            const retryResponsePromise = fetch(`${this.baseURL}${url}`, config);
            const retryResponse = await Promise.race([retryResponsePromise, timeoutPromise]);
            
            const retryContentType = retryResponse.headers.get('content-type');
            let retryData;
            
            if (retryContentType && retryContentType.includes('application/json')) {
              retryData = await retryResponse.json();
            } else {
              throw new Error('Server returned invalid response format on retry');
            }
            
            if (!retryResponse.ok) {
              throw new Error(retryData.message || retryData.error || `HTTP ${retryResponse.status}`);
            }
            return retryData;
          }
        }
      }

      return data;
    };

    try {
      // Use retry mechanism for network requests
      return await retryWithBackoff(makeRequest, 2, 1000); // 2 retries, 1 second base delay
    } catch (error) {
      console.error('API request failed:', error);

      // On network-related failures, try to re-detect the server and retry once
      const errorInfo = classifyNetworkError(error as Error);
      if (errorInfo.type === 'NO_INTERNET' || errorInfo.type === 'TIMEOUT' || errorInfo.type === 'SERVER_ERROR') {
        try {
          console.warn('🔄 Network error detected. Re-discovering server and retrying request once...');
          await NetworkDetection.detectServer();
          return await makeRequest();
        } catch (retryErr) {
          console.error('Retry after server re-detection failed:', retryErr);
        }
      }

      // Classify error and provide user-friendly message
      throw new Error(errorInfo.message);
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

      if (data.success && data.data?.accessToken && data.data?.refreshToken) {
        await StorageService.setAccessToken(data.data.accessToken);
        await StorageService.setRefreshToken(data.data.refreshToken);
        await StorageService.setUserData(data.data.user);
        return true;
      }

      return false;
    } catch {
      console.error('Token refresh failed');
      return false;
    }
  }

  /**
   * Check service health
   */
  static async checkHealth(): Promise<ApiResponse<any>> {
    try {
      return await this.get<ApiResponse<any>>(API_CONFIG.ENDPOINTS.HEALTH);
    } catch {
      throw new Error('Service is not available');
    }
  }
}
