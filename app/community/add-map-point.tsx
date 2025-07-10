import * as Location from 'expo-location';

import {
  Alert,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import React, { useEffect, useState } from 'react';

import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

const POINT_TYPES = [
  { id: 'washroom', name: 'Restroom', icon: 'business-outline', color: Colors.primary600 },
  { id: 'wifi', name: 'WiFi Spot', icon: 'wifi-outline', color: Colors.info },
  { id: 'restaurant', name: 'Local Eatery', icon: 'restaurant-outline', color: Colors.warning },
  { id: 'poi', name: 'Point of Interest', icon: 'location-outline', color: Colors.success },
  { id: 'parking', name: 'Parking', icon: 'car-outline', color: Colors.secondary600 },
];

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface LocationSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
  userLocation: Location.LocationObject | null;
}

const LocationSelectionModal: React.FC<LocationSelectionModalProps> = ({
  visible,
  onClose,
  onLocationSelect,
  userLocation,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [region, setRegion] = useState({
    latitude: userLocation?.coords.latitude || 7.8731,
    longitude: userLocation?.coords.longitude || 80.7718,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  const confirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
    }
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed to use your current location');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: 'Current Location',
      };
      setSelectedLocation(locationData);
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not get your current location. Please try again.');
    }
  };

  // Mock search functionality - in real app, use Google Places API
  const searchLocations = async () => {
    if (!searchQuery.trim()) return;
    
    // Mock search results for demonstration
    const mockResults = [
      { latitude: 7.2906, longitude: 80.6337, address: `${searchQuery} - Colombo` },
      { latitude: 6.0535, longitude: 80.2210, address: `${searchQuery} - Galle` },
      { latitude: 7.9553, longitude: 80.7593, address: `${searchQuery} - Sigiriya` },
    ];

    Alert.alert(
      'Search Results',
      'In a real implementation, this would show Google Places search results. For now, select a location on the map.',
      [{ text: 'OK' }]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.locationModalContainer}>
        {/* Header */}
        <View style={styles.locationModalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Location</Text>
          <TouchableOpacity 
            onPress={confirmLocation}
            disabled={!selectedLocation}
            style={[styles.confirmButton, !selectedLocation && styles.confirmButtonDisabled]}
          >
            <Text style={[styles.modalSubmitText, !selectedLocation && styles.modalSubmitTextDisabled]}>
              Confirm
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={Colors.secondary400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a place..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.secondary400}
              onSubmitEditing={searchLocations}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={Colors.secondary400} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.currentLocationButton} onPress={getCurrentLocation}>
            <Ionicons name="locate" size={18} color={Colors.primary600} />
            <Text style={styles.currentLocationText}>Use Current</Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapSelectionContainer}>
          <MapView
            style={styles.mapSelection}
            provider={PROVIDER_GOOGLE}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                pinColor={Colors.primary600}
              >
                <View style={styles.selectedMarker}>
                  <Ionicons name="location" size={24} color={Colors.white} />
                </View>
              </Marker>
            )}
          </MapView>
          
          {/* Map Instructions */}
          <View style={styles.mapInstructions}>
            <Text style={styles.mapInstructionsText}>
              {selectedLocation 
                ? '📍 Location selected! Tap "Confirm" to use this location.'
                : '🗺️ Tap anywhere on the map to select a location, or search above.'
              }
            </Text>
          </View>
        </View>

        {/* Selected Location Info */}
        {selectedLocation && (
          <View style={styles.selectedLocationInfo}>
            <View style={styles.selectedLocationHeader}>
              <Ionicons name="location" size={20} color={Colors.primary600} />
              <Text style={styles.selectedLocationTitle}>Selected Location</Text>
            </View>
            <Text style={styles.selectedLocationCoords}>
              {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </Text>
            {selectedLocation.address && (
              <Text style={styles.selectedLocationAddress}>{selectedLocation.address}</Text>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default function AddMapPointScreen() {
  const [selectedType, setSelectedType] = useState<string>('washroom');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          let location = await Location.getCurrentPositionAsync({});
          setUserLocation(location);
        } catch (error) {
          console.log('Error getting location:', error);
        }
      }
    })();
  }, []);

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
  };

  const useCurrentLocation = async () => {
    if (!userLocation) {
      Alert.alert('Location Required', 'Please enable location services to use your current location');
      return;
    }

    const location: LocationData = {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
      address: 'Current Location',
    };
    setSelectedLocation(location);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your map point');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return false;
    }
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location for your map point');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real app, this would submit to your backend
      const newPoint = {
        type: selectedType,
        title: title.trim(),
        description: description.trim(),
        latitude: selectedLocation!.latitude,
        longitude: selectedLocation!.longitude,
        addedBy: 'You',
        addedDate: new Date().toISOString().split('T')[0],
        verified: false,
        rating: 0,
        reviews: 0,
      };

      Alert.alert(
        'Point Added Successfully!',
        'Your map point has been submitted and will be visible to other travelers after verification.',
        [
          {
            text: 'Add Another',
            onPress: () => {
              setTitle('');
              setDescription('');
              setSelectedLocation(null);
              setSelectedType('washroom');
            },
          },
          {
            text: 'Done',
            onPress: () => router.back(),
            style: 'default',
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add map point. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Map Point</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Point Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Point Type</Text>
          <Text style={styles.sectionSubtitle}>Choose the category that best describes your location</Text>
          <View style={styles.typeGrid}>
            {POINT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeOption,
                  selectedType === type.id && styles.selectedTypeOption
                ]}
                onPress={() => setSelectedType(type.id)}
              >
                <Ionicons
                  name={type.icon as keyof typeof Ionicons.glyphMap}
                  size={28}
                  color={selectedType === type.id ? Colors.white : type.color}
                />
                <Text style={[
                  styles.typeOptionText,
                  selectedType === type.id && styles.selectedTypeOptionText
                ]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title</Text>
          <Text style={styles.sectionSubtitle}>Give your location a clear, descriptive name</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Clean Public Restroom near Beach"
            placeholderTextColor={Colors.secondary400}
            maxLength={100}
          />
          <Text style={styles.characterCount}>{title.length}/100</Text>
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionSubtitle}>Provide helpful details for other travelers</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what makes this location useful, accessibility features, operating hours, etc..."
            placeholderTextColor={Colors.secondary400}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.characterCount}>{description.length}/500</Text>
        </View>

        {/* Location Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.sectionSubtitle}>Choose how to set the location for your point</Text>
          
          {/* Location Options */}
          <View style={styles.locationOptionsContainer}>
            <TouchableOpacity
              style={styles.locationOption}
              onPress={useCurrentLocation}
              disabled={!userLocation}
            >
              <View style={styles.locationOptionIcon}>
                <Ionicons name="locate" size={24} color={userLocation ? Colors.primary600 : Colors.secondary400} />
              </View>
              <View style={styles.locationOptionText}>
                <Text style={[styles.locationOptionTitle, !userLocation && styles.disabledText]}>
                  Use Current Location
                </Text>
                <Text style={[styles.locationOptionSubtitle, !userLocation && styles.disabledText]}>
                  {userLocation ? 'Capture your current position' : 'Location services disabled'}
                </Text>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={userLocation ? Colors.secondary400 : Colors.secondary500} 
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.locationOption}
              onPress={() => setShowLocationModal(true)}
            >
              <View style={styles.locationOptionIcon}>
                <Ionicons name="map" size={24} color={Colors.success} />
              </View>
              <View style={styles.locationOptionText}>
                <Text style={styles.locationOptionTitle}>Search & Select on Map</Text>
                <Text style={styles.locationOptionSubtitle}>
                  Find a specific location or tap on the map
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.secondary400} />
            </TouchableOpacity>
          </View>

          {/* Selected Location Display */}
          {selectedLocation && (
            <View style={styles.selectedLocationDisplay}>
              <View style={styles.selectedLocationHeader}>
                <Ionicons name="location" size={20} color={Colors.primary600} />
                <Text style={styles.selectedLocationTitle}>Selected Location</Text>
                <TouchableOpacity
                  onPress={() => setSelectedLocation(null)}
                  style={styles.removeLocationButton}
                >
                  <Ionicons name="close" size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
              <Text style={styles.selectedLocationCoords}>
                📍 {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </Text>
              {selectedLocation.address && (
                <Text style={styles.selectedLocationAddress}>{selectedLocation.address}</Text>
              )}
            </View>
          )}
        </View>

        {/* Helpful Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsSectionTitle}>💡 Tips for Quality Map Points</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Be specific and accurate with your descriptions</Text>
            <Text style={styles.tipItem}>• Include accessibility information when relevant</Text>
            <Text style={styles.tipItem}>• Mention operating hours or availability</Text>
            <Text style={styles.tipItem}>• Help fellow travelers with useful details</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? '🔄 Adding Point...' : '📍 Add Map Point'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Location Selection Modal */}
      <LocationSelectionModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={handleLocationSelect}
        userLocation={userLocation}
      />
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.secondary600,
    marginBottom: 16,
    lineHeight: 20,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeOption: {
    width: (width - 64) / 2,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light200,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedTypeOption: {
    backgroundColor: Colors.primary600,
    borderColor: Colors.primary600,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
    marginTop: 12,
    textAlign: 'center',
  },
  selectedTypeOptionText: {
    color: Colors.white,
  },
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.black,
    borderWidth: 1,
    borderColor: Colors.light200,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: Colors.secondary500,
    textAlign: 'right',
    marginTop: 8,
  },
  locationOptionsContainer: {
    gap: 12,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light200,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  locationOptionText: {
    flex: 1,
  },
  locationOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  locationOptionSubtitle: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 18,
  },
  disabledText: {
    color: Colors.secondary400,
  },
  selectedLocationDisplay: {
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.primary100,
  },
  selectedLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
    marginLeft: 8,
    flex: 1,
  },
  removeLocationButton: {
    padding: 4,
  },
  selectedLocationCoords: {
    fontSize: 14,
    color: Colors.primary600,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  selectedLocationAddress: {
    fontSize: 14,
    color: Colors.primary700,
    fontStyle: 'italic',
  },
  tipsSection: {
    backgroundColor: Colors.info + '10',
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  tipsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.info,
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: Colors.info,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: Colors.primary600,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.secondary400,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  bottomPadding: {
    height: 40,
  },
  // Location Selection Modal Styles
  locationModalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  locationModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  modalCancelText: {
    fontSize: 16,
    color: Colors.secondary600,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  confirmButton: {
    paddingHorizontal: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
  },
  modalSubmitTextDisabled: {
    color: Colors.secondary400,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.secondary50,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary600,
  },
  mapSelectionContainer: {
    flex: 1,
  },
  mapSelection: {
    flex: 1,
  },
  selectedMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary600,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  mapInstructions: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapInstructionsText: {
    fontSize: 14,
    color: Colors.secondary600,
    textAlign: 'center',
    lineHeight: 20,
  },
  selectedLocationInfo: {
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light200,
    padding: 20,
  },
});
