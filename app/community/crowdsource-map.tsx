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
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { AddReviewModal } from '../../components/AddReviewModal';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { ReviewList } from '../../components/ReviewList';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StarRating } from '../../components/StarRating';
import { mapPointsApi } from '../../services/mapPointsApi';

// API MapPoint interface (from backend)
interface APIMapPoint {
  _id: string;
  title: string;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  category: 'attraction' | 'restaurant' | 'hotel' | 'viewpoint' | 'beach' | 'temple' | 'nature' | 'adventure' | 'shopping' | 'nightlife' | 'transport' | 'other';
  address?: string;
  placeName?: string;
  author: {
    userId: string;
    username: string;
    avatar?: string;
    role: 'traveler' | 'traveller' | 'guide';
  };
  images?: Array<{
    url: string;
    thumbnailUrl?: string;
    mediumUrl?: string;
  }>;
  rating?: number;
  likesCount?: number;
  savesCount?: number;
  commentsCount?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Local MapPoint interface (used in this component)
interface MapPoint {
  id: string;
  type: 'washroom' | 'wifi' | 'restaurant' | 'poi' | 'parking' | 'attraction' | 'hotel' | 'viewpoint' | 'beach' | 'temple' | 'nature' | 'adventure' | 'shopping' | 'nightlife' | 'transport' | 'other';
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
  onPress?: () => void;
}

const MapPointCard: React.FC<MapPointCardProps> = ({ point, onPress }) => {
  const pointType = POINT_TYPES.find(type => type.id === point.type);
  
  return (
    <TouchableOpacity 
      style={styles.pointCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
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
        <View style={styles.pointRatingSection}>
          {point.rating > 0 ? (
            <View style={styles.pointRatingWithStars}>
              <StarRating rating={point.rating} size={16} />
              <Text style={styles.ratingValue}>{point.rating.toFixed(1)}</Text>
            </View>
          ) : (
            <View style={styles.noRatingContainer}>
              <Ionicons name="star-outline" size={16} color={Colors.secondary400} />
              <Text style={styles.noRatingText}>No ratings yet</Text>
            </View>
          )}
          <Text style={styles.reviewCount}>
            {point.reviews} {point.reviews === 1 ? 'review' : 'reviews'}
          </Text>
        </View>
        <View style={styles.pointMeta}>
          <Ionicons name="person-circle-outline" size={14} color={Colors.secondary400} />
          <Text style={styles.addedBy}>{point.addedBy}</Text>
        </View>
      </View>
    </TouchableOpacity>
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
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRefresh, setReviewRefresh] = useState(0);
  const [showReviewsList, setShowReviewsList] = useState(false);
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

  // Fetch map points from API
  const fetchMapPoints = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🗺️ Fetching map points from API...');
      
      const response = await mapPointsApi.getMapPoints({});
      console.log('✅ Fetched map points:', response);
      
      if (response.success && response.data && response.data.mapPoints) {
        // Convert API MapPoint format to local format
        const convertedPoints: MapPoint[] = response.data.mapPoints.map((apiPoint: APIMapPoint) => ({
          id: apiPoint._id,
          type: apiPoint.category, // map category to type for compatibility
          title: apiPoint.title,
          description: apiPoint.description,
          latitude: apiPoint.location.coordinates[1], // coordinates are [lng, lat]
          longitude: apiPoint.location.coordinates[0],
          addedBy: apiPoint.author.username,
          addedDate: new Date(apiPoint.createdAt).toISOString().split('T')[0],
          verified: (apiPoint.likesCount || 0) > 5, // Consider verified if has many likes
          rating: apiPoint.rating || 0,
          reviews: apiPoint.commentsCount || 0,
        }));
        
        setMapPoints(convertedPoints);
        console.log(`📍 Loaded ${convertedPoints.length} map points`);
      } else {
        // No map points available or response structure unexpected
        console.log('ℹ️ No map points found or unexpected response structure');
        setMapPoints([]);
      }
    } catch (err: any) {
      console.error('❌ Error fetching map points:', err);
      setError(err.message || 'Failed to load map points');
      // Don't show alert on error, just log it and show empty map
      console.log('ℹ️ Showing empty map, user can add new points');
      setMapPoints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch map points when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Screen focused, fetching map points...');
      fetchMapPoints();
    }, [fetchMapPoints])
  );

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
      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading map points...</Text>
          </View>
        </View>
      )}

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
        {selectedPoint && !showReviewsList && (
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
            
            {/* Rating Display */}
            <View style={styles.selectedPointFooter}>
              <View style={styles.selectedPointRatingContainer}>
                {selectedPoint.rating > 0 ? (
                  <>
                    <StarRating rating={selectedPoint.rating} size={18} />
                    <Text style={styles.selectedPointRatingText}>
                      {selectedPoint.rating.toFixed(1)}
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="star-outline" size={18} color={Colors.secondary400} />
                    <Text style={styles.selectedPointNoRating}>No ratings yet</Text>
                  </>
                )}
              </View>
              <View style={styles.selectedPointMetaInfo}>
                <View style={styles.selectedPointReviewsContainer}>
                  <Ionicons name="chatbox-outline" size={14} color={Colors.primary600} />
                  <Text style={styles.selectedPointReviews}>
                    {selectedPoint.reviews} {selectedPoint.reviews === 1 ? 'review' : 'reviews'}
                  </Text>
                </View>
                <View style={styles.selectedPointAuthorContainer}>
                  <Ionicons name="person-circle-outline" size={14} color={Colors.secondary400} />
                  <Text style={styles.selectedPointAddedBy}>{selectedPoint.addedBy}</Text>
                </View>
              </View>
            </View>

            {/* Review Actions */}
            <View style={styles.reviewActionsSection}>
              <Text style={styles.reviewActionsSectionTitle}>Reviews</Text>
              
              <View style={styles.reviewActionsContainer}>
                <TouchableOpacity
                  style={styles.reviewActionCard}
                  onPress={() => setShowReviewsList(true)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.reviewActionIconContainer, { backgroundColor: Colors.primary600 + '15' }]}>
                    <Ionicons name="chatbox-ellipses" size={26} color={Colors.primary600} />
                  </View>
                  <View style={styles.reviewActionContent}>
                    <Text style={styles.reviewActionTitle}>View All Reviews</Text>
                    <Text style={styles.reviewActionSubtitle}>
                      {selectedPoint.reviews} {selectedPoint.reviews === 1 ? 'review' : 'reviews'} available
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color={Colors.secondary400} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reviewActionCard, styles.writeReviewCard]}
                  onPress={() => setShowReviewModal(true)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.reviewActionIconContainer, { backgroundColor: Colors.warning + '15' }]}>
                    <Ionicons name="create" size={26} color={Colors.warning} />
                  </View>
                  <View style={styles.reviewActionContent}>
                    <Text style={styles.reviewActionTitle}>Write a Review</Text>
                    <Text style={styles.reviewActionSubtitle}>Share your experience</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color={Colors.secondary400} />
                </TouchableOpacity>
              </View>
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
          <MapPointCard 
            key={point.id} 
            point={point}
            onPress={() => {
              // Focus on the point on the map
              const newRegion = {
                latitude: point.latitude,
                longitude: point.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              };
              setRegion(newRegion);
              if (mapRef.current) {
                mapRef.current.animateToRegion(newRegion, 500);
              }
              // Select the point to show reviews
              setSelectedPoint(point);
            }}
          />
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

      {/* Reviews List Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showReviewsList}
        onRequestClose={() => setShowReviewsList(false)}
      >
        <View style={styles.reviewsModalOverlay}>
          <View style={styles.reviewsModalContent}>
            {/* Handle Bar */}
            <View style={styles.reviewsModalHandle} />
            
            {/* Header */}
            <View style={styles.reviewsModalHeader}>
              <Text style={styles.reviewsModalTitle}>
                {selectedPoint?.title}
              </Text>
              <TouchableOpacity
                onPress={() => setShowReviewsList(false)}
                style={styles.reviewsModalCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.secondary600} />
              </TouchableOpacity>
            </View>

            {/* Rating Summary */}
            {selectedPoint && (
              <View style={styles.reviewsModalRatingSummary}>
                <View style={styles.reviewsModalRatingDisplay}>
                  <Text style={styles.reviewsModalRatingNumber}>
                    {selectedPoint.rating > 0 ? selectedPoint.rating.toFixed(1) : 'N/A'}
                  </Text>
                  <StarRating rating={selectedPoint.rating} size={20} />
                  <Text style={styles.reviewsModalRatingCount}>
                    Based on {selectedPoint.reviews} {selectedPoint.reviews === 1 ? 'review' : 'reviews'}
                  </Text>
                </View>
              </View>
            )}

            {/* Reviews List */}
            <View style={styles.reviewsModalListContainer}>
              {selectedPoint && (
                <ReviewList
                  mapPointId={selectedPoint.id}
                  refreshTrigger={reviewRefresh}
                />
              )}
            </View>

            {/* Write Review Button */}
            <View style={styles.reviewsModalFooter}>
              <TouchableOpacity
                style={styles.reviewsModalWriteButton}
                onPress={() => {
                  setShowReviewsList(false);
                  setTimeout(() => setShowReviewModal(true), 300);
                }}
              >
                <Ionicons name="create" size={20} color={Colors.white} />
                <Text style={styles.reviewsModalWriteButtonText}>Write a Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Review Modal */}
      {selectedPoint && (
        <AddReviewModal
          visible={showReviewModal}
          mapPointId={selectedPoint.id}
          mapPointName={selectedPoint.title}
          onClose={() => setShowReviewModal(false)}
          onReviewAdded={() => {
            setShowReviewModal(false);
            setReviewRefresh(prev => prev + 1);
            // Optionally refresh map points to get updated ratings
            fetchMapPoints();
          }}
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.secondary700,
    fontWeight: '500',
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
    flexDirection: 'column',
    gap: 8,
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light200,
  },
  selectedPointRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedPointRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedPointRatingText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.warning,
  },
  selectedPointNoRating: {
    fontSize: 14,
    color: Colors.secondary400,
    fontStyle: 'italic',
  },
  selectedPointMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  selectedPointReviewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectedPointReviews: {
    fontSize: 12,
    color: Colors.primary600,
    fontWeight: '600',
  },
  selectedPointAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectedPointAddedBy: {
    fontSize: 12,
    color: Colors.secondary500,
    fontWeight: '500',
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
    alignItems: 'flex-end',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light200,
  },
  pointRatingSection: {
    flex: 1,
  },
  pointRatingWithStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.warning,
  },
  noRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  noRatingText: {
    fontSize: 12,
    color: Colors.secondary400,
    fontStyle: 'italic',
  },
  reviewCount: {
    fontSize: 11,
    color: Colors.secondary500,
    fontWeight: '500',
  },
  pointMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    fontSize: 11,
    color: Colors.secondary500,
    fontWeight: '500',
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
  // Review Actions Section
  reviewActionsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light200,
  },
  reviewActionsSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  reviewActionsContainer: {
    gap: 12,
  },
  reviewActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.light200,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  writeReviewCard: {
    borderColor: Colors.warning + '30',
    backgroundColor: Colors.warning + '05',
  },
  reviewActionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  reviewActionContent: {
    flex: 1,
  },
  reviewActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  reviewActionSubtitle: {
    fontSize: 13,
    color: Colors.secondary600,
    lineHeight: 18,
  },
  // Reviews Modal
  reviewsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  reviewsModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '80%',
  },
  reviewsModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.secondary400,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  reviewsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  reviewsModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    flex: 1,
    paddingRight: 12,
  },
  reviewsModalCloseButton: {
    padding: 4,
  },
  reviewsModalRatingSummary: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: Colors.secondary50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  reviewsModalRatingDisplay: {
    alignItems: 'center',
  },
  reviewsModalRatingNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.warning,
    marginBottom: 8,
  },
  reviewsModalRatingCount: {
    fontSize: 13,
    color: Colors.secondary600,
    marginTop: 8,
  },
  reviewsModalListContainer: {
    flex: 1,
  },
  reviewsModalFooter: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light200,
    backgroundColor: Colors.white,
  },
  reviewsModalWriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary600,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 10,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  reviewsModalWriteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
});
