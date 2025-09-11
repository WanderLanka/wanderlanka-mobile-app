// Simple auto-IP detection for mobile development
// Updated to work with API Gateway and detect current system IP

import { API_CONFIG } from '../services/config';

export class ServerDetection {
  private static readonly TIMEOUT = 3000; // 3 seconds

  /**
   * Get all possible local network IPs to try
   */
  static getAllPossibleIPs(): string[] {
    // Get current time to generate dynamic IPs
    const now = new Date();
    const hour = now.getHours();
    
    // Common IP patterns for development environments
    const commonIPs = [
      // Current network patterns
      '10.21.88.227',   // Your current IP
      '192.168.8.159',  // Previous working IP
      '192.168.8.142',  // Another previous IP
      '10.21.136.103',  // Corporate network
      '172.20.10.2',    // Mobile hotspot
      
      // Common local network ranges
      '192.168.1.100', '192.168.1.101', '192.168.1.102',
      '192.168.8.100', '192.168.8.101', '192.168.8.102',
      '10.0.0.100', '10.0.0.101', '10.0.0.102',
      '172.16.0.100', '172.16.0.101',
      
      // Time-based guessing (people often get similar IPs)
      `192.168.1.${100 + (hour % 50)}`,
      `192.168.8.${100 + (hour % 50)}`,
      `10.21.88.${200 + (hour % 50)}`,
      
      // Developer machine common patterns
      '192.168.1.110', '192.168.1.111', '192.168.1.112',
      '192.168.8.110', '192.168.8.111', '192.168.8.112',
      '10.0.0.110', '10.0.0.111', '10.0.0.112',
    ];

    // Remove duplicates and return
    return [...new Set(commonIPs)];
  }

  /**
   * Try to detect server by checking localhost first (for emulator)
   */
  static async tryLocalhostFirst(): Promise<string | null> {
    // For Android emulator, try 10.0.2.2 which maps to host localhost
    const emulatorIPs = ['10.0.2.2', 'localhost', '127.0.0.1'];
    
    for (const ip of emulatorIPs) {
      if (await this.testServer(ip)) {
        console.log(`✅ API Gateway found at emulator IP: ${ip}`);
        return `http://${ip}:3000`;
      }
    }
    
    return null;
  }

  static async detectServer(): Promise<string> {
    console.log('🔍 Detecting API Gateway server...');
    
    // Step 1: Try emulator/localhost first
    const localhostResult = await this.tryLocalhostFirst();
    if (localhostResult) {
      // Update the config for future requests
      (API_CONFIG as any).BASE_URL = localhostResult;
      return localhostResult;
    }

    // Step 2: Try the configured IP
    const configuredIP = API_CONFIG.BASE_URL.replace('http://', '').split(':')[0];
    if (await this.testServer(configuredIP)) {
      console.log(`✅ API Gateway found at configured IP: ${configuredIP}`);
      return `http://${configuredIP}:3000`;
    }

    // Step 3: Try all possible IPs systematically
    const allPossibleIPs = this.getAllPossibleIPs();
    console.log(`🔍 Trying ${allPossibleIPs.length} possible IP addresses...`);
    
    // Test IPs in parallel (faster detection)
    const testPromises = allPossibleIPs.map(async (ip) => {
      if (ip === configuredIP) return null; // Skip already tested
      
      const isWorking = await this.testServer(ip);
      return isWorking ? ip : null;
    });

    const results = await Promise.all(testPromises);
    const workingIP = results.find(ip => ip !== null);
    
    if (workingIP) {
      console.log(`✅ API Gateway found at: ${workingIP}`);
      const serverUrl = `http://${workingIP}:3000`;
      // Update the config for future requests
      (API_CONFIG as any).BASE_URL = serverUrl;
      return serverUrl;
    }

    console.warn('⚠️ No API Gateway server found, using configured URL');
    return API_CONFIG.BASE_URL;
  }

  private static async testServer(ip: string): Promise<boolean> {
    try {
      console.log(`🔍 Testing API Gateway at: ${ip}:3000`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(`http://${ip}:3000/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ API Gateway health check passed for ${ip}:`, data.status);
        return true;
      }
      return false;
    } catch {
      console.log(`❌ API Gateway test failed for ${ip}:3000`);
      return false;
    }
  }
}

// Auto-detect API Gateway on app startup
export const initializeServerConnection = async () => {
  if (!__DEV__) return; // Only in development
  
  console.log('🔍 Auto-detecting API Gateway...');
  
  // Check for expired tokens and clear if needed
  try {
    const { StorageService } = await import('../services/storage');
    const accessToken = await StorageService.getAccessToken();
    
    if (accessToken) {
      // Check if token looks expired (basic check)
      try {
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (tokenPayload.exp && tokenPayload.exp < currentTime) {
          console.log('🧹 Found expired token, clearing auth data...');
          await StorageService.clearAuthData();
        }
      } catch {
        console.log('🧹 Invalid token format, clearing auth data...');
        await StorageService.clearAuthData();
      }
    }
  } catch {
    console.log('⚠️ Could not check token status');
  }
  
  await ServerDetection.detectServer();
};
