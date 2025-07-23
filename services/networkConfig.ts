// Dynamic network configuration for mobile app
import { Platform } from 'react-native';

// Function to get your current network IP
const getNetworkIP = async (): Promise<string> => {
  // Try multiple common network IPs
  const possibleIPs = [
    '172.20.10.2',  // Current hotspot IP
    '10.21.83.2',   // Previous WiFi IP  
    '192.168.8.159', // Original IP
    '192.168.1.100', // Common router IP
    'localhost'
  ];

  for (const ip of possibleIPs) {
    try {
      const response = await fetch(`http://${ip}:3001/api/ping`, { 
        timeout: 2000 
      });
      if (response.ok) {
        console.log(`✅ Connected to API at: ${ip}`);
        return ip;
      }
    } catch (error) {
      console.log(`❌ Failed to connect to: ${ip}`);
      continue;
    }
  }
  
  // Fallback to localhost
  console.warn('⚠️ Using localhost fallback - may not work on physical device');
  return 'localhost';
};

// Export dynamic config
export const getAPIConfig = async () => {
  const networkIP = await getNetworkIP();
  return {
    BASE_URL: __DEV__ ? `http://${networkIP}:3001` : 'https://your-production-api.com',
    timeout: 10000,
  };
};
