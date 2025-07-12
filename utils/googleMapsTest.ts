/**
 * Google Maps Integration Test
 * 
 * This file helps verify that Google Maps integration is working correctly.
 * Run this to test the various components of the crowdsource map feature.
 */

import * as Location from 'expo-location';

import { Platform } from 'react-native';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
}

export class GoogleMapsIntegrationTest {
  private results: TestResult[] = [];

  /**
   * Run all tests for Google Maps integration
   */
  async runAllTests(): Promise<TestResult[]> {
    this.results = [];
    
    await this.testLocationPermissions();
    await this.testGoogleMapsConfiguration();
    await this.testLocationServices();
    
    return this.results;
  }

  /**
   * Test if location permissions are properly configured
   */
  private async testLocationPermissions(): Promise<void> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        this.addResult('Location Permissions', 'PASS', 'Location permissions granted successfully');
      } else {
        this.addResult('Location Permissions', 'FAIL', `Location permission denied: ${status}`);
      }
    } catch (error) {
      this.addResult('Location Permissions', 'FAIL', `Error requesting permissions: ${error}`);
    }
  }

  /**
   * Test if Google Maps API keys are configured
   */
  private async testGoogleMapsConfiguration(): Promise<void> {
    // Check if react-native-maps is available
    try {
      const MapView = require('react-native-maps');
      if (MapView) {
        this.addResult('React Native Maps', 'PASS', 'react-native-maps is installed and available');
      }
    } catch (error) {
      this.addResult('React Native Maps', 'FAIL', 'react-native-maps is not properly installed');
      return;
    }

    // Platform-specific checks
    if (Platform.OS === 'ios') {
      this.addResult('iOS Configuration', 'WARNING', 'Verify GoogleMapsApiKey is set in app.json');
    } else if (Platform.OS === 'android') {
      this.addResult('Android Configuration', 'WARNING', 'Verify Google Maps API key is set in app.json');
    }
  }

  /**
   * Test if location services are working
   */
  private async testLocationServices(): Promise<void> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        this.addResult('Location Services', 'FAIL', 'Cannot test location services without permission');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (location && location.coords) {
        this.addResult('Location Services', 'PASS', 
          `Location retrieved: ${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`);
      } else {
        this.addResult('Location Services', 'FAIL', 'Could not retrieve location');
      }
    } catch (error) {
      this.addResult('Location Services', 'FAIL', `Location error: ${error}`);
    }
  }

  /**
   * Add a test result
   */
  private addResult(test: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string): void {
    this.results.push({ test, status, message });
  }

  /**
   * Print test results to console
   */
  static printResults(results: TestResult[]): void {
    console.log('\n=== Google Maps Integration Test Results ===');
    
    results.forEach(result => {
      const statusEmoji = result.status === 'PASS' ? '✅' : 
                         result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${statusEmoji} ${result.test}: ${result.message}`);
    });

    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    const warnCount = results.filter(r => r.status === 'WARNING').length;

    console.log(`\nSummary: ${passCount} passed, ${failCount} failed, ${warnCount} warnings`);
    console.log('============================================\n');
  }
}

/**
 * Mock data for testing map points functionality
 */
export const TEST_MAP_POINTS = [
  {
    id: 'test1',
    type: 'washroom' as const,
    title: 'Test Restroom - Colombo',
    description: 'Test point for development',
    latitude: 6.9271,
    longitude: 79.8612,
    addedBy: 'TestUser',
    addedDate: '2024-07-06',
    verified: true,
    rating: 4.5,
    reviews: 10,
  },
  {
    id: 'test2',
    type: 'wifi' as const,
    title: 'Test WiFi - Kandy',
    description: 'Test WiFi point for development',
    latitude: 7.2906,
    longitude: 80.6337,
    addedBy: 'TestUser',
    addedDate: '2024-07-06',
    verified: false,
    rating: 0,
    reviews: 0,
  },
];

/**
 * Test utility to validate map point data
 */
export function validateMapPoint(point: any): boolean {
  const requiredFields = ['id', 'type', 'title', 'description', 'latitude', 'longitude'];
  const validTypes = ['washroom', 'wifi', 'restaurant', 'poi', 'parking'];

  // Check required fields
  for (const field of requiredFields) {
    if (!point[field]) {
      console.error(`Map point missing required field: ${field}`);
      return false;
    }
  }

  // Check type validity
  if (!validTypes.includes(point.type)) {
    console.error(`Invalid map point type: ${point.type}`);
    return false;
  }

  // Check coordinate validity (Sri Lanka bounds)
  if (point.latitude < 5.9 || point.latitude > 9.9 ||
      point.longitude < 79.5 || point.longitude > 81.9) {
    console.warn(`Map point coordinates outside Sri Lanka bounds: ${point.latitude}, ${point.longitude}`);
  }

  return true;
}
