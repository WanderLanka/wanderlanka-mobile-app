// Simple auto-IP detection for mobile development
// Add this at the top of your App.tsx or root component

import { API_CONFIG } from '../services/config';

// Auto-detect server IP on app startup
export const initializeServerConnection = async () => {
  if (!__DEV__) return; // Only in development
  
  console.log('🔍 Detecting server IP...');
  
  const possibleIPs = [
    'localhost',
    '127.0.0.1', 
    '172.20.10.2',  // Current hotspot
    '10.0.2.2',     // Android emulator
    '10.21.83.2',   // Previous WiFi
    '192.168.1.100',
    '192.168.8.159', // Original IP
    '192.168.0.100',
  ];

  for (const ip of possibleIPs) {
    try {
      const testURL = `http://${ip}:3001/api/ping`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(testURL, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Server found at: ${ip}`);
        // Update the config with working IP
        (API_CONFIG as any).BASE_URL = `http://${ip}:3001`;
        console.log(`📱 Mobile app will use: http://${ip}:3001`);
        return;
      }
    } catch (error) {
      continue;
    }
  }
  
  console.warn('⚠️ No server found, using localhost fallback');
  (API_CONFIG as any).BASE_URL = 'http://localhost:3001';
};
