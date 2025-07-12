import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  addFamousLocationPoint,
  addTestPoints,
  focusOnRegion,
  generateMockCrowdsourceData,
  runFullIntegrationTest,
  testLocationServices,
  validateAllMapPoints,
} from '../../utils/mapDemo';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MapDemoControlsProps {
  mapPoints: any[];
  setMapPoints: (updater: (prev: any[]) => any[]) => void;
  setRegion: (region: any) => void;
}

const MapDemoControls: React.FC<MapDemoControlsProps> = ({
  mapPoints,
  setMapPoints,
  setRegion,
}) => {
  const handleGenerateMockData = () => {
    const mockData = generateMockCrowdsourceData();
    setMapPoints(prev => [...mockData, ...prev]);
    Alert.alert('Demo', `Generated ${mockData.length} mock points!`);
  };

  const handleClearAllPoints = () => {
    Alert.alert(
      'Clear All Points',
      'Are you sure you want to clear all map points?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => setMapPoints(() => [])
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Map Demo Controls</Text>
        <Text style={styles.subtitle}>Test Google Maps Integration</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Data Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Controls</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={() => addTestPoints(setMapPoints)}
          >
            <Ionicons name="add-circle-outline" size={20} color={Colors.primary600} />
            <Text style={styles.buttonText}>Add Test Points</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => addFamousLocationPoint(setMapPoints)}
          >
            <Ionicons name="location-outline" size={20} color={Colors.primary600} />
            <Text style={styles.buttonText}>Add Famous Location</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleGenerateMockData}
          >
            <Ionicons name="albums-outline" size={20} color={Colors.primary600} />
            <Text style={styles.buttonText}>Generate Mock Data (10 points)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleClearAllPoints}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.white} />
            <Text style={[styles.buttonText, styles.dangerButtonText]}>Clear All Points</Text>
          </TouchableOpacity>
        </View>

        {/* Map Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Map Controls</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={() => focusOnRegion(setRegion, 'Colombo')}
          >
            <Ionicons name="business-outline" size={20} color={Colors.primary600} />
            <Text style={styles.buttonText}>Focus on Colombo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => focusOnRegion(setRegion, 'Kandy')}
          >
            <Ionicons name="home-outline" size={20} color={Colors.primary600} />
            <Text style={styles.buttonText}>Focus on Kandy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => focusOnRegion(setRegion, 'Galle')}
          >
            <Ionicons name="shield-outline" size={20} color={Colors.primary600} />
            <Text style={styles.buttonText}>Focus on Galle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => focusOnRegion(setRegion, 'Sri Lanka')}
          >
            <Ionicons name="globe-outline" size={20} color={Colors.primary600} />
            <Text style={styles.buttonText}>View All Sri Lanka</Text>
          </TouchableOpacity>
        </View>

        {/* Testing Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Testing & Validation</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={testLocationServices}
          >
            <Ionicons name="locate-outline" size={20} color={Colors.primary600} />
            <Text style={styles.buttonText}>Test Location Services</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => validateAllMapPoints(mapPoints)}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.primary600} />
            <Text style={styles.buttonText}>Validate All Points</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={runFullIntegrationTest}
          >
            <Ionicons name="bug-outline" size={20} color={Colors.primary600} />
            <Text style={styles.buttonText}>Run Integration Tests</Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Status</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>Total Points: {mapPoints.length}</Text>
            <Text style={styles.infoText}>
              Verified: {mapPoints.filter(p => p.verified).length}
            </Text>
            <Text style={styles.infoText}>
              Types: {new Set(mapPoints.map(p => p.type)).size}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.secondary600,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dangerButton: {
    backgroundColor: Colors.error,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
    marginLeft: 12,
  },
  dangerButtonText: {
    color: Colors.white,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: Colors.secondary600,
    marginBottom: 4,
  },
});

export default MapDemoControls;
