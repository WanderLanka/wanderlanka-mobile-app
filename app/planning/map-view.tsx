import {
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import React, { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '../../components';
import { myTripsApi } from '../../utils/itineraryApi';

const GOOGLE_DIRECTIONS_API_KEY = 'AIzaSyDEi9t8bE0Jq1sMlkLpwIL7MrHH02XxVrM';

interface Place {
  id: string;
  name: string;
  address?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export default function MapViewScreen() {
  const { itineraryId, routeId } = useLocalSearchParams();
  const [trip, setTrip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [places, setPlaces] = useState<Place[]>([]);
  const [startLocation, setStartLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeDirections, setRouteDirections] = useState<any>(null);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [selectedRouteType, setSelectedRouteType] = useState<string>('recommended');
  const [mapRegion, setMapRegion] = useState({
    latitude: 7.8731,
    longitude: 80.7718,
    latitudeDelta: 2.0,
    longitudeDelta: 2.0,
  });

  const mapRef = useRef<MapView>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Start spinning animation for loading
  useEffect(() => {
    let spinAnimation: Animated.CompositeAnimation | undefined;
    
    if (isLoadingDirections) {
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
  }, [isLoadingDirections]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    fetchTripData();
  }, [itineraryId]);

  const fetchTripData = async () => {
    try {
      setIsLoading(true);
      const response = await myTripsApi.getTripDetails(itineraryId as string);
      
      if (response.success && response.data) {
        const tripData = response.data;
        setTrip(tripData);

        // Extract start location
        let startLoc = null;
        if (tripData.startLocation) {
          startLoc = {
            latitude: tripData.startLocation.latitude,
            longitude: tripData.startLocation.longitude,
          };
          setStartLocation(startLoc);
        }

        // Extract all places from day plans
        const allPlaces: Place[] = [];
        if (tripData.dayPlans && tripData.dayPlans.length > 0) {
          tripData.dayPlans.forEach((day: any) => {
            if (day.places && day.places.length > 0) {
              day.places.forEach((place: any) => {
                allPlaces.push({
                  id: place.placeId || place._id,
                  name: place.name,
                  address: place.address || '',
                  coordinates: {
                    latitude: place.location.latitude,
                    longitude: place.location.longitude,
                  },
                });
              });
            }
          });
        }
        setPlaces(allPlaces);

        // Set initial map region to first place
        if (allPlaces.length > 0) {
          setMapRegion({
            latitude: allPlaces[0].coordinates.latitude,
            longitude: allPlaces[0].coordinates.longitude,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          });
        }

        // Fetch the pre-calculated route from database based on selectedRoute
        await fetchRouteFromDatabase(tripData);
      }
    } catch (error) {
      console.error('Error fetching trip data:', error);
      Alert.alert('Error', 'Failed to load trip data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRouteFromDatabase = async (tripData: any) => {
    if (!tripData) {
      console.warn('No trip data provided');
      return;
    }

    setIsLoadingDirections(true);

    try {
      // Default to "recommended" if selectedRoute is not set
      const routeType = tripData.selectedRoute || 'recommended';
      setSelectedRouteType(routeType);
      console.log(`🗺️  Fetching ${routeType} route from database...`);
      
      // Import routeApi
      const { routeApi } = require('../../utils/itineraryApi');
      
      // Fetch routes for this itinerary
      const response = await routeApi.getItineraryRoutes(tripData._id);
      
      if (response.success && response.data) {
        const routeData = response.data[routeType];
        
        if (!routeData) {
          console.warn(`No ${routeType} route found in database`);
          Alert.alert(
            'Route Not Available', 
            `The ${routeType} route hasn't been calculated yet. Routes are calculated automatically when you create an itinerary. Please go back and refresh the trip.`,
            [{ text: 'OK', onPress: () => router.back() }]
          );
          return;
        }

        console.log(`✅ Loaded ${routeType} route:`, routeData.totalDistance, 'meters');
        console.log('📍 Route has waypoints:', routeData.waypoints?.length);
        console.log('📍 Route overview polyline:', routeData.overview?.polyline?.substring(0, 50) + '...');
        
        // Calculate bounds from waypoints
        const lats = routeData.waypoints.map((wp: any) => wp.location.latitude);
        const lngs = routeData.waypoints.map((wp: any) => wp.location.longitude);
        
        const bounds = {
          northeast: {
            lat: Math.max(...lats),
            lng: Math.max(...lngs),
          },
          southwest: {
            lat: Math.min(...lats),
            lng: Math.min(...lngs),
          },
        };
        
        const directionsData = {
          route: routeData,
          distance: `${Math.round(routeData.totalDistance / 1000)} km`,
          duration: `${Math.floor(routeData.totalDuration / 3600)}h ${Math.floor((routeData.totalDuration % 3600) / 60)}m`,
          polyline: routeData.overview.polyline,
          bounds: bounds,
          segments: routeData.segments,
          routeType: routeType,
        };
        
        console.log('🎯 Setting route directions:', {
          distance: directionsData.distance,
          duration: directionsData.duration,
          routeType: directionsData.routeType,
          hasPolyline: !!directionsData.polyline,
          polylineLength: directionsData.polyline?.length,
        });
        
        setRouteDirections(directionsData);
        
        // Auto-fit map to show route
        if (mapRef.current && bounds) {
          const { northeast, southwest } = bounds;
          mapRef.current.animateToRegion({
            latitude: (northeast.lat + southwest.lat) / 2,
            longitude: (northeast.lng + southwest.lng) / 2,
            latitudeDelta: Math.abs(northeast.lat - southwest.lat) * 1.3,
            longitudeDelta: Math.abs(northeast.lng - southwest.lng) * 1.3,
          }, 1000);
        }
      } else {
        console.error('Failed to fetch route from database');
        Alert.alert('Route Error', 'Failed to load route from database');
      }
    } catch (error) {
      console.error('Error fetching route from database:', error);
      Alert.alert('Error', 'Failed to load route. Please check your connection.');
    } finally {
      setIsLoadingDirections(false);
    }
  };

  // Decode Google polyline
  const decodeGooglePolyline = (polyline: string): { latitude: number; longitude: number }[] => {
    if (!polyline || polyline.length === 0) {
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

        const decodedLat = lat / 1e5;
        const decodedLng = lng / 1e5;

        if (decodedLat >= 5.0 && decodedLat <= 10.0 && decodedLng >= 79.0 && decodedLng <= 82.0) {
          points.push({
            latitude: decodedLat,
            longitude: decodedLng,
          });
        }
      }
      
      return points;
    } catch (error) {
      console.error('Error decoding polyline:', error);
      return [];
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary600} />
          <ThemedText style={styles.loadingText}>Loading map...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <ThemedText style={styles.headerTitle}>
            {trip?.tripName || 'Trip Map'}
          </ThemedText>
          {routeDirections && (
            <>
              <View style={styles.headerStats}>
                <View style={styles.headerStat}>
                  <Ionicons name="speedometer" size={14} color={Colors.white} />
                  <ThemedText style={styles.headerStatText}>
                    {routeDirections.distance}
                  </ThemedText>
                </View>
                <View style={styles.headerStat}>
                  <Ionicons name="time" size={14} color={Colors.white} />
                  <ThemedText style={styles.headerStatText}>
                    {routeDirections.duration}
                  </ThemedText>
                </View>
              </View>
              {routeDirections.routeType && (
                <View style={styles.routeTypeBadge}>
                  <Ionicons 
                    name={
                      routeDirections.routeType === 'shortest' ? 'flash' :
                      routeDirections.routeType === 'recommended' ? 'star' : 'leaf'
                    } 
                    size={12} 
                    color={Colors.white} 
                  />
                  <ThemedText style={styles.routeTypeText}>
                    {routeDirections.routeType.charAt(0).toUpperCase() + routeDirections.routeType.slice(1)} Route
                  </ThemedText>
                </View>
              )}
            </>
          )}
        </View>

        {isLoadingDirections && (
          <Animated.View style={[styles.loadingIcon, { transform: [{ rotate: spin }] }]}>
            <Ionicons name="reload" size={24} color={Colors.white} />
          </Animated.View>
        )}
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={mapRegion}
        showsUserLocation
        showsMyLocationButton
        mapType="standard"
        showsCompass
        showsScale
        showsBuildings
        showsTraffic={false}
        rotateEnabled
        scrollEnabled
        zoomEnabled
        pitchEnabled
        loadingEnabled
        loadingIndicatorColor={Colors.primary600}
        loadingBackgroundColor={Colors.white}
      >
        {/* Start Location Marker */}
        {startLocation && (
          <Marker
            coordinate={startLocation}
            title="Start Point"
            description={trip?.startLocation?.name}
            pinColor={Colors.success}
          >
            <View style={styles.customMarkerStart}>
              <Ionicons name="play" size={16} color={Colors.white} />
            </View>
          </Marker>
        )}
        
        {/* Places Markers */}
        {places.map((place, index) => (
          <Marker
            key={place.id}
            coordinate={place.coordinates}
            title={index === places.length - 1 ? "Destination" : place.name}
            description={place.address}
          >
            {index === places.length - 1 ? (
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

        {/* Route Polyline */}
        {routeDirections?.polyline && (
          <Polyline
            coordinates={decodeGooglePolyline(routeDirections.polyline)}
            strokeWidth={6}
            strokeColor={Colors.primary600}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      {/* Bottom Info Card */}
      {trip && (
        <View style={styles.bottomCard}>
          <View style={styles.bottomCardHeader}>
            <View>
              <ThemedText style={styles.bottomCardTitle}>{trip.tripName}</ThemedText>
              <ThemedText style={styles.bottomCardSubtitle}>
                {trip.startLocation?.name} → {trip.endLocation?.name}
              </ThemedText>
            </View>
            {trip.selectedRoute && (
              <View style={styles.routeBadge}>
                <Ionicons name="navigate-circle" size={16} color={Colors.primary600} />
                <ThemedText style={styles.routeBadgeText}>
                  {trip.selectedRoute.routeName || 'Route'}
                </ThemedText>
              </View>
            )}
          </View>
          
          <View style={styles.bottomCardStats}>
            <View style={styles.bottomStat}>
              <Ionicons name="location" size={18} color={Colors.secondary500} />
              <ThemedText style={styles.bottomStatText}>
                {places.length} places
              </ThemedText>
            </View>
            <View style={styles.bottomStat}>
              <Ionicons name="calendar" size={18} color={Colors.secondary500} />
              <ThemedText style={styles.bottomStatText}>
                {trip.tripDuration || trip.dayPlansCount || 0} days
              </ThemedText>
            </View>
            {trip.selectedRoute && (
              <View style={styles.bottomStat}>
                <Ionicons name="cash" size={18} color={Colors.secondary500} />
                <ThemedText style={styles.bottomStatText}>
                  LKR {trip.selectedRoute.estimatedCost || 0}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary600,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondary50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.secondary600,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primary600,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  headerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerStatText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  loadingIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  customMarkerStart: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  customMarkerDestination: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  customMarkerPlace: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary600,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerPlaceNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bottomCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  bottomCardSubtitle: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  routeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  routeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary600,
  },
  routeTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  routeTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  bottomCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary100,
  },
  bottomStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bottomStatText: {
    fontSize: 13,
    color: Colors.secondary600,
    fontWeight: '500',
  },
});
