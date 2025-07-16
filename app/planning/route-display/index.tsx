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
    benefits: ['Optimized for tourism', 'Popular attractions', 'Good road conditions'],
  },
  {
    id: 'shortest',
    name: 'Shortest',
    description: 'Fastest route avoiding tolls',
    icon: 'flash',
    color: '#10b981',
    benefits: ['Fastest route', 'Fuel efficient', 'Direct path'],
  },
  {
    id: 'scenic',
    name: 'Scenic',
    description: 'Most beautiful route avoiding highways',
    icon: 'camera',
    color: '#f59e0b',
    benefits: ['Beautiful views', 'Cultural sites', 'Local experiences'],
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
    const initializeData = async () => {
      console.log('Initializing route display with params:', { destination, startPoint, startDate, endDate });

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
    console.log('Route selected:', routeType);
    
    // Set the modal route type and show modal
    setModalRouteType(routeType);
    setIsModalVisible(true);
    
    // Also update the main screen selection
    setSelectedRouteType(routeType);
    const info = calculateRouteInfo(routeType);
    setRouteInfo(info);
  };

  // Handle route confirmation
  const handleRouteConfirm = () => {
    setSelectedRouteType(modalRouteType);
    setIsModalVisible(false);
    Alert.alert(
      'Route Selected',
      `You have selected the ${modalRouteType} route. You can now proceed to book services for your trip.`,
      [
        { 
          text: 'Book Services', 
          onPress: () => {
            router.push('/planning/booking');
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Get route parameters for directions
  const getRouteParameters = (routeType: RouteType) => {
    const params: any = {
      optimizeWaypoints: false,
      precision: 'high' as const,
    };

    switch (routeType) {
      case 'shortest':
        params.avoid = ['tolls'] as const;
        params.mode = 'DRIVING' as const;
        break;
      case 'scenic':
        params.avoid = ['highways'] as const;
        params.mode = 'DRIVING' as const;
        break;
      case 'recommended':
      default:
        params.mode = 'DRIVING' as const;
        break;
    }

    return params;
  };

  // Route Modal Component
  const RouteModal = () => {
    const routeOption = ROUTE_OPTIONS.find(option => option.id === modalRouteType);
    const currentRouteInfo = calculateRouteInfo(modalRouteType);
    
    return (
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Fixed Header */}
          <View style={styles.modalFixedHeader}>
            <View style={styles.modalHeaderTop}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => setIsModalVisible(false)}
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

              {/* Remove the separate destination marker since it's now handled in the places loop */}

              {/* Route Directions */}
              {startLocation && allPlaces.length > 0 && GOOGLE_DIRECTIONS_API_KEY && (
                <MapViewDirections
                  origin={startLocation}
                  destination={allPlaces[allPlaces.length - 1].coordinates}
                  waypoints={allPlaces.slice(0, -1).map(place => place.coordinates)}
                  apikey={GOOGLE_DIRECTIONS_API_KEY}
                  strokeWidth={6}
                  strokeColor={routeOption?.color || Colors.primary600}
                  strokeColors={[routeOption?.color || Colors.primary600]}
                  lineCap="round"
                  lineJoin="round"
                  {...getRouteParameters(modalRouteType) as any}
                  onReady={(result) => {
                    console.log(`Route ready - Distance: ${result.distance} km, Duration: ${result.duration} min`);
                    // Auto-fit map to show entire route
                    // mapRef.current?.fitToCoordinates(result.coordinates, {
                    //   edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                    //   animated: true,
                    // });
                  }}
                  onError={(errorMessage) => {
                    console.error('Directions API error:', errorMessage);
                  }}
                />
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

  // Helper function to decode polyline
  const decodePolyline = (polyline: string): { latitude: number; longitude: number }[] => {
    const points: { latitude: number; longitude: number }[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < polyline.length) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
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

  // Generate routes function
  const generateRoutes = async (places: Place[] = allPlaces) => {
    if (!startLocation || places.length === 0) {
      console.warn('Cannot generate routes: missing start location or places');
      return;
    }

    setIsGeneratingRoutes(true);
    setRoutesGenerated(false);
    setGeneratedRoutes([]);
    setSelectedRoute(null);

    try {
      console.log('🚀 Generating multiple route options using Google Directions API...');
      
      if (!GOOGLE_DIRECTIONS_API_KEY) {
        console.warn('⚠️ API key missing, using fallback route generation');
        // Fallback to basic route generation
        const routeTypes: RouteType[] = ['recommended', 'shortest', 'scenic'];
        const mockRoutes: GeneratedRoute[] = routeTypes.map(routeType => {
          const allWaypoints = places.map(p => p.coordinates);
          const totalDistance = allWaypoints.reduce((total, point, index) => {
            if (index === 0) return calculateDistance(startLocation, point);
            return total + calculateDistance(allWaypoints[index - 1], point);
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
            coordinates: [startLocation, ...allWaypoints],
            polyline: 'handled_by_mapviewdirections',
            instructions: [`Route from ${startPoint} through ${places.length} places`],
            bounds: {
              northeast: {
                latitude: Math.max(startLocation.latitude, ...allWaypoints.map(p => p.latitude)),
                longitude: Math.max(startLocation.longitude, ...allWaypoints.map(p => p.longitude)),
              },
              southwest: {
                latitude: Math.min(startLocation.latitude, ...allWaypoints.map(p => p.latitude)),
                longitude: Math.min(startLocation.longitude, ...allWaypoints.map(p => p.longitude)),
              },
            },
            highlights: getRouteHighlights(routeType),
          };
        });
        
        setGeneratedRoutes(mockRoutes);
        setSelectedRoute(mockRoutes[0]);
        setRoutesGenerated(true);
        setShowRouteComparison(true);
        return;
      }

      // Generate different route types using Google Directions API
      const routes: GeneratedRoute[] = [];
      const destination = places[places.length - 1].coordinates;
      const waypoints = places.slice(0, -1).map(p => p.coordinates);
      
      // Build waypoints string for API calls
      const waypointsStr = waypoints.length > 0 
        ? waypoints.map(w => `${w.latitude},${w.longitude}`).join('|')
        : '';
      
      // Route 1: Recommended (default balanced route)
      const recommendedUrl = `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${startLocation.latitude},${startLocation.longitude}&` +
        `destination=${destination.latitude},${destination.longitude}&` +
        `${waypointsStr ? `waypoints=${waypointsStr}&` : ''}` +
        `mode=driving&` +
        `alternatives=true&` +
        `key=${GOOGLE_DIRECTIONS_API_KEY}`;
      
      console.log('📍 Fetching recommended route...');
      const recommendedResponse = await fetch(recommendedUrl);
      const recommendedData = await recommendedResponse.json();
      
      if (recommendedData.status === 'OK' && recommendedData.routes.length > 0) {
        const route = recommendedData.routes[0];
        const coordinates = decodePolyline(route.overview_polyline.points);
        
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
          highlights: getRouteHighlights('recommended'),
        });
      }
      
      // Route 2: Shortest (optimized for distance, avoid tolls)
      const shortestUrl = `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${startLocation.latitude},${startLocation.longitude}&` +
        `destination=${destination.latitude},${destination.longitude}&` +
        `${waypointsStr ? `waypoints=optimize:true|${waypointsStr}&` : ''}` +
        `mode=driving&` +
        `avoid=tolls&` +
        `alternatives=true&` +
        `key=${GOOGLE_DIRECTIONS_API_KEY}`;
      
      console.log('📍 Fetching shortest route...');
      const shortestResponse = await fetch(shortestUrl);
      const shortestData = await shortestResponse.json();
      
      if (shortestData.status === 'OK' && shortestData.routes.length > 0) {
        const route = shortestData.routes[0];
        const coordinates = decodePolyline(route.overview_polyline.points);
        
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
          highlights: getRouteHighlights('shortest'),
        });
      }
      
      // Route 3: Scenic (avoid highways for scenic local roads)
      const scenicUrl = `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${startLocation.latitude},${startLocation.longitude}&` +
        `destination=${destination.latitude},${destination.longitude}&` +
        `${waypointsStr ? `waypoints=${waypointsStr}&` : ''}` +
        `mode=driving&` +
        `avoid=highways,ferries&` +
        `alternatives=true&` +
        `key=${GOOGLE_DIRECTIONS_API_KEY}`;
      
      console.log('📍 Fetching scenic route...');
      const scenicResponse = await fetch(scenicUrl);
      const scenicData = await scenicResponse.json();
      
      if (scenicData.status === 'OK' && scenicData.routes.length > 0) {
        const route = scenicData.routes[0];
        const coordinates = decodePolyline(route.overview_polyline.points);
        
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
          highlights: getRouteHighlights('scenic'),
        });
      }

      if (routes.length === 0) {
        throw new Error('No routes found');
      }

      console.log(`✅ Generated ${routes.length} distinct routes from Google Directions API`);
      
      setGeneratedRoutes(routes);
      setSelectedRoute(routes[0]);
      setRoutesGenerated(true);
      setShowRouteComparison(true);
    } catch (error) {
      console.error('Error generating routes:', error);
      Alert.alert('Route Generation Error', 'Failed to generate routes. Please check your internet connection and try again.');
    } finally {
      setIsGeneratingRoutes(false);
    }
  };

  // Handle route selection from comparison view
  const handleRouteSelectFromComparison = (route: GeneratedRoute) => {
    console.log(`🔄 Switching to ${route.type} route`);
    setSelectedRoute(route);
    setSelectedRouteType(route.type);
    
    // Update map region to show the selected route
    if (route.bounds) {
      const { northeast, southwest } = route.bounds;
      setMapRegion({
        latitude: (northeast.latitude + southwest.latitude) / 2,
        longitude: (northeast.longitude + southwest.longitude) / 2,
        latitudeDelta: Math.abs(northeast.latitude - southwest.latitude) * 1.2,
        longitudeDelta: Math.abs(northeast.longitude - southwest.longitude) * 1.2,
      });
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
              Choose how you'd like to travel between destinations
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
                    handleRouteSelect(option.id);
                  }}
                >
                  <View style={[styles.horizontalRouteIcon, { backgroundColor: option.color + '20' }]}>
                    <Ionicons 
                      name={option.icon as any} 
                      size={24} 
                      color={option.color} 
                    />
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
                  
                  {selectedRouteType === option.id && (
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
            router.push('/planning/booking');
          }}
          rightIcon={<Ionicons name="arrow-forward" size={20} color={Colors.white} />}
        />
      </View>

      <RouteModal />
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
