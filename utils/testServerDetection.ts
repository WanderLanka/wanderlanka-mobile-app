// Test script for server detection
// Run this in your mobile app to test IP detection

import { ServerDetection } from './serverDetection';

export const testServerDetection = async () => {
  console.log('🧪 Testing Server Detection...');
  
  try {
    const detectedUrl = await ServerDetection.detectServer();
    console.log('✅ Server detection result:', detectedUrl);
    
    // Test the detected URL
    const response = await fetch(`${detectedUrl}/health`);
    if (response.ok) {
      const healthData = await response.json();
      console.log('✅ Health check successful:', healthData);
      return detectedUrl;
    } else {
      console.log('❌ Health check failed:', response.status);
      return null;
    }
  } catch (error) {
    console.log('❌ Server detection failed:', error);
    return null;
  }
};

// Usage: Call this function in your app to test
// testServerDetection();
