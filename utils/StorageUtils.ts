import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Utility functions for managing AsyncStorage data
 */
export class StorageUtils {
  
  /**
   * Clear ALL AsyncStorage data (complete wipe)
   * ⚠️ Use with caution - this removes everything!
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log('✅ All AsyncStorage data cleared');
    } catch (error) {
      console.error('❌ Error clearing all AsyncStorage data:', error);
      throw error;
    }
  }

  /**
   * Clear specific keys from AsyncStorage
   */
  static async clearKeys(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
      console.log(`✅ Cleared ${keys.length} keys:`, keys);
    } catch (error) {
      console.error('❌ Error clearing specific keys:', error);
      throw error;
    }
  }

  /**
   * Clear a single key from AsyncStorage
   */
  static async clearKey(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`✅ Cleared key: ${key}`);
    } catch (error) {
      console.error(`❌ Error clearing key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all booking-related data
   */
  static async clearAllBookingData(): Promise<void> {
    const bookingKeys = [
      'upcomingBookings',
      'pastBookings',
      '@wanderlanka_bookings',
      'tripPlanningData',
      'bookingDetails',
      'selectedAccommodations',
      'selectedTransport',
      'selectedGuides',
      'tempTripData',
      'draftBooking'
    ];

    try {
      await this.clearKeys(bookingKeys);
      console.log('✅ All booking data cleared');
    } catch (error) {
      console.error('❌ Error clearing booking data:', error);
      throw error;
    }
  }

  /**
   * Clear only temporary/planning data (keeps confirmed bookings)
   */
  static async clearTemporaryData(): Promise<void> {
    const temporaryKeys = [
      '@wanderlanka_bookings',
      'tripPlanningData',
      'bookingDetails',
      'selectedAccommodations',
      'selectedTransport',
      'selectedGuides',
      'tempTripData',
      'draftBooking'
    ];

    try {
      await this.clearKeys(temporaryKeys);
      console.log('✅ Temporary data cleared');
    } catch (error) {
      console.error('❌ Error clearing temporary data:', error);
      throw error;
    }
  }

  /**
   * Debug: List all keys in AsyncStorage
   */
  static async listAllKeys(): Promise<readonly string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log('📋 AsyncStorage keys:', keys);
      return keys;
    } catch (error) {
      console.error('❌ Error listing AsyncStorage keys:', error);
      return [];
    }
  }

  /**
   * Debug: Get all data from AsyncStorage
   */
  static async getAllData(): Promise<{ [key: string]: string | null }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const keyValuePairs = await AsyncStorage.multiGet(keys);
      
      const data: { [key: string]: string | null } = {};
      keyValuePairs.forEach(([key, value]) => {
        data[key] = value;
      });
      
      console.log('📊 AsyncStorage data:', data);
      return data;
    } catch (error) {
      console.error('❌ Error getting all AsyncStorage data:', error);
      return {};
    }
  }

  /**
   * Check if a key exists in AsyncStorage
   */
  static async keyExists(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`❌ Error checking if key ${key} exists:`, error);
      return false;
    }
  }

  /**
   * Get storage size information
   */
  static async getStorageInfo(): Promise<{
    totalKeys: number;
    keysList: readonly string[];
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return {
        totalKeys: keys.length,
        keysList: keys
      };
    } catch (error) {
      console.error('❌ Error getting storage info:', error);
      return {
        totalKeys: 0,
        keysList: []
      };
    }
  }
}

/**
 * Quick access functions for common operations
 */

// Clear everything
export const clearAllStorage = () => StorageUtils.clearAll();

// Clear just booking data
export const clearBookings = () => StorageUtils.clearAllBookingData();

// Clear temporary data only
export const clearTemp = () => StorageUtils.clearTemporaryData();

// Debug functions
export const listKeys = () => StorageUtils.listAllKeys();
export const getAllData = () => StorageUtils.getAllData();
