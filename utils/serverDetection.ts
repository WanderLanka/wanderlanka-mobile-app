// Simple auto-IP detection for mobile development
// Add this at the top of your App.tsx or root component

import { API_CONFIG } from '../services/config';

// Auto-detect server IP on app startup
export const initializeServerConnection = async () => {
  if (!__DEV__) return; // Only in development
  
  console.log('🔍 Detecting server IP...');
  
  const possibleIPs = [
    '192.168.8.142', // Current WiFi IP (prioritized)
    '192.168.137.93', // Previous WiFi IP
    '192.168.8.159', // Original IP
    '172.20.10.2',  // Hotspot IP
    '10.21.83.2',   // Previous WiFi
    '192.168.1.100',
    '192.168.0.100',
    '10.0.2.2',     // Android emulator
    'localhost',
    '127.0.0.1', 
  ];

  for (const ip of possibleIPs) {
    try {
      const testURL = `http://${ip}:3001/health`; // Use /health endpoint
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(testURL, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          console.log(`✅ Server found at: ${ip}`);
          // Update the config with working IP
          (API_CONFIG as any).BASE_URL = `http://${ip}:3001`;
          console.log(`📱 Mobile app will use: http://${ip}:3001`);
          return;
        }
      }
    } catch {
      console.log(`❌ Failed to connect to: ${ip}:3001`);
      continue;
    }
  }
  
  console.warn('⚠️ No server found, using current WiFi IP fallback');
  (API_CONFIG as any).BASE_URL = 'http://192.168.137.93:3001';
};
