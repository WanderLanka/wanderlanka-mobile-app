/**
 * API Configuration with dynamic IP support
 */
export const config = {
  // BASE_URL reads from .env file (EXPO_PUBLIC_API_BASE_URL) or falls back to hardcoded IP
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ ? 'http://192.168.1.37:3000' : 'https://your-production-api.com'),
  ENDPOINTS: {
    AUTH: '/api/auth', // Gateway namespace for auth endpoints
    HEALTH: '/health',
    PING: '/health', // Use health endpoint for ping
  },
  TIMEOUT: 30000, // 30 seconds - increased for mobile networks
} as const;

// Export as API_CONFIG for backward compatibility
export const API_CONFIG = config;

/**
 * HTTP Status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Storage keys for AsyncStorage
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
} as const;
