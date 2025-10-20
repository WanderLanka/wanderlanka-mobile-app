/**
 * API Configuration with dynamic IP support
 */
import { Platform, NativeModules } from 'react-native';
// expo-constants is available in Expo projects; import lazily to avoid hard fails
let ExpoConstants: any = undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExpoConstants = require('expo-constants').default || require('expo-constants');
} catch (e) {
  ExpoConstants = undefined;
}

// Prefer setting this in your env for physical devices
// e.g., EXPO_PUBLIC_API_URL=http://<your-mac-lan-ip>:3000
const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Resolve a sensible BASE_URL in development, even on physical devices
function resolveDevBaseUrl(): string {
  if (ENV_BASE_URL) return ENV_BASE_URL;

  // Try to infer LAN IP from Metro/Expo bundle URL
  // Works for both Expo and plain RN (SourceCode.scriptURL)
  const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
  let inferredHost: string | undefined;
  if (scriptURL) {
    // Support exp://, http://, ws://, etc.
    const match = scriptURL.match(/^[a-zA-Z]+:\/\/([^/:]+)(?::\d+)?\//);
    inferredHost = match?.[1];
  }

  // Try Expo Constants (preferred for Expo Go on physical devices)
  if (!inferredHost && ExpoConstants) {
    const expoHostUri: string | undefined = ExpoConstants?.expoConfig?.hostUri
      || ExpoConstants?.manifest2?.extra?.expoGo?.developer?.host
      || ExpoConstants?.manifest?.debuggerHost;
    if (expoHostUri) {
      inferredHost = expoHostUri.split(':')[0];
    }
  }

  const isLanIp = inferredHost ? /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(inferredHost) : false;
  if (isLanIp && inferredHost) {
    return `http://${inferredHost}:3000`;
  }

  // Android emulator special hostname
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';

  // iOS simulator or unknown: localhost
  return 'http://localhost:3000';
}

const DEV_BASE_URL = resolveDevBaseUrl();

// Log the selected URL for debugging
if (__DEV__) {
  const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
  console.log('🌐 API_CONFIG - Platform:', Platform.OS);
  console.log('🌐 API_CONFIG - ENV_BASE_URL:', ENV_BASE_URL);
  console.log('🌐 API_CONFIG - scriptURL:', scriptURL);
  console.log('🌐 API_CONFIG - Using ExpoConstants:', Boolean(ExpoConstants));
  console.log('🌐 API_CONFIG - Selected BASE_URL:', DEV_BASE_URL);
}

export const API_CONFIG = {
  // Dynamic BASE_URL for development/testing
  BASE_URL: __DEV__ ? DEV_BASE_URL : 'https://your-production-api.com',
  ENDPOINTS: {
    AUTH: '/api/auth', // Gateway namespace for auth endpoints
    HEALTH: '/health',
    PING: '/health', // Use health endpoint for ping
  },
  TIMEOUT: 30000, // 30 seconds - increased for mobile networks
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
