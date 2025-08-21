// Simple auto-IP detection for mobile development
// Updated to work with API Gateway

import { API_CONFIG } from '../services/config';

export class ServerDetection {
  private static readonly POTENTIAL_IPS = [
    '192.168.8.159',      // Current IP - UPDATED
    '10.21.136.103',      // Previous IP
    '172.20.10.2',        // Previous IP
    '192.168.8.142',      // Another previous IP
    '192.168.1.100',      // Common router IP range
    '10.0.0.100',         // Common corporate IP range
  ];

  private static readonly TIMEOUT = 3000; // 3 seconds

  static async detectServer(): Promise<string> {
    console.log('🔍 Detecting API Gateway server...');
    
    // First try the configured IP
    const configuredIP = API_CONFIG.BASE_URL.replace('http://', '').split(':')[0];
    if (await this.testServer(configuredIP)) {
      console.log(`✅ API Gateway found at configured IP: ${configuredIP}`);
      return `http://${configuredIP}:3000`;
    }

    // Try other potential IPs
    for (const ip of this.POTENTIAL_IPS) {
      if (ip === configuredIP) continue; // Skip already tested IP
      
      if (await this.testServer(ip)) {
        console.log(`✅ API Gateway found at: ${ip}`);
        // Update the config for future requests
        (API_CONFIG as any).BASE_URL = `http://${ip}:3000`;
        return `http://${ip}:3000`;
      }
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
    } catch (error) {
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
      } catch (e) {
        console.log('🧹 Invalid token format, clearing auth data...');
        await StorageService.clearAuthData();
      }
    }
  } catch (error) {
    console.log('⚠️ Could not check token status:', error);
  }
  
  await ServerDetection.detectServer();
};
