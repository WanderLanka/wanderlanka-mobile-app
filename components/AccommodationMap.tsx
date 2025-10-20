import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { ThemedText } from './ThemedText';

interface AccommodationMapProps {
  coordinates?: {
    lat: number;
    lng: number;
  };
  accommodationName?: string;
  location?: string;
}

export const AccommodationMap: React.FC<AccommodationMapProps> = ({
  coordinates,
  accommodationName,
  location
}) => {
  const screenWidth = Dimensions.get('window').width;
  const mapWidth = screenWidth * 0.92; // 92% of screen width to match the placeholder

  // Default coordinates (Colombo, Sri Lanka) if no coordinates provided
  const defaultCoordinates = {
    latitude: 6.9271,
    longitude: 79.8612,
  };

  const mapCoordinates = coordinates ? {
    latitude: coordinates.lat,
    longitude: coordinates.lng,
  } : defaultCoordinates;

  return (
    <View style={[styles.mapContainer, { width: mapWidth }]}>
      {coordinates ? (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: mapCoordinates.latitude,
            longitude: mapCoordinates.longitude,
            latitudeDelta: 0.005, // Smaller delta for closer zoom
            longitudeDelta: 0.005,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
          zoomEnabled={true}
          scrollEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
          minZoomLevel={10}
          maxZoomLevel={20}
        >
          <Marker
            coordinate={mapCoordinates}
            title={accommodationName || 'Accommodation'}
            description={location || 'Accommodation Location'}
          >
            <Ionicons name="location" size={30} color="#22c55e" />
          </Marker>
        </MapView>
      ) : (
        <View style={styles.placeholderContainer}>
          <ThemedText style={styles.placeholderText}>
            Map coordinates not available
          </ThemedText>
          <ThemedText style={styles.placeholderSubtext}>
            {location || 'Location information unavailable'}
          </ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    height: 200, // Increased from 120 to 200 for larger map
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 18,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  placeholderText: {
    color: Colors.primary600,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  placeholderSubtext: {
    color: Colors.primary500,
    fontSize: 13,
    textAlign: 'center',
  },
});
