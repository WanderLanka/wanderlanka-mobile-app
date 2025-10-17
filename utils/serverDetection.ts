// Smart WiFi-adaptive server detection for mobile development
// Automatically handles WiFi changes by detecting the current network

import { API_CONFIG } from '../services/config';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ServerCache {
  ip: string;
  timestamp: number;
  networkId?: string;
}

export class NetworkDetection {
  private static readonly CACHE_KEY = '@wanderlanka:server_cache';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly TIMEOUT = 3000; // 3 seconds per IP test
  
  /**
   * Try to derive the LAN IP of the dev machine from Expo hostUri
   */
  private static getExpoHostIp(): string | null {
    try {
      // Try several locations depending on SDK/version
      const hostUri = (Constants as any)?.expoConfig?.hostUri 
        || (Constants as any)?.manifest?.debuggerHost
        || (Constants as any)?.manifest2?.extra?.expoClient?.hostUri
        || '';
      if (typeof hostUri === 'string' && hostUri.includes(':')) {
        const host = hostUri.split(':')[0];
        // If it looks like an IP address, use it
        if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
          return host;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get comprehensive list of possible IPs for systematic discovery
   */
  private static getPossibleIPs(): string[] {
    // Generate time-based intelligent guesses
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Expo host IP (highest priority when available)
    const expoHost = this.getExpoHostIp();

    // Known working IPs (update these as we discover new ones)
    const knownIPs = [
      '192.168.8.142', // Current WiFi IP
      '192.168.137.93', // Previous WiFi IP
      '192.168.8.159', // Original IP
      '172.20.10.2',  // Hotspot IP
      '10.21.83.2',   // Previous WiFi
    ];

    // Common network patterns (covers most home/office WiFi)
    const commonRanges = [
      // 192.168.1.x (most common home router)
      ...this.generateRange('192.168.1', 100, 150),
      // 192.168.8.x (your common pattern)
      ...this.generateRange('192.168.8', 100, 200),
      // 192.168.0.x (another common pattern)
      ...this.generateRange('192.168.0', 100, 150),
      // 192.168.43.x (mobile hotspot pattern)
      ...this.generateRange('192.168.43', 1, 50),
      // 10.x.x.x corporate/university networks
      ...this.generateRange('10.0.0', 100, 150),
      // Special cases
      '10.0.2.2', // Android emulator
      'localhost', '127.0.0.1',
    ];

    // Time-based intelligent guessing (routers often assign sequential IPs)
    const smartGuesses = [
      `192.168.1.${100 + (hour % 50)}`,
      `192.168.8.${100 + (minute % 100)}`,
      `192.168.0.${100 + ((hour + minute) % 50)}`,
      `10.0.0.${100 + (hour % 30)}`,
    ];

    // Combine and prioritize: known IPs first, then smart guesses, then systematic
    return [
      ...(expoHost ? [expoHost] : []),
      ...knownIPs,
      ...smartGuesses,
      ...commonRanges,
    ].filter((ip, index, arr) => arr.indexOf(ip) === index); // Remove duplicates
  }

  /**
   * Clear cached server to force re-detection
   */
  static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CACHE_KEY);
      console.log('🧹 Cleared cached server IP');
    } catch (err) {
      console.warn('Failed to clear server cache:', err);
    }
  }

  /**
   * Generate IP range for systematic scanning
   */
  private static generateRange(baseIP: string, start: number, end: number): string[] {
    const ips: string[] = [];
    for (let i = start; i <= end; i++) {
      ips.push(`${baseIP}.${i}`);
    }
    return ips;
  }

  /**
   * Test if a server is reachable at given IP
   */
  private static async testServer(ip: string): Promise<boolean> {
    try {
      // Test API Gateway health at port 3000
      const testURL = `http://${ip}:3000/health`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);
      
      const response = await fetch(testURL, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        // Accept both API Gateway and service health shapes
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            const data = await response.json();
            const status = String(data?.status || '').toLowerCase();
            // Accept 'healthy' (API Gateway) or 'ok'
            return status === 'healthy' || status === 'ok';
          } catch {
            // If JSON parse fails but status is 200, assume healthy
            return true;
          }
        }
        // Non-JSON but 200 OK, assume reachable
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Cache the working server IP
   */
  private static async cacheServer(ip: string): Promise<void> {
    try {
      const cache: ServerCache = {
        ip,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to cache server IP:', error);
    }
  }

  /**
   * Get cached server IP if still valid
   */
  private static async getCachedServer(): Promise<string | null> {
    try {
      const cacheData = await AsyncStorage.getItem(this.CACHE_KEY);
      if (!cacheData) return null;
      
      const cache: ServerCache = JSON.parse(cacheData);
      const age = Date.now() - cache.timestamp;
      
      if (age < this.CACHE_DURATION) {
        // Test cached IP to make sure it's still working
        if (await this.testServer(cache.ip)) {
          console.log(`✅ Using cached server IP: ${cache.ip}`);
          return cache.ip;
        }
      }
      
      // Cache is expired or IP not working
      await AsyncStorage.removeItem(this.CACHE_KEY);
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Detect server with smart caching and systematic discovery
   */
  static async detectServer(): Promise<string> {
    console.log('🔍 🌐 Smart WiFi-adaptive server detection starting...');
    
    // Step 0: Prefer the Expo dev host first for speed
    const expoHost = this.getExpoHostIp();
    if (expoHost) {
      const ok = await this.testServer(expoHost);
      if (ok) {
  const baseURL = `http://${expoHost}:3000`;
        await this.cacheServer(expoHost);
        (API_CONFIG as any).BASE_URL = baseURL;
        console.log(`📱 Using Expo host server: ${baseURL}`);
        return baseURL;
      }
    }
    
    // Step 1: Try cached server first
    const cachedIP = await this.getCachedServer();
    if (cachedIP) {
  const baseURL = `http://${cachedIP}:3000`;
      (API_CONFIG as any).BASE_URL = baseURL;
      console.log(`📱 Using cached server: ${baseURL}`);
      return baseURL;
    }

    // Step 2: Systematic discovery
    const possibleIPs = this.getPossibleIPs();
    console.log(`� Testing ${possibleIPs.length} possible server locations...`);
    
    // Test IPs in batches for faster discovery
    const batchSize = 5;
    for (let i = 0; i < possibleIPs.length; i += batchSize) {
      const batch = possibleIPs.slice(i, i + batchSize);
      console.log(`🔍 Testing batch ${Math.floor(i/batchSize) + 1}: ${batch.join(', ')}`);
      
      // Test batch in parallel
      const batchPromises = batch.map(async ip => {
        const isWorking = await this.testServer(ip);
        return isWorking ? ip : null;
      });
      
      const results = await Promise.all(batchPromises);
      const workingIP = results.find(ip => ip !== null);
      
      if (workingIP) {
        console.log(`✅ 🎯 Server discovered at: ${workingIP}`);
        await this.cacheServer(workingIP);
  const baseURL = `http://${workingIP}:3000`;
        (API_CONFIG as any).BASE_URL = baseURL;
        console.log(`📱 Mobile app configured for: ${baseURL}`);
        return baseURL;
      }
    }

    // Step 3: Fallback to last known working IP
    console.warn('⚠️ No server found during discovery; keeping existing BASE_URL');
    return (API_CONFIG as any).BASE_URL;
  }
}

/**
 * Initialize server connection on app startup
 * Call this when the app starts or when network changes
 */
export const initializeServerConnection = async () => {
  if (!__DEV__) return; // Only in development
  
  try {
    await NetworkDetection.detectServer();
  } catch (error) {
    console.error('❌ Server detection failed:', error);
    // Fallback: try Expo host IP if available
    const expoHost = NetworkDetection['getExpoHostIp']?.call(NetworkDetection) as string | null;
    if (expoHost) {
      const fallbackURL = `http://${expoHost}:3000`;
      (API_CONFIG as any).BASE_URL = fallbackURL;
      console.warn(`⚠️ Falling back to Expo host base URL: ${fallbackURL}`);
    }
  }
};

/**
 * Re-detect server when network changes
 * Call this when you detect network connectivity changes
 */
export const handleNetworkChange = async () => {
  if (!__DEV__) return;
  
  console.log('🔄 Network change detected, re-discovering server...');
  await NetworkDetection.clearCache();
  await initializeServerConnection();
};

/**
 * Force server re-detection (useful before critical operations)
 * Returns true if server is reachable, false otherwise
 */
export const ensureServerConnection = async (): Promise<boolean> => {
  if (!__DEV__) return true; // Skip in production
  
  console.log('🔍 Ensuring server connection before operation...');
  
  try {
    // First, try current BASE_URL
    const currentURL = new URL(API_CONFIG.BASE_URL);
    const currentIP = currentURL.hostname;
    
    const isCurrentWorking = await NetworkDetection['testServer']?.call(
      NetworkDetection,
      currentIP
    ) as boolean;
    
    if (isCurrentWorking) {
      console.log(`✅ Current server is reachable: ${API_CONFIG.BASE_URL}`);
      return true;
    }
    
    // Current server not working, force re-detection
    console.warn('⚠️ Current server not reachable, forcing re-detection...');
    await NetworkDetection.clearCache();
    const newURL = await NetworkDetection.detectServer();
    console.log(`✅ Server re-detected: ${newURL}`);
    return true;
  } catch (error) {
    console.error('❌ Server connection check failed:', error);
    return false;
  }
};
