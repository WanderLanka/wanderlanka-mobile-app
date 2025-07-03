import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './config';

/**
 * Storage service for managing app data
 */
export class StorageService {
  /**
   * Store access token
   */
  static async setAccessToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch (error) {
      console.error('Error storing access token:', error);
      throw error;
    }
  }

  /**
   * Get access token
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error retrieving access token:', error);
      return null;
    }
  }

  /**
   * Store refresh token
   */
  static async setRefreshToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (error) {
      console.error('Error storing refresh token:', error);
      throw error;
    }
  }

  /**
   * Get refresh token
   */
  static async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error retrieving refresh token:', error);
      return null;
    }
  }

  /**
   * Store user data
   */
  static async setUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing user data:', error);
      throw error;
    }
  }

  /**
   * Get user data
   */
  static async getUserData(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }

  /**
   * Clear all auth data
   */
  static async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  }

  /**
   * Check if user is logged in
   */
  static async isLoggedIn(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      const userData = await this.getUserData();
      return !!(accessToken && userData);
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }
}
