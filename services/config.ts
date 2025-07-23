/**
 * API Configuration with dynamic IP support
 */
export const API_CONFIG = {
  // This will be updated dynamically by serverDetection.ts
  BASE_URL: __DEV__ ? 'http://192.168.8.159:3001' : 'https://your-production-api.com',
  ENDPOINTS: {
    AUTH: '/api/auth',
    HEALTH: '/health',
    PING: '/api/ping',
  },
  TIMEOUT: 15000, // 15 seconds
} as const;

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
