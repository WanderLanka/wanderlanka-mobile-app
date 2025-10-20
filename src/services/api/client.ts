import { ApiService } from '../../../services/api';

/**
 * API Client for making HTTP requests
 * Wrapper around ApiService to provide a consistent interface
 */
export const apiClient = {
  /**
   * GET request
   */
  get: <T>(url: string): Promise<{ data: T }> => {
    return ApiService.get<T>(url).then(data => ({ data }));
  },

  /**
   * POST request
   */
  post: <T>(url: string, data?: any): Promise<{ data: T }> => {
    return ApiService.post<T>(url, data).then(responseData => ({ data: responseData }));
  },

  /**
   * PUT request
   */
  put: <T>(url: string, data?: any): Promise<{ data: T }> => {
    return ApiService.put<T>(url, data).then(responseData => ({ data: responseData }));
  },

  /**
   * PATCH request
   */
  patch: <T>(url: string, data?: any): Promise<{ data: T }> => {
    return ApiService.patch<T>(url, data).then(responseData => ({ data: responseData }));
  },

  /**
   * DELETE request
   */
  delete: <T>(url: string): Promise<{ data: T }> => {
    return ApiService.delete<T>(url).then(data => ({ data }));
  },
};

