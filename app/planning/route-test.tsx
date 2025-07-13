import { Alert, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import React, { useEffect, useState } from 'react';

import { ThemedText } from '@/components';

interface TestRoute {
  id: string;
  coordinates: { latitude: number; longitude: number }[];
  color: string;
  strokeWidth: number;
}

// Simple test component to isolate the crash issue
const RouteTestComponent = () => {
  const [testRoutes, setTestRoutes] = useState<TestRoute[]>([]);
  const [showRoutes, setShowRoutes] = useState(false);

  useEffect(() => {
    // Simulate route generation with simple test data
    const generateTestRoutes = () => {
      console.log('📍 Generating test routes...');
      
      const testCoordinates = [
        { latitude: 6.9271, longitude: 79.8612 }, // Colombo
        { latitude: 6.9319, longitude: 79.8478 }, // Slightly different
        { latitude: 6.9367, longitude: 79.8344 }, // And another
      ];

      const routes: TestRoute[] = [
        {
          id: 'test-route-1',
          coordinates: testCoordinates,
          color: '#3B82F6',
          strokeWidth: 5,
        },
        {
          id: 'test-route-2', 
          coordinates: testCoordinates.map(coord => ({
            latitude: coord.latitude + 0.001,
            longitude: coord.longitude + 0.001,
          })),
          color: '#10B981',
          strokeWidth: 5,
        },
      ];

      console.log('📍 Test routes generated');
      setTestRoutes(routes);
      
      // Delay showing routes
      setTimeout(() => {
        console.log('📍 Showing test routes...');
        setShowRoutes(true);
      }, 1000);
    };

    generateTestRoutes();
  }, []);

  const mapRegion = {
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  console.log('📍 Rendering test component, showRoutes:', showRoutes);

  return (
    <View style={styles.container}>
      <ThemedText>Route Test Component</ThemedText>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={mapRegion}
          onMapReady={() => console.log('📍 Test map ready')}
        >
          {/* Test marker */}
          <Marker
            coordinate={{ latitude: 6.9271, longitude: 79.8612 }}
            title="Test Marker"
            pinColor="red"
          />
          
          {/* Test routes */}
          {showRoutes && testRoutes.map((route) => {
            console.log(`📍 Rendering test route ${route.id}`);
            try {
              return (
                <Polyline
                  key={route.id}
                  coordinates={route.coordinates}
                  strokeColor={route.color}
                  strokeWidth={route.strokeWidth}
                />
              );
            } catch (error) {
              console.error(`📍 Error rendering test route ${route.id}:`, error);
              return null;
            }
          })}
        </MapView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  mapContainer: {
    flex: 1,
    marginTop: 20,
  },
  map: {
    flex: 1,
  },
});

export default RouteTestComponent;
