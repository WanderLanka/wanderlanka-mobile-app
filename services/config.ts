/**
 * API Configuration with API Gateway support
 * Updated to use API Gateway following microservice architecture
 */
export const API_CONFIG = {
  // API Gateway endpoint - Updated to use current IP address
  BASE_URL: 'http://192.168.8.159:3000',
  TIMEOUT: 10000,
  
  ENDPOINTS: {
    // Auth endpoints through API Gateway
    AUTH: '/auth/api/auth',
  }
};

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
