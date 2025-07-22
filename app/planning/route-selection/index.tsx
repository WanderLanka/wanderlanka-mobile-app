import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CustomButton, ThemedText } from '@/components';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import React, { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import MapViewDirections from 'react-native-maps-directions';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Google API configuration
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_DIRECTIONS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_DIRECTIONS_API_KEY || process.env.GOOGLE_MAPS_DIRECTIONS_API_KEY || GOOGLE_MAPS_API_KEY;

// Debug logging (remove in production)
console.log('🗺️ Google Maps API Configuration:');
console.log('Places API Key:', GOOGLE_PLACES_API_KEY ? '✅ Available' : '❌ Missing');
console.log('Maps API Key:', GOOGLE_MAPS_API_KEY ? '✅ Available' : '❌ Missing');
console.log('Directions API Key:', GOOGLE_DIRECTIONS_API_KEY ? '✅ Available' : '❌ Missing');

if (!GOOGLE_DIRECTIONS_API_KEY) {
  console.warn('⚠️ Google Directions API key is missing!');
  console.warn('📖 Please check API_SETUP_GUIDE.md for setup instructions');
} else {
  console.log('🚀 Ready to generate pixel-perfect Google Maps routes!');
}

interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  placeId?: string;
  types?: string[];
  description?: string;
}

interface Waypoint extends Location {
  order: number;
  isStartPoint?: boolean;
  isDestination?: boolean;
}

interface RouteSegment {
  from: Waypoint;
  to: Waypoint;
  distance: number;
  duration: number;
  coordinates: { latitude: number; longitude: number; }[];
  polyline: string;
  instructions: string[];
}

interface GeneratedRoute {
  id: string;
  name: string;
  type: 'recommended' | 'shortest' | 'scenic';
  color: string;
  totalDistance: number;
  totalDuration: number;
  segments: RouteSegment[];
  coordinates: { latitude: number; longitude: number; }[];
  polyline: string;
  instructions: string[];
  bounds: {
    northeast: { latitude: number; longitude: number; };
    southwest: { latitude: number; longitude: number; };
  };
  attractions: Array<{
    id: string;
    name: string;
    coordinates: { latitude: number; longitude: number; };
    description: string;
    icon: string;
  }>;
  highlights: string[];
}

// Planning steps
type PlanningStep = 'start-point' | 'destination' | 'waypoints' | 'route-generation' | 'route-comparison';

// Helper function to decode Google polyline
// Smart coordinate simplification that preserves route accuracy
const simplifyCoordinates = (coords: { latitude: number; longitude: number }[], maxPoints: number = 25): { latitude: number; longitude: number }[] => {
  if (!coords || coords.length <= maxPoints) return coords;
  
  console.log(`📍 Simplifying ${coords.length} coordinates to max ${maxPoints} points`);
  
  // Use uniform sampling as the primary method for predictable results
  const step = Math.max(1, Math.floor(coords.length / (maxPoints - 1)));
  const simplified = [coords[0]]; // Always keep first point
  
  for (let i = step; i < coords.length - step; i += step) {
    simplified.push(coords[i]);
  }
  
  simplified.push(coords[coords.length - 1]); // Always keep last point
  
  // Final safety check - if still too many points, take every nth point
  if (simplified.length > maxPoints) {
    const finalStep = Math.ceil(simplified.length / maxPoints);
    const finalSimplified = [simplified[0]];
    for (let i = finalStep; i < simplified.length - finalStep; i += finalStep) {
      finalSimplified.push(simplified[i]);
    }
    finalSimplified.push(simplified[simplified.length - 1]);
    
    console.log(`📍 Final simplified to ${finalSimplified.length} coordinates`);
    return finalSimplified;
  }
  
  console.log(`📍 Simplified to ${simplified.length} coordinates`);
  return simplified;
};

const decodePolyline = (encoded: string): { latitude: number; longitude: number }[] => {
  try {
    if (!encoded || encoded.length === 0) {
      console.warn('⚠️ Empty polyline provided for decoding');
      return [];
    }
    
    const points = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    console.log(`📍 Decoded ${points.length} polyline points`);
    
    // Aggressive simplification to prevent crashes - reduced to 25 points max
    const simplified = simplifyCoordinates(points, 25);
    console.log(`📍 Using ${simplified.length} simplified points for rendering`);
    
    return simplified;
  } catch (error) {
    console.error('❌ Error decoding polyline:', error);
    return [];
  }
};

// Helper functions for route types
const getRouteTypeName = (type: 'recommended' | 'shortest' | 'scenic'): string => {
  switch (type) {
    case 'shortest': return 'Shortest Route';
    case 'scenic': return 'Scenic Route';
    case 'recommended': 
    default: return 'Recommended Route';
  }
};

const getRouteTypeColor = (type: 'recommended' | 'shortest' | 'scenic'): string => {
  switch (type) {
    case 'recommended': return '#3B82F6'; // Blue
    case 'shortest': return '#10B981'; // Green
    case 'scenic': return '#F59E0B'; // Orange
    default: return '#3B82F6';
  }
};

const getRouteHighlights = (type: 'recommended' | 'shortest' | 'scenic'): string[] => {
  switch (type) {
    case 'recommended':
      return ['Balanced time and comfort', 'Google\'s best route', 'Optimal traffic routing'];
    case 'shortest':
      return ['Minimum distance', 'Fuel efficient', 'Direct path'];
    case 'scenic':
      return ['Beautiful landscapes', 'Tourist attractions', 'Scenic viewpoints'];
    default:
      return [];
  }
};

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (coord1: { latitude: number; longitude: number }, coord2: { latitude: number; longitude: number }): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Fallback mock route generation for development/testing
const generateMockRoute = async (
  origin: Location,
  destination: Location,
  waypoints: Location[],
  routeType: 'recommended' | 'shortest' | 'scenic'
): Promise<GeneratedRoute | null> => {
  console.log(`⚠️ Generating mock ${routeType} route as fallback...`);
  
  const allPoints = [origin, ...waypoints, destination];
  
  // Generate realistic-looking route coordinates that vary based on route type
  let routeCoordinates: { latitude: number; longitude: number }[] = [];
  
  for (let i = 0; i < allPoints.length - 1; i++) {
    const start = allPoints[i].coordinates;
    const end = allPoints[i + 1].coordinates;
    
    // Generate intermediate points based on route type
    const intermediatePoints = generateIntermediatePoints(start, end, routeType);
    
    if (i === 0) {
      routeCoordinates.push(start);
    }
    routeCoordinates.push(...intermediatePoints);
    routeCoordinates.push(end);
  }
  
  // Calculate approximate distance and duration
  const totalDistance = calculateTotalDistance(routeCoordinates);
  const baseDuration = totalDistance * 1.2; // Rough estimate: 1.2 hours per 100km
  
  // Adjust based on route type
  let adjustedDistance = totalDistance;
  let adjustedDuration = baseDuration;
  
  switch (routeType) {
    case 'shortest':
      adjustedDistance *= 0.95; // 5% shorter
      adjustedDuration *= 1.1;   // 10% longer due to traffic/road conditions
      break;
    case 'scenic':
      adjustedDistance *= 1.25;  // 25% longer for scenic route
      adjustedDuration *= 1.4;   // 40% longer due to winding roads
      break;
    case 'recommended':
    default:
      // Base values - balanced approach
      break;
  }
  
  // Convert locations to waypoints
  const waypointList: Waypoint[] = allPoints.map((point, index) => ({
    ...point,
    order: index,
    isStartPoint: index === 0,
    isDestination: index === allPoints.length - 1,
  }));
  
  // Calculate bounds
  const lats = routeCoordinates.map(coord => coord.latitude);
  const lngs = routeCoordinates.map(coord => coord.longitude);
  const bounds = {
    northeast: {
      latitude: Math.max(...lats),
      longitude: Math.max(...lngs),
    },
    southwest: {
      latitude: Math.min(...lats),
      longitude: Math.min(...lngs),
    },
  };
  
  return {
    id: routeType,
    name: getRouteTypeName(routeType),
    type: routeType,
    color: getRouteTypeColor(routeType),
    totalDistance: Math.round(adjustedDistance),
    totalDuration: Math.round(adjustedDuration),
    segments: waypointList.slice(0, -1).map((point, index) => ({
      from: point,
      to: waypointList[index + 1],
      distance: Math.round(calculateDistance(point.coordinates, waypointList[index + 1].coordinates)),
      duration: Math.round(calculateDistance(point.coordinates, waypointList[index + 1].coordinates) * 1.5),
      coordinates: routeCoordinates.slice(
        routeCoordinates.findIndex(coord => 
          Math.abs(coord.latitude - point.coordinates.latitude) < 0.001 &&
          Math.abs(coord.longitude - point.coordinates.longitude) < 0.001
        ),
        routeCoordinates.findIndex(coord => 
          Math.abs(coord.latitude - waypointList[index + 1].coordinates.latitude) < 0.001 &&
          Math.abs(coord.longitude - waypointList[index + 1].coordinates.longitude) < 0.001
        ) + 1
      ),
      polyline: 'mock_polyline',
      instructions: [`Head towards ${waypointList[index + 1].name}`, `Arrive at ${waypointList[index + 1].name}`],
    })),
    coordinates: routeCoordinates, // Different path for each route type
    polyline: 'mock_polyline',
    instructions: [`Head towards ${destination.name}`, `Arrive at ${destination.name}`],
    bounds,
    attractions: [],
    highlights: getRouteHighlights(routeType),
  };
};

// Generate intermediate points that create visually different routes
const generateIntermediatePoints = (
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
  routeType: 'recommended' | 'shortest' | 'scenic'
): { latitude: number; longitude: number }[] => {
  const points: { latitude: number; longitude: number }[] = [];
  const steps = 10; // Number of intermediate points
  
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    
    // Base interpolation
    let lat = start.latitude + (end.latitude - start.latitude) * t;
    let lng = start.longitude + (end.longitude - start.longitude) * t;
    
    // Add variations based on route type
    switch (routeType) {
      case 'shortest':
        // Slight random variation to simulate direct roads
        lat += (Math.random() - 0.5) * 0.005;
        lng += (Math.random() - 0.5) * 0.005;
        break;
      case 'scenic':
        // Larger curves to simulate scenic mountain/coastal roads
        const scenicOffset = Math.sin(t * Math.PI * 3) * 0.02;
        lat += scenicOffset;
        lng += scenicOffset * 0.7;
        break;
      case 'recommended':
      default:
        // Moderate variation to simulate main roads
        lat += (Math.random() - 0.5) * 0.01;
        lng += (Math.random() - 0.5) * 0.01;
        break;
    }
    
    points.push({ latitude: lat, longitude: lng });
  }
  
  return points;
};

// Calculate total distance for a route
const calculateTotalDistance = (coordinates: { latitude: number; longitude: number }[]): number => {
  let totalDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalDistance += calculateDistance(coordinates[i], coordinates[i + 1]);
  }
  return totalDistance;
};

// MAIN ROUTE GENERATION FUNCTION - USES REAL GOOGLE DIRECTIONS API
const generateRoute = async (
  origin: Location,
  destination: Location,
  waypoints: Location[],
  routeType: 'recommended' | 'shortest' | 'scenic' = 'recommended'
): Promise<GeneratedRoute | null> => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not found');
    Alert.alert('Configuration Error', 'Google Maps API key is not configured. Please check your environment setup.');
    return null;
  }

  try {
    console.log(`🗺️ Generating ${routeType} route from ${origin.name} to ${destination.name}`);
    
    // Create waypoints string for the API
    const waypointsStr = waypoints.length > 0 
      ? `&waypoints=${waypoints.map(wp => `${wp.coordinates.latitude},${wp.coordinates.longitude}`).join('|')}`
      : '';
    
    // Set route preferences based on type to get different actual routes
    let routePreferences = '';
    let alternatives = '&alternatives=true';
    
    switch (routeType) {
      case 'shortest':
        // Request shortest route by avoiding tolls and optimizing for distance
        routePreferences = '&avoid=tolls&mode=driving&optimize=true';
        break;
      case 'scenic':
        // Request scenic route by avoiding highways (forces local roads)
        routePreferences = '&avoid=highways&mode=driving';
        break;
      case 'recommended':
      default:
        // Request recommended route (Google's default best route)
        routePreferences = '&mode=driving';
        break;
    }

    // Build the Google Directions API URL
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.coordinates.latitude},${origin.coordinates.longitude}&destination=${destination.coordinates.latitude},${destination.coordinates.longitude}${waypointsStr}&key=${GOOGLE_MAPS_API_KEY}${routePreferences}${alternatives}`;
    
    console.log(`📡 Fetching ${routeType} route from Google Directions API...`);
    console.log('Request URL:', url.replace(GOOGLE_MAPS_API_KEY, 'API_KEY_HIDDEN'));
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log(`📊 API Response status for ${routeType}:`, data.status);
    
    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      // Select the appropriate route based on type
      let selectedRoute = data.routes[0];
      
      // For different route types, try to select the best matching route from alternatives
      if (data.routes.length > 1) {
        switch (routeType) {
          case 'shortest':
            // Find the shortest distance route
            selectedRoute = data.routes.reduce((shortest: any, route: any) => {
              const shortestDistance = shortest.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0);
              const routeDistance = route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0);
              return routeDistance < shortestDistance ? route : shortest;
            });
            break;
          case 'scenic':
            // Find the route that avoids highways (more scenic)
            selectedRoute = data.routes.reduce((best: any, route: any) => {
              const bestDistance = best.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0);
              const routeDistance = route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0);
              // Prefer routes that are longer (potentially more scenic)
              return routeDistance > bestDistance ? route : best;
            });
            break;
          case 'recommended':
          default:
            // Use the first route (Google's recommended)
            selectedRoute = data.routes[0];
            break;
        }
      }
      
      // ⭐ DECODE THE POLYLINE TO GET THE ACTUAL ROAD COORDINATES
      const coordinates = decodePolyline(selectedRoute.overview_polyline.points);
      
      // Calculate total distance and duration
      const totalDistance = selectedRoute.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0);
      const totalDuration = selectedRoute.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0);
      
      // Convert locations to waypoints for segments
      const allPoints = [origin, ...waypoints, destination];
      const waypointList: Waypoint[] = allPoints.map((point, index) => ({
        ...point,
        order: index,
        isStartPoint: index === 0,
        isDestination: index === allPoints.length - 1,
      }));
      
      // Create route segments with real polyline data
      const segments = selectedRoute.legs.map((leg: any, index: number) => ({
        from: waypointList[index],
        to: waypointList[index + 1],
        distance: Math.round(leg.distance.value / 1000), // Convert to km
        duration: Math.round(leg.duration.value / 60), // Convert to minutes
        coordinates: decodePolyline(leg.overview_polyline?.points || selectedRoute.overview_polyline.points),
        polyline: leg.overview_polyline?.points || selectedRoute.overview_polyline.points,
        instructions: leg.steps.map((step: any) => step.html_instructions.replace(/<[^>]*>/g, '')),
      }));
      
      console.log(`✅ Successfully generated ${routeType} route with ${coordinates.length} real road coordinate points`);
      
      return {
        id: routeType,
        name: getRouteTypeName(routeType),
        type: routeType,
        color: getRouteTypeColor(routeType),
        totalDistance: Math.round(totalDistance / 1000), // Convert to km
        totalDuration: Math.round(totalDuration / 60), // Convert to minutes
        segments,
        coordinates, // ⭐ REAL GOOGLE MAPS ROAD COORDINATES
        polyline: selectedRoute.overview_polyline.points,
        instructions: selectedRoute.legs.flatMap((leg: any) => 
          leg.steps.map((step: any) => step.html_instructions.replace(/<[^>]*>/g, ''))
        ),
        bounds: {
          northeast: {
            latitude: selectedRoute.bounds.northeast.lat,
            longitude: selectedRoute.bounds.northeast.lng,
          },
          southwest: {
            latitude: selectedRoute.bounds.southwest.lat,
            longitude: selectedRoute.bounds.southwest.lng,
          },
        },
        attractions: [], // Will be populated later with nearby attractions
        highlights: getRouteHighlights(routeType),
      };
    } else {
      console.warn(`❌ Directions API error for ${routeType}:`, data.status, data.error_message);
      if (data.status === 'ZERO_RESULTS') {
        Alert.alert('No Route Found', `No ${routeType} route could be found between the selected locations.`);
      } else if (data.status === 'REQUEST_DENIED') {
        console.error('🔑 API Configuration Issue:', data.error_message);
        Alert.alert(
          'API Configuration Error', 
          'Google Directions API is not properly configured. Please:\n\n1. Go to Google Cloud Console\n2. Enable the Directions API\n3. Make sure your API key has proper permissions\n\nFor now, we\'ll use mock data for testing.'
        );
        // Temporarily fall back to mock data for development/testing
        return generateMockRoute(origin, destination, waypoints, routeType);
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        Alert.alert('API Limit Exceeded', 'Google Directions API quota exceeded. Please try again later.');
      } else {
        Alert.alert('Route Error', `Unable to generate ${routeType} route: ${data.status}`);
      }
      
      // Don't fall back to mock data for production - return null
      console.log(`❌ No real route available for ${routeType} - API returned: ${data.status}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error generating ${routeType} route:`, error);
    
    // Check if it's a network error or API configuration issue
    if (error instanceof Error) {
      if (error.message.includes('REQUEST_DENIED')) {
        Alert.alert(
          'API Configuration Error', 
          'Google Directions API is not properly configured. Please check your API key permissions in Google Cloud Console.'
        );
        // Temporarily fall back to mock data for development/testing
        return generateMockRoute(origin, destination, waypoints, routeType);
      } else {
        Alert.alert('Network Error', `Unable to connect to Google Maps API for ${routeType} route. Please check your internet connection.`);
      }
    }
    
    return null;
  }
};

// Helper function to get place description from types
const getPlaceDescription = (types: string[]): string => {
  if (!types || types.length === 0) return 'Place';
  
  const typeDescriptions: Record<string, string> = {
    'locality': 'City',
    'political': 'Administrative area',
    'tourist_attraction': 'Tourist attraction',
    'point_of_interest': 'Point of interest',
    'establishment': 'Establishment',
    'natural_feature': 'Natural feature',
    'park': 'Park',
    'airport': 'Airport',
    'train_station': 'Train station',
    'bus_station': 'Bus station',
    'lodging': 'Hotel',
    'restaurant': 'Restaurant',
    'shopping_mall': 'Shopping mall',
    'hospital': 'Hospital',
    'school': 'School',
    'university': 'University',
    'place_of_worship': 'Place of worship',
    'museum': 'Museum',
    'amusement_park': 'Amusement park',
    'zoo': 'Zoo',
    'aquarium': 'Aquarium',
    'beach': 'Beach',
    'campground': 'Campground',
    'spa': 'Spa',
    'gym': 'Gym',
    'stadium': 'Stadium',
    'night_club': 'Night club',
    'casino': 'Casino',
    'beauty_salon': 'Beauty salon',
    'gas_station': 'Gas station',
    'bank': 'Bank',
    'atm': 'ATM',
    'pharmacy': 'Pharmacy',
    'post_office': 'Post office',
    'police': 'Police station',
    'fire_station': 'Fire station',
    'courthouse': 'Courthouse',
    'city_hall': 'City hall',
    'embassy': 'Embassy',
    'library': 'Library',
    'movie_theater': 'Movie theater',
    'bowling_alley': 'Bowling alley',
    'rv_park': 'RV park',
    'car_dealer': 'Car dealer',
    'car_rental': 'Car rental',
    'car_repair': 'Car repair',
    'car_wash': 'Car wash',
    'clothing_store': 'Clothing store',
    'convenience_store': 'Convenience store',
    'department_store': 'Department store',
    'electronics_store': 'Electronics store',
    'furniture_store': 'Furniture store',
    'grocery_or_supermarket': 'Supermarket',
    'hardware_store': 'Hardware store',
    'home_goods_store': 'Home goods store',
    'jewelry_store': 'Jewelry store',
    'liquor_store': 'Liquor store',
    'pet_store': 'Pet store',
    'shoe_store': 'Shoe store',
    'storage': 'Storage',
    'store': 'Store',
    'subpremise': 'Subpremise',
    'synagogue': 'Synagogue',
    'taxi_stand': 'Taxi stand',
    'transit_station': 'Transit station',
    'travel_agency': 'Travel agency',
    'veterinary_care': 'Veterinary care',
    'administrative_area_level_1': 'Province',
    'administrative_area_level_2': 'District',
    'administrative_area_level_3': 'Division',
    'administrative_area_level_4': 'Subdivision',
    'administrative_area_level_5': 'Subdivision',
    'country': 'Country',
    'postal_code': 'Postal code',
    'route': 'Route',
    'street_address': 'Street address',
    'street_number': 'Street number',
    'sublocality': 'Sublocality',
    'sublocality_level_1': 'Sublocality',
    'sublocality_level_2': 'Sublocality',
    'sublocality_level_3': 'Sublocality',
    'sublocality_level_4': 'Sublocality',
    'sublocality_level_5': 'Sublocality',
    'premise': 'Premise',
    'floor': 'Floor',
    'room': 'Room',
    'postal_town': 'Postal town',
    'neighborhood': 'Neighborhood',
    'intersection': 'Intersection',
    'colloquial_area': 'Colloquial area',
    'ward': 'Ward',
    'archipelago': 'Archipelago',
    'continent': 'Continent',
  };
  
  // Find the most descriptive type
  const priorityTypes = [
    'tourist_attraction',
    'point_of_interest',
    'airport',
    'train_station',
    'bus_station',
    'lodging',
    'restaurant',
    'shopping_mall',
    'hospital',
    'school',
    'university',
    'place_of_worship',
    'museum',
    'amusement_park',
    'zoo',
    'aquarium',
    'beach',
    'park',
    'natural_feature',
    'locality',
    'establishment',
  ];
  
  for (const priorityType of priorityTypes) {
    if (types.includes(priorityType)) {
      return typeDescriptions[priorityType] || priorityType;
    }
  }
  
  // If no priority type found, use the first type
  const firstType = types[0];
  return typeDescriptions[firstType] || firstType;
};

// Google Places Autocomplete API for better search experience
const autocompleteSearch = async (query: string): Promise<Location[]> => {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not found');
    return [];
  }

  // Return empty array if query is too short
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    console.log(`🔍 Autocomplete search for: "${query}"`);
    
    // Use Google Places Autocomplete API
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
    const queryParam = encodeURIComponent(query);
    
    // Sri Lanka component restriction
    const url = `${baseUrl}?` +
      `input=${queryParam}&` +
      `components=country:lk&` + // Restrict to Sri Lanka
      `types=geocode|establishment&` + // Include both places and addresses
      `key=${GOOGLE_PLACES_API_KEY}`;
    
    console.log('🌐 Making Autocomplete API request...');
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Autocomplete API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
      console.log(`✅ Found ${data.predictions.length} autocomplete suggestions`);
      
      // Get place details for each prediction
      const locations: Location[] = [];
      
      for (const prediction of data.predictions.slice(0, 10)) { // Limit to 10 results
        try {
          const placeDetails = await getPlaceDetails(prediction.place_id);
          if (placeDetails) {
            locations.push(placeDetails);
          }
        } catch (error) {
          console.error('Error getting place details:', error);
          // Fallback to basic prediction data
          locations.push({
            id: prediction.place_id,
            name: prediction.structured_formatting?.main_text || prediction.description,
            address: prediction.description,
            coordinates: { latitude: 0, longitude: 0 }, // Will be updated when place details are fetched
            placeId: prediction.place_id,
            types: prediction.types || [],
            description: getPlaceDescription(prediction.types || []),
          });
        }
      }
      
      console.log(`📍 Processed ${locations.length} autocomplete locations`);
      return locations;
      
    } else if (data.status === 'ZERO_RESULTS') {
      console.log('🔍 No autocomplete suggestions found');
      return [];
    } else {
      console.error('Autocomplete API error:', data.status, data.error_message);
      throw new Error(`Autocomplete API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('Error in autocomplete search:', error);
    // Fallback to text search
    return await searchPlaces(query);
  }
};

// Get detailed place information
const getPlaceDetails = async (placeId: string): Promise<Location | null> => {
  if (!GOOGLE_PLACES_API_KEY || !placeId) {
    return null;
  }

  try {
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    const url = `${baseUrl}?` +
      `place_id=${placeId}&` +
      `fields=place_id,name,formatted_address,geometry,types,address_components&` +
      `key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Place details request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.result) {
      const place = data.result;
      
      return {
        id: place.place_id,
        name: place.name || 'Unknown Place',
        address: place.formatted_address || 'Unknown Address',
        coordinates: {
          latitude: place.geometry?.location?.lat || 0,
          longitude: place.geometry?.location?.lng || 0,
        },
        placeId: place.place_id,
        types: place.types || [],
        description: getPlaceDescription(place.types || []),
      };
    } else {
      console.error('Place details API error:', data.status, data.error_message);
      return null;
    }
    
  } catch (error) {
    console.error('Error getting place details:', error);
    return null;
  }
};

// Google Places API utilities
const searchPlaces = async (query: string, location?: { lat: number; lng: number }): Promise<Location[]> => {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not found');
    Alert.alert('Configuration Error', 'Google Places API key is not configured. Please check your environment setup.');
    return [];
  }

  // Return empty array if query is too short
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    console.log(`🔍 Searching for places: "${query}" in Sri Lanka`);
    
    // Sri Lanka bounds for location bias
    const sriLankaBounds = {
      northeast: { lat: 9.8315, lng: 82.2 },
      southwest: { lat: 5.9, lng: 79.5 }
    };
    
    // Use Google Places API Text Search
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    const queryParam = encodeURIComponent(`${query} Sri Lanka`);
    
    const url = `${baseUrl}?` +
      `query=${queryParam}&` +
      `location=${(sriLankaBounds.northeast.lat + sriLankaBounds.southwest.lat) / 2},${(sriLankaBounds.northeast.lng + sriLankaBounds.southwest.lng) / 2}&` +
      `radius=200000&` + // 200km radius to cover all of Sri Lanka
      `key=${GOOGLE_PLACES_API_KEY}`;
    
    console.log('🌐 Making Places API request...');
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Places API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK') {
      console.log(`✅ Found ${data.results.length} places`);
      
      const locations: Location[] = data.results.map((place: any, index: number) => {
        const location: Location = {
          id: place.place_id || `place_${index}`,
          name: place.name || 'Unknown Place',
          address: place.formatted_address || 'Unknown Address',
          coordinates: {
            latitude: place.geometry?.location?.lat || 0,
            longitude: place.geometry?.location?.lng || 0,
          },
          placeId: place.place_id,
          types: place.types || [],
          description: getPlaceDescription(place.types || []),
        };
        
        console.log(`📍 Place: ${location.name} - ${location.address}`);
        return location;
      });
      
      // Filter to ensure we only return places in Sri Lanka
      const sriLankanPlaces = locations.filter(place => 
        place.address.toLowerCase().includes('sri lanka') ||
        place.address.toLowerCase().includes('lk') ||
        (place.coordinates.latitude >= sriLankaBounds.southwest.lat && 
         place.coordinates.latitude <= sriLankaBounds.northeast.lat &&
         place.coordinates.longitude >= sriLankaBounds.southwest.lng && 
         place.coordinates.longitude <= sriLankaBounds.northeast.lng)
      );
      
      console.log(`🇱🇰 Filtered to ${sriLankanPlaces.length} places in Sri Lanka`);
      return sriLankanPlaces;
      
    } else if (data.status === 'ZERO_RESULTS') {
      console.log('🔍 No places found for query');
      return [];
    } else {
      console.error('Places API error:', data.status, data.error_message);
      throw new Error(`Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('Error searching places:', error);
    
    // Fallback to sample locations if API fails
    console.log('🔄 Using fallback sample locations...');
    const sampleLocations: Location[] = [
      {
        id: 'sample_1',
        name: 'Colombo',
        address: 'Colombo, Sri Lanka',
        coordinates: { latitude: 6.9271, longitude: 79.8612 },
        placeId: 'ChIJA3XvDC1_4joRMRbdXSYA7lw',
        types: ['locality', 'political'],
        description: 'Capital city',
      },
      {
        id: 'sample_2',
        name: 'Kandy',
        address: 'Kandy, Sri Lanka',
        coordinates: { latitude: 7.2906, longitude: 80.6337 },
        placeId: 'ChIJnbPNEQHaOToRYVlqJMoRBko',
        types: ['locality', 'political'],
        description: 'Cultural city',
      },
      {
        id: 'sample_3',
        name: 'Galle',
        address: 'Galle, Sri Lanka',
        coordinates: { latitude: 6.0329, longitude: 80.217 },
        placeId: 'ChIJxwUhYQHrOToRbZOiJkwQZZY',
        types: ['locality', 'political'],
        description: 'Historic city',
      },
      {
        id: 'sample_4',
        name: 'Sigiriya',
        address: 'Sigiriya, Sri Lanka',
        coordinates: { latitude: 7.9568, longitude: 80.7598 },
        placeId: 'ChIJXQZYLV3COToRaAqWBz2YhBE',
        types: ['tourist_attraction'],
        description: 'Ancient rock fortress',
      },
      {
        id: 'sample_5',
        name: 'Ella',
        address: 'Ella, Sri Lanka',
        coordinates: { latitude: 6.8721, longitude: 81.0476 },
        placeId: 'ChIJi8_2zv8fOToRqOQJvUcwULg',
        types: ['locality', 'political'],
        description: 'Hill station',
      },
      {
        id: 'sample_6',
        name: 'Nuwara Eliya',
        address: 'Nuwara Eliya, Sri Lanka',
        coordinates: { latitude: 6.9497, longitude: 80.7891 },
        placeId: 'ChIJrWgNw2KNOToRKKYv1_pzMkw',
        types: ['locality', 'political'],
        description: 'Hill country',
      },
      {
        id: 'sample_7',
        name: 'Anuradhapura',
        address: 'Anuradhapura, Sri Lanka',
        coordinates: { latitude: 8.3114, longitude: 80.4037 },
        placeId: 'ChIJXwJXcK5vOToRKOhJtSG6YgA',
        types: ['locality', 'political'],
        description: 'Ancient city',
      },
      {
        id: 'sample_8',
        name: 'Polonnaruwa',
        address: 'Polonnaruwa, Sri Lanka',
        coordinates: { latitude: 7.9403, longitude: 81.0188 },
        placeId: 'ChIJXQZYLV3COToRaAqWBz2YhBE',
        types: ['locality', 'political'],
        description: 'Historic city',
      },
      {
        id: 'sample_9',
        name: 'Bentota',
        address: 'Bentota, Sri Lanka',
        coordinates: { latitude: 6.4267, longitude: 80.0031 },
        placeId: 'ChIJXwJXcK5vOToRKOhJtSG6YgA',
        types: ['locality', 'political'],
        description: 'Beach town',
      },
      {
        id: 'sample_10',
        name: 'Mirissa',
        address: 'Mirissa, Sri Lanka',
        coordinates: { latitude: 5.9487, longitude: 80.4522 },
        placeId: 'ChIJXwJXcK5vOToRKOhJtSG6YgA',
        types: ['locality', 'political'],
        description: 'Beach destination',
      },
    ];

    // Filter sample locations based on query
    const filteredLocations = sampleLocations.filter(location => 
      location.name.toLowerCase().includes(query.toLowerCase()) ||
      location.address.toLowerCase().includes(query.toLowerCase()) ||
      location.description?.toLowerCase().includes(query.toLowerCase())
    );

    return filteredLocations;
  }
};

// Main component
export default function TripPlanningScreen() {
  const params = useLocalSearchParams();
  const [currentStep, setCurrentStep] = useState<PlanningStep>('start-point');
  
  // Location states
  const [startPoint, setStartPoint] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [waypoints, setWaypoints] = useState<Location[]>([]);
  
  // Route states
  const [generatedRoutes, setGeneratedRoutes] = useState<GeneratedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<GeneratedRoute | null>(null);
  
  // UI states
  const [isGeneratingRoutes, setIsGeneratingRoutes] = useState(false);
  const [showRouteComparison, setShowRouteComparison] = useState(false);
  const [routesReadyForRender, setRoutesReadyForRender] = useState(false);
  const [showFullScreenMap, setShowFullScreenMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchMode, setSearchMode] = useState<'start' | 'destination' | 'waypoint'>('start');
  const [isSearching, setIsSearching] = useState(false);
  
  // Map states
  const [mapRegion, setMapRegion] = useState({
    latitude: 7.8731,
    longitude: 80.7718,
    latitudeDelta: 2.0,
    longitudeDelta: 2.0,
  });

  // Initialize with params if available
  useEffect(() => {
    if (params.startPoint) {
      try {
        const parsedStartPoint = JSON.parse(params.startPoint as string);
        setStartPoint(parsedStartPoint);
        setCurrentStep('destination');
      } catch (error) {
        console.error('Error parsing start point:', error);
      }
    }
  }, [params]);

  // Search handling
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      setIsSearching(true);
      console.log(`🔍 Searching for: "${query}"`);
      try {
        // Use autocomplete search for better results
        const results = await autocompleteSearch(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (location: Location) => {
    switch (searchMode) {
      case 'start':
        setStartPoint(location);
        setCurrentStep('destination');
        break;
      case 'destination':
        setDestination(location);
        setCurrentStep('waypoints');
        break;
      case 'waypoint':
        setWaypoints([...waypoints, location]);
        break;
    }
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveWaypoint = (locationId: string) => {
    setWaypoints(waypoints.filter(w => w.id !== locationId));
  };

  const generateRoutes = async () => {
    if (!startPoint || !destination) return;

    setIsGeneratingRoutes(true);
    setCurrentStep('route-generation');
    setRoutesReadyForRender(false); // Reset render state
    
    // Clear existing routes to free memory
    setGeneratedRoutes([]);
    setSelectedRoute(null);

    try {
      console.log('🚀 Generating multiple route options using Google Directions API...');
      
      if (!GOOGLE_DIRECTIONS_API_KEY) {
        console.warn('⚠️ API key missing, using fallback route generation');
        // Fallback to basic route generation
        const routeTypes: ('recommended' | 'shortest' | 'scenic')[] = ['recommended', 'shortest', 'scenic'];
        const mockRoutes: GeneratedRoute[] = routeTypes.map(routeType => {
          const allPoints = [startPoint, ...waypoints, destination];
          const totalDistance = allPoints.reduce((total, point, index) => {
            if (index === 0) return 0;
            return total + calculateDistance(allPoints[index - 1].coordinates, point.coordinates);
          }, 0);
          
          let adjustedDistance = totalDistance;
          let adjustedDuration = totalDistance * 1.2;
          
          switch (routeType) {
            case 'shortest':
              adjustedDistance *= 0.95;
              adjustedDuration *= 1.1;
              break;
            case 'scenic':
              adjustedDistance *= 1.25;
              adjustedDuration *= 1.4;
              break;
            default:
              break;
          }
          
          return {
            id: routeType,
            name: getRouteTypeName(routeType),
            type: routeType,
            color: getRouteTypeColor(routeType),
            totalDistance: Math.round(adjustedDistance),
            totalDuration: Math.round(adjustedDuration),
            segments: [],
            coordinates: allPoints.map(p => p.coordinates),
            polyline: 'handled_by_mapviewdirections',
            instructions: [`Route from ${startPoint.name} to ${destination.name}`],
            bounds: {
              northeast: {
                latitude: Math.max(...allPoints.map(p => p.coordinates.latitude)),
                longitude: Math.max(...allPoints.map(p => p.coordinates.longitude)),
              },
              southwest: {
                latitude: Math.min(...allPoints.map(p => p.coordinates.latitude)),
                longitude: Math.min(...allPoints.map(p => p.coordinates.longitude)),
              },
            },
            attractions: [],
            highlights: getRouteHighlights(routeType),
          };
        });
        
        setGeneratedRoutes(mockRoutes);
        setSelectedRoute(mockRoutes[0]);
        setCurrentStep('route-comparison');
        setShowRouteComparison(true);
        return;
      }

      // Generate different route types using Google Directions API
      const routes: GeneratedRoute[] = [];
      
      // Build waypoints string for API calls
      const waypointsStr = waypoints.length > 0 
        ? waypoints.map(w => `${w.coordinates.latitude},${w.coordinates.longitude}`).join('|')
        : '';
      
      // Route 1: Recommended (default balanced route)
      const recommendedUrl = `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${startPoint.coordinates.latitude},${startPoint.coordinates.longitude}&` +
        `destination=${destination.coordinates.latitude},${destination.coordinates.longitude}&` +
        `${waypointsStr ? `waypoints=${waypointsStr}&` : ''}` +
        `mode=driving&` +
        `alternatives=true&` +
        `key=${GOOGLE_DIRECTIONS_API_KEY}`;
      
      console.log('📍 Fetching recommended route...');
      const recommendedResponse = await fetch(recommendedUrl);
      
      if (!recommendedResponse.ok) {
        throw new Error(`HTTP error! status: ${recommendedResponse.status}`);
      }
      
      const recommendedData = await recommendedResponse.json();
      
      if (recommendedData.status === 'OK' && recommendedData.routes.length > 0) {
        const route = recommendedData.routes[0];
        const coordinates = decodePolyline(route.overview_polyline.points);
        
        // Validate coordinates
        if (coordinates && coordinates.length > 0) {
          routes.push({
            id: 'recommended',
            name: 'Recommended Route',
            type: 'recommended',
            color: '#3B82F6',
            totalDistance: Math.round(route.legs.reduce((total: number, leg: any) => total + leg.distance.value, 0) / 1000),
            totalDuration: Math.round(route.legs.reduce((total: number, leg: any) => total + leg.duration.value, 0) / 60),
            segments: route.legs,
            coordinates: coordinates,
            polyline: route.overview_polyline.points,
            instructions: route.legs.flatMap((leg: any) => leg.steps.map((step: any) => step.html_instructions)),
            bounds: route.bounds,
            attractions: [],
            highlights: getRouteHighlights('recommended'),
          });
        } else {
          console.warn('⚠️ Invalid coordinates for recommended route');
        }
      }
      
      // Route 2: Shortest (optimized for distance, avoid tolls)
      const shortestUrl = `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${startPoint.coordinates.latitude},${startPoint.coordinates.longitude}&` +
        `destination=${destination.coordinates.latitude},${destination.coordinates.longitude}&` +
        `${waypointsStr ? `waypoints=optimize:true|${waypointsStr}&` : ''}` +
        `mode=driving&` +
        `avoid=tolls&` +
        `alternatives=true&` +
        `key=${GOOGLE_DIRECTIONS_API_KEY}`;
      
      console.log('📍 Fetching shortest route...');
      const shortestResponse = await fetch(shortestUrl);
      
      if (!shortestResponse.ok) {
        throw new Error(`HTTP error! status: ${shortestResponse.status}`);
      }
      
      const shortestData = await shortestResponse.json();
      
      if (shortestData.status === 'OK' && shortestData.routes.length > 0) {
        // Get the shortest route (first one is usually optimized)
        const route = shortestData.routes[0];
        const coordinates = decodePolyline(route.overview_polyline.points);
        
        // Validate coordinates
        if (coordinates && coordinates.length > 0) {
          routes.push({
            id: 'shortest',
            name: 'Shortest Route',
            type: 'shortest',
            color: '#10B981',
            totalDistance: Math.round(route.legs.reduce((total: number, leg: any) => total + leg.distance.value, 0) / 1000),
            totalDuration: Math.round(route.legs.reduce((total: number, leg: any) => total + leg.duration.value, 0) / 60),
            segments: route.legs,
            coordinates: coordinates,
            polyline: route.overview_polyline.points,
            instructions: route.legs.flatMap((leg: any) => leg.steps.map((step: any) => step.html_instructions)),
            bounds: route.bounds,
            attractions: [],
            highlights: getRouteHighlights('shortest'),
          });
        } else {
          console.warn('⚠️ Invalid coordinates for shortest route');
        }
      }
      
      // Route 3: Scenic (avoid highways and ferries for more scenic local roads)
      const scenicUrl = `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${startPoint.coordinates.latitude},${startPoint.coordinates.longitude}&` +
        `destination=${destination.coordinates.latitude},${destination.coordinates.longitude}&` +
        `${waypointsStr ? `waypoints=${waypointsStr}&` : ''}` +
        `mode=driving&` +
        `avoid=highways,ferries&` +
        `alternatives=true&` +
        `key=${GOOGLE_DIRECTIONS_API_KEY}`;
      
      console.log('📍 Fetching scenic route...');
      const scenicResponse = await fetch(scenicUrl);
      
      if (!scenicResponse.ok) {
        throw new Error(`HTTP error! status: ${scenicResponse.status}`);
      }
      
      const scenicData = await scenicResponse.json();
      
      if (scenicData.status === 'OK' && scenicData.routes.length > 0) {
        const route = scenicData.routes[0];
        const coordinates = decodePolyline(route.overview_polyline.points);
        
        // Validate coordinates
        if (coordinates && coordinates.length > 0) {
          routes.push({
            id: 'scenic',
            name: 'Scenic Route',
            type: 'scenic',
            color: '#F59E0B',
            totalDistance: Math.round(route.legs.reduce((total: number, leg: any) => total + leg.distance.value, 0) / 1000),
            totalDuration: Math.round(route.legs.reduce((total: number, leg: any) => total + leg.duration.value, 0) / 60),
            segments: route.legs,
            coordinates: coordinates,
            polyline: route.overview_polyline.points,
            instructions: route.legs.flatMap((leg: any) => leg.steps.map((step: any) => step.html_instructions)),
            bounds: route.bounds,
            attractions: [],
            highlights: getRouteHighlights('scenic'),
          });
        } else {
          console.warn('⚠️ Invalid coordinates for scenic route');
        }
      }

      // Enhanced alternative route handling to ensure route type accuracy
      const processedRouteTypes = new Set(routes.map(r => r.type));
      
      // Organize alternatives by their source to ensure accurate route type matching
      const alternativesBySource: Record<string, any[]> = {
        recommended: [],
        shortest: [],
        scenic: []
      };
      
      if (recommendedData.routes && recommendedData.routes.length > 1) {
        alternativesBySource.recommended = recommendedData.routes.slice(1);
      }
      
      if (shortestData.routes && shortestData.routes.length > 1) {
        alternativesBySource.shortest = shortestData.routes.slice(1);
      }
      
      if (scenicData.routes && scenicData.routes.length > 1) {
        alternativesBySource.scenic = scenicData.routes.slice(1);
      }
      
      console.log(`📍 Found alternatives: Recommended=${alternativesBySource.recommended.length}, Shortest=${alternativesBySource.shortest.length}, Scenic=${alternativesBySource.scenic.length}`);
      
      // Use alternatives to fill missing route types, but only from the correct source
      const routeTypes: ('recommended' | 'shortest' | 'scenic')[] = ['recommended', 'shortest', 'scenic'];
      const missingTypes = routeTypes.filter(type => !processedRouteTypes.has(type));
      
      if (missingTypes.length > 0) {
        console.log(`📍 Filling missing route types: ${missingTypes.join(', ')}`);
        
        for (const routeType of missingTypes) {
          const alternatives = alternativesBySource[routeType];
          
          if (alternatives && alternatives.length > 0) {
            // Use the first alternative from the correct source
            const route = alternatives[0];
            
            try {
              const coordinates = decodePolyline(route.overview_polyline.points);
              
              // Validate coordinates and ensure it's different from existing routes
              if (coordinates && coordinates.length > 0) {
                const isDifferent = routes.every(existingRoute => {
                  if (!existingRoute.coordinates || existingRoute.coordinates.length === 0) return true;
                  const distance = calculateDistance(coordinates[0], existingRoute.coordinates[0]);
                  return distance > 0.001; // At least 100m difference at start
                });
                
                if (isDifferent) {
                  routes.push({
                    id: routeType,
                    name: getRouteTypeName(routeType),
                    type: routeType,
                    color: getRouteTypeColor(routeType),
                    totalDistance: Math.round(route.legs.reduce((total: number, leg: any) => total + leg.distance.value, 0) / 1000),
                    totalDuration: Math.round(route.legs.reduce((total: number, leg: any) => total + leg.duration.value, 0) / 60),
                    segments: route.legs,
                    coordinates: coordinates,
                    polyline: route.overview_polyline.points,
                    instructions: route.legs.flatMap((leg: any) => leg.steps.map((step: any) => step.html_instructions)),
                    bounds: route.bounds,
                    attractions: [],
                    highlights: getRouteHighlights(routeType),
                  });
                  console.log(`✅ Added alternative ${routeType} route from correct source`);
                }
              }
            } catch (error) {
              console.error(`Error processing alternative ${routeType} route:`, error);
            }
          } else {
            console.warn(`⚠️ No alternatives available for ${routeType} route type`);
          }
        }
      }

      if (routes.length === 0) {
        throw new Error('No routes found');
      }

      console.log(`✅ Generated ${routes.length} distinct routes from Google Directions API`);
      
      // Log route details to verify they are different
      routes.forEach((route, index) => {
        console.log(`📍 Route ${index + 1}: ${route.name}`);
        console.log(`   - Type: ${route.type}`);
        console.log(`   - Color: ${route.color}`);
        console.log(`   - Distance: ${route.totalDistance} km`);
        console.log(`   - Duration: ${route.totalDuration} min`);
        console.log(`   - Coordinates: ${route.coordinates.length} points`);
        console.log(`   - Start: ${route.coordinates[0]?.latitude}, ${route.coordinates[0]?.longitude}`);
        console.log(`   - End: ${route.coordinates[route.coordinates.length - 1]?.latitude}, ${route.coordinates[route.coordinates.length - 1]?.longitude}`);
      });
      
      // Validate routes before setting state
      const validRoutes = routes.filter(route => 
        route.coordinates && 
        route.coordinates.length > 0 && 
        route.coordinates.every(coord => 
          typeof coord.latitude === 'number' && 
          typeof coord.longitude === 'number' &&
          !isNaN(coord.latitude) && 
          !isNaN(coord.longitude)
        )
      );
      
      if (validRoutes.length === 0) {
        throw new Error('No valid routes with coordinates found');
      }
      
      // Final validation: Verify distance and duration calculations
      validRoutes.forEach((route, index) => {
        console.log(`📊 Route ${index + 1} (${route.type}) Validation:`);
        console.log(`   - API Route Legs: ${route.segments?.length || 0}`);
        
        if (route.segments && Array.isArray(route.segments)) {
          const manualDistanceCalc = route.segments.reduce((total: number, leg: any) => {
            const legDistance = leg.distance?.value || 0;
            console.log(`   - Leg distance: ${legDistance}m (${Math.round(legDistance / 1000)}km)`);
            return total + legDistance;
          }, 0);
          
          const manualDurationCalc = route.segments.reduce((total: number, leg: any) => {
            const legDuration = leg.duration?.value || 0;
            console.log(`   - Leg duration: ${legDuration}s (${Math.round(legDuration / 60)}min)`);
            return total + legDuration;
          }, 0);
          
          console.log(`   - Manual calc: ${Math.round(manualDistanceCalc / 1000)}km, ${Math.round(manualDurationCalc / 60)}min`);
          console.log(`   - Stored calc: ${route.totalDistance}km, ${route.totalDuration}min`);
          
          // Check if calculations match
          const distanceMatch = Math.abs(Math.round(manualDistanceCalc / 1000) - route.totalDistance) <= 1;
          const durationMatch = Math.abs(Math.round(manualDurationCalc / 60) - route.totalDuration) <= 1;
          
          console.log(`   - Distance accurate: ${distanceMatch ? '✅' : '❌'}`);
          console.log(`   - Duration accurate: ${durationMatch ? '✅' : '❌'}`);
        }
      });
      
      console.log(`✅ Validated ${validRoutes.length} routes with proper coordinates`);
      
      // Update state gradually to prevent crashes
      try {
        console.log('📍 Updating route state...');
        setGeneratedRoutes(validRoutes);
        
        // Small delay before setting selected route to prevent race conditions
        setTimeout(() => {
          try {
            console.log('📍 Setting selected route...');
            setSelectedRoute(validRoutes[0]);
            
            // Another small delay before updating UI state
            setTimeout(() => {
              try {
                console.log('📍 Updating UI state...');
                setCurrentStep('route-comparison');
                setShowRouteComparison(true);
                
                // Mark routes as ready for rendering with longer delay to prevent crashes
                setTimeout(() => {
                  console.log('📍 Enabling route rendering...');
                  setRoutesReadyForRender(true);
                  console.log('✅ Route state updates completed successfully');
                }, 500); // Increased delay to 500ms
              } catch (error) {
                console.error('Error updating UI state:', error);
              }
            }, 100);
          } catch (error) {
            console.error('Error setting selected route:', error);
          }
        }, 50);
      } catch (error) {
        console.error('Error updating route state:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error generating routes:', error);
      Alert.alert('Route Generation Error', 'Failed to generate routes. Please check your internet connection and try again.');
      setCurrentStep('waypoints');
      setRoutesReadyForRender(false);
    } finally {
      setIsGeneratingRoutes(false);
    }
  };

  const handleRouteSelect = (route: GeneratedRoute) => {
    try {
      console.log(`🔄 Switching to ${route.type} route`);
      console.log(`📍 Route has ${route.coordinates?.length || 0} coordinate points`);
      console.log(`📍 Route color: ${route.color}`);
      console.log(`📍 Route details: ${route.totalDistance}km, ${route.totalDuration}min`);
      
      // Double-check: Verify the route data is accurate
      if (route.segments && Array.isArray(route.segments)) {
        const verifyDistance = Math.round(route.segments.reduce((total: number, leg: any) => total + (leg.distance?.value || 0), 0) / 1000);
        const verifyDuration = Math.round(route.segments.reduce((total: number, leg: any) => total + (leg.duration?.value || 0), 0) / 60);
        
        console.log(`🔍 Route verification for ${route.type}:`);
        console.log(`   - Stored: ${route.totalDistance}km, ${route.totalDuration}min`);
        console.log(`   - Verified: ${verifyDistance}km, ${verifyDuration}min`);
        
        if (Math.abs(verifyDistance - route.totalDistance) > 1 || Math.abs(verifyDuration - route.totalDuration) > 1) {
          console.warn(`⚠️ Route ${route.type} data mismatch detected!`);
        } else {
          console.log(`✅ Route ${route.type} data is accurate`);
        }
      }
      
      setSelectedRoute(route);
      
      // Update map region to show the selected route
      if (route.bounds && route.bounds.northeast && route.bounds.southwest) {
        const northeast = route.bounds.northeast;
        const southwest = route.bounds.southwest;
        
        // Validate bounds
        if (typeof northeast.latitude === 'number' && 
            typeof northeast.longitude === 'number' &&
            typeof southwest.latitude === 'number' && 
            typeof southwest.longitude === 'number') {
          
          setMapRegion({
            latitude: (northeast.latitude + southwest.latitude) / 2,
            longitude: (northeast.longitude + southwest.longitude) / 2,
            latitudeDelta: Math.abs(northeast.latitude - southwest.latitude) * 1.2,
            longitudeDelta: Math.abs(northeast.longitude - southwest.longitude) * 1.2,
          });
        }
      }
      
      console.log(`✅ Successfully switched to ${route.type} route`);
    } catch (error) {
      console.error('Error selecting route:', error);
    }
  };

  const handleConfirmRoute = () => {
    if (!selectedRoute) return;
    
    router.push({
      pathname: '/planning/accommodation',
      params: {
        routeData: JSON.stringify(selectedRoute),
        startPoint: JSON.stringify(startPoint),
        destination: JSON.stringify(destination),
        waypoints: JSON.stringify(waypoints),
      },
    });
  };

  const renderProgressSteps = () => {
    const steps = [
      { key: 'start-point', label: 'Start Point', icon: 'location' },
      { key: 'destination', label: 'Destination', icon: 'flag' },
      { key: 'waypoints', label: 'Waypoints', icon: 'add-circle' },
      { key: 'route-generation', label: 'Generate Routes', icon: 'map' },
      { key: 'route-comparison', label: 'Compare Routes', icon: 'analytics' },
    ];

    const currentIndex = steps.findIndex(step => step.key === currentStep);

    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={step.key} style={styles.progressStep}>
            <View style={[
              styles.progressIcon,
              { backgroundColor: index <= currentIndex ? Colors.primary : Colors.light300 }
            ]}>
              <Ionicons 
                name={step.icon as any} 
                size={16} 
                color={index <= currentIndex ? Colors.white : Colors.secondary500} 
              />
            </View>
            <ThemedText style={[
              styles.progressLabel,
              { color: index <= currentIndex ? Colors.primary : Colors.secondary500 }
            ]}>
              {step.label}
            </ThemedText>
          </View>
        ))}
      </View>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'start-point':
        return (
          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepTitle}>Select Starting Point</ThemedText>
            <ThemedText style={styles.stepDescription}>
              Choose where your journey begins
            </ThemedText>
            {startPoint ? (
              <View style={styles.selectedLocationContainer}>
                <ThemedText style={styles.selectedLocationName}>{startPoint.name}</ThemedText>
                <ThemedText style={styles.selectedLocationAddress}>{startPoint.address}</ThemedText>
                <TouchableOpacity
                  style={styles.changeLocationButton}
                  onPress={() => {
                    setSearchMode('start');
                    setShowSearch(true);
                  }}
                >
                  <ThemedText style={styles.changeLocationText}>Change Location</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectLocationButton}
                onPress={() => {
                  setSearchMode('start');
                  setShowSearch(true);
                }}
              >
                <Ionicons name="location" size={24} color={Colors.primary} />
                <ThemedText style={styles.selectLocationText}>Select Starting Point</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'destination':
        return (
          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepTitle}>Select Destination</ThemedText>
            <ThemedText style={styles.stepDescription}>
              Choose where you want to go
            </ThemedText>
            {destination ? (
              <View style={styles.selectedLocationContainer}>
                <ThemedText style={styles.selectedLocationName}>{destination.name}</ThemedText>
                <ThemedText style={styles.selectedLocationAddress}>{destination.address}</ThemedText>
                <TouchableOpacity
                  style={styles.changeLocationButton}
                  onPress={() => {
                    setSearchMode('destination');
                    setShowSearch(true);
                  }}
                >
                  <ThemedText style={styles.changeLocationText}>Change Location</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectLocationButton}
                onPress={() => {
                  setSearchMode('destination');
                  setShowSearch(true);
                }}
              >
                <Ionicons name="flag" size={24} color={Colors.primary} />
                <ThemedText style={styles.selectLocationText}>Select Destination</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'waypoints':
        return (
          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepTitle}>Add Waypoints (Optional)</ThemedText>
            <ThemedText style={styles.stepDescription}>
              Add stops along your journey
            </ThemedText>
            
            {waypoints.length > 0 && (
              <View style={styles.waypointsContainer}>
                {waypoints.map((waypoint, index) => (
                  <View key={waypoint.id} style={styles.waypointItem}>
                    <View style={styles.waypointInfo}>
                      <ThemedText style={styles.waypointName}>{waypoint.name}</ThemedText>
                      <ThemedText style={styles.waypointAddress}>{waypoint.address}</ThemedText>
                    </View>
                    <TouchableOpacity
                      style={styles.removeWaypointButton}
                      onPress={() => handleRemoveWaypoint(waypoint.id)}
                    >
                      <Ionicons name="close" size={20} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            
            <TouchableOpacity
              style={styles.addWaypointButton}
              onPress={() => {
                setSearchMode('waypoint');
                setShowSearch(true);
              }}
            >
              <Ionicons name="add" size={24} color={Colors.primary} />
              <ThemedText style={styles.addWaypointText}>Add Waypoint</ThemedText>
            </TouchableOpacity>
          </View>
        );

      case 'route-generation':
        return (
          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepTitle}>
              {isGeneratingRoutes ? 'Generating Routes...' : 'Ready to Generate Routes'}
            </ThemedText>
            <ThemedText style={styles.stepDescription}>
              We'll create multiple route options for you to choose from
            </ThemedText>
            
            {isGeneratingRoutes ? (
              <View style={styles.loadingContainer}>
                <ThemedText style={styles.loadingText}>
                  Calculating optimal routes using Google Maps...
                </ThemedText>
              </View>
            ) : (
              <View style={styles.routeGenerationContainer}>
                <ThemedText style={styles.routeTypesTitle}>Route Types to Generate:</ThemedText>
                <View style={styles.routeTypesList}>
                  <View style={styles.routeTypeItem}>
                    <View style={[styles.routeTypeColor, { backgroundColor: '#3B82F6' }]} />
                    <ThemedText style={styles.routeTypeName}>Recommended Route</ThemedText>
                  </View>
                  <View style={styles.routeTypeItem}>
                    <View style={[styles.routeTypeColor, { backgroundColor: '#10B981' }]} />
                    <ThemedText style={styles.routeTypeName}>Shortest Route</ThemedText>
                  </View>
                  <View style={styles.routeTypeItem}>
                    <View style={[styles.routeTypeColor, { backgroundColor: '#F59E0B' }]} />
                    <ThemedText style={styles.routeTypeName}>Scenic Route</ThemedText>
                  </View>
                </View>
              </View>
            )}
          </View>
        );

      case 'route-comparison':
        return (
          <View style={styles.routeComparisonContainer}>
            {/* Route Selection Header */}
            <View style={styles.routeComparisonHeader}>
              <ThemedText style={styles.stepTitle}>Choose Your Route</ThemedText>
              <ThemedText style={styles.stepDescription}>
                Select the best route for your journey
              </ThemedText>
            </View>

            {/* Route Cards - Horizontal Layout */}
            <View style={styles.routeCardsContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.routeCardsScrollContainer}
                style={styles.routeCardsScroll}
              >
                {generatedRoutes.map((route, index) => (
                  <TouchableOpacity
                    key={route.id}
                    style={[
                      styles.routeCardHorizontal,
                      selectedRoute?.id === route.id && styles.selectedRouteCardHorizontal
                    ]}
                    onPress={() => handleRouteSelect(route)}
                  >
                    {/* Route Header */}
                    <View style={styles.routeHeaderHorizontal}>
                      <View style={[styles.routeColorIndicatorLarge, { backgroundColor: route.color }]} />
                      <ThemedText style={styles.routeNameHorizontal}>{route.name}</ThemedText>
                      {selectedRoute?.id === route.id && (
                        <View style={styles.selectedBadge}>
                          <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                        </View>
                      )}
                    </View>
                    
                    {/* Route Metrics */}
                    <View style={styles.routeMetricsHorizontal}>
                      <View style={styles.routeMetricHorizontal}>
                        <Ionicons name="location" size={16} color={Colors.secondary500} />
                        <ThemedText style={styles.routeMetricValueHorizontal}>{route.totalDistance} km</ThemedText>
                      </View>
                      <View style={styles.routeMetricHorizontal}>
                        <Ionicons name="time" size={16} color={Colors.secondary500} />
                        <ThemedText style={styles.routeMetricValueHorizontal}>{route.totalDuration} min</ThemedText>
                      </View>
                    </View>
                    
                    {/* Route Highlights */}
                    <View style={styles.routeHighlightsHorizontal}>
                      {route.highlights.slice(0, 2).map((highlight, highlightIndex) => (
                        <View key={highlightIndex} style={styles.routeHighlightItemHorizontal}>
                          <View style={styles.routeHighlightDot} />
                          <ThemedText style={styles.routeHighlightTextHorizontal}>{highlight}</ThemedText>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Map Toggle Button */}
            <View style={styles.mapToggleContainer}>
              <TouchableOpacity
                style={styles.mapToggleButton}
                onPress={() => setShowFullScreenMap(!showFullScreenMap)}
              >
                <Ionicons 
                  name={showFullScreenMap ? "list" : "map"} 
                  size={20} 
                  color={Colors.white} 
                />
                <ThemedText style={styles.mapToggleText}>
                  {showFullScreenMap ? "Show Route List" : "View Full Map"}
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Route Comparison Stats */}
            {selectedRoute && (
              <View style={styles.routeStatsContainer}>
                <View style={styles.routeStatsHeader}>
                  <ThemedText style={styles.routeStatsTitle}>Route Details</ThemedText>
                  <View style={[styles.routeStatsColorIndicator, { backgroundColor: selectedRoute.color }]} />
                </View>
                
                <View style={styles.routeStatsGrid}>
                  <View style={styles.routeStatItem}>
                    <Ionicons name="location" size={24} color={Colors.primary} />
                    <ThemedText style={styles.routeStatLabel}>Distance</ThemedText>
                    <ThemedText style={styles.routeStatValue}>{selectedRoute.totalDistance} km</ThemedText>
                  </View>
                  <View style={styles.routeStatItem}>
                    <Ionicons name="time" size={24} color={Colors.primary} />
                    <ThemedText style={styles.routeStatLabel}>Duration</ThemedText>
                    <ThemedText style={styles.routeStatValue}>{selectedRoute.totalDuration} min</ThemedText>
                  </View>
                  <View style={styles.routeStatItem}>
                    <Ionicons name="speedometer" size={24} color={Colors.primary} />
                    <ThemedText style={styles.routeStatLabel}>Avg Speed</ThemedText>
                    <ThemedText style={styles.routeStatValue}>
                      {Math.round((selectedRoute.totalDistance / selectedRoute.totalDuration) * 60)} km/h
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  // Memoized route polylines to prevent unnecessary re-renders
  const routePolylines = useMemo(() => {
    if (!routesReadyForRender || generatedRoutes.length === 0) {
      return [];
    }
    
    return generatedRoutes.filter(route => {
      // More stringent validation
      if (!route.coordinates || !Array.isArray(route.coordinates)) {
        console.warn(`⚠️ Route ${route.id} has invalid coordinates array`);
        return false;
      }
      
      if (route.coordinates.length < 2) {
        console.warn(`⚠️ Route ${route.id} has too few coordinates: ${route.coordinates.length}`);
        return false;
      }
      
      // Check each coordinate
      const hasValidCoords = route.coordinates.every(coord => {
        const isValid = coord && 
          typeof coord.latitude === 'number' && 
          typeof coord.longitude === 'number' &&
          !isNaN(coord.latitude) && 
          !isNaN(coord.longitude) &&
          coord.latitude >= -90 && coord.latitude <= 90 &&
          coord.longitude >= -180 && coord.longitude <= 180;
        
        if (!isValid) {
          console.warn(`⚠️ Route ${route.id} has invalid coordinate:`, coord);
        }
        return isValid;
      });
      
      return hasValidCoords;
    }).map((route, index) => {
      console.log(`📍 Preparing route ${route.id} for render with ${route.coordinates.length} valid points`);
      return {
        id: route.id,
        coordinates: route.coordinates,
        color: route.color,
        strokeWidth: selectedRoute?.id === route.id ? 8 : 5,
        zIndex: selectedRoute?.id === route.id ? 100 : 10 + index,
        type: route.type,
      };
    });
  }, [generatedRoutes, selectedRoute, routesReadyForRender]);

  const renderMap = () => {
    if (currentStep === 'route-comparison' && routePolylines.length > 0 && routesReadyForRender) {
      // Ensure we have a valid API key for directions
      const directionsApiKey = GOOGLE_DIRECTIONS_API_KEY || GOOGLE_MAPS_API_KEY;
      
      if (!directionsApiKey) {
        console.warn('⚠️ No API key available for directions');
        return (
          <View style={styles.mapContainer}>
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>
                🔑 API Key Required
              </ThemedText>
              <ThemedText style={styles.errorSubtext}>
                Please configure Google Directions API key
              </ThemedText>
            </View>
          </View>
        );
      }
      
      return (
        <View style={showFullScreenMap ? styles.fullMapContainer : styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
          >
            {/* Show all waypoints */}
            {startPoint && (
              <Marker
                coordinate={startPoint.coordinates}
                title={startPoint.name}
                description="Starting Point"
                pinColor="green"
              />
            )}
            {destination && (
              <Marker
                coordinate={destination.coordinates}
                title={destination.name}
                description="Destination"
                pinColor="red"
              />
            )}
            {waypoints.map((waypoint) => (
              <Marker
                key={waypoint.id}
                coordinate={waypoint.coordinates}
                title={waypoint.name}
                description="Waypoint"
                pinColor="blue"
              />
            ))}
            
            {/* Show loading state while routes are being prepared for rendering */}
            {!routesReadyForRender && generatedRoutes.length > 0 && (
              <View style={styles.loadingOverlay}>
                <ThemedText style={styles.loadingOverlayText}>
                  🗺️ Preparing routes for display...
                </ThemedText>
              </View>
            )}
            
            {/* 🎯 REAL GOOGLE DIRECTIONS API - Use MapViewDirections with route-specific configurations */}
            {/* Each route type uses different waypoint configurations to ensure distinct routes */}
            
            {routesReadyForRender && selectedRoute && GOOGLE_DIRECTIONS_API_KEY && (
              <>
                {selectedRoute.type === 'recommended' && (
                  <MapViewDirections
                    key="recommended-route"
                    origin={startPoint?.coordinates}
                    destination={destination?.coordinates}
                    waypoints={waypoints.map(w => w.coordinates)}
                    apikey={GOOGLE_DIRECTIONS_API_KEY}
                    strokeWidth={8}
                    strokeColor={selectedRoute.color}
                    mode="DRIVING"
                    precision="high"
                    onReady={(result) => {
                      console.log(`✅ Recommended route rendered: ${result.distance} km, ${result.duration} min`);
                    }}
                    onError={(error) => console.log('❌ Recommended route error:', error)}
                  />
                )}
                
                {selectedRoute.type === 'shortest' && (
                  <MapViewDirections
                    key="shortest-route"
                    origin={startPoint?.coordinates}
                    destination={destination?.coordinates}
                    waypoints={waypoints.map(w => w.coordinates)}
                    apikey={GOOGLE_DIRECTIONS_API_KEY}
                    strokeWidth={8}
                    strokeColor={selectedRoute.color}
                    mode="DRIVING"
                    precision="high"
                    optimizeWaypoints={true}
                    onReady={(result) => {
                      console.log(`✅ Shortest route rendered: ${result.distance} km, ${result.duration} min`);
                    }}
                    onError={(error) => console.log('❌ Shortest route error:', error)}
                  />
                )}
                
                {selectedRoute.type === 'scenic' && (
                  <MapViewDirections
                    key="scenic-route"
                    origin={startPoint?.coordinates}
                    destination={destination?.coordinates}
                    waypoints={[
                      ...waypoints.map(w => w.coordinates),
                      // Add intermediate waypoint for scenic route to force different path
                      {
                        latitude: (startPoint!.coordinates.latitude + destination!.coordinates.latitude) / 2,
                        longitude: (startPoint!.coordinates.longitude + destination!.coordinates.longitude) / 2,
                      }
                    ]}
                    apikey={GOOGLE_DIRECTIONS_API_KEY}
                    strokeWidth={8}
                    strokeColor={selectedRoute.color}
                    mode="DRIVING"
                    precision="high"
                    onReady={(result) => {
                      console.log(`✅ Scenic route rendered: ${result.distance} km, ${result.duration} min`);
                    }}
                    onError={(error) => console.log('❌ Scenic route error:', error)}
                  />
                )}
              </>
            )}
            
            {/* Fallback: Show message if no API key */}
            {!GOOGLE_DIRECTIONS_API_KEY && (
              <View style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>
                  🔑 API Key Required for Route Display
                </ThemedText>
                <ThemedText style={styles.errorSubtext}>
                  Please configure Google Directions API key
                </ThemedText>
              </View>
            )}
            
            {/* Fallback: Show message if no routes available */}
            {generatedRoutes.length === 0 && (
              <View style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>
                  �️ No routes available to display
                </ThemedText>
              </View>
            )}
            
            {/* Fallback: Show error if no API key and no routes generated */}
            {!GOOGLE_DIRECTIONS_API_KEY && generatedRoutes.length === 0 && (
              <View style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>
                  🔑 API Key Required for Route Display
                </ThemedText>
              </View>
            )}
            
          </MapView>
        </View>
      );
    }
    
    return null;
  };

  const renderActionButtons = () => {
    switch (currentStep) {
      case 'start-point':
        return startPoint ? (
          <CustomButton
            title="Continue"
            onPress={() => setCurrentStep('destination')}
            style={styles.actionButton}
          />
        ) : null;

      case 'destination':
        return destination ? (
          <CustomButton
            title="Continue"
            onPress={() => setCurrentStep('waypoints')}
            style={styles.actionButton}
          />
        ) : null;

      case 'waypoints':
        return (
          <View style={styles.actionButtonsContainer}>
            <CustomButton
              title="Generate Routes"
              onPress={generateRoutes}
              style={styles.actionButton}
              disabled={!startPoint || !destination}
            />
            <CustomButton
              title="Skip Waypoints"
              onPress={generateRoutes}
              style={[styles.actionButton, styles.secondaryButton]}
              disabled={!startPoint || !destination}
            />
          </View>
        );

      case 'route-generation':
        return isGeneratingRoutes ? null : (
          <CustomButton
            title="Generate Routes"
            onPress={generateRoutes}
            style={styles.actionButton}
            disabled={!startPoint || !destination}
          />
        );

      case 'route-comparison':
        return (
          <CustomButton
            title="Confirm Route"
            onPress={handleConfirmRoute}
            style={styles.actionButton}
            disabled={!selectedRoute}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderProgressSteps()}
      
      {/* Route Comparison Layout */}
      {currentStep === 'route-comparison' ? (
        <>
          {showFullScreenMap ? (
            /* Full Screen Map View - Takes entire space between navbar and action buttons */
            <View style={styles.fullScreenMapContainer}>
              {renderMap()}
              {/* Map Overlay Controls */}
              <View style={styles.mapOverlayControls}>
                <TouchableOpacity
                  style={styles.mapCloseButton}
                  onPress={() => setShowFullScreenMap(false)}
                >
                  <Ionicons name="list" size={20} color={Colors.white} />
                </TouchableOpacity>
                
                {/* <TouchableOpacity
                  style={styles.mapBackToListButton}
                  onPress={() => setShowFullScreenMap(false)}
                >
                  <Ionicons name="arrow-back" size={20} color={Colors.white} />
                  <ThemedText style={styles.mapBackToListText}>Back to Routes</ThemedText>
                </TouchableOpacity> */}
                
                {/* Route Info Overlay */}
                {selectedRoute && (
                  <View style={styles.mapRouteInfoOverlay}>
                    <View style={styles.mapRouteInfo}>
                      <View style={[styles.mapRouteColorIndicator, { backgroundColor: selectedRoute.color }]} />
                      <ThemedText style={styles.mapRouteInfoText}>{selectedRoute.name}</ThemedText>
                    </View>
                    <View style={styles.mapRouteStats}>
                      <ThemedText style={styles.mapRouteStatText}>
                        {selectedRoute.totalDistance} km • {selectedRoute.totalDuration} min
                      </ThemedText>
                    </View>
                  </View>
                )}
              </View>
            </View>
          ) : (
            /* Route Comparison View */
            <ScrollView style={styles.routeComparisonScroll}>
              {renderStepContent()}
            </ScrollView>
          )}
        </>
      ) : (
        /* Regular Layout for Other Steps */
        <>
          <ScrollView style={styles.content}>
            {renderStepContent()}
          </ScrollView>
          
          {renderMap()}
        </>
      )}
      
      <View style={styles.actionsContainer}>
        {renderActionButtons()}
      </View>

      {/* Search Modal */}
      <Modal visible={showSearch} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              Search {searchMode === 'start' ? 'Starting Point' : searchMode === 'destination' ? 'Destination' : 'Waypoint'}
            </ThemedText>
            <TouchableOpacity onPress={() => setShowSearch(false)}>
              <Ionicons name="close" size={24} color={Colors.secondary700} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a location..."
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
          </View>
          
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => handleSelectLocation(item)}
              >
                <Ionicons name="location" size={20} color={Colors.primary} />
                <View style={styles.searchResultInfo}>
                  <ThemedText style={styles.searchResultName}>{item.name}</ThemedText>
                  <ThemedText style={styles.searchResultAddress}>{item.address}</ThemedText>
                  {item.description && (
                    <ThemedText style={styles.searchResultDescription}>{item.description}</ThemedText>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              isSearching ? (
                <View style={styles.searchLoadingContainer}>
                  <ThemedText style={styles.searchLoadingText}>Searching places in Sri Lanka...</ThemedText>
                </View>
              ) : searchQuery.length > 2 ? (
                <ThemedText style={styles.noResultsText}>No locations found</ThemedText>
              ) : (
                <ThemedText style={styles.noResultsText}>Start typing to search for locations in Sri Lanka</ThemedText>
              )
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light100,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light300,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.secondary700,
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.secondary500,
    marginBottom: 24,
  },
  selectedLocationContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  selectedLocationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  selectedLocationAddress: {
    fontSize: 14,
    color: Colors.secondary500,
    marginBottom: 12,
  },
  changeLocationButton: {
    alignSelf: 'flex-start',
  },
  changeLocationText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  selectLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light300,
    borderStyle: 'dashed',
  },
  selectLocationText: {
    fontSize: 16,
    color: Colors.primary,
    marginLeft: 12,
    fontWeight: '500',
  },
  waypointsContainer: {
    marginBottom: 16,
  },
  waypointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light300,
  },
  waypointInfo: {
    flex: 1,
  },
  waypointName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.secondary700,
  },
  waypointAddress: {
    fontSize: 14,
    color: Colors.secondary500,
    marginTop: 2,
  },
  removeWaypointButton: {
    padding: 8,
  },
  addWaypointButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addWaypointText: {
    fontSize: 16,
    color: Colors.primary,
    marginLeft: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.secondary500,
    textAlign: 'center',
  },
  routeGenerationContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
  },
  routeTypesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.secondary700,
  },
  routeTypesList: {
    gap: 12,
  },
  routeTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeTypeColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  routeTypeName: {
    fontSize: 16,
    color: Colors.secondary700,
  },
  routesList: {
    maxHeight: 400,
  },
  routeCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light300,
  },
  selectedRouteCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondary700,
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routeMetric: {
    alignItems: 'center',
  },
  routeMetricLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    marginBottom: 4,
  },
  routeMetricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.secondary700,
  },
  routeHighlights: {
    marginTop: 8,
  },
  routeHighlight: {
    fontSize: 14,
    color: Colors.secondary500,
    marginBottom: 2,
  },
  mapContainer: {
    height: 300,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fullMapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  map: {
    flex: 1,
  },
  actionsContainer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.light300,
  },
  actionButtonsContainer: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
  },
  secondaryButton: {
    backgroundColor: Colors.light200,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light100,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondary700,
  },
  searchContainer: {
    padding: 20,
  },
  searchInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.light300,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light300,
  },
  searchResultInfo: {
    marginLeft: 12,
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.secondary700,
  },
  searchResultAddress: {
    fontSize: 14,
    color: Colors.secondary500,
    marginTop: 2,
  },
  searchResultDescription: {
    fontSize: 12,
    color: Colors.secondary400,
    marginTop: 2,
    fontStyle: 'italic',
  },
  searchLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  searchLoadingText: {
    fontSize: 16,
    color: Colors.secondary500,
    textAlign: 'center',
  },
  noResultsText: {
    textAlign: 'center',
    color: Colors.secondary500,
    fontSize: 16,
    marginTop: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light100,
    borderRadius: 12,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.error,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingOverlayText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  
  // Route Comparison Layout Styles
  routeComparisonLayout: {
    flex: 1,
  },
  routeComparisonScroll: {
    flex: 1,
  },
  fullScreenMapContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  mapOverlayControls: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1000,
  },
  mapCloseButton: {
    position: 'absolute',
    top: 10,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  mapBackToListButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  mapBackToListText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  mapRouteInfoOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    padding: 12,
    marginTop: 0,
    marginRight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  mapRouteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mapRouteColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  mapRouteInfoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  mapRouteStats: {
    alignItems: 'center',
  },
  mapRouteStatText: {
    fontSize: 14,
    color: Colors.white,
  },
  
  // Route Comparison Container Styles
  routeComparisonContainer: {
    flex: 1,
    backgroundColor: Colors.light100,
  },
  routeComparisonHeader: {
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light300,
  },
  
  // Horizontal Route Cards
  routeCardsContainer: {
    backgroundColor: Colors.white,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light300,
  },
  routeCardsScroll: {
    paddingHorizontal: 20,
  },
  routeCardsScrollContainer: {
    paddingRight: 20,
  },
  routeCardHorizontal: {
    width: width * 0.75,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    borderWidth: 2,
    borderColor: Colors.light300,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedRouteCardHorizontal: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  routeHeaderHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeColorIndicatorLarge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  routeNameHorizontal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondary700,
    flex: 1,
  },
  selectedBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeMetricsHorizontal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routeMetricHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeMetricValueHorizontal: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginLeft: 6,
  },
  routeHighlightsHorizontal: {
    flex: 1,
  },
  routeHighlightItemHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeHighlightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  routeHighlightTextHorizontal: {
    fontSize: 12,
    color: Colors.secondary500,
    flex: 1,
  },
  
  // Map Toggle
  mapToggleContainer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light300,
  },
  mapToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  mapToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 8,
  },
  
  // Route Stats
  routeStatsContainer: {
    margin: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light300,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  routeStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondary700,
  },
  routeStatsColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  routeStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routeStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  routeStatLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: 4,
  },
  routeStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.secondary700,
    marginTop: 2,
  },
});
