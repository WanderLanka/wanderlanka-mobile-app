import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { CustomButton, ThemedText } from '../../../components';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import React, { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { Colors } from '../../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapViewDirections from 'react-native-maps-directions';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Route types
type RouteType = 'recommended' | 'shortest' | 'scenic';

// Route option interface
interface RouteOption {
  id: RouteType;
  name: string;
  description: string;
  icon: string;
  color: string;
  benefits: string[];
}

// Types
interface Place {
  id: string;
  name: string;
  address: string;
  description?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string;
  rating?: number;
}

interface DayItinerary {
  date: string;
  dayNumber: number;
  places: Place[];
}

interface GeneratedRoute {
  id: RouteType;
  name: string;
  type: RouteType;
  color: string;
  totalDistance: number;
  totalDuration: number;
  segments: any[];
  coordinates: { latitude: number; longitude: number }[];
  polyline: string;
  instructions: string[];
  bounds: {
    northeast: { latitude: number; longitude: number };
    southwest: { latitude: number; longitude: number };
  };
  highlights: string[];
}

interface RouteInfo {
  distance: string;
  duration: string;
  estimatedCost: string;
  routeType: RouteType;
}

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 
                           process.env.GOOGLE_MAPS_API_KEY || 
                           process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

// Google Directions API configuration (separate key)
const GOOGLE_DIRECTIONS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_DIRECTIONS_API_KEY || 
                                 process.env.GOOGLE_MAPS_DIRECTIONS_API_KEY ||
                                 process.env.GOOGLE_DIRECTIONS_API_KEY ||
                                 GOOGLE_MAPS_API_KEY; // fallback to general API key

// Route options with contrasting colors for better visual differentiation
const ROUTE_OPTIONS: RouteOption[] = [
  {
    id: 'recommended',
    name: 'Recommended',
    description: 'Balanced route with best attractions',
    icon: 'star',
    color: '#3b82f6',
    benefits: ['Balanced route', 'Best attractions', 'Moderate traffic'],
  },
  {
    id: 'shortest',
    name: 'Shortest',
    description: 'Fastest route avoiding tolls',
    icon: 'flash',
    color: '#10b981',
    benefits: ['Fastest route', 'Avoids tolls', 'Direct path'],
  },
  {
    id: 'scenic',
    name: 'Scenic',
    description: 'Most beautiful route avoiding highways',
    icon: 'camera',
    color: '#f59e0b',
    benefits: ['Beautiful views', 'Local roads', 'Cultural sites'],
  },
];

function RouteDisplayScreen() {
  const params = useLocalSearchParams();
  const { destination, startPoint, startDate, endDate, itinerary: itineraryString } = params;
  
  const [itinerary, setItinerary] = useState<DayItinerary[]>([]);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [selectedRouteType, setSelectedRouteType] = useState<RouteType>('recommended');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  
  // New state for route generation
  const [generatedRoutes, setGeneratedRoutes] = useState<GeneratedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<GeneratedRoute | null>(null);
  const [isGeneratingRoutes, setIsGeneratingRoutes] = useState(false);
  const [routesGenerated, setRoutesGenerated] = useState(false);
  const [showRouteComparison, setShowRouteComparison] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Start spinning animation for loading
  useEffect(() => {
    let spinAnimation: Animated.CompositeAnimation | undefined;
    
    if (isLoadingRoute) {
      spinAnimation = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
    } else {
      spinAnimation?.stop();
      spinAnim.setValue(0);
    }
    
    return () => {
      spinAnimation?.stop();
    };
  }, [isLoadingRoute, spinAnim]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (routeSelectionTimeoutRef.current) {
        clearTimeout(routeSelectionTimeoutRef.current);
      }
    };
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Essential state for app functionality
  const [startLocation, setStartLocation] = useState<{ latitude: number; longitude: number; } | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 7.8731,
    longitude: 80.7718,
    latitudeDelta: 2.0,
    longitudeDelta: 2.0,
  });
  const [initialRegionSet, setInitialRegionSet] = useState(false);
  
  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalRouteType, setModalRouteType] = useState<RouteType>('recommended');
  const [isModalProcessing, setIsModalProcessing] = useState(false);
  
  // Route direction state - separate for each route type
  // This enables route-specific visualization: each route type (recommended, shortest, scenic) 
  // gets its own unique path data from Google Directions API with different parameters
  const [routeDirections, setRouteDirections] = useState<{
    recommended?: any;
    shortest?: any;
    scenic?: any;
  }>({});
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [directionsError, setDirectionsError] = useState<string | null>(null);
  const [mapViewDirectionsKey, setMapViewDirectionsKey] = useState(0);
  
  // Map reference for auto-fitting
  const mapRef = useRef<MapView>(null);
  
  // Debounce ref for route selection
  const routeSelectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Ref to prevent multiple initializations
  const initializedRef = useRef(false);

  // iOS-specific effect for modal stability - simplified to prevent freezing
  useEffect(() => {
    if (isModalVisible && routeDirections[modalRouteType]) {
      console.log('🍎 iOS Modal opened - route data available');
      // No automatic map region changes to prevent re-render loops on iOS
    }
  }, [isModalVisible, modalRouteType]);

  // Add geocoding function using Google Places API
  const geocodeStartPoint = async (locationName: string): Promise<{ latitude: number; longitude: number } | null> => {
    console.log('Geocoding start point:', locationName);
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not found, using fallback geocoding');
      return getFallbackLocationCoords(locationName);
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationName)}&region=LK&key=${GOOGLE_MAPS_API_KEY}`;
      console.log('Geocoding URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Geocoding response:', data);
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const result = {
          latitude: location.lat,
          longitude: location.lng
        };
        console.log(`Successfully geocoded "${locationName}" to:`, result);
        return result;
      } else {
        console.warn('Geocoding failed:', data.status, data.error_message);
        return getFallbackLocationCoords(locationName);
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
      return getFallbackLocationCoords(locationName);
    }
  };

  // Fallback geocoding for when API is not available
  const getFallbackLocationCoords = (locationName: string): { latitude: number; longitude: number } => {
    console.log('Using fallback geocoding for:', locationName);
    
    const locationMap: { [key: string]: { latitude: number; longitude: number } } = {
      'Colombo': { latitude: 6.9271, longitude: 79.8612 },
      'Kandy': { latitude: 7.2936, longitude: 80.6417 },
      'Galle': { latitude: 6.0535, longitude: 80.2210 },
      'Nuwara Eliya': { latitude: 6.9708, longitude: 80.7580 },
      'Anuradhapura': { latitude: 8.3114, longitude: 80.4037 },
      'Polonnaruwa': { latitude: 7.9403, longitude: 81.0188 },
      'Sigiriya': { latitude: 7.9571, longitude: 80.7601 },
      'Ella': { latitude: 6.8721, longitude: 81.0461 },
      'Arugam Bay': { latitude: 6.8405, longitude: 81.8364 },
      'Trincomalee': { latitude: 8.5874, longitude: 81.2152 },
      'Jaffna': { latitude: 9.6615, longitude: 80.0255 },
      'Bentota': { latitude: 6.4260, longitude: 79.9956 },
      'Mirissa': { latitude: 5.9490, longitude: 80.4607 },
      'Hikkaduwa': { latitude: 6.1391, longitude: 80.1014 },
      'Pinnawala': { latitude: 7.2939, longitude: 80.3889 },
      'Dambulla': { latitude: 7.8562, longitude: 80.6510 },
      'Yala National Park': { latitude: 6.3782, longitude: 81.5061 },
      'Udawalawe National Park': { latitude: 6.4390, longitude: 80.8856 },
      'Horton Plains': { latitude: 6.8069, longitude: 80.8044 },
      'Adam\'s Peak': { latitude: 6.8092, longitude: 80.4992 },
    };

    const normalizedName = Object.keys(locationMap).find(key => 
      key.toLowerCase().includes(locationName.toLowerCase()) || 
      locationName.toLowerCase().includes(key.toLowerCase())
    );

    if (normalizedName && locationMap[normalizedName]) {
      console.log(`Found fallback coordinates for "${locationName}":`, locationMap[normalizedName]);
      return locationMap[normalizedName];
    }

    console.log(`No fallback found for "${locationName}", using default Colombo coordinates`);
    return locationMap['Colombo'];
  };

  // Initialize data
  useEffect(() => {
    // Prevent multiple initializations
    if (initializedRef.current) {
      console.log('Already initialized, skipping...');
      return;
    }
    
    const initializeData = async () => {
      console.log('Initializing route display with params:', { destination, startPoint, startDate, endDate });
      
      try {
        // Mark as initialized at the start
        initializedRef.current = true;

        // Initialize default route info
        const defaultRouteInfo = calculateRouteInfo('recommended');
        setRouteInfo(defaultRouteInfo);

        // Set default location if no start point
        if (!startPoint) {
          console.log('No start point provided, using default Colombo location');
          setStartLocation({ latitude: 6.9271, longitude: 79.8612 });
        } else {
          // First, geocode start point if provided
          console.log('Geocoding start point:', startPoint);
          const coords = await geocodeStartPoint(startPoint as string);
          if (coords) {
            console.log('Start location coordinates:', coords);
            setStartLocation(coords);
          } else {
            console.log('Geocoding failed, using default Colombo location');
            setStartLocation({ latitude: 6.9271, longitude: 79.8612 });
          }
        }

        if (itineraryString) {
          try {
            const parsedItinerary = JSON.parse(itineraryString as string);
            console.log('Parsed itinerary:', parsedItinerary);
            setItinerary(parsedItinerary);

            const places: Place[] = [];
            parsedItinerary.forEach((day: DayItinerary) => {
              places.push(...day.places);
            });
            setAllPlaces(places);
            console.log('All places extracted:', places.length);

            // Set initial map region based on first place
            if (places.length > 0) {
              const firstPlace = places[0];
              const newRegion = {
                latitude: firstPlace.coordinates.latitude,
                longitude: firstPlace.coordinates.longitude,
                latitudeDelta: 0.5,
                longitudeDelta: 0.5,
              };
              console.log('Setting initial map region to first place:', newRegion);
              setMapRegion(newRegion);
              setInitialRegionSet(true);
              
              // Set fallback start location if not already set
              if (!startLocation && startPoint) {
                const fallbackStart = await geocodeStartPoint(startPoint as string);
                if (fallbackStart) {
                  setStartLocation(fallbackStart);
                } else {
                  // Use first place as fallback start location
                  setStartLocation(firstPlace.coordinates);
                }
              }
            }
          } catch (error) {
            console.error('Error parsing itinerary:', error);
            Alert.alert('Error', 'Failed to load itinerary data');
          }
        } else {
          console.log('No itinerary data provided');
          // Set some default places for testing
          const defaultPlaces: Place[] = [
            {
              id: '1',
              name: 'Kandy',
              address: 'Kandy, Sri Lanka',
              coordinates: { latitude: 7.2936, longitude: 80.6417 }
            },
            {
              id: '2',
              name: 'Nuwara Eliya',
              address: 'Nuwara Eliya, Sri Lanka',
              coordinates: { latitude: 6.9708, longitude: 80.7580 }
            }
          ];
          setAllPlaces(defaultPlaces);
          setMapRegion({
            latitude: 7.2936,
            longitude: 80.6417,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          });
          setInitialRegionSet(true);
        }
      } catch (error) {
        console.error('Error initializing route display:', error);
        Alert.alert('Error', 'Failed to initialize route display');
      }
    };

    initializeData();
  }, [destination, startPoint, startDate, endDate, itineraryString]);

  // Calculate route information based on type
  const calculateRouteInfo = (routeType: RouteType): RouteInfo => {
    // Mock calculation - in real app, this would call Google Directions API
    const baseDistance = 150; // km
    const baseDuration = 180; // minutes
    
    let distance: number, duration: number, cost: number;
    
    switch (routeType) {
      case 'shortest':
        distance = baseDistance * 0.9; // 10% shorter
        duration = baseDuration * 0.8; // 20% faster
        cost = 1500; // LKR
        break;
      case 'scenic':
        distance = baseDistance * 1.2; // 20% longer
        duration = baseDuration * 1.4; // 40% longer
        cost = 2000; // LKR
        break;
      case 'recommended':
      default:
        distance = baseDistance;
        duration = baseDuration;
        cost = 1750; // LKR
        break;
    }

    return {
      distance: `${Math.round(distance)} km`,
      duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
      estimatedCost: `LKR ${cost}`,
      routeType,
    };
  };

  // Handle route selection from modal
  const handleRouteSelect = async (routeType: RouteType) => {
    console.log(`🎯 Route selection initiated: ${routeType}`);
    
    // Prevent multiple simultaneous selections
    if (isLoadingRoute || isLoadingDirections || isModalProcessing) {
      console.log('⏸️ Already processing, ignoring selection');
      return;
    }
    
    // Check if route data already exists for this route type
    if (selectedRouteType === routeType && routeDirections[routeType]) {
      console.log('⏸️ Same route already selected, opening modal directly');
      setModalRouteType(routeType);
      // Use setTimeout to prevent rapid state changes on iOS
      setTimeout(() => {
        setIsModalVisible(true);
      }, 50);
      return;
    }
    
    console.log(`🚀 Processing route selection: ${routeType}`);
    
    // Set processing state immediately with iOS-friendly approach
    setIsLoadingRoute(true);
    setIsModalProcessing(true);
    setDirectionsError(null);
    setSelectedRouteType(routeType);
    setModalRouteType(routeType);
    
    try {
      // Fetch directions for specific route type
      console.log(`📍 Fetching directions for ${routeType}...`);
      const routeData = await fetchDirections(routeType);
      
      if (routeData) {
        console.log(`✅ Directions loaded successfully for ${routeType}`);
        
        // Ensure modal processing is complete before opening
        setTimeout(() => {
          setIsModalProcessing(false);
          setIsModalVisible(true);
        }, 100);
      } else {
        console.error(`❌ Failed to load route data for ${routeType}`);
        setDirectionsError(`Failed to load ${routeType} route`);
        setIsModalProcessing(false);
      }
      
    } catch (error) {
      console.error(`❌ Error in route selection for ${routeType}:`, error);
      setDirectionsError(`Failed to load ${routeType} route`);
      setIsModalProcessing(false);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Handle route confirmation
  const handleRouteConfirm = () => {
    setSelectedRouteType(modalRouteType);
    setIsModalVisible(false);
    
    // Collect all places from the itinerary
    const allDestinations = allPlaces.map(place => place.name);
    
    Alert.alert(
      'Route Selected',
      `You have selected the ${modalRouteType} route. You can now proceed to book services for your trip.`,
      [
        { 
          text: 'Book Services', 
          onPress: () => {
            router.push({
              pathname: '/planning/booking',
              params: {
                destination,
                startPoint,
                startDate,
                endDate,
                destinations: JSON.stringify(allDestinations),
                itinerary: itineraryString,
              },
            });
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Get route parameters for directions
  const getRouteParameters = (routeType: RouteType) => {
    console.log(`🔧 Getting route parameters for: ${routeType}`);
    
    const params: any = {
      optimizeWaypoints: false,
      precision: 'high' as const,
      mode: 'DRIVING' as const,
      splitWaypoints: false,
      resetOnChange: true,
    };

    switch (routeType) {
      case 'shortest':
        // Fastest route, avoid tolls for direct path
        params.avoid = 'tolls';
        params.optimizeWaypoints = true;
        console.log(`⚡ Shortest route params:`, params);
        break;
      case 'scenic':
        // Beautiful views, avoid highways for local roads and cultural sites
        params.avoid = 'highways';
        console.log(`🌅 Scenic route params:`, params);
        break;
      case 'recommended':
      default:
        // Balanced route with best attractions, moderate traffic
        console.log(`⭐ Recommended route params:`, params);
        break;
    }

    return params;
  };

  // Fetch directions from Google Directions API
  const fetchDirections = async (routeType: RouteType) => {
    if (!startLocation || allPlaces.length === 0 || !GOOGLE_DIRECTIONS_API_KEY) {
      console.warn('⚠️ Cannot fetch directions: missing requirements', {
        startLocation: !!startLocation,
        placesCount: allPlaces.length,
        apiKey: !!GOOGLE_DIRECTIONS_API_KEY
      });
      return null;
    }

    setIsLoadingDirections(true);
    setDirectionsError(null);

    try {
      console.log(`🚀 Fetching ${routeType} route directions...`);
      
      const origin = `${startLocation.latitude},${startLocation.longitude}`;
      const destination = `${allPlaces[allPlaces.length - 1].coordinates.latitude},${allPlaces[allPlaces.length - 1].coordinates.longitude}`;
      
      // Create waypoints from all places except the last one (destination)
      const waypoints = allPlaces.length > 1 
        ? allPlaces.slice(0, -1).map(place => `${place.coordinates.latitude},${place.coordinates.longitude}`).join('|')
        : '';

      // Build URL with route-specific parameters
      let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${GOOGLE_DIRECTIONS_API_KEY}`;
      
      // Add waypoints if they exist
      if (waypoints) {
        url += `&waypoints=${waypoints}`;
      }

      // Add route-specific parameters
      switch (routeType) {
        case 'shortest':
          // Fastest route, avoid tolls for direct path
          url += '&avoid=tolls&optimize=true';
          console.log(`⚡ Shortest route: avoiding tolls, optimizing waypoints`);
          break;
        case 'scenic':
          // Beautiful views, avoid highways for local roads and cultural sites
          url += '&avoid=highways&alternatives=true';
          console.log(`🌅 Scenic route: avoiding highways, requesting alternatives`);
          break;
        case 'recommended':
          // Balanced route with best attractions, moderate traffic
          url += '&alternatives=true&traffic_model=best_guess&departure_time=now';
          console.log(`⭐ Recommended route: alternatives with live traffic data`);
          break;
      }

      console.log(`🔗 Directions API URL for ${routeType}:`, url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`📍 Directions API Response Status for ${routeType}:`, data.status);
      
      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Log route selection reasoning
        console.log(`📊 API returned ${data.routes.length} route(s) for ${routeType}`);
        if (data.routes.length > 1) {
          console.log(`🔄 Multiple routes available, using primary route for ${routeType}`);
          data.routes.forEach((r: any, index: number) => {
            const dist = r.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0);
            const dur = r.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0);
            console.log(`  Route ${index + 1}: ${Math.round(dist / 1000)}km, ${Math.round(dur / 60)}min`);
          });
        }
        
        // Calculate total distance and duration
        const totalDistance = route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0);
        const totalDuration = route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0);
        
        const directionsData = {
          route: route,
          distance: `${Math.round(totalDistance / 1000)} km`,
          duration: `${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m`,
          polyline: route.overview_polyline.points,
          bounds: route.bounds,
          legs: route.legs,
          routeType: routeType,
          rawDistance: totalDistance,
          rawDuration: totalDuration
        };
        
        console.log(`✅ ${routeType} route loaded successfully:`);
        console.log(`  📏 Distance: ${directionsData.distance}`);
        console.log(`  ⏱️ Duration: ${directionsData.duration}`);
        console.log(`  🔢 Raw values: ${totalDistance}m, ${totalDuration}s`);
        console.log(`🗺️ Route will use pure Google native rendering for perfect road accuracy`);
        
        // Store route data for specific route type
        setRouteDirections(prev => ({
          ...prev,
          [routeType]: directionsData
        }));
        setMapViewDirectionsKey(prev => prev + 1); // Force re-render for accuracy
        
        // Update route info with real data
        const realRouteInfo: RouteInfo = {
          distance: directionsData.distance,
          duration: directionsData.duration,
          estimatedCost: calculateRouteInfo(routeType).estimatedCost,
          routeType: routeType
        };
        setRouteInfo(realRouteInfo);
        
        // Auto-fit map to show route
        if (mapRef.current && route.bounds) {
          const { northeast, southwest } = route.bounds;
          console.log(`🗺️ Auto-fitting map for ${routeType} route`);
          mapRef.current.animateToRegion({
            latitude: (northeast.lat + southwest.lat) / 2,
            longitude: (northeast.lng + southwest.lng) / 2,
            latitudeDelta: Math.abs(northeast.lat - southwest.lat) * 1.3,
            longitudeDelta: Math.abs(northeast.lng - southwest.lng) * 1.3,
          }, 1000);
        }
        
        return directionsData;
      } else {
        const errorMsg = data.error_message || `Directions API error: ${data.status}`;
        console.error(`❌ Directions API Error for ${routeType}:`, errorMsg);
        if (data.status === 'ZERO_RESULTS') {
          console.error(`❌ No route found for ${routeType} - this might be due to route restrictions`);
        }
        setDirectionsError(errorMsg);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error fetching ${routeType} directions:`, error);
      setDirectionsError('Failed to fetch route directions. Please check your internet connection.');
      return null;
    } finally {
      setIsLoadingDirections(false);
    }
  };

  // Route Modal Component
  const RouteModal = () => {
    const routeOption = ROUTE_OPTIONS.find(option => option.id === modalRouteType);
    // Use real route info if available, otherwise use calculated
    const currentRouteInfo = routeInfo && routeInfo.routeType === modalRouteType 
      ? routeInfo 
      : calculateRouteInfo(modalRouteType);
    
    const handleModalClose = () => {
      console.log('🔒 Closing modal');
      console.log('🧹 Current state before cleanup:', {
        isModalVisible,
        isModalProcessing,
        isLoadingRoute,
        isLoadingDirections,
        modalRouteType,
        selectedRouteType
      });
      
      // Clear any pending route selection timeout
      if (routeSelectionTimeoutRef.current) {
        clearTimeout(routeSelectionTimeoutRef.current);
        routeSelectionTimeoutRef.current = null;
      }
      
      // Reset modal-related states immediately to prevent conflicts
      setIsModalVisible(false);
      setIsModalProcessing(false);
      
      // Use setTimeout to ensure modal is closed before resetting loading states
      setTimeout(() => {
        setIsLoadingRoute(false);
        setIsLoadingDirections(false);
        setDirectionsError(null);
        console.log('✅ Modal cleanup complete with delay');
      }, 100);
    };
    
    return (
      <Modal
        key={`route-modal-${modalRouteType}-${isModalVisible}`}
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleModalClose}
        statusBarTranslucent={false}
        supportedOrientations={['portrait']}
      >
        <View style={styles.modalContainer}>
          {/* Fixed Header */}
          <View style={styles.modalFixedHeader}>
            <View style={styles.modalHeaderTop}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={handleModalClose}
              >
                <Ionicons name="arrow-back" size={24} color={Colors.white} />
              </TouchableOpacity>
              
              <View style={styles.modalHeaderCenter}>
                <View style={styles.modalRouteTypeInfo}>
                  <View style={[styles.modalRouteTypeIcon, { backgroundColor: routeOption?.color + '30' }]}>
                    <Ionicons 
                      name={routeOption?.icon as any} 
                      size={20} 
                      color={Colors.white} 
                    />
                  </View>
                  <ThemedText style={styles.modalRouteTypeName}>
                    {routeOption?.name} Route
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.modalHeaderRight}>
                <View style={styles.modalRouteStats}>
                  <View style={styles.modalStatItem}>
                    <Ionicons name="speedometer" size={16} color={Colors.white} />
                    <ThemedText style={styles.modalStatText}>
                      {Math.round(parseFloat(currentRouteInfo.distance))} km
                    </ThemedText>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Ionicons name="time" size={16} color={Colors.white} />
                    <ThemedText style={styles.modalStatText}>
                      {Math.round(parseFloat(currentRouteInfo.duration.split('h')[0]) || 0)}h {Math.round(parseFloat(currentRouteInfo.duration.split('h')[1]?.replace('m', '')) || 0)}m
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Full Screen Map */}
          <View style={styles.modalFullScreenMap}>
            <MapView
              ref={mapRef}
              style={styles.modalMap}
              provider={PROVIDER_GOOGLE}
              region={mapRegion}
              showsUserLocation
              showsMyLocationButton
              mapType="standard"
              showsCompass={false}
              showsScale={false}
              showsBuildings={true}
              showsTraffic={false}
              showsIndoors={false}
              rotateEnabled={true}
              scrollEnabled={true}
              zoomEnabled={true}
              pitchEnabled={true}
              loadingEnabled={true}
              loadingIndicatorColor={routeOption?.color}
              loadingBackgroundColor={Colors.white}
              moveOnMarkerPress={false}
              showsPointsOfInterest={false}
              toolbarEnabled={false}
            >
              {/* Start Location Marker */}
              {startLocation && (
                <Marker
                  coordinate={startLocation}
                  title="Start Point"
                  description={startPoint as string}
                  pinColor={Colors.success}
                  identifier="start"
                >
                  <View style={styles.customMarkerStart}>
                    <Ionicons name="play" size={16} color={Colors.white} />
                  </View>
                </Marker>
              )}
              
              {/* Places Markers */}
              {allPlaces.map((place, index) => (
                <Marker
                  key={place.id}
                  coordinate={place.coordinates}
                  title={index === allPlaces.length - 1 ? "Destination" : place.name}
                  description={index === allPlaces.length - 1 ? (destination as string) : place.address}
                  identifier={`place-${index}`}
                >
                  {/* Show flag icon for the last place (destination) */}
                  {index === allPlaces.length - 1 ? (
                    <View style={styles.customMarkerDestination}>
                      <Ionicons name="flag" size={16} color={Colors.white} />
                    </View>
                  ) : (
                    <View style={styles.customMarkerPlace}>
                      <ThemedText style={styles.markerPlaceNumber}>{index + 1}</ThemedText>
                    </View>
                  )}
                </Marker>
              ))}

              {/* ACCURATE POLYLINE RENDERING - Using Google Directions API data */}
              {startLocation && allPlaces.length > 0 && routeDirections[modalRouteType] && (
                <>
                  {/* Primary: Accurate polyline from Google Directions API */}
                  <Polyline
                    key={`accurate-route-${modalRouteType}-${mapViewDirectionsKey}`}
                    coordinates={decodeGooglePolyline(routeDirections[modalRouteType].polyline)}
                    strokeWidth={8}
                    strokeColor={routeOption?.color || getRouteTypeColor(modalRouteType)}
                    lineCap="round"
                    lineJoin="round"
                    onLayout={() => {
                      console.log(`✅ ACCURATE ${modalRouteType.toUpperCase()} polyline rendered with ${decodeGooglePolyline(routeDirections[modalRouteType].polyline).length} points`);
                      
                      // Auto-fit map to show the route
                      if (mapRef.current && routeDirections[modalRouteType]) {
                        const coordinates = decodeGooglePolyline(routeDirections[modalRouteType].polyline);
                        if (coordinates.length > 0) {
                          console.log(`�️ Auto-fitting map to ${modalRouteType} polyline bounds`);
                          mapRef.current.fitToCoordinates(coordinates, {
                            edgePadding: { top: 120, right: 60, bottom: 240, left: 60 },
                            animated: true,
                          });
                        }
                      }
                    }}
                  />
                  
                  {/* Fallback: Simple coordinate line if polyline fails */}
                  {(!routeDirections[modalRouteType].polyline || decodeGooglePolyline(routeDirections[modalRouteType].polyline).length === 0) && (
                    <Polyline
                      key={`fallback-route-${modalRouteType}-${mapViewDirectionsKey}`}
                      coordinates={[
                        startLocation,
                        ...allPlaces.map(place => place.coordinates),
                      ]}
                      strokeWidth={6}
                      strokeColor={routeOption?.color || getRouteTypeColor(modalRouteType)}
                      lineCap="round"
                      lineJoin="round"
                      onLayout={() => {
                        console.log(`⚠️ FALLBACK ${modalRouteType.toUpperCase()} coordinate line rendered`);
                      }}
                    />
                  )}
                </>
              )}
            </MapView>
          </View>

          {/* Fixed Bottom Section */}
          <View style={styles.modalFixedBottom}>
            <View style={styles.modalBottomContent}>
              {/* Route Description */}
              <View style={styles.modalRouteDescription}>
                <ThemedText style={styles.modalRouteDescriptionText}>
                  {routeOption?.description}
                </ThemedText>
              </View>

              {/* Route Benefits */}
              <View style={styles.modalRouteBenefits}>
                {routeOption?.benefits.slice(0, 2).map((benefit, index) => (
                  <View key={index} style={styles.modalBenefitItem}>
                    <Ionicons name="checkmark-circle" size={16} color={routeOption.color} />
                    <ThemedText style={styles.modalBenefitText}>{benefit}</ThemedText>
                  </View>
                ))}
              </View>

              {/* Confirm Button */}
              <View style={styles.modalActionButton}>
                <CustomButton
                  title="Confirm Route"
                  variant="primary"
                  size="large"
                  onPress={handleRouteConfirm}
                  loading={isLoadingRoute}
                  rightIcon={<Ionicons name="checkmark" size={20} color={Colors.white} />}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Enhanced Google polyline decoder for accurate route rendering
  const decodeGooglePolyline = (polyline: string): { latitude: number; longitude: number }[] => {
    if (!polyline || polyline.length === 0) {
      console.warn('⚠️ Empty polyline provided to decoder');
      return [];
    }

    const points: { latitude: number; longitude: number }[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    try {
      while (index < polyline.length) {
        let b;
        let shift = 0;
        let result = 0;

        // Decode latitude
        do {
          b = polyline.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);

        const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;

        // Decode longitude
        do {
          b = polyline.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);

        const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        // Convert to decimal degrees with high precision
        const decodedLat = lat / 1e5;
        const decodedLng = lng / 1e5;

        // Validate coordinates are within reasonable bounds for Sri Lanka
        if (decodedLat >= 5.0 && decodedLat <= 10.0 && decodedLng >= 79.0 && decodedLng <= 82.0) {
          points.push({
            latitude: decodedLat,
            longitude: decodedLng,
          });
        }
      }

      console.log(`✅ Successfully decoded ${points.length} accurate polyline coordinates`);
      if (points.length > 0) {
        console.log(`📍 Route bounds: Lat ${Math.min(...points.map(p => p.latitude))}-${Math.max(...points.map(p => p.latitude))}, Lng ${Math.min(...points.map(p => p.longitude))}-${Math.max(...points.map(p => p.longitude))}`);
      }
      
      return points;
    } catch (error) {
      console.error('❌ Error decoding polyline:', error);
      return [];
    }
  };

  // Helper function to get route type name
  const getRouteTypeName = (type: RouteType): string => {
    switch (type) {
      case 'recommended': return 'Recommended Route';
      case 'shortest': return 'Shortest Route';
      case 'scenic': return 'Scenic Route';
      default: return 'Unknown Route';
    }
  };

  // Helper function to get route type color
  const getRouteTypeColor = (type: RouteType): string => {
    switch (type) {
      case 'recommended': return '#3B82F6';
      case 'shortest': return '#10B981';
      case 'scenic': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  // Helper function to get route highlights
  const getRouteHighlights = (type: RouteType): string[] => {
    switch (type) {
      case 'recommended':
        return ['Balanced route', 'Best attractions', 'Moderate traffic'];
      case 'shortest':
        return ['Fastest route', 'Avoids tolls', 'Direct path'];
      case 'scenic':
        return ['Beautiful views', 'Local roads', 'Cultural sites'];
      default:
        return [];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Colors.primary600, Colors.primary700]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <ThemedText style={styles.headerTitle}>Route Options</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Choose your preferred route
            </ThemedText>
          </View>
          {/* <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="map" size={24} color={Colors.white} />
          </TouchableOpacity> */}
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.mainContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <View style={styles.animatedContainer}>
          
          {/* Trip Summary Card */}
          <View style={styles.routeSummaryCard}>
            <View style={styles.tripInfoSection}>
              <View style={styles.tripLocation}>
                <Ionicons name="location" size={24} color={Colors.primary600} />
                <ThemedText style={styles.tripLocationText}>
                  {startPoint} → {destination}
                </ThemedText>
              </View>
              
              <View style={styles.tripDetails}>
                <View style={styles.tripDetailItem}>
                  <Ionicons name="calendar" size={18} color={Colors.secondary500} />
                  <ThemedText style={styles.tripDetailText}>
                    {startDate} - {endDate}
                  </ThemedText>
                </View>
                <View style={styles.tripDetailItem}>
                  <Ionicons name="location-outline" size={18} color={Colors.secondary500} />
                  <ThemedText style={styles.tripDetailText}>
                    {allPlaces.length} places
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Horizontal Route Selection */}
          <View style={styles.routeSelectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="map-outline" size={24} color={Colors.primary600} />
              <ThemedText style={styles.sectionTitle}>Select Route Type</ThemedText>
            </View>
            
            <ThemedText style={styles.routeSelectionSubtitle}>
              Choose how youd like to travel between destinations
            </ThemedText>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRouteScrollContainer}
              style={styles.horizontalRouteScrollView}
            >
              {ROUTE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.horizontalRouteCard,
                    selectedRouteType === option.id && styles.horizontalRouteCardSelected,
                    { borderColor: selectedRouteType === option.id ? option.color : Colors.secondary200 }
                  ]}
                  onPress={() => {
                    // Add debounce protection for iOS
                    if (routeSelectionTimeoutRef.current) {
                      console.log('⏸️ Debouncing route selection tap');
                      return;
                    }
                    
                    routeSelectionTimeoutRef.current = setTimeout(() => {
                      routeSelectionTimeoutRef.current = null;
                    }, 1000); // 1 second debounce
                    
                    handleRouteSelect(option.id);
                  }}
                  disabled={isLoadingRoute || isLoadingDirections || isModalProcessing || isModalVisible}
                >
                  <View style={[styles.horizontalRouteIcon, { backgroundColor: option.color + '20' }]}>
                    {isLoadingRoute && selectedRouteType === option.id ? (
                      <Animated.View style={{ transform: [{ rotate: spin }] }}>
                        <Ionicons name="reload" size={24} color={option.color} />
                      </Animated.View>
                    ) : (
                      <Ionicons 
                        name={option.icon as any} 
                        size={24} 
                        color={option.color} 
                      />
                    )}
                  </View>
                  
                  <ThemedText style={[
                    styles.horizontalRouteTitle,
                    selectedRouteType === option.id && { color: option.color }
                  ]}>
                    {option.name}
                  </ThemedText>
                  
                  <ThemedText style={styles.horizontalRouteDescription}>
                    {option.description}
                  </ThemedText>
                  
                  {selectedRouteType === option.id && !isLoadingRoute && (
                    <View style={[styles.horizontalRouteSelected, { backgroundColor: option.color }]}>
                      <Ionicons name="checkmark" size={12} color={Colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Selected Route Info */}
          {routeInfo && (
            <View style={styles.selectedRouteInfoCard}>
              <View style={styles.routeInfoHeader}>
                <View style={[styles.routeInfoColorBar, { backgroundColor: getRouteTypeColor(selectedRouteType) }]} />
                <ThemedText style={styles.routeInfoTitle}>
                  {getRouteTypeName(selectedRouteType)}
                </ThemedText>
              </View>
              
              <View style={styles.routeInfoStats}>
                <View style={styles.routeInfoStatItem}>
                  <Ionicons name="speedometer-outline" size={20} color={Colors.secondary500} />
                  <ThemedText style={styles.routeInfoStatText}>{routeInfo.distance}</ThemedText>
                </View>
                <View style={styles.routeInfoStatItem}>
                  <Ionicons name="time-outline" size={20} color={Colors.secondary500} />
                  <ThemedText style={styles.routeInfoStatText}>{routeInfo.duration}</ThemedText>
                </View>
                <View style={styles.routeInfoStatItem}>
                  <Ionicons name="wallet-outline" size={20} color={Colors.secondary500} />
                  <ThemedText style={styles.routeInfoStatText}>{routeInfo.estimatedCost}</ThemedText>
                </View>
              </View>
            </View>
          )}

          {/* Places Itinerary */}
          <View style={styles.placesItineraryCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="map" size={24} color={Colors.primary600} />
              <ThemedText style={styles.sectionTitle}>Your Journey</ThemedText>
            </View>
            
            <ThemedText style={styles.placesItinerarySubtitle}>
              Complete route from start to destination
            </ThemedText>

            <View style={styles.journeyContainer}>
              {/* Start Point */}
              <View style={styles.journeyItem}>
                <View style={styles.journeyItemLeft}>
                  <View style={[styles.journeyDot, { backgroundColor: Colors.success }]} />
                  <View style={styles.journeyLine} />
                </View>
                <View style={styles.journeyItemContent}>
                  <View style={styles.journeyItemHeader}>
                    <ThemedText style={styles.journeyItemTitle}>Starting Point</ThemedText>
                    <View style={styles.journeyItemBadge}>
                      <ThemedText style={styles.journeyItemBadgeText}>START</ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.journeyItemLocation}>{startPoint}</ThemedText>
                  <ThemedText style={styles.journeyItemTime}>Departure: {startDate}</ThemedText>
                </View>
              </View>

              {/* Day by Day Places */}
              {itinerary.map((day, dayIndex) => (
                <View key={day.dayNumber} style={styles.daySection}>
                  <View style={styles.daySectionHeader}>
                    <View style={[styles.journeyDot, { backgroundColor: Colors.primary600 }]} />
                    <ThemedText style={styles.daySectionTitle}>Day {day.dayNumber}</ThemedText>
                    <ThemedText style={styles.daySectionDate}>{day.date}</ThemedText>
                  </View>
                  
                  {day.places.map((place, placeIndex) => (
                    <View key={place.id} style={styles.placeItem}>
                      <View style={styles.journeyItemLeft}>
                        <View style={[styles.placeItemDot, { backgroundColor: Colors.primary300 }]} />
                        {placeIndex < day.places.length - 1 && <View style={styles.placeItemLine} />}
                      </View>
                      <View style={styles.placeItemContent}>
                        <ThemedText style={styles.placeItemTitle}>{place.name}</ThemedText>
                        <ThemedText style={styles.placeItemAddress}>{place.address}</ThemedText>
                        {place.description && (
                          <ThemedText style={styles.placeItemDescription}>{place.description}</ThemedText>
                        )}
                        {place.openingHours && (
                          <View style={styles.placeItemMeta}>
                            <Ionicons name="time-outline" size={14} color={Colors.secondary500} />
                            <ThemedText style={styles.placeItemMetaText}>{place.openingHours}</ThemedText>
                          </View>
                        )}
                        {place.rating && (
                          <View style={styles.placeItemMeta}>
                            <Ionicons name="star" size={14} color={Colors.warning} />
                            <ThemedText style={styles.placeItemMetaText}>{place.rating} rating</ThemedText>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ))}

              {/* Destination */}
              <View style={styles.journeyItem}>
                <View style={styles.journeyItemLeft}>
                  <View style={[styles.journeyDot, { backgroundColor: Colors.error }]} />
                </View>
                <View style={styles.journeyItemContent}>
                  <View style={styles.journeyItemHeader}>
                    <ThemedText style={styles.journeyItemTitle}>Final Destination</ThemedText>
                    <View style={[styles.journeyItemBadge, { backgroundColor: Colors.error }]}>
                      <ThemedText style={styles.journeyItemBadgeText}>END</ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.journeyItemLocation}>{destination}</ThemedText>
                  <ThemedText style={styles.journeyItemTime}>Arrival: {endDate}</ThemedText>
                </View>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Fixed Bottom Actions */}
      <View style={styles.bottomActions}>
        {/* <View style={styles.proceedInfo}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          <View style={styles.proceedInfoContent}>
            <ThemedText style={styles.proceedInfoTitle}>Route Ready</ThemedText>
            <ThemedText style={styles.proceedInfoText}>
              {selectedRouteType.charAt(0).toUpperCase() + selectedRouteType.slice(1)} route selected
            </ThemedText>
          </View>
        </View> */}
        
        <CustomButton
          title="Proceed to Booking"
          variant="primary"
          size="large"
          onPress={() => {
            // Collect all places from the itinerary
            const allDestinations = allPlaces.map(place => place.name);
            
            router.push({
              pathname: '/planning/booking',
              params: {
                destination,
                startPoint,
                startDate,
                endDate,
                destinations: JSON.stringify(allDestinations),
                itinerary: itineraryString,
              },
            });
          }}
          rightIcon={<Ionicons name="arrow-forward" size={20} color={Colors.white} />}
        />
      </View>

      {/* Only render modal when data is ready to prevent iOS crashes */}
      {startLocation && allPlaces.length > 0 && <RouteModal />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  
  // Main content
  mainContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100, // Account for fixed bottom section
    paddingTop: 30
  },
  animatedContainer: {
    paddingBottom: 20,
    paddingTop:10
  },
  
  // Route Summary Card
  routeSummaryCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 24,
    padding: 24,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: Colors.secondary100,
  },
  tripInfoSection: {
    marginBottom: 4,
  },
  tripLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tripLocationText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary700,
    marginLeft: 8,
    flex: 1,
  },
  tripDetails: {
    flexDirection: 'row',
    gap: 24,
  },
  tripDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripDetailText: {
    fontSize: 14,
    color: Colors.secondary500,
    fontWeight: '500',
  },
  
  // Route Selection Card
  routeSelectionCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.secondary100,
  },
  
  // Horizontal Route Selection
  horizontalRouteScrollView: {
    marginHorizontal: -20,
  },
  horizontalRouteScrollContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  horizontalRouteCard: {
    width: 140,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.secondary200,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  horizontalRouteCardSelected: {
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  horizontalRouteIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  horizontalRouteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary700,
    textAlign: 'center',
    marginBottom: 8,
  },
  horizontalRouteDescription: {
    fontSize: 11,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 14,
  },
  horizontalRouteSelected: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Selected Route Info Card
  selectedRouteInfoCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.secondary100,
  },
  routeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeInfoColorBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  routeInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary700,
  },
  routeInfoStats: {
    flexDirection: 'row',
    gap: 20,
  },
  routeInfoStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  routeInfoStatText: {
    fontSize: 14,
    color: Colors.secondary600,
    fontWeight: '600',
  },
  
  // Places Itinerary Card
  placesItineraryCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.secondary100,
  },
  placesItinerarySubtitle: {
    fontSize: 14,
    color: Colors.secondary500,
    marginBottom: 24,
    lineHeight: 20,
  },
  
  // Journey Container
  journeyContainer: {
    paddingLeft: 8,
  },
  journeyItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  journeyItemLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  journeyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  journeyLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.secondary200,
    marginTop: 8,
  },
  journeyItemContent: {
    flex: 1,
    paddingBottom: 8,
  },
  journeyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  journeyItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
    flex: 1,
  },
  journeyItemBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  journeyItemBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  journeyItemLocation: {
    fontSize: 15,
    color: Colors.secondary600,
    marginBottom: 4,
  },
  journeyItemTime: {
    fontSize: 13,
    color: Colors.secondary500,
  },
  
  // Day Section
  daySection: {
    marginBottom: 24,
  },
  daySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  daySectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
    marginLeft: 16,
    flex: 1,
  },
  daySectionDate: {
    fontSize: 13,
    color: Colors.secondary500,
    fontWeight: '500',
  },
  
  // Place Item
  placeItem: {
    flexDirection: 'row',
    marginBottom: 16,
    marginLeft: 16,
  },
  placeItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  placeItemLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.secondary200,
    marginTop: 8,
  },
  placeItemContent: {
    flex: 1,
    marginLeft: 16,
  },
  placeItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  placeItemAddress: {
    fontSize: 13,
    color: Colors.secondary500,
    marginBottom: 4,
  },
  placeItemDescription: {
    fontSize: 12,
    color: Colors.secondary400,
    marginBottom: 8,
    lineHeight: 16,
  },
  placeItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  placeItemMetaText: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary700,
    marginLeft: 8,
  },
  routeSelectionSubtitle: {
    fontSize: 14,
    color: Colors.secondary500,
    marginBottom: 24,
    lineHeight: 20,
  },
  
  // Bottom Actions
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary100,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  proceedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '15',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.success + '30',
    gap: 12,
  },
  proceedInfoContent: {
    flex: 1,
  },
  proceedInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
    marginBottom: 4,
  },
  proceedInfoText: {
    fontSize: 14,
    color: Colors.success,
    opacity: 0.8,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  
  // Fixed Header Styles
  modalFixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary600,
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 24) + 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  modalRouteTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalRouteTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalRouteTypeName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  modalHeaderRight: {
    alignItems: 'flex-end',
  },
  modalRouteStats: {
    gap: 4,
  },
  modalStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  
  // Full Screen Map Styles
  modalFullScreenMap: {
    flex: 1,
    backgroundColor: Colors.secondary200,
  },
  modalMap: {
    flex: 1,
  },
  
  // Custom Marker Styles
  customMarkerStart: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  customMarkerPlace: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary600,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerPlaceNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  customMarkerDestination: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  
  // Fixed Bottom Styles
  modalFixedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    zIndex: 1000,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalBottomContent: {
    gap: 16,
  },
  modalRouteDescription: {
    alignItems: 'center',
  },
  modalRouteDescriptionText: {
    fontSize: 14,
    color: Colors.secondary600,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalRouteBenefits: {
    gap: 8,
  },
  modalBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalBenefitText: {
    fontSize: 13,
    color: Colors.secondary600,
    flex: 1,
  },
  modalActionButton: {
    marginTop: 8,
  },
  
  // Route Cards Section
  routeCardsSection: {
    marginBottom: 20,
  },
  routeCardsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 16,
  },
  routeCardsScrollView: {
    marginHorizontal: -20,
  },
  routeCardsScrollContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  modalRouteCard: {
    width: 160,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.secondary200,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  modalRouteCardSelected: {
    borderColor: Colors.primary600,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalRouteCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  modalRouteCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalRouteCardDescription: {
    fontSize: 12,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  routeStats: {
    gap: 8,
  },
  routeStatsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  routeStatsSpinner: {
    // Animation handled by Animated.View
  },
  routeStatsLoadingText: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  routeModalStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeModalStatText: {
    fontSize: 11,
    color: Colors.secondary600,
    fontWeight: '500',
  },
  routeStatPlaceholder: {
    fontSize: 11,
    color: Colors.secondary400,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  
  // Route Benefits Section
  routeBenefitsSection: {
    marginBottom: 20,
  },
  routeBenefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 12,
  },
  routeBenefitsList: {
    gap: 8,
  },
  routeBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeBenefitText: {
    fontSize: 14,
    color: Colors.secondary600,
    flex: 1,
  },
  
  // Modal Action Section
  modalActionSection: {
    // No additional styles needed, CustomButton handles everything
  },
  
  // Modal Benefits Container
  modalBenefitsContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalBenefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 12,
  },
  
  // Route Generation Styles
  routeGenerationCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.secondary100,
  },
  generationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  generationSpinner: {
    marginRight: 12,
  },
  generationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  generationDescription: {
    fontSize: 14,
    color: Colors.secondary500,
    lineHeight: 20,
  },
  
  // Route Comparison Styles
  routeComparisonContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.secondary100,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    marginLeft: 8,
  },
  comparisonSubtitle: {
    fontSize: 14,
    color: Colors.secondary500,
    marginBottom: 20,
    lineHeight: 20,
  },
  routeCardsContainer: {
    paddingRight: 20,
    gap: 16,
  },
  routeComparisonCard: {
    width: 280,
    backgroundColor: Colors.secondary50,
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    borderWidth: 2,
    borderColor: Colors.secondary200,
  },
  selectedRouteCard: {
    borderColor: Colors.primary600,
    backgroundColor: Colors.primary100,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  routeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  routeCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    flex: 1,
  },
  routeCardStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  routeStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeStatText: {
    fontSize: 12,
    color: Colors.secondary500,
    fontWeight: '500',
  },
  routeCardHighlights: {
    gap: 6,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  highlightDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  highlightText: {
    fontSize: 12,
    color: Colors.secondary600,
  },
  
  // Selected Route Details
  selectedRouteDetails: {
    marginTop: 20,
    backgroundColor: Colors.secondary50,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },
  selectedRouteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedRouteColorBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  selectedRouteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  selectedRouteMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.secondary100,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.secondary500,
    marginTop: 2,
  },
  
  // Map Legend
  mapLegend: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 4,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: Colors.secondary700,
    fontWeight: '500',
  },
});

export default RouteDisplayScreen;