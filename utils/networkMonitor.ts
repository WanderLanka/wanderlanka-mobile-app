/**
 * Network Change Monitor
 * Automatically detects when WiFi changes and updates server configuration
 */

import NetInfo from '@react-native-community/netinfo';
import { handleNetworkChange } from './serverDetection';

class NetworkMonitor {
  private static isListening = false;
  private static lastNetworkId: string | null = null;

  /**
   * Start monitoring network changes
   */
  static startMonitoring() {
    if (this.isListening) return;
    
    console.log('📡 Starting network change monitoring...');
    this.isListening = true;

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      this.handleNetworkStateChange(state);
    });

    // Store unsubscribe function for cleanup if needed
    (global as any).__networkUnsubscribe = unsubscribe;
  }

  /**
   * Handle network state changes
   */
  private static async handleNetworkStateChange(state: any) {
    const { isConnected, type, details } = state;
    
    // Safely extract WiFi and IP details
    const wifiSSID = (details && typeof details === 'object' && 'ssid' in details) 
      ? (details as any).ssid 
      : 'Unknown';
    const ipAddress = (details && typeof details === 'object' && 'ipAddress' in details)
      ? (details as any).ipAddress
      : null;
    const ipSubnet = ipAddress && typeof ipAddress === 'string' && ipAddress.includes('.')
      ? ipAddress.split('.').slice(0, 3).join('.')
      : null;
    
    console.log('📡 Network state change:', {
      connected: isConnected,
      type,
      ssid: wifiSSID,
      ipAddress,
      ipSubnet,
    });

    // Only handle WiFi connections
    if (!isConnected || type !== 'wifi') {
      console.log('📡 Not on WiFi, skipping server detection');
      return;
    }

    // Check if we're on a different network
    const wifiBSSID = (details && typeof details === 'object' && 'bssid' in details) 
      ? (details as any).bssid 
      : null;
    
    // Prefer IP subnet as stable network identifier, fallback to SSID/BSSID
    const currentNetworkId = ipSubnet || wifiSSID || wifiBSSID || 'unknown';
    
    if (this.lastNetworkId && this.lastNetworkId !== currentNetworkId) {
      console.log('📡 🔄 Network changed (by subnet/SSID)!');
      console.log(`   Previous: ${this.lastNetworkId}`);
      console.log(`   Current:  ${currentNetworkId}`);
      
      // Re-discover server on the new network
      await handleNetworkChange();
    }
    
    this.lastNetworkId = currentNetworkId;
  }

  /**
   * Stop monitoring network changes
   */
  static stopMonitoring() {
    if (!this.isListening) return;
    
    console.log('📡 Stopping network change monitoring...');
    this.isListening = false;
    
    const unsubscribe = (global as any).__networkUnsubscribe;
    if (unsubscribe) {
      unsubscribe();
      delete (global as any).__networkUnsubscribe;
    }
  }

  /**
   * Get current network information
   */
  static async getCurrentNetwork() {
    try {
      const state = await NetInfo.fetch();
      
      // Safely extract network details
      const wifiSSID = (state.details && typeof state.details === 'object' && 'ssid' in state.details) 
        ? (state.details as any).ssid 
        : 'Unknown';
      
      const wifiStrength = (state.details && typeof state.details === 'object' && 'strength' in state.details) 
        ? (state.details as any).strength 
        : 0;
      const ipAddress = (state.details && typeof state.details === 'object' && 'ipAddress' in state.details)
        ? (state.details as any).ipAddress
        : null;
      
      return {
        connected: state.isConnected,
        type: state.type,
        ssid: wifiSSID,
        strength: wifiStrength,
        ipAddress,
      };
    } catch (error) {
      console.error('Failed to get network info:', error);
      return null;
    }
  }

  /**
   * Force a network detection check
   */
  static async forceNetworkCheck() {
    console.log('📡 🔍 Forcing network check...');
    const state = await NetInfo.fetch();
    await this.handleNetworkStateChange(state);
  }
}

export { NetworkMonitor };

/**
 * Initialize network monitoring (call this in your App.tsx)
 */
export const initializeNetworkMonitoring = () => {
  if (__DEV__) {
    NetworkMonitor.startMonitoring();
  }
};

/**
 * Manual network refresh for user-triggered actions
 */
export const refreshNetworkConnection = async () => {
  if (__DEV__) {
    await NetworkMonitor.forceNetworkCheck();
  }
};