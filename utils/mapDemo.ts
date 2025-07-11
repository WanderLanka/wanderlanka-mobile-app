/**
 * Demo Script for Google Maps Integration
 * 
 * This file provides demo functions to test various aspects of the 
 * crowdsource map functionality. Use these in your development console.
 */

import * as Location from 'expo-location';

import { GoogleMapsIntegrationTest, TEST_MAP_POINTS, validateMapPoint } from './googleMapsTest';

import { Alert } from 'react-native';

/**
 * Demo function to add multiple test points to the map
 */
export const addTestPoints = (setMapPoints: (updater: (prev: any[]) => any[]) => void) => {
  setMapPoints(prev => [...TEST_MAP_POINTS, ...prev]);
  Alert.alert('Demo', 'Added test points to the map!');
};

/**
 * Demo function to simulate adding a point at a famous Sri Lankan location
 */
export const addFamousLocationPoint = (setMapPoints: (updater: (prev: any[]) => any[]) => void) => {
  const famousLocations = [
    {
      name: 'Sigiriya Rock Fortress',
      latitude: 7.9568,
      longitude: 80.7598,
      type: 'poi',
      title: 'Ancient Rock Fortress',
      description: 'Historic fortress and palace ruins from the 5th century'
    },
    {
      name: 'Temple of the Sacred Tooth',
      latitude: 7.2936,
      longitude: 80.6417,
      type: 'poi',
      title: 'Sacred Buddhist Temple',
      description: 'Temple housing the tooth relic of Buddha'
    },
    {
      name: 'Galle Dutch Fort',
      latitude: 6.0329,
      longitude: 80.2168,
      type: 'poi',
      title: 'Colonial Dutch Fortress',
      description: 'UNESCO World Heritage fortress city'
    }
  ];

  const randomLocation = famousLocations[Math.floor(Math.random() * famousLocations.length)];
  
  const newPoint = {
    id: `demo_${Date.now()}`,
    type: randomLocation.type,
    title: randomLocation.title,
    description: randomLocation.description,
    latitude: randomLocation.latitude,
    longitude: randomLocation.longitude,
    addedBy: 'DemoUser',
    addedDate: new Date().toISOString().split('T')[0],
    verified: Math.random() > 0.5,
    rating: 4 + Math.random(),
    reviews: Math.floor(Math.random() * 50),
  };

  setMapPoints(prev => [newPoint, ...prev]);
  Alert.alert('Demo', `Added point at ${randomLocation.name}!`);
};

/**
 * Demo function to test location services
 */
export const testLocationServices = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Location Error', 'Location permission not granted');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    Alert.alert(
      'Location Retrieved',
      `Lat: ${location.coords.latitude.toFixed(6)}\nLng: ${location.coords.longitude.toFixed(6)}`,
      [
        { 
          text: 'Copy Coordinates', 
          onPress: () => {
            // In a real app, you might copy to clipboard here
            console.log(`${location.coords.latitude}, ${location.coords.longitude}`);
          }
        },
        { text: 'OK' }
      ]
    );

    return location;
  } catch (error) {
    Alert.alert('Location Error', `Could not get location: ${error}`);
    return null;
  }
};

/**
 * Demo function to run the full integration test
 */
export const runFullIntegrationTest = async () => {
  const testRunner = new GoogleMapsIntegrationTest();
  const results = await testRunner.runAllTests();
  
  GoogleMapsIntegrationTest.printResults(results);
  
  const passCount = results.filter(r => r.status === 'PASS').length;
  const totalCount = results.length;
  
  Alert.alert(
    'Integration Test Complete',
    `${passCount}/${totalCount} tests passed. Check console for details.`,
    [{ text: 'OK' }]
  );
  
  return results;
};

/**
 * Demo function to validate all map points
 */
export const validateAllMapPoints = (mapPoints: any[]) => {
  let validCount = 0;
  let invalidCount = 0;
  
  mapPoints.forEach(point => {
    if (validateMapPoint(point)) {
      validCount++;
    } else {
      invalidCount++;
    }
  });
  
  Alert.alert(
    'Point Validation',
    `Valid: ${validCount}\nInvalid: ${invalidCount}\nTotal: ${mapPoints.length}`,
    [{ text: 'OK' }]
  );
  
  console.log('Map Point Validation Results:', { validCount, invalidCount, total: mapPoints.length });
};

/**
 * Demo function to simulate map region changes
 */
export const focusOnRegion = (setRegion: (region: any) => void, regionName: string) => {
  const regions = {
    'Colombo': {
      latitude: 6.9271,
      longitude: 79.8612,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    },
    'Kandy': {
      latitude: 7.2906,
      longitude: 80.6337,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    },
    'Galle': {
      latitude: 6.0329,
      longitude: 80.2168,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    },
    'Sri Lanka': {
      latitude: 7.8731,
      longitude: 80.7718,
      latitudeDelta: 2.0,
      longitudeDelta: 2.0,
    }
  };

  const region = regions[regionName as keyof typeof regions];
  if (region) {
    setRegion(region);
    Alert.alert('Map Focus', `Focused on ${regionName}`);
  } else {
    Alert.alert('Error', `Unknown region: ${regionName}`);
  }
};

/**
 * Demo function to generate mock crowdsourced data
 */
export const generateMockCrowdsourceData = () => {
  const types = ['washroom', 'wifi', 'restaurant', 'poi', 'parking'];
  const titles = {
    washroom: ['Clean Restroom', 'Public Toilet', 'Modern Facilities'],
    wifi: ['Free WiFi Spot', 'High Speed Internet', 'Coworking Space'],
    restaurant: ['Local Eatery', 'Traditional Cuisine', 'Street Food'],
    poi: ['Scenic Viewpoint', 'Historic Site', 'Cultural Center'],
    parking: ['Safe Parking', 'Free Parking Area', 'Secure Lot']
  };

  const mockPoints = [];
  
  for (let i = 0; i < 10; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const titleOptions = titles[type as keyof typeof titles];
    const title = titleOptions[Math.floor(Math.random() * titleOptions.length)];
    
    const point = {
      id: `mock_${Date.now()}_${i}`,
      type,
      title: `${title} #${i + 1}`,
      description: `Mock ${type} point for testing purposes`,
      latitude: 6.5 + Math.random() * 2, // Sri Lanka latitude range
      longitude: 79.8 + Math.random() * 1.5, // Sri Lanka longitude range
      addedBy: `MockUser${i + 1}`,
      addedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      verified: Math.random() > 0.3,
      rating: 3 + Math.random() * 2,
      reviews: Math.floor(Math.random() * 100),
    };
    
    mockPoints.push(point);
  }
  
  return mockPoints;
};

/**
 * Helper function to format location for display
 */
export const formatLocationForDisplay = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`;
};

/**
 * Helper function to calculate distance between two points (in km)
 */
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
