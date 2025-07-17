import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { CustomButton, ThemedText } from '../../../components';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { Colors } from '../../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import MapViewDirections from 'react-native-maps-directions';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

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

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 
                           process.env.GOOGLE_MAPS_API_KEY || 
                           process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

export default function RouteDisplayScreen() {
  const params = useLocalSearchParams();
  const { destination, startPoint, startDate, endDate, itinerary: itineraryString } = params;
  
  const [itinerary, setItinerary] = useState<DayItinerary[]>([]);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    estimatedCost: string;
  } | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 7.8731,
    longitude: 80.7718,
    latitudeDelta: 2.0,
    longitudeDelta: 2.0,
  });

  useEffect(() => {
    if (itineraryString) {
      try {
        const parsedItinerary: DayItinerary[] = JSON.parse(itineraryString as string);
        setItinerary(parsedItinerary);
        
        // Extract all places from all days
        const places = parsedItinerary.flatMap(day => day.places);
        setAllPlaces(places);
        
        // Calculate map region to show all places
        if (places.length > 0) {
          const latitudes = places.map(place => place.coordinates.latitude);
          const longitudes = places.map(place => place.coordinates.longitude);
          
          const minLat = Math.min(...latitudes);
          const maxLat = Math.max(...latitudes);
          const minLng = Math.min(...longitudes);
          const maxLng = Math.max(...longitudes);
          
          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          const deltaLat = (maxLat - minLat) * 1.5;
          const deltaLng = (maxLng - minLng) * 1.5;
          
          setMapRegion({
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: Math.max(deltaLat, 0.1),
            longitudeDelta: Math.max(deltaLng, 0.1),
          });
        }
      } catch (error) {
        console.error('Error parsing itinerary:', error);
        Alert.alert('Error', 'Failed to load itinerary data');
      }
    }
  }, [itineraryString]);

  const handleRouteReady = (result: any) => {
    setRouteInfo({
      distance: `${result.distance.toFixed(1)} km`,
      duration: `${Math.round(result.duration)} min`,
      estimatedCost: `$${Math.round(result.distance * 0.5 + 20)}`, // Simple cost calculation
    });
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.secondary700} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Your Route</ThemedText>
        <TouchableOpacity onPress={() => {
          Alert.alert('Share Route', 'Route sharing feature coming soon!');
        }}>
          <Ionicons name="share-outline" size={24} color={Colors.secondary700} />
        </TouchableOpacity>
      </View>

      <View style={styles.routeSummary}>
        <ThemedText style={styles.routeTitle}>{destination}</ThemedText>
        <ThemedText style={styles.routeSubtitle}>
          {itinerary.length} days • {allPlaces.length} places
        </ThemedText>
        {routeInfo && (
          <View style={styles.routeStats}>
            <View style={styles.statItem}>
              <Ionicons name="location-outline" size={16} color={Colors.primary600} />
              <ThemedText style={styles.statText}>{routeInfo.distance}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color={Colors.primary600} />
              <ThemedText style={styles.statText}>{routeInfo.duration}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="card-outline" size={16} color={Colors.primary600} />
              <ThemedText style={styles.statText}>{routeInfo.estimatedCost}</ThemedText>
            </View>
          </View>
        )}
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
        >
          {/* Show all places as markers */}
          {allPlaces.map((place, index) => {
            const dayNumber = itinerary.find(day => 
              day.places.some(p => p.id === place.id)
            )?.dayNumber || 1;
            
            return (
              <Marker
                key={place.id}
                coordinate={place.coordinates}
                title={place.name}
                description={`Day ${dayNumber} • ${place.openingHours}`}
                pinColor={getMarkerColor(dayNumber)}
              />
            );
          })}

          {/* Show route directions between places */}
          {GOOGLE_MAPS_API_KEY && allPlaces.length > 1 && (
            <MapViewDirections
              origin={allPlaces[0].coordinates}
              destination={allPlaces[allPlaces.length - 1].coordinates}
              waypoints={allPlaces.slice(1, -1).map(place => place.coordinates)}
              apikey={GOOGLE_MAPS_API_KEY}
              strokeWidth={4}
              strokeColor={Colors.primary600}
              mode="DRIVING"
              optimizeWaypoints={true}
              onReady={handleRouteReady}
              onError={(error) => {
                console.error('Directions error:', error);
                Alert.alert('Route Error', 'Failed to calculate route. Please check your internet connection.');
              }}
            />
          )}
        </MapView>
      </View>

      <ScrollView style={styles.itineraryOverview} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.overviewTitle}>Itinerary Overview</ThemedText>
        
        {itinerary.map((day, index) => (
          <View key={day.date} style={styles.dayOverview}>
            <View style={styles.dayOverviewHeader}>
              <View style={[styles.dayColorIndicator, { backgroundColor: getMarkerColor(day.dayNumber) }]} />
              <View style={styles.dayOverviewInfo}>
                <ThemedText style={styles.dayOverviewTitle}>Day {day.dayNumber}</ThemedText>
                <ThemedText style={styles.dayOverviewDate}>{formatDate(day.date)}</ThemedText>
              </View>
              <ThemedText style={styles.dayOverviewCount}>
                {day.places.length} places
              </ThemedText>
            </View>
            
            {day.places.map((place, placeIndex) => (
              <View key={place.id} style={styles.placeOverview}>
                <View style={styles.placeNumber}>
                  <ThemedText style={styles.placeNumberText}>{placeIndex + 1}</ThemedText>
                </View>
                <View style={styles.placeOverviewInfo}>
                  <ThemedText style={styles.placeOverviewName}>{place.name}</ThemedText>
                  <ThemedText style={styles.placeOverviewHours}>{place.openingHours}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomActions}>
        <CustomButton
          title="Proceed to Booking"
          onPress={handleProceedToBooking}
          style={styles.proceedButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  routeSummary: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  routeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  routeSubtitle: {
    fontSize: 14,
    color: Colors.secondary500,
    marginBottom: 12,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary700,
  },
  mapContainer: {
    height: height * 0.4,
    backgroundColor: Colors.secondary200,
  },
  map: {
    flex: 1,
  },
  itineraryOverview: {
    flex: 1,
    paddingHorizontal: 20,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    marginVertical: 16,
  },
  dayOverview: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayOverviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  dayOverviewInfo: {
    flex: 1,
  },
  dayOverviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  dayOverviewDate: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: 2,
  },
  dayOverviewCount: {
    fontSize: 12,
    color: Colors.secondary500,
    backgroundColor: Colors.secondary100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  placeOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 24,
  },
  placeNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  placeOverviewInfo: {
    flex: 1,
  },
  placeOverviewName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary700,
  },
  placeOverviewHours: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: 2,
  },
  bottomActions: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
  },
  proceedButton: {
    backgroundColor: Colors.primary600,
    borderRadius: 12,
    paddingVertical: 16,
  },
});
