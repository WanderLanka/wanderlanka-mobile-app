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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
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

// Route options
const ROUTE_OPTIONS: RouteOption[] = [
  {
    id: 'recommended',
    name: 'Recommended',
    description: 'Balanced route with best attractions',
    icon: 'star',
    color: Colors.primary600,
  },
  {
    id: 'shortest',
    name: 'Shortest',
    description: 'Fastest route to destination',
    icon: 'flash',
    color: Colors.success,
  },
  {
    id: 'scenic',
    name: 'Scenic',
    description: 'Most beautiful route with views',
    icon: 'camera',
    color: Colors.info,
  },
];

export default function RouteDisplayScreen() {
  const params = useLocalSearchParams();
  const { destination, startPoint, startDate, endDate, itinerary: itineraryString } = params;
  
  const [itinerary, setItinerary] = useState<DayItinerary[]>([]);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [selectedRouteType, setSelectedRouteType] = useState<RouteType>('recommended');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    // Animate component entrance
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

    if (itineraryString) {
      try {
        const parsedItinerary: DayItinerary[] = JSON.parse(itineraryString as string);
        setItinerary(parsedItinerary);
        
        // Extract all places from all days
        const places = parsedItinerary.flatMap(day => day.places);
        setAllPlaces(places);
        
        // Get start location coordinates from startPoint
        let startCoords: { latitude: number; longitude: number } | null = null;
        if (startPoint && typeof startPoint === 'string') {
          // Simple geocoding for major Sri Lankan cities
          const locationMap: { [key: string]: { latitude: number; longitude: number } } = {
            'Colombo': { latitude: 6.9271, longitude: 79.8612 },
            'Kandy': { latitude: 7.2936, longitude: 80.6417 },
            'Galle': { latitude: 6.0329, longitude: 80.217 },
            'Negombo': { latitude: 7.2083, longitude: 79.8358 },
            'Bandaranaike International Airport': { latitude: 7.1808, longitude: 79.8841 },
            'Ella': { latitude: 6.8667, longitude: 81.0469 },
            'Nuwara Eliya': { latitude: 6.9497, longitude: 80.7891 },
            'Anuradhapura': { latitude: 8.3114, longitude: 80.4037 },
            'Polonnaruwa': { latitude: 7.9403, longitude: 81.0188 },
            'Sigiriya': { latitude: 7.9570, longitude: 80.7600 },
          };
          
          startCoords = locationMap[startPoint] || { latitude: 6.9271, longitude: 79.8612 };
          setStartLocation(startCoords);
        }
        
        // Calculate map region to show all places including start point
        const allCoordinates = [...places.map(place => place.coordinates)];
        if (startCoords) {
          allCoordinates.push(startCoords);
        }
        
        if (allCoordinates.length > 0 && !initialRegionSet) {
          const latitudes = allCoordinates.map(coord => coord.latitude);
          const longitudes = allCoordinates.map(coord => coord.longitude);
          
          const minLat = Math.min(...latitudes);
          const maxLat = Math.max(...latitudes);
          const minLng = Math.min(...longitudes);
          const maxLng = Math.max(...longitudes);
          
          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          const deltaLat = (maxLat - minLat) * 1.3; // Reduced padding
          const deltaLng = (maxLng - minLng) * 1.3; // Reduced padding
          
          const newRegion = {
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: Math.max(deltaLat, 0.05), // Minimum zoom level
            longitudeDelta: Math.max(deltaLng, 0.05), // Minimum zoom level
          };
          
          setMapRegion(newRegion);
          setInitialRegionSet(true);
        }
        
        // Calculate initial route info for the recommended route
        if (allPlaces.length > 0 && startCoords) {
          setIsLoadingRoute(true);
          // Simulate route calculation with realistic data
          setTimeout(() => {
            calculateRouteInfo(selectedRouteType);
          }, 1500);
        }
      } catch (error) {
        console.error('Error parsing itinerary:', error);
        Alert.alert('Error', 'Failed to load itinerary data');
      }
    }
  }, [itineraryString, startPoint, fadeAnim, slideAnim]);

  // Function to calculate route info based on route type
  const calculateRouteInfo = (routeType: RouteType) => {
    if (allPlaces.length === 0) {
      setIsLoadingRoute(false);
      return;
    }

    // Simulate route calculation based on places and route type
    let totalDistance = 0;
    let totalDuration = 0;

    // Calculate approximate distance and duration
    for (let i = 0; i < allPlaces.length; i++) {
      // Simulate distance calculation between consecutive places
      const baseDistance = Math.random() * 50 + 20; // 20-70 km per segment
      const baseDuration = Math.random() * 45 + 30; // 30-75 minutes per segment
      
      // Adjust based on route type
      switch (routeType) {
        case 'shortest':
          totalDistance += baseDistance * 0.8; // 20% shorter
          totalDuration += baseDuration * 0.7; // 30% faster
          break;
        case 'scenic':
          totalDistance += baseDistance * 1.3; // 30% longer
          totalDuration += baseDuration * 1.5; // 50% longer
          break;
        case 'recommended':
        default:
          totalDistance += baseDistance;
          totalDuration += baseDuration;
          break;
      }
    }

    // Set the calculated route info
    setRouteInfo({
      distance: `${totalDistance.toFixed(1)} km`,
      duration: `${Math.round(totalDuration)} min`,
      estimatedCost: calculateEstimatedCost(totalDistance, routeType),
      routeType: routeType,
    });
    
    setIsLoadingRoute(false);
  };

  const handleRouteReady = (result: any) => {
    setIsLoadingRoute(false);
    setRouteInfo({
      distance: `${result.distance.toFixed(1)} km`,
      duration: `${Math.round(result.duration)} min`,
      estimatedCost: calculateEstimatedCost(result.distance, selectedRouteType),
      routeType: selectedRouteType,
    });
  };

  const handleRouteSelection = (routeType: RouteType) => {
    if (routeType === selectedRouteType) {
      return; // Don't recalculate if same route type is selected
    }
    
    setSelectedRouteType(routeType);
    setIsLoadingRoute(true);
    // Clear previous route info to trigger recalculation
    setRouteInfo(null);
    
    // Recalculate route info for the new route type
    setTimeout(() => {
      calculateRouteInfo(routeType);
    }, 1000);
  };

  // Add state to prevent rapid modal operations
  const [isModalOperating, setIsModalOperating] = useState(false);
  const modalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const handleOpenRouteModal = (routeType: RouteType) => {
    // Prevent rapid operations and check if modal is already visible
    if (isModalOperating || isModalVisible) return;
    
    console.log('Opening modal for route type:', routeType);
    
    setIsModalOperating(true);
    
    // Clear any existing timeout
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current);
    }
    
    // Set modal state immediately
    setModalRouteType(routeType);
    setIsModalVisible(true);
    
    // Reset the flag after modal is fully opened
    modalTimeoutRef.current = setTimeout(() => {
      setIsModalOperating(false);
    }, 1000); // Increased delay to ensure modal is fully opened
  };

  const handleCloseRouteModal = () => {
    // Prevent rapid operations and check if modal is already hidden
    if (isModalOperating || !isModalVisible) return;
    
    console.log('Closing modal');
    
    setIsModalOperating(true);
    
    // Clear any existing timeout
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current);
    }
    
    // Close modal immediately
    setIsModalVisible(false);
    
    // Reset state after modal is fully closed
    modalTimeoutRef.current = setTimeout(() => {
      setModalRouteType('recommended');
      setIsModalOperating(false);
    }, 500); // Delay to ensure modal is fully closed
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
      }
    };
  }, []);

  const handleRouteError = (error: any) => {
    setIsLoadingRoute(false);
    console.error('Directions error:', error);
    Alert.alert('Route Error', 'Unable to calculate route. Please check your connection and try again.');
  };

  const getRouteMode = (routeType: RouteType): 'DRIVING' | 'WALKING' | 'TRANSIT' => {
    return 'DRIVING'; // All routes use driving mode
  };

  const getRouteOptimization = (routeType: RouteType): boolean => {
    return routeType === 'shortest'; // Only optimize waypoints for shortest route
  };

  // Enhanced route parameters to create truly different routes
  const getRouteParameters = (routeType: RouteType) => {
    switch (routeType) {
      case 'shortest':
        return {
          optimize: true,
          avoid: 'tolls',
          region: 'LK',
          units: 'metric',
          alternatives: false,
        };
      case 'scenic':
        return {
          optimize: false,
          avoid: 'highways',
          region: 'LK',
          units: 'metric',
          alternatives: false,
        };
      case 'recommended':
      default:
        return {
          optimize: false,
          avoid: '',
          region: 'LK',
          units: 'metric',
          alternatives: false,
        };
    }
  };

  const getRouteAvoidances = (routeType: RouteType): string[] => {
    switch (routeType) {
      case 'shortest':
        return ['tolls']; // Avoid tolls for shortest route
      case 'scenic':
        return ['highways']; // Avoid highways for scenic route
      case 'recommended':
      default:
        return []; // No avoidances for recommended route
    }
  };

  const getRouteColor = (routeType: RouteType): string => {
    const option = ROUTE_OPTIONS.find(opt => opt.id === routeType);
    return option?.color || Colors.primary600;
  };

  // Helper function to create ordered waypoints from itinerary
  const createOrderedWaypoints = (allPlaces: Place[], itinerary: DayItinerary[]): { latitude: number; longitude: number }[] => {
    if (allPlaces.length <= 1) return [];
    
    const sortedPlaces: Place[] = [];
    
    // Sort places by day number and maintain order within each day
    itinerary
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .forEach(day => {
        sortedPlaces.push(...day.places);
      });
    
    // Return all but the last place (which becomes the destination)
    return sortedPlaces.slice(0, -1).map(place => place.coordinates);
  };

  // Helper function to get the final destination
  const getFinalDestination = (allPlaces: Place[], itinerary: DayItinerary[]): { latitude: number; longitude: number } | undefined => {
    if (allPlaces.length === 0) return undefined;
    
    // Get the last place from the last day
    const lastDay = Math.max(...itinerary.map(day => day.dayNumber));
    const lastDayItinerary = itinerary.find(day => day.dayNumber === lastDay);
    
    if (lastDayItinerary && lastDayItinerary.places.length > 0) {
      return lastDayItinerary.places[lastDayItinerary.places.length - 1].coordinates;
    }
    
    return allPlaces[allPlaces.length - 1].coordinates;
  };

  const calculateEstimatedCost = (distance: number, routeType: RouteType): string => {
    let baseCost = 20; // Base cost in USD
    let costPerKm = 0.5; // Cost per km
    
    switch (routeType) {
      case 'shortest':
        costPerKm = 0.4; // Cheaper due to shorter distance
        break;
      case 'scenic':
        costPerKm = 0.6; // More expensive due to scenic route
        baseCost = 30; // Higher base cost for scenic experience
        break;
      case 'recommended':
      default:
        costPerKm = 0.5; // Standard cost
        break;
    }
    
    return `$${Math.round(distance * costPerKm + baseCost)}`;
  };

  const handleProceedToBooking = () => {
    router.push({
      pathname: '/planning/booking',
      params: {
        destination,
        startPoint,
        startDate,
        endDate,
        itinerary: itineraryString,
        routeInfo: JSON.stringify(routeInfo),
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMarkerColor = (dayNumber: number) => {
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    return colors[(dayNumber - 1) % colors.length];
  };

  // Route Modal Component
  interface RouteModalProps {
    visible: boolean;
    onClose: () => void;
    routeType: RouteType;
    startLocation: { latitude: number; longitude: number } | null;
    allPlaces: Place[];
    itinerary: DayItinerary[];
    mapRegion: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    };
    calculateEstimatedCost: (distance: number, routeType: RouteType) => string;
  }

  const RouteModal: React.FC<RouteModalProps> = ({
    visible,
    onClose,
    routeType,
    startLocation,
    allPlaces,
    itinerary,
    mapRegion,
    calculateEstimatedCost,
  }) => {
    const [modalRouteInfo, setModalRouteInfo] = useState<RouteInfo | null>(null);
    const [isModalLoading, setIsModalLoading] = useState(false);

    const currentRoute = ROUTE_OPTIONS.find(option => option.id === routeType);

    const handleModalRouteReady = (result: any) => {
      setIsModalLoading(false);
      setModalRouteInfo({
        distance: `${result.distance.toFixed(1)} km`,
        duration: `${Math.round(result.duration)} min`,
        estimatedCost: calculateEstimatedCost(result.distance, routeType),
        routeType: routeType,
      });
    };

    const handleModalRouteError = (error: any) => {
      setIsModalLoading(false);
      console.error('Modal route error:', error);
      // Don't show alert for every error to avoid UI freezing
      // Alert.alert('Route Error', 'Unable to calculate route. Please try again.');
    };

    const getMarkerColor = (dayNumber: number) => {
      const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
      return colors[(dayNumber - 1) % colors.length];
    };

    // Enhanced route optimization based on route type
    const getRouteOptimization = (routeType: RouteType): boolean => {
      return routeType === 'shortest';
    };

    // Get route avoid parameters based on route type
    const getRouteAvoid = (routeType: RouteType): string => {
      switch (routeType) {
        case 'shortest':
          return 'tolls'; // Avoid tolls for shortest route
        case 'scenic':
          return 'highways'; // Avoid highways for scenic route
        case 'recommended':
        default:
          return ''; // No avoidances for recommended route
      }
    };

    // Get proper destination for the route
    const getDestination = (): { latitude: number; longitude: number } | undefined => {
      return getFinalDestination(allPlaces, itinerary);
    };

    // Get waypoints ordered by day and sequence
    const getOrderedWaypoints = (): { latitude: number; longitude: number }[] => {
      return createOrderedWaypoints(allPlaces, itinerary);
    };

    useEffect(() => {
      if (visible) {
        setIsModalLoading(true);
        setModalRouteInfo(null);
        // Small delay to ensure modal is fully rendered before starting route calculation
        const timer = setTimeout(() => {
          // Only start loading if modal is still visible
          if (visible) {
            setIsModalLoading(true);
          }
        }, 100);
        
        return () => clearTimeout(timer);
      } else {
        // Clear state when modal is hidden
        setIsModalLoading(false);
        setModalRouteInfo(null);
      }
    }, [visible, routeType]); // Added routeType as dependency

    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
        supportedOrientations={['portrait']}
        hardwareAccelerated={true}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor={currentRoute?.color} />
          
          {/* Modal Header */}
          <LinearGradient
            colors={[currentRoute?.color || Colors.primary600, `${currentRoute?.color || Colors.primary600}CC`]}
            style={styles.modalHeader}
          >
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.modalCloseButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.modalHeaderCenter}>
              <View style={styles.modalHeaderIcon}>
                <Ionicons name={currentRoute?.icon as any} size={24} color={Colors.white} />
              </View>
              <ThemedText style={styles.modalHeaderTitle}>{currentRoute?.name} Route</ThemedText>
              <ThemedText style={styles.modalHeaderSubtitle}>{currentRoute?.description}</ThemedText>
            </View>
          </LinearGradient>

          {/* Modal Content with background */}
          <View style={styles.modalContent}>
            {/* Route Statistics */}
            {isModalLoading ? (
              <View style={styles.modalLoadingContainer}>
                <View style={styles.modalLoadingSpinner}>
                  <Ionicons name="refresh" size={24} color={currentRoute?.color} />
                </View>
                <ThemedText style={styles.modalLoadingText}>
                  Calculating {routeType} route from {startLocation ? 'start point' : 'origin'} through {allPlaces.length} destinations...
                </ThemedText>
              </View>
            ) : modalRouteInfo ? (
              <View style={styles.modalRouteStats}>
                <View style={styles.modalStatCard}>
                  <Ionicons name="speedometer-outline" size={20} color={currentRoute?.color} />
                  <ThemedText style={styles.modalStatValue}>{modalRouteInfo.distance}</ThemedText>
                  <ThemedText style={styles.modalStatLabel}>Distance</ThemedText>
                </View>
                <View style={styles.modalStatCard}>
                  <Ionicons name="time-outline" size={20} color={currentRoute?.color} />
                  <ThemedText style={styles.modalStatValue}>{modalRouteInfo.duration}</ThemedText>
                  <ThemedText style={styles.modalStatLabel}>Duration</ThemedText>
                </View>
                <View style={styles.modalStatCard}>
                  <Ionicons name="wallet-outline" size={20} color={currentRoute?.color} />
                  <ThemedText style={styles.modalStatValue}>{modalRouteInfo.estimatedCost}</ThemedText>
                  <ThemedText style={styles.modalStatLabel}>Est. Cost</ThemedText>
                </View>
              </View>
            ) : null}

            {/* Full Screen Map */}
            <View style={styles.modalMapContainer}>
            <MapView
              style={styles.modalMap}
              provider={PROVIDER_GOOGLE}
              initialRegion={mapRegion}
              showsUserLocation={true}
              showsMyLocationButton={true}
              showsCompass={true}
              showsScale={true}
              zoomEnabled={true}
              scrollEnabled={true}
              pitchEnabled={true}
              rotateEnabled={true}
              showsTraffic={false}
              loadingEnabled={true}
              loadingIndicatorColor={currentRoute?.color}
              loadingBackgroundColor={Colors.secondary50}
            >
              {/* Start point marker */}
              {startLocation && (
                <Marker
                  coordinate={startLocation}
                  title="Start Point"
                  description="Your journey begins here"
                  pinColor={Colors.success}
                  identifier="start-point"
                />
              )}
              
              {/* All destination places markers ordered by day */}
              {itinerary
                .sort((a, b) => a.dayNumber - b.dayNumber)
                .map(day => 
                  day.places.map((place, index) => (
                    <Marker
                      key={place.id}
                      coordinate={place.coordinates}
                      title={place.name}
                      description={`Day ${day.dayNumber} • ${place.openingHours || 'Hours not available'}`}
                      pinColor={getMarkerColor(day.dayNumber)}
                      identifier={`place-${place.id}`}
                    />
                  ))
                )
                .flat()
              }

              {/* ENHANCED ROUTE DISPLAY with proper Google Maps Directions API implementation */}
              {GOOGLE_MAPS_API_KEY && startLocation && allPlaces.length > 0 && (
                <MapViewDirections
                  key={`modal-${routeType}-${Date.now()}`}
                  origin={startLocation}
                  destination={getDestination()}
                  waypoints={getOrderedWaypoints()}
                  apikey={GOOGLE_MAPS_API_KEY}
                  strokeWidth={8}
                  strokeColor={currentRoute?.color || Colors.primary600}
                  mode="DRIVING"
                  optimizeWaypoints={getRouteOptimization(routeType)}
                  language="en"
                  region="LK"
                  onReady={handleModalRouteReady}
                  onError={handleModalRouteError}
                  resetOnChange={true}
                  precision="high"
                  timePrecision="now"
                  splitWaypoints={false}
                />
              )}
            </MapView>
          </View>
          </View>

          {/* Bottom Action */}
          <View style={styles.modalBottomAction}>
            <CustomButton
              title="Select This Route"
              onPress={() => {
                // Update main screen route selection
                setSelectedRouteType(routeType);
                handleRouteSelection(routeType);
                onClose();
              }}
              style={[styles.modalSelectButton, { backgroundColor: currentRoute?.color }]}
            />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary600} />
      
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={[Colors.primary600, Colors.primary700]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <ThemedText style={styles.headerTitle}>Your Route</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Trip to {destination}</ThemedText>
          </View>
          <TouchableOpacity 
            onPress={() => Alert.alert('Share Route', 'Route sharing feature coming soon!')}
            style={styles.headerButton}
          >
            <Ionicons name="share-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Content Container */}
      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Trip Summary with Route Information */}
          <View style={styles.compactSummary}>
          <View style={styles.tripLocation}>
            <Ionicons name="location" size={18} color={Colors.primary600} />
            <ThemedText style={styles.tripLocationText}>
              {startPoint} → {allPlaces.length} destinations
            </ThemedText>
          </View>
          <View style={styles.tripStats}>
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={14} color={Colors.secondary500} />
              <ThemedText style={styles.statText}>{itinerary.length} days</ThemedText>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="map-outline" size={14} color={Colors.secondary500} />
              <ThemedText style={styles.statText}>{allPlaces.length} places</ThemedText>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="navigate-outline" size={14} color={Colors.secondary500} />
              <ThemedText style={styles.statText}>{selectedRouteType} route</ThemedText>
            </View>
          </View>
        </View>

        {/* Route Selection with Modern Cards */}
        <View style={styles.routeSelectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="options-outline" size={20} color={Colors.primary600} />
            <ThemedText style={styles.sectionTitle}>Choose Your Route</ThemedText>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.routeOptionsContainer}
          >
            {ROUTE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.routeOptionCard,
                  selectedRouteType === option.id && [styles.routeOptionSelected, { backgroundColor: option.color + '15' }]
                ]}
                onPress={() => {
                  handleRouteSelection(option.id);
                }}
              >
                <View style={[
                  styles.routeOptionIconContainer,
                  { backgroundColor: selectedRouteType === option.id ? option.color : Colors.secondary100 }
                ]}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={24} 
                    color={selectedRouteType === option.id ? Colors.white : option.color} 
                  />
                </View>
                <ThemedText style={[
                  styles.routeOptionName,
                  selectedRouteType === option.id && [styles.routeOptionNameSelected, { color: option.color }]
                ]}>
                  {option.name}
                </ThemedText>
                <ThemedText style={[
                  styles.routeOptionDescription,
                  selectedRouteType === option.id && { color: option.color + 'AA' }
                ]}>
                  {option.description}
                </ThemedText>
                <View style={styles.routeOptionAction}>
                  <TouchableOpacity
                    style={styles.routeOptionMapButton}
                    onPress={() => handleOpenRouteModal(option.id)}
                    disabled={isModalOperating}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name="map-outline" 
                      size={16} 
                      color={selectedRouteType === option.id ? option.color : Colors.secondary400} 
                    />
                    <ThemedText style={[
                      styles.routeOptionActionText,
                      selectedRouteType === option.id && { color: option.color }
                    ]}>
                      View on Map
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                {selectedRouteType === option.id && (
                  <View style={[styles.selectedIndicator, { backgroundColor: option.color }]}>
                    <Ionicons name="checkmark" size={16} color={Colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Route Statistics */}
        {isLoadingRoute ? (
          <View style={styles.routeStatsCard}>
            <View style={styles.loadingContainer}>
              <Animated.View style={[styles.loadingSpinner, { transform: [{ rotate: spin }] }]}>
                <Ionicons name="refresh" size={20} color={Colors.primary600} />
              </Animated.View>
              <ThemedText style={styles.loadingText}>Calculating best route...</ThemedText>
            </View>
          </View>
        ) : routeInfo ? (
          <View style={styles.routeStatsCard}>
            <View style={styles.routeStatsHeader}>
              <Ionicons name="analytics-outline" size={20} color={Colors.primary600} />
              <ThemedText style={styles.routeStatsTitle}>Route Statistics</ThemedText>
            </View>
            <View style={styles.routeStatsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: Colors.primary100 }]}>
                  <Ionicons name="speedometer-outline" size={20} color={Colors.primary600} />
                </View>
                <ThemedText style={styles.statValue}>{routeInfo.distance}</ThemedText>
                <ThemedText style={styles.statLabel}>Distance</ThemedText>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: Colors.success + '20' }]}>
                  <Ionicons name="time-outline" size={20} color={Colors.success} />
                </View>
                <ThemedText style={styles.statValue}>{routeInfo.duration}</ThemedText>
                <ThemedText style={styles.statLabel}>Duration</ThemedText>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: Colors.warning + '20' }]}>
                  <Ionicons name="wallet-outline" size={20} color={Colors.warning} />
                </View>
                <ThemedText style={styles.statValue}>{routeInfo.estimatedCost}</ThemedText>
                <ThemedText style={styles.statLabel}>Est. Cost</ThemedText>
              </View>
            </View>
          </View>
        ) : null}

        {/* Modern Itinerary Overview */}
        <View style={styles.itineraryContainer}>
          <View style={styles.itineraryHeader}>
            <View style={styles.itineraryHeaderLeft}>
              <Ionicons name="map-outline" size={20} color={Colors.primary600} />
              <ThemedText style={styles.itineraryTitle}>Trip Itinerary</ThemedText>
            </View>
            <View style={styles.itineraryHeaderRight}>
              <ThemedText style={styles.itineraryCount}>{itinerary.length} days</ThemedText>
            </View>
          </View>

          <ScrollView 
            style={styles.itineraryScrollView}
            contentContainerStyle={styles.itineraryScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {itinerary.map((day, dayIndex) => (
              <View key={day.date} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayNumberContainer}>
                    <View style={[styles.dayNumber, { backgroundColor: getMarkerColor(day.dayNumber) }]}>
                      <ThemedText style={styles.dayNumberText}>{day.dayNumber}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.dayInfo}>
                    <ThemedText style={styles.dayTitle}>Day {day.dayNumber}</ThemedText>
                    <ThemedText style={styles.dayDate}>{formatDate(day.date)}</ThemedText>
                  </View>
                  <View style={styles.dayStats}>
                    <View style={styles.placesCount}>
                      <Ionicons name="location-outline" size={14} color={Colors.secondary500} />
                      <ThemedText style={styles.placesCountText}>{day.places.length}</ThemedText>
                    </View>
                  </View>
                </View>

                <View style={styles.placesContainer}>
                  {day.places.map((place, placeIndex) => (
                    <View key={place.id} style={styles.placeItem}>
                      <View style={styles.placeItemLeft}>
                        <View style={styles.placeIcon}>
                          <Ionicons 
                            name={placeIndex === 0 ? "flag-outline" : 
                                  placeIndex === day.places.length - 1 ? "checkmark-circle-outline" : 
                                  "location-outline"} 
                            size={16} 
                            color={Colors.primary600} 
                          />
                        </View>
                        <View style={styles.placeDetails}>
                          <ThemedText style={styles.placeName}>{place.name}</ThemedText>
                          <ThemedText style={styles.placeAddress}>{place.address}</ThemedText>
                          {place.openingHours && (
                            <View style={styles.placeHours}>
                              <Ionicons name="time-outline" size={12} color={Colors.secondary400} />
                              <ThemedText style={styles.placeHoursText}>{place.openingHours}</ThemedText>
                            </View>
                          )}
                        </View>
                      </View>
                      {place.rating && (
                        <View style={styles.placeRating}>
                          <Ionicons name="star" size={12} color={Colors.warning} />
                          <ThemedText style={styles.placeRatingText}>{place.rating}</ThemedText>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Route Preview Card */}
        <View style={styles.routePreviewCard}>
          <View style={styles.routePreviewHeader}>
            <View style={styles.routePreviewTitle}>
              <Ionicons name="navigate-outline" size={20} color={Colors.primary600} />
              <ThemedText style={styles.routePreviewTitleText}>Route Preview</ThemedText>
            </View>
            <TouchableOpacity 
              style={styles.viewAllRoutesButton}
              onPress={() => handleOpenRouteModal(selectedRouteType)}
              disabled={isModalOperating}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.viewAllRoutesText}>View on Map</ThemedText>
              <Ionicons name="map-outline" size={16} color={Colors.primary600} />
            </TouchableOpacity>
          </View>

          <View style={styles.routePreviewContent}>
            <View style={styles.routePreviewRoute}>
              <View style={styles.routePreviewStart}>
                <View style={styles.routePreviewPoint}>
                  <Ionicons name="radio-button-on" size={12} color={Colors.success} />
                </View>
                <ThemedText style={styles.routePreviewLocationText}>{startPoint}</ThemedText>
              </View>
              
              <View style={styles.routePreviewLine}>
                <View style={styles.routePreviewDots}>
                  {Array(3).fill(0).map((_, index) => (
                    <View key={index} style={styles.routePreviewDot} />
                  ))}
                </View>
              </View>
              
              <View style={styles.routePreviewEnd}>
                <View style={styles.routePreviewPoint}>
                  <Ionicons name="location" size={12} color={Colors.error} />
                </View>
                <ThemedText style={styles.routePreviewLocationText}>
                  {allPlaces.length > 0 ? allPlaces[allPlaces.length - 1].name : 'Destination'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.routePreviewStats}>
              <View style={styles.routePreviewStat}>
                <Ionicons name="location-outline" size={14} color={Colors.primary600} />
                <ThemedText style={styles.routePreviewStatText}>{allPlaces.length} stops</ThemedText>
              </View>
              <View style={styles.routePreviewStat}>
                <Ionicons name="time-outline" size={14} color={Colors.primary600} />
                <ThemedText style={styles.routePreviewStatText}>{itinerary.length} days</ThemedText>
              </View>
              <View style={styles.routePreviewStat}>
                <Ionicons name="star-outline" size={14} color={Colors.primary600} />
                <ThemedText style={styles.routePreviewStatText}>{selectedRouteType} route</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <View style={styles.proceedInfo}>
            <View style={styles.proceedInfoIcon}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            </View>
            <View style={styles.proceedInfoContent}>
              <ThemedText style={styles.proceedInfoTitle}>Route Ready!</ThemedText>
              <ThemedText style={styles.proceedInfoText}>
                Your personalized itinerary is ready for booking
              </ThemedText>
            </View>
          </View>
          <CustomButton
            title="Proceed to Booking"
            onPress={handleProceedToBooking}
            style={styles.proceedButton}
          />
        </View>
        </Animated.View>
      </ScrollView>

      {/* Route Modal - For detailed route view */}
      {isModalVisible && !isModalOperating && (
        <RouteModal
          visible={isModalVisible}
          onClose={handleCloseRouteModal}
          routeType={modalRouteType}
          startLocation={startLocation}
          allPlaces={allPlaces}
          itinerary={itinerary}
          mapRegion={mapRegion}
          calculateEstimatedCost={calculateEstimatedCost}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  
  // Loading States
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary50,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  loadingSpinner: {
    marginRight: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.secondary500,
    fontWeight: '500',
  },
  
  // Enhanced Header Styles
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
  
  // Enhanced Route Summary Card
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
    marginBottom: 20,
  },
  tripLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },
  tripLocationText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary700,
    marginLeft: 8,
  },
  tripDetails: {
    flexDirection: 'row',
    gap: 24,
  },
  tripDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.secondary50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tripDetailText: {
    fontSize: 14,
    color: Colors.secondary500,
    fontWeight: '600',
  },
  
  // Enhanced Route Stats Card
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.secondary200,
    marginHorizontal: 16,
  },
  
  // Enhanced Route Selection Card
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    marginLeft: 8,
  },
  routeOptionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
  },
  routeOptionCard: {
    width: 180,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.secondary200,
    alignItems: 'center',
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 8,
  },
  routeOptionSelected: {
    borderColor: Colors.primary600,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  routeOptionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  routeOptionName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
    textAlign: 'center',
    marginBottom: 6,
  },
  routeOptionNameSelected: {
    color: Colors.primary600,
  },
  routeOptionDescription: {
    fontSize: 12,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 8,
  },
  routeOptionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
  },
  routeOptionMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.secondary100,
  },
  routeOptionActionText: {
    fontSize: 12,
    color: Colors.secondary400,
    fontWeight: '500',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Enhanced Map Container - Much Larger
  mapContainer: {
    height: height * 0.65, // Increased from 0.45 to 0.65 for much larger map
    backgroundColor: Colors.secondary200,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.secondary100,
  },
  map: {
    flex: 1,
  },
  
  // Enhanced Itinerary Overview
  itineraryOverview: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 10,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    marginLeft: 8,
  },
  dayOverview: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 16,
    padding: 20,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.secondary100,
  },
  dayOverviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  dayOverviewInfo: {
    flex: 1,
  },
  dayOverviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  dayOverviewDate: {
    fontSize: 14,
    color: Colors.secondary500,
    marginTop: 2,
  },
  dayOverviewCount: {
    fontSize: 12,
    color: Colors.primary600,
    backgroundColor: Colors.primary100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontWeight: '500',
  },
  placeOverview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingLeft: 28,
    borderLeftWidth: 2,
    borderLeftColor: Colors.secondary200,
    marginLeft: 8,
    backgroundColor: Colors.secondary50,
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
  },
  placeNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary600,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  placeNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  placeOverviewInfo: {
    flex: 1,
    paddingTop: 2,
  },
  placeOverviewName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  placeOverviewHours: {
    fontSize: 13,
    color: Colors.secondary500,
    marginTop: 2,
  },
  
  // Empty Day Placeholder
  emptyDayPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: Colors.secondary50,
    borderRadius: 12,
    marginLeft: 28,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    borderStyle: 'dashed',
  },
  emptyDayText: {
    fontSize: 14,
    color: Colors.secondary400,
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Enhanced Bottom Actions
  bottomActions: {
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
  },
  proceedInfoIcon: {
    marginRight: 12,
  },
  proceedInfoContent: {
    flex: 1,
  },
  proceedInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
    marginBottom: 2,
  },
  proceedInfoText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '500',
  },
  proceedButton: {
    backgroundColor: Colors.primary600,
    borderRadius: 20,
    paddingVertical: 18,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.primary500,
  },
  
  // Main Content Container
  mainContent: {
    flex: 1,
  },
  
  // Animation Container
  animatedContainer: {
    paddingBottom: 20,
  },
  
  // Compact Summary
  compactSummary: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.secondary500,
    fontWeight: '500',
  },
  
  // Route Selection Container
  routeSelectionCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  
  // Route Statistics
  routeStatsCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  routeStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeStatsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    marginLeft: 8,
  },
  routeStatsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  routeStats: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    gap: 16,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  modalHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 20, // Increased padding for safe area
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 24) + 10, // Positioned in safe touchable area
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalHeaderCenter: {
    alignItems: 'center',
    marginTop: 10,
  },
  modalHeaderIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
  modalHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  modalLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalLoadingSpinner: {
    marginRight: 12,
  },
  modalLoadingText: {
    fontSize: 16,
    color: Colors.secondary700,
    fontWeight: '500',
  },
  modalRouteStats: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 20,
  },
  modalStatCard: {
    flex: 1,
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary700,
    marginTop: 8,
  },
  modalStatLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: 4,
  },
  modalMapContainer: {
    flex: 1,
    backgroundColor: Colors.secondary200,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.secondary100,
  },
  modalMap: {
    flex: 1,
  },
  modalBottomAction: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary100,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalSelectButton: {
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Modern Itinerary Styles
  itineraryContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  itineraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
    backgroundColor: Colors.secondary50,
  },
  itineraryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itineraryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    marginLeft: 8,
  },
  itineraryHeaderRight: {
    backgroundColor: Colors.primary100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  itineraryCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary600,
  },
  itineraryScrollView: {
    flex: 1,
  },
  itineraryScrollContent: {
    paddingBottom: 20,
  },
  
  // Day Card Styles
  dayCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.secondary100,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.secondary50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },
  dayNumberContainer: {
    marginRight: 12,
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  dayInfo: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  dayDate: {
    fontSize: 14,
    color: Colors.secondary500,
    marginTop: 2,
  },
  dayStats: {
    alignItems: 'flex-end',
  },
  placesCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },
  placesCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary600,
    marginLeft: 4,
  },
  
  // Places Container Styles
  placesContainer: {
    padding: 16,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },
  placeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  placeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeDetails: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  placeAddress: {
    fontSize: 14,
    color: Colors.secondary500,
    marginTop: 2,
  },
  placeHours: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  placeHoursText: {
    fontSize: 12,
    color: Colors.secondary400,
    marginLeft: 4,
  },
  placeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  placeRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning,
    marginLeft: 4,
  },
  
  // Route Preview Card Styles
  routePreviewCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  routePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
    backgroundColor: Colors.secondary50,
  },
  routePreviewTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routePreviewTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    marginLeft: 8,
  },
  viewAllRoutesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  viewAllRoutesText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary600,
    marginRight: 6,
  },
  routePreviewContent: {
    padding: 20,
  },
  routePreviewRoute: {
    marginBottom: 16,
  },
  routePreviewStart: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routePreviewEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  routePreviewPoint: {
    marginRight: 12,
  },
  routePreviewLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  routePreviewLine: {
    paddingLeft: 6,
    paddingVertical: 4,
  },
  routePreviewDots: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  routePreviewDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.secondary400,
  },
  routePreviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.secondary50,
    padding: 16,
    borderRadius: 12,
  },
  routePreviewStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routePreviewStatText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary600,
    marginLeft: 6,
  },
});
