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
// Removed automatic server detection: rely on configured BASE_URL only

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
      // Use configured BASE_URL without auto detection
      const config: RequestInit = {
        ...options,
      };

      // Normalize headers without forcing Content-Type for FormData
      const headers: Record<string, any> = { ...(options.headers || {}) };
      const isFormData = typeof FormData !== 'undefined' && config.body instanceof FormData;
      if (!isFormData && !('Content-Type' in headers) && (config.method && config.method !== 'GET')) {
        headers['Content-Type'] = 'application/json';
      }
      config.headers = headers;

      // Add authorization header if access token exists
      const accessToken = await StorageService.getAccessToken();
      if (accessToken) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${accessToken}`,
        };
      }

      if (__DEV__) {
        console.log('📍 Base URL in use:', this.baseURL);
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
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        console.warn('Non-JSON response received:', text);
        throw new Error('Server returned invalid response format');
      }

      // If unauthorized/forbidden, attempt token refresh before throwing
      const isAuthError =
        (response.status === HTTP_STATUS.UNAUTHORIZED || response.status === HTTP_STATUS.FORBIDDEN) &&
        (data?.code === 'AUTH_TOKEN_INVALID' || data?.code === 'AUTH_TOKEN_MISSING' || !!accessToken);

      if (!response.ok && isAuthError) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          const newAccessToken = await StorageService.getAccessToken();
          if (newAccessToken) {
            const retryHeaders: Record<string, any> = { ...(config.headers || {}) };
            retryHeaders.Authorization = `Bearer ${newAccessToken}`;
            const retryConfig: RequestInit = { ...config, headers: retryHeaders };

            const retryResponsePromise = fetch(`${this.baseURL}${url}`, retryConfig);
            const retryResponse = await Promise.race([retryResponsePromise, timeoutPromise]);
            const retryContentType = retryResponse.headers.get('content-type');
            let retryData: any;

            if (retryContentType && retryContentType.includes('application/json')) {
              retryData = await retryResponse.json();
            } else {
              throw new Error('Server returned invalid response format on retry');
            }

            if (!retryResponse.ok) {
              // If retry still unauthorized, surface non-retryable auth error without clearing tokens
              const err: any = new Error(retryData.message || retryData.error || 'Authentication required. Please try again.');
              err.noRetry = true;
              throw err;
            }
            return retryData as T;
          }
        }
        // Refresh failed - surface non-retryable error but do not clear tokens automatically
        const err: any = new Error(data?.message || data?.error || 'Authentication required. Please try again.');
        err.noRetry = true;
        throw err;
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}`);
      }

      return data as T;
    };

    try {
      // Use retry mechanism for network requests
      return await retryWithBackoff(makeRequest, 2, 1000); // 2 retries, 1 second base delay
    } catch (error) {
      console.error('API request failed:', error);

      // On network-related failures, try to re-detect the server and retry once
      const errorInfo = classifyNetworkError(error as Error);
      // No automatic server discovery or fallback; rely on configured BASE_URL

      // Provide clearer message for local/LAN development
      let message = errorInfo.message;
      try {
        const base = this.baseURL;
        const isLocal = /^http:\/\/(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/i.test(base);
        if (errorInfo.type === 'NO_INTERNET' && isLocal) {
          message = `Cannot connect to server at ${base}. Please ensure the API Gateway is running and your device is on the same Wi‑Fi network.`;
        }
      } catch {}

  // Classify error and provide user-friendly message
  const err: any = new Error(message);
  if (errorInfo.type === 'NO_INTERNET') err.noRetry = true;
  throw err;
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
   * PATCH request
   */
  static async patch<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'PATCH',
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
   * Upload FormData (multipart)
   */
  static async upload<T>(url: string, formData: FormData): Promise<T> {
    return this.request<T>(url, { method: 'POST', body: formData });
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
