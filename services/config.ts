/**
 * API Configuration and Base URL
 */
export const API_CONFIG = {
  // Updated URL to point to user-service with current network IP
  BASE_URL: __DEV__ ? 'http://192.168.8.142:3001' : 'https://your-production-api.com',
  ENDPOINTS: {
    AUTH: '/api/auth', // Mobile auth endpoints with /api/auth prefix
    HEALTH: '/health',
  },
  TIMEOUT: 15000, // 15 seconds - increased for better reliability
} as const;

/**
 * API Response status codes
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
