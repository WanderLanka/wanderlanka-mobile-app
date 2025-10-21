/**
 * API Configuration for WanderLanka Mobile App
 * Updated with current network IP for proper connectivity
 */

export const API_CONFIG = {
  // Current network IP - Update this when network changes
  BASE_URL: __DEV__ ? 'http://192.168.1.41:3000' : 'https://api.wanderlanka.com',
  
  ENDPOINTS: {
    AUTH: '/api/auth',
    HEALTH: '/health',
  },
  
  // Network timeout settings
  TIMEOUT: 15000, // Increased to 15 seconds for slower networks
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second between retries
} as const;

/**
 * HTTP Status Codes
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
 * AsyncStorage Keys
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@wanderlanka:accessToken',
  REFRESH_TOKEN: '@wanderlanka:refreshToken',
  USER_DATA: '@wanderlanka:userData',
  ONBOARDING_COMPLETED: '@wanderlanka:onboardingCompleted',
} as const;

/**
 * Network connectivity helper
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Debug network configuration
 */
if (__DEV__) {
  console.log('🔧 API Configuration:');
  console.log('📍 Base URL:', API_CONFIG.BASE_URL);
  console.log('⏱️ Timeout:', API_CONFIG.TIMEOUT + 'ms');
  console.log('🔄 Retry Attempts:', API_CONFIG.RETRY_ATTEMPTS);
}
