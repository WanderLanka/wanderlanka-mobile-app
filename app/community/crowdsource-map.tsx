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
import { router, useLocalSearchParams } from 'expo-router';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    reviews: 6,
  },
  // Include user's own points for testing
  {
    id: 'user_point_1',
    type: 'washroom',
    title: 'Clean Public Restroom - Galle Fort',
    description: 'Well-maintained restroom facility near the lighthouse. Accessible and clean with proper amenities.',
    latitude: 6.0535,
    longitude: 80.2210,
    addedBy: 'You',
    addedDate: '2024-01-15',
    verified: true,
    rating: 4.2,
    reviews: 8,
  },
  {
    id: 'user_point_2',
    type: 'wifi',
    title: 'Free WiFi - Beach Cafe Unawatuna',
    description: 'Strong WiFi connection available for customers. Password provided with purchase.',
    latitude: 6.0108,
    longitude: 80.2492,
    addedBy: 'You',
    addedDate: '2024-01-10',
    verified: false,
    rating: 0,
    reviews: 0,
  },
  {
    id: 'user_point_3',
    type: 'restaurant',
    title: 'Local Rice & Curry - Mirissa',
    description: 'Authentic Sri Lankan rice and curry. Great portions and very affordable.',
    latitude: 5.9467,
    longitude: 80.4682,
    addedBy: 'You',
    addedDate: '2024-01-05',
    verified: false,
    rating: 0,
    reviews: 0,
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
  const { filter, selectedPointId, lat, lng, viewMode } = useLocalSearchParams() as { 
    filter?: string; 
    selectedPointId?: string; 
    lat?: string; 
    lng?: string; 
    viewMode?: string;
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<string>(filter || 'all');
  const [mapPoints, setMapPoints] = useState<MapPoint[]>(MOCK_MAP_POINTS);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [region, setRegion] = useState(() => {
    // If we have specific coordinates from params, use them immediately
    if (lat && lng) {
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
    }
    
    // Otherwise use default Sri Lanka center
    return {
      latitude: 7.8731, // Center of Sri Lanka
      longitude: 80.7718,
      latitudeDelta: 2.0,
      longitudeDelta: 2.0,
    };
  });
  const mapRef = React.useRef<MapView>(null);

  // Handle initial setup and filter
  useEffect(() => {
    if (filter) {
      setFilterType(filter);
      // Only show quick action modal if no specific point is being viewed and not in direct view mode
      if (filter !== 'all' && !selectedPointId && viewMode !== 'direct') {
        setShowQuickActions(true);
      }
    }
  }, [filter, selectedPointId, viewMode]);

  // Handle specific point viewing
  useEffect(() => {
    if (selectedPointId && lat && lng) {
      // Find the point first
      const targetPoint = mapPoints.find(p => p.id === selectedPointId);
      if (targetPoint) {
        // Set the selected point first
        setSelectedPoint(targetPoint);
        
        // Create a more focused region
        const newRegion = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          latitudeDelta: 0.005, // Smaller delta for closer zoom
          longitudeDelta: 0.005,
        };
        
        // Update region immediately
        setRegion(newRegion);
        
        // Animate map to the new region after a short delay to ensure map is loaded
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
          }
        }, 500); // Increased delay to ensure map is ready
      }
    }
  }, [selectedPointId, lat, lng, mapPoints]);

  const [showQuickActions, setShowQuickActions] = useState(false);

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
        
        // Only update region to user's location if we're not viewing a specific point
        if (!selectedPointId && !lat && !lng && viewMode !== 'direct') {
          // Update region to user's location if in Sri Lanka
          if (location.coords.latitude >= 5.9 && location.coords.latitude <= 9.9 &&
              location.coords.longitude >= 79.5 && location.coords.longitude <= 81.9) {
            const userRegion = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            };
            setRegion(userRegion);
          }
        }
      } catch (error) {
        console.log('Error getting location:', error);
      }
    })();
  }, [selectedPointId, lat, lng, viewMode]);

  const getMarkerColor = (type: MapPoint['type']) => {
    const pointType = POINT_TYPES.find(pt => pt.id === type);
    return pointType?.color || Colors.primary600;
  };

  const handleRegionChange = (newRegion: any) => {
    // Don't update region state if we're in direct view mode to prevent conflicts
    if (viewMode !== 'direct') {
      setRegion(newRegion);
    }
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {viewMode === 'direct' && selectedPoint 
              ? 'Viewing Point' 
              : 'Crowdsourced Map'
            }
          </Text>
          {viewMode === 'direct' && selectedPoint && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {selectedPoint.title}
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/community/my-map-points')} style={styles.headerActionButton}>
            <Ionicons name="person" size={20} color={Colors.primary600} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/community/add-map-point')} style={styles.headerActionButton}>
            <Ionicons name="add" size={24} color={Colors.primary600} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Google Maps */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={region}
          onRegionChangeComplete={handleRegionChange}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsBuildings={false}
          showsTraffic={false}
        >
          {/* Map Points Markers */}
          {filteredPoints.map((point) => {
            const isSelected = selectedPoint && selectedPoint.id === point.id;
            return (
              <Marker
                key={point.id}
                coordinate={{
                  latitude: point.latitude,
                  longitude: point.longitude,
                }}
                pinColor={getMarkerColor(point.type)}
                onPress={() => setSelectedPoint(point)}
              >
                <View style={[
                  styles.customMarker, 
                  { backgroundColor: getMarkerColor(point.type) },
                  isSelected && styles.selectedMarker
                ]}>
                  <Ionicons
                    name={POINT_TYPES.find(type => type.id === point.type)?.icon as keyof typeof Ionicons.glyphMap}
                    size={isSelected ? 20 : 16}
                    color={Colors.white}
                  />
                  {point.verified && (
                    <View style={styles.verifiedDot} />
                  )}
                  {isSelected && (
                    <View style={styles.selectedIndicator} />
                  )}
                </View>
              </Marker>
            );
          })}
        </MapView>

        {/* Viewing Point Banner */}
        {viewMode === 'direct' && selectedPoint && (
          <View style={styles.viewingBanner}>
            <View style={styles.viewingBannerContent}>
              <Ionicons name="eye" size={16} color={Colors.primary600} />
              <Text style={styles.viewingBannerText}>
                Viewing: {selectedPoint.title}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.viewingBannerClose}
            >
              <Ionicons name="close" size={16} color={Colors.secondary600} />
            </TouchableOpacity>
          </View>
        )}

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

      {/* Quick Actions Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showQuickActions}
        onRequestClose={() => setShowQuickActions(false)}
      >
        <View style={styles.quickActionsOverlay}>
          <View style={styles.quickActionsModal}>
            <View style={styles.quickActionsHeader}>
              <Text style={styles.quickActionsTitle}>
                {POINT_TYPES.find(type => type.id === filterType)?.name || 'Map Features'}
              </Text>
              <TouchableOpacity onPress={() => setShowQuickActions(false)}>
                <Ionicons name="close" size={24} color={Colors.secondary400} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.quickActionsSubtitle}>
              What would you like to do?
            </Text>

            <View style={styles.quickActionsList}>
              <TouchableOpacity 
                style={styles.quickActionItem}
                onPress={() => {
                  setShowQuickActions(false);
                  router.push('/community/add-map-point');
                }}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="add-circle" size={24} color={Colors.primary600} />
                </View>
                <View style={styles.quickActionText}>
                  <Text style={styles.quickActionTitle}>Add New Point</Text>
                  <Text style={styles.quickActionSubtext}>Share a location with the community</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.secondary400} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionItem}
                onPress={() => {
                  setShowQuickActions(false);
                  // Focus on nearest point of this type
                  const nearestPoint = filteredPoints[0];
                  if (nearestPoint) {
                    setRegion({
                      latitude: nearestPoint.latitude,
                      longitude: nearestPoint.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    });
                    setSelectedPoint(nearestPoint);
                  }
                }}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="location" size={24} color={Colors.success} />
                </View>
                <View style={styles.quickActionText}>
                  <Text style={styles.quickActionTitle}>Find Nearest</Text>
                  <Text style={styles.quickActionSubtext}>Locate closest point to you</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.secondary400} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionItem}
                onPress={() => {
                  setShowQuickActions(false);
                  Alert.alert(
                    'Statistics',
                    `${filteredPoints.length} ${POINT_TYPES.find(type => type.id === filterType)?.name.toLowerCase()} points available\n\n${filteredPoints.filter(p => p.verified).length} verified by community\n\nAverage rating: ${(filteredPoints.reduce((sum, p) => sum + p.rating, 0) / filteredPoints.length || 0).toFixed(1)}/5.0`
                  );
                }}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="stats-chart" size={24} color={Colors.info} />
                </View>
                <View style={styles.quickActionText}>
                  <Text style={styles.quickActionTitle}>View Statistics</Text>
                  <Text style={styles.quickActionSubtext}>See community data insights</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.secondary400} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickActionsStats}>
              <Text style={styles.quickActionsStatsTitle}>Quick Stats</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{filteredPoints.length}</Text>
                  <Text style={styles.statLabel}>Total Points</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{filteredPoints.filter(p => p.verified).length}</Text>
                  <Text style={styles.statLabel}>Verified</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {(filteredPoints.reduce((sum, p) => sum + p.rating, 0) / filteredPoints.length || 0).toFixed(1)}
                  </Text>
                  <Text style={styles.statLabel}>Avg Rating</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button for Quick Add */}
      {filterType !== 'all' && (
        <TouchableOpacity
          style={styles.floatingActionButton}
          onPress={() => router.push('/community/add-map-point')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      )}
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.secondary600,
    marginTop: 2,
  },
  addButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionButton: {
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
  selectedMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.primary600,
    backgroundColor: 'transparent',
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
    height: 'auto',
    maxHeight: 50
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    height: 50
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
  // Quick Actions Modal Styles
  quickActionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  quickActionsModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  quickActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  quickActionsSubtitle: {
    fontSize: 14,
    color: Colors.secondary600,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  quickActionsList: {
    paddingHorizontal: 20,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light100,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
    marginBottom: 2,
  },
  quickActionSubtext: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  quickActionsStats: {
    backgroundColor: Colors.secondary50,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  quickActionsStatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary600,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary600,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  viewingBanner: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.primary600,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewingBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  viewingBannerText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary600,
    flex: 1,
  },
  viewingBannerClose: {
    padding: 4,
  },
});
