import * as Location from 'expo-location';

import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import React, { useEffect, useState } from 'react';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

interface MapPoint {
  id: string;
  type: 'washroom' | 'wifi' | 'restaurant' | 'poi' | 'parking';
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  addedBy: string;
  addedDate: string;
  verified: boolean;
  rating: number;
  reviews: number;
}

// Mock crowdsourced data - easily replaceable with backend API
const MOCK_MAP_POINTS: MapPoint[] = [
  {
    id: 'point1',
    type: 'washroom',
    title: 'Public Restroom - Galle Fort',
    description: 'Clean restroom facilities near the lighthouse',
    latitude: 6.0329,
    longitude: 80.2168,
    addedBy: 'TravelerSarah',
    addedDate: '2024-07-05',
    verified: true,
    rating: 4.2,
    reviews: 15,
  },
  {
    id: 'point2',
    type: 'wifi',
    title: 'Free WiFi - Cafe Mocha',
    description: 'Fast internet, good for remote work',
    latitude: 6.9271,
    longitude: 79.8612,
    addedBy: 'DigitalNomad',
    addedDate: '2024-07-04',
    verified: true,
    rating: 4.8,
    reviews: 23,
  },
  {
    id: 'point3',
    type: 'restaurant',
    title: 'Local Rice & Curry - Mama\'s Kitchen',
    description: 'Authentic Sri Lankan home-style cooking',
    latitude: 7.2906,
    longitude: 80.6337,
    addedBy: 'FoodieExplorer',
    addedDate: '2024-07-03',
    verified: false,
    rating: 4.6,
    reviews: 8,
  },
  {
    id: 'point4',
    type: 'poi',
    title: 'Hidden Waterfall - Secret Spot',
    description: 'Beautiful waterfall off the beaten path',
    latitude: 6.9497,
    longitude: 80.7891,
    addedBy: 'NatureSeeker',
    addedDate: '2024-07-02',
    verified: true,
    rating: 4.9,
    reviews: 12,
  },
  {
    id: 'point5',
    type: 'parking',
    title: 'Safe Parking - Temple of Tooth',
    description: 'Secure parking near Kandy Temple',
    latitude: 7.2936,
    longitude: 80.6417,
    addedBy: 'LocalGuide',
    addedDate: '2024-07-01',
    verified: true,
    rating: 4.4,
    reviews: 18,
  },
  {
    id: 'point6',
    type: 'washroom',
    title: 'Clean Restroom - Sigiriya Base',
    description: 'Well-maintained facilities at Sigiriya entrance',
    latitude: 7.9568,
    longitude: 80.7598,
    addedBy: 'HeritageExplorer',
    addedDate: '2024-06-30',
    verified: true,
    rating: 4.0,
    reviews: 25,
  },
];

const POINT_TYPES = [
  { id: 'washroom', name: 'Restroom', icon: 'business-outline', color: Colors.primary600 },
  { id: 'wifi', name: 'WiFi Spot', icon: 'wifi-outline', color: Colors.info },
  { id: 'restaurant', name: 'Local Eatery', icon: 'restaurant-outline', color: Colors.warning },
  { id: 'poi', name: 'Point of Interest', icon: 'location-outline', color: Colors.success },
  { id: 'parking', name: 'Parking', icon: 'car-outline', color: Colors.secondary600 },
];

interface AddPointModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (point: Omit<MapPoint, 'id' | 'addedBy' | 'addedDate' | 'verified' | 'rating' | 'reviews'>) => void;
  userLocation: Location.LocationObject | null;
}

const AddPointModal: React.FC<AddPointModalProps> = ({ visible, onClose, onSubmit, userLocation }) => {
  const [selectedType, setSelectedType] = useState<string>('washroom');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(userLocation);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed to add points at your current location');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
      Alert.alert('Location Updated', 'Your current location has been captured for this point');
    } catch (error) {
      Alert.alert('Error', 'Could not get your current location. Please try again.');
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Use captured location if available, otherwise use default Sri Lankan location
    const location = currentLocation ? {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    } : {
      // Default to Colombo area if no location available
      latitude: 6.9271 + (Math.random() - 0.5) * 0.1,
      longitude: 79.8612 + (Math.random() - 0.5) * 0.1,
    };

    onSubmit({
      type: selectedType as MapPoint['type'],
      title: title.trim(),
      description: description.trim(),
      latitude: location.latitude,
      longitude: location.longitude,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setSelectedType('washroom');
    setCurrentLocation(userLocation);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Map Point</Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={styles.modalSubmitText}>Submit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Point Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type</Text>
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
                    size={24}
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
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Clean Public Restroom"
              placeholderTextColor={Colors.secondary400}
            />
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Provide helpful details for other travelers..."
              placeholderTextColor={Colors.secondary400}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Location Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationInfo}>
              <Ionicons name="location-outline" size={20} color={Colors.primary600} />
              <Text style={styles.locationText}>
                {currentLocation 
                  ? "Using your current location"
                  : "No location captured yet"
                }
              </Text>
            </View>
            <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
              <Ionicons name="locate" size={16} color={Colors.primary600} />
              <Text style={styles.locationButtonText}>
                {currentLocation ? "Update Location" : "Get My Location"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

interface MapPointCardProps {
  point: MapPoint;
}

const MapPointCard: React.FC<MapPointCardProps> = ({ point }) => {
  const pointType = POINT_TYPES.find(type => type.id === point.type);
  
  return (
    <View style={styles.pointCard}>
      <View style={styles.pointHeader}>
        <View style={styles.pointTypeContainer}>
          <View style={[styles.pointTypeIcon, { backgroundColor: pointType?.color + '20' }]}>
            <Ionicons
              name={pointType?.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={pointType?.color}
            />
          </View>
          <View style={styles.pointInfo}>
            <Text style={styles.pointTitle}>{point.title}</Text>
            <Text style={styles.pointType}>{pointType?.name}</Text>
          </View>
        </View>
        {point.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.pointDescription}>{point.description}</Text>
      
      <View style={styles.pointFooter}>
        <View style={styles.pointRating}>
          <Ionicons name="star" size={14} color={Colors.warning} />
          <Text style={styles.ratingText}>{point.rating}</Text>
          <Text style={styles.reviewsText}>({point.reviews} reviews)</Text>
        </View>
        <Text style={styles.addedBy}>Added by {point.addedBy}</Text>
      </View>
    </View>
  );
};

export default function CrowdsourceMapScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [mapPoints, setMapPoints] = useState<MapPoint[]>(MOCK_MAP_POINTS);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [region, setRegion] = useState({
    latitude: 7.8731, // Center of Sri Lanka
    longitude: 80.7718,
    latitudeDelta: 2.0,
    longitudeDelta: 2.0,
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to show your position on the map',
          [{ text: 'OK' }]
        );
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        
        // Update region to user's location if in Sri Lanka
        if (location.coords.latitude >= 5.9 && location.coords.latitude <= 9.9 &&
            location.coords.longitude >= 79.5 && location.coords.longitude <= 81.9) {
          setRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      } catch (error) {
        console.log('Error getting location:', error);
      }
    })();
  }, []);

  const getMarkerColor = (type: MapPoint['type']) => {
    const pointType = POINT_TYPES.find(pt => pt.id === type);
    return pointType?.color || Colors.primary600;
  };

  const handleAddPoint = (newPoint: Omit<MapPoint, 'id' | 'addedBy' | 'addedDate' | 'verified' | 'rating' | 'reviews'>) => {
    const point: MapPoint = {
      ...newPoint,
      id: `point_${Date.now()}`,
      addedBy: 'You',
      addedDate: new Date().toISOString().split('T')[0],
      verified: false,
      rating: 0,
      reviews: 0,
    };

    setMapPoints(prev => [point, ...prev]);
    setShowAddModal(false);
    
    Alert.alert(
      'Point Added!',
      'Your point has been added to the map. It will be visible to other travelers after verification.',
      [{ text: 'OK' }]
    );
  };

  const filteredPoints = filterType === 'all' 
    ? mapPoints 
    : mapPoints.filter(point => point.type === filterType);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crowdsourced Map</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color={Colors.primary600} />
        </TouchableOpacity>
      </View>

      {/* Google Maps */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsBuildings={false}
          showsTraffic={false}
        >
          {/* Map Points Markers */}
          {filteredPoints.map((point) => (
            <Marker
              key={point.id}
              coordinate={{
                latitude: point.latitude,
                longitude: point.longitude,
              }}
              pinColor={getMarkerColor(point.type)}
              onPress={() => setSelectedPoint(point)}
            >
              <View style={[styles.customMarker, { backgroundColor: getMarkerColor(point.type) }]}>
                <Ionicons
                  name={POINT_TYPES.find(type => type.id === point.type)?.icon as keyof typeof Ionicons.glyphMap}
                  size={16}
                  color={Colors.white}
                />
                {point.verified && (
                  <View style={styles.verifiedDot} />
                )}
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Selected Point Info */}
        {selectedPoint && (
          <View style={styles.selectedPointInfo}>
            <View style={styles.selectedPointHeader}>
              <View style={styles.selectedPointTitleContainer}>
                <Text style={styles.selectedPointTitle}>{selectedPoint.title}</Text>
                <Text style={styles.selectedPointType}>
                  {POINT_TYPES.find(type => type.id === selectedPoint.type)?.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedPoint(null)}
                style={styles.closeSelectedPoint}
              >
                <Ionicons name="close" size={20} color={Colors.secondary600} />
              </TouchableOpacity>
            </View>
            <Text style={styles.selectedPointDescription}>{selectedPoint.description}</Text>
            <View style={styles.selectedPointFooter}>
              <View style={styles.selectedPointRating}>
                <Ionicons name="star" size={14} color={Colors.warning} />
                <Text style={styles.selectedPointRatingText}>{selectedPoint.rating}</Text>
              </View>
              <Text style={styles.selectedPointAddedBy}>by {selectedPoint.addedBy}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'all' && styles.activeFilterTab]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterTabText, filterType === 'all' && styles.activeFilterTabText]}>
            All ({mapPoints.length})
          </Text>
        </TouchableOpacity>
        {POINT_TYPES.map((type) => {
          const count = mapPoints.filter(point => point.type === type.id).length;
          return (
            <TouchableOpacity
              key={type.id}
              style={[styles.filterTab, filterType === type.id && styles.activeFilterTab]}
              onPress={() => setFilterType(type.id)}
            >
              <Ionicons
                name={type.icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color={filterType === type.id ? Colors.white : type.color}
              />
              <Text style={[styles.filterTabText, filterType === type.id && styles.activeFilterTabText]}>
                {type.name} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Points List */}
      <ScrollView style={styles.pointsList} showsVerticalScrollIndicator={false}>
        {filteredPoints.map((point) => (
          <MapPointCard key={point.id} point={point} />
        ))}
        {filteredPoints.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={48} color={Colors.secondary400} />
            <Text style={styles.emptyStateText}>No points found for this category</Text>
            <Text style={styles.emptyStateSubtext}>Be the first to add one!</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Point Modal */}
      <AddPointModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddPoint}
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
  addButton: {
    padding: 4,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: Colors.light100,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light200,
    borderStyle: 'dashed',
  },
  mapContainer: {
    height: 300,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    position: 'relative',
  },
  verifiedDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  selectedPointInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedPointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  selectedPointTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  selectedPointTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  selectedPointType: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  closeSelectedPoint: {
    padding: 4,
  },
  selectedPointDescription: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 18,
    marginBottom: 12,
  },
  selectedPointFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedPointRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedPointRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.black,
    marginLeft: 2,
  },
  selectedPointAddedBy: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary600,
    marginTop: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    color: Colors.secondary500,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  filterContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: Colors.light100,
  },
  activeFilterTab: {
    backgroundColor: Colors.primary600,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.secondary600,
    marginLeft: 4,
  },
  activeFilterTabText: {
    color: Colors.white,
  },
  pointsList: {
    flex: 1,
    padding: 20,
  },
  pointCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  pointHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pointTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pointTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pointInfo: {
    flex: 1,
  },
  pointTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  pointType: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '20',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.success,
    marginLeft: 2,
  },
  pointDescription: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 18,
    marginBottom: 12,
  },
  pointFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.black,
    marginLeft: 2,
  },
  reviewsText: {
    fontSize: 12,
    color: Colors.secondary500,
    marginLeft: 4,
  },
  addedBy: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.secondary600,
    marginTop: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.secondary500,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
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
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light200,
  },
  selectedTypeOption: {
    backgroundColor: Colors.primary600,
    borderColor: Colors.primary600,
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.black,
    marginTop: 8,
    textAlign: 'center',
  },
  selectedTypeOptionText: {
    color: Colors.white,
  },
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.black,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary100,
    borderRadius: 8,
    padding: 12,
  },
  locationText: {
    fontSize: 14,
    color: Colors.primary600,
    marginLeft: 8,
    flex: 1,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary100,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary600,
    marginLeft: 6,
  },
});
