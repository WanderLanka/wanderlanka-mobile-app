import { API_CONFIG, HTTP_STATUS } from './config';
import {
  ApiResponse,
  AuthResponse,
} from '../types';

import { StorageService } from './storage';

/**
 * API Service for making HTTP requests
 */
export class ApiService {
  private static baseURL = API_CONFIG.BASE_URL;

    /**
   * Make HTTP request with comprehensive logging
   */
  private static async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`;
    
    console.log(`
🌐 ===== MOBILE APP REQUEST =====`);
    console.log(`🔗 Making API request via Gateway: ${fullUrl}`);
    console.log(`📤 Request method: ${options.method || 'GET'}`);
    console.log(`📋 Request headers:`, options.headers);
    
    if (options.body) {
      console.log(`📤 Request body:`, options.body);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log(`⏰ Request timeout for: ${fullUrl}`);
    }, API_CONFIG.TIMEOUT);

    try {
      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      console.log(`📡 Response status: ${response.status}`);
      console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));
      
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`📡 API response status: ${response.status}`);
        console.log(`📥 API response data:`, data);
        
        if (!response.ok) {
          throw new Error(data.message || data.error || `HTTP ${response.status}`);
        }
        
        return data;
      } else {
        const text = await response.text();
        console.log(`📄 Non-JSON response:`, text);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        
        return text as unknown as T;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`❌ API request failed:`, error);
      throw error;
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

      if (data.success && data.data && data.data.accessToken && data.data.refreshToken) {
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
   * Health check endpoint
   */
  static async checkHealth(): Promise<ApiResponse<any>> {
    try {
      return await this.get<ApiResponse<any>>('/health');
    } catch {
      throw new Error('Service is not available');
    }
  }
}
