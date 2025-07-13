import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CustomButton, ThemedText } from '@/components';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type: 'city' | 'beach' | 'mountain' | 'cultural' | 'wildlife' | 'airport' | 'station';
  description?: string;
}

interface Waypoint extends Location {
  order: number;
  isStartPoint?: boolean;
  isDestination?: boolean;
}

interface RouteSegment {
  from: Waypoint;
  to: Waypoint;
  distance: number;
  duration: number;
  coordinates: { latitude: number; longitude: number; }[];
  nearbyAttractions: AttractionPoint[];
}

interface AttractionPoint {
  id: string;
  name: string;
  type: 'temple' | 'estate' | 'bridge' | 'waterfall' | 'viewpoint' | 'museum' | 'market';
  coordinates: { latitude: number; longitude: number; };
  description: string;
  rating: number;
  distance: number; // km from route
  estimatedTime: string;
  icon: string;
}

interface GeneratedRoute {
  id: string;
  name: string;
  type: 'recommended' | 'shortest' | 'scenic';
  color: string;
  totalDistance: number;
  totalDuration: number;
  segments: RouteSegment[];
  coordinates: { latitude: number; longitude: number; }[];
  attractions: AttractionPoint[];
  highlights: string[];
}

// Mock locations database
const LOCATIONS: Location[] = [
  {
    id: 'colombo',
    name: 'Colombo',
    address: 'Colombo, Western Province',
    coordinates: { latitude: 6.9271, longitude: 79.8612 },
    type: 'city',
    description: 'Commercial capital of Sri Lanka',
  },
  {
    id: 'cmb_airport',
    name: 'Bandaranaike International Airport',
    address: 'Katunayake, Western Province',
    coordinates: { latitude: 7.1808, longitude: 79.8841 },
    type: 'airport',
    description: 'Main international airport',
  },
  {
    id: 'kandy',
    name: 'Kandy',
    address: 'Kandy, Central Province',
    coordinates: { latitude: 7.2936, longitude: 80.6417 },
    type: 'cultural',
    description: 'Cultural capital with Temple of Tooth',
  },
  {
    id: 'sigiriya',
    name: 'Sigiriya',
    address: 'Sigiriya, Central Province',
    coordinates: { latitude: 7.9568, longitude: 80.7603 },
    type: 'cultural',
    description: 'Ancient rock fortress',
  },
  {
    id: 'dambulla',
    name: 'Dambulla',
    address: 'Dambulla, Central Province',
    coordinates: { latitude: 7.8731, longitude: 80.6511 },
    type: 'cultural',
    description: 'Cave temple complex',
  },
  {
    id: 'nuwara_eliya',
    name: 'Nuwara Eliya',
    address: 'Nuwara Eliya, Central Province',
    coordinates: { latitude: 6.9497, longitude: 80.7891 },
    type: 'mountain',
    description: 'Hill station with tea plantations',
  },
  {
    id: 'ella',
    name: 'Ella',
    address: 'Ella, Uva Province',
    coordinates: { latitude: 6.8667, longitude: 81.0467 },
    type: 'mountain',
    description: 'Scenic hill station',
  },
  {
    id: 'galle',
    name: 'Galle',
    address: 'Galle, Southern Province',
    coordinates: { latitude: 6.0329, longitude: 80.2168 },
    type: 'cultural',
    description: 'Dutch colonial fort city',
  },
];

// Mock attractions near routes
const ATTRACTIONS: AttractionPoint[] = [
  {
    id: 'dambulla_cave',
    name: 'Dambulla Cave Temple',
    type: 'temple',
    coordinates: { latitude: 7.8731, longitude: 80.6511 },
    description: 'Ancient Buddhist cave temple with statues and paintings',
    rating: 4.6,
    distance: 2.5,
    estimatedTime: '2-3 hours',
    icon: 'business',
  },
  {
    id: 'pedro_estate',
    name: 'Pedro Tea Estate',
    type: 'estate',
    coordinates: { latitude: 6.9497, longitude: 80.7891 },
    description: 'Historic tea plantation with factory tours',
    rating: 4.4,
    distance: 1.8,
    estimatedTime: '1-2 hours',
    icon: 'leaf',
  },
  {
    id: 'nine_arch_bridge',
    name: 'Nine Arch Bridge',
    type: 'bridge',
    coordinates: { latitude: 6.8667, longitude: 81.0467 },
    description: 'Iconic railway bridge through tea plantations',
    rating: 4.8,
    distance: 0.5,
    estimatedTime: '30-45 minutes',
    icon: 'train',
  },
  {
    id: 'royal_botanical',
    name: 'Royal Botanical Gardens',
    type: 'viewpoint',
    coordinates: { latitude: 7.2736, longitude: 80.5986 },
    description: 'Beautiful botanical gardens with rare plants',
    rating: 4.5,
    distance: 3.2,
    estimatedTime: '2-3 hours',
    icon: 'flower',
  },
];

// Planning steps
type PlanningStep = 'start-point' | 'destination' | 'waypoints' | 'route-generation' | 'route-comparison';

export default function RouteSelectionScreen() {
  const params = useLocalSearchParams();
  const initialDestination = params.destination as string;

  // Planning state
  const [currentStep, setCurrentStep] = useState<PlanningStep>('start-point');
  const [startPoint, setStartPoint] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [waypoints, setWaypoints] = useState<Location[]>([]);
  const [generatedRoutes, setGeneratedRoutes] = useState<GeneratedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<GeneratedRoute | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState(initialDestination || '');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchType, setSearchType] = useState<'start' | 'destination' | 'waypoint'>('start');
  const [showRouteComparison, setShowRouteComparison] = useState(false);

  // Map state
  const [mapRegion, setMapRegion] = useState({
    latitude: 7.8731,
    longitude: 80.7718,
    latitudeDelta: 3.0,
    longitudeDelta: 3.0,
  });

  const filteredLocations = LOCATIONS.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLocationSelect = (location: Location) => {
    switch (searchType) {
      case 'start':
        setStartPoint(location);
        setCurrentStep('destination');
        break;
      case 'destination':
        setDestination(location);
        setCurrentStep('waypoints');
        break;
      case 'waypoint':
        if (!waypoints.find(w => w.id === location.id)) {
          setWaypoints([...waypoints, location]);
        }
        break;
    }
    setSearchQuery('');
    setShowLocationModal(false);
  };

  const handleRemoveWaypoint = (locationId: string) => {
    setWaypoints(waypoints.filter(w => w.id !== locationId));
  };

  const generateRoutes = () => {
    if (!startPoint || !destination) return;

    // Create ordered waypoints
    const orderedWaypoints: Waypoint[] = [
      { ...startPoint, order: 0, isStartPoint: true },
      ...waypoints.map((wp, index) => ({ ...wp, order: index + 1 })),
      { ...destination, order: waypoints.length + 1, isDestination: true },
    ];

    // Mock route generation - in real app, this would call a routing API
    const routes: GeneratedRoute[] = [
      {
        id: 'recommended',
        name: 'Recommended Route',
        type: 'recommended',
        color: '#3B82F6', // Blue
        totalDistance: 285,
        totalDuration: 420, // minutes
        segments: mockGenerateSegments(orderedWaypoints),
        coordinates: mockGenerateCoordinates(orderedWaypoints),
        attractions: ATTRACTIONS.filter(attr => 
          orderedWaypoints.some(wp => 
            calculateDistance(wp.coordinates, attr.coordinates) < 25
          )
        ),
        highlights: ['Scenic views', 'Cultural sites', 'Photo opportunities'],
      },
      {
        id: 'shortest',
        name: 'Shortest Route',
        type: 'shortest',
        color: '#10B981', // Green
        totalDistance: 245,
        totalDuration: 360,
        segments: mockGenerateSegments(orderedWaypoints),
        coordinates: mockGenerateCoordinates(orderedWaypoints),
        attractions: ATTRACTIONS.filter(attr => 
          orderedWaypoints.some(wp => 
            calculateDistance(wp.coordinates, attr.coordinates) < 15
          )
        ),
        highlights: ['Fastest route', 'Main highways', 'Less stops'],
      },
      {
        id: 'scenic',
        name: 'Scenic Route',
        type: 'scenic',
        color: '#F59E0B', // Orange
        totalDistance: 320,
        totalDuration: 480,
        segments: mockGenerateSegments(orderedWaypoints),
        coordinates: mockGenerateCoordinates(orderedWaypoints),
        attractions: ATTRACTIONS,
        highlights: ['Mountain views', 'Tea plantations', 'Waterfalls'],
      },
    ];

    setGeneratedRoutes(routes);
    setSelectedRoute(routes[0]);
    setCurrentStep('route-comparison');
    setShowRouteComparison(true);
  };

  const mockGenerateSegments = (waypoints: Waypoint[]): RouteSegment[] => {
    const segments: RouteSegment[] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];
      const distance = calculateDistance(from.coordinates, to.coordinates);
      
      segments.push({
        from,
        to,
        distance,
        duration: distance * 1.5, // Rough estimate
        coordinates: [from.coordinates, to.coordinates],
        nearbyAttractions: ATTRACTIONS.filter(attr =>
          calculateDistance(from.coordinates, attr.coordinates) < 15 ||
          calculateDistance(to.coordinates, attr.coordinates) < 15
        ),
      });
    }
    return segments;
  };

  const mockGenerateCoordinates = (waypoints: Waypoint[]) => {
    return waypoints.map(wp => wp.coordinates);
  };

  const calculateDistance = (coord1: { latitude: number; longitude: number }, coord2: { latitude: number; longitude: number }) => {
    const R = 6371; // km
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleContinue = () => {
    if (!selectedRoute) return;
    
    router.push({
      pathname: '/planning/accommodation' as any,
      params: {
        route: JSON.stringify(selectedRoute),
        startPoint: JSON.stringify(startPoint),
        destination: JSON.stringify(destination),
        waypoints: JSON.stringify(waypoints),
      }
    });
  };

  const getStepIcon = (step: PlanningStep) => {
    switch (step) {
      case 'start-point': return 'location';
      case 'destination': return 'flag';
      case 'waypoints': return 'add-circle';
      case 'route-generation': return 'map';
      case 'route-comparison': return 'analytics';
      default: return 'help';
    }
  };

  const getStepTitle = (step: PlanningStep) => {
    switch (step) {
      case 'start-point': return 'Select Starting Point';
      case 'destination': return 'Select Destination';
      case 'waypoints': return 'Add Waypoints (Optional)';
      case 'route-generation': return 'Generate Routes';
      case 'route-comparison': return 'Compare Routes';
      default: return 'Route Planning';
    }
  };

  const getLocationTypeIcon = (type: string) => {
    switch (type) {
      case 'city': return 'business';
      case 'beach': return 'water';
      case 'mountain': return 'mountain';
      case 'cultural': return 'library';
      case 'wildlife': return 'leaf';
      case 'airport': return 'airplane';
      case 'station': return 'train';
      default: return 'location';
    }
  };

  const getLocationTypeColor = (type: string) => {
    switch (type) {
      case 'city': return Colors.primary600;
      case 'beach': return Colors.secondary600;
      case 'mountain': return Colors.success;
      case 'cultural': return Colors.warning;
      case 'wildlife': return Colors.primary500;
      case 'airport': return Colors.secondary500;
      case 'station': return Colors.primary700;
      default: return Colors.secondary400;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <ThemedText variant="subtitle" style={styles.headerTitle}>
          Route Planning
        </ThemedText>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        {(['start-point', 'destination', 'waypoints', 'route-generation', 'route-comparison'] as PlanningStep[]).map((step, index) => (
          <View key={step} style={styles.progressStep}>
            <View style={[
              styles.stepCircle,
              currentStep === step && styles.activeStepCircle,
              index < (['start-point', 'destination', 'waypoints', 'route-generation', 'route-comparison'] as PlanningStep[]).indexOf(currentStep) && styles.completedStepCircle
            ]}>
              <Ionicons 
                name={getStepIcon(step) as any} 
                size={16} 
                color={
                  currentStep === step ? Colors.white :
                  index < (['start-point', 'destination', 'waypoints', 'route-generation', 'route-comparison'] as PlanningStep[]).indexOf(currentStep) ? Colors.white :
                  Colors.secondary400
                } 
              />
            </View>
            <ThemedText style={[
              styles.stepText,
              currentStep === step && styles.activeStepText
            ]}>
              {step === 'start-point' ? 'Start' :
               step === 'destination' ? 'Destination' :
               step === 'waypoints' ? 'Waypoints' :
               step === 'route-generation' ? 'Generate' :
               'Compare'}
            </ThemedText>
          </View>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step Content */}
        <View style={styles.stepContent}>
          <ThemedText variant="subtitle" style={styles.stepTitle}>
            {getStepTitle(currentStep)}
          </ThemedText>
          
          {currentStep === 'start-point' && (
            <View style={styles.locationStep}>
              <ThemedText style={styles.stepDescription}>
                Where would you like to start your journey?
              </ThemedText>
              
              {startPoint ? (
                <View style={styles.selectedLocationCard}>
                  <View style={styles.selectedLocationInfo}>
                    <View style={[styles.locationTypeIcon, { backgroundColor: getLocationTypeColor(startPoint.type) + '20' }]}>
                      <Ionicons 
                        name={getLocationTypeIcon(startPoint.type) as any} 
                        size={18} 
                        color={getLocationTypeColor(startPoint.type)} 
                      />
                    </View>
                    <View style={styles.locationDetails}>
                      <ThemedText variant="subtitle">{startPoint.name}</ThemedText>
                      <ThemedText variant="caption" style={styles.locationAddress}>
                        {startPoint.address}
                      </ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setStartPoint(null)}>
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.selectLocationButton}
                  onPress={() => {
                    setSearchType('start');
                    setShowLocationModal(true);
                  }}
                >
                  <Ionicons name="location" size={20} color={Colors.primary600} />
                  <ThemedText style={styles.selectLocationText}>Select Starting Point</ThemedText>
                </TouchableOpacity>
              )}
              
              {startPoint && (
                <CustomButton
                  title="Continue to Destination"
                  onPress={() => setCurrentStep('destination')}
                  variant="primary"
                  style={styles.stepButton}
                />
              )}
            </View>
          )}

          {currentStep === 'destination' && (
            <View style={styles.locationStep}>
              <ThemedText style={styles.stepDescription}>
                Where would you like to end your journey?
              </ThemedText>
              
              {destination ? (
                <View style={styles.selectedLocationCard}>
                  <View style={styles.selectedLocationInfo}>
                    <View style={[styles.locationTypeIcon, { backgroundColor: getLocationTypeColor(destination.type) + '20' }]}>
                      <Ionicons 
                        name={getLocationTypeIcon(destination.type) as any} 
                        size={18} 
                        color={getLocationTypeColor(destination.type)} 
                      />
                    </View>
                    <View style={styles.locationDetails}>
                      <ThemedText variant="subtitle">{destination.name}</ThemedText>
                      <ThemedText variant="caption" style={styles.locationAddress}>
                        {destination.address}
                      </ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setDestination(null)}>
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.selectLocationButton}
                  onPress={() => {
                    setSearchType('destination');
                    setShowLocationModal(true);
                  }}
                >
                  <Ionicons name="flag" size={20} color={Colors.primary600} />
                  <ThemedText style={styles.selectLocationText}>Select Destination</ThemedText>
                </TouchableOpacity>
              )}
              
              {destination && (
                <CustomButton
                  title="Continue to Waypoints"
                  onPress={() => setCurrentStep('waypoints')}
                  variant="primary"
                  style={styles.stepButton}
                />
              )}
            </View>
          )}

          {currentStep === 'waypoints' && (
            <View style={styles.waypointsStep}>
              <ThemedText style={styles.stepDescription}>
                Add optional stops along your route to make your journey more interesting.
              </ThemedText>
              
              {waypoints.length > 0 && (
                <View style={styles.waypointsList}>
                  <ThemedText variant="subtitle" style={styles.waypointsTitle}>
                    Waypoints ({waypoints.length})
                  </ThemedText>
                  {waypoints.map((waypoint, index) => (
                    <View key={waypoint.id} style={styles.waypointCard}>
                      <View style={styles.waypointInfo}>
                        <View style={[styles.locationTypeIcon, { backgroundColor: getLocationTypeColor(waypoint.type) + '20' }]}>
                          <Ionicons 
                            name={getLocationTypeIcon(waypoint.type) as any} 
                            size={16} 
                            color={getLocationTypeColor(waypoint.type)} 
                          />
                        </View>
                        <View style={styles.locationDetails}>
                          <ThemedText variant="subtitle">{waypoint.name}</ThemedText>
                          <ThemedText variant="caption" style={styles.locationAddress}>
                            {waypoint.address}
                          </ThemedText>
                        </View>
                        <View style={styles.waypointOrder}>
                          <ThemedText style={styles.waypointOrderText}>{index + 1}</ThemedText>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveWaypoint(waypoint.id)}>
                        <Ionicons name="close-circle" size={20} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.addWaypointButton}
                onPress={() => {
                  setSearchType('waypoint');
                  setShowLocationModal(true);
                }}
              >
                <Ionicons name="add-circle" size={20} color={Colors.primary600} />
                <ThemedText style={styles.addWaypointText}>Add Waypoint</ThemedText>
              </TouchableOpacity>
              
              <View style={styles.waypointActions}>
                <CustomButton
                  title="Skip & Generate Routes"
                  onPress={generateRoutes}
                  variant="secondary"
                  style={styles.skipButton}
                />
                <CustomButton
                  title="Generate Routes"
                  onPress={generateRoutes}
                  variant="primary"
                  style={styles.generateButton}
                />
              </View>
            </View>
          )}

          {currentStep === 'route-comparison' && showRouteComparison && (
            <View style={styles.routeComparison}>
              {/* Map showing all routes */}
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  region={mapRegion}
                  onRegionChangeComplete={setMapRegion}
                  showsUserLocation={false}
                  showsCompass={true}
                  toolbarEnabled={false}
                >
                  {/* Start point marker */}
                  {startPoint && (
                    <Marker
                      coordinate={startPoint.coordinates}
                      title={startPoint.name}
                      description="Starting Point"
                      pinColor={Colors.success}
                    />
                  )}
                  
                  {/* Destination marker */}
                  {destination && (
                    <Marker
                      coordinate={destination.coordinates}
                      title={destination.name}
                      description="Destination"
                      pinColor={Colors.error}
                    />
                  )}
                  
                  {/* Waypoint markers */}
                  {waypoints.map((waypoint, index) => (
                    <Marker
                      key={waypoint.id}
                      coordinate={waypoint.coordinates}
                      title={waypoint.name}
                      description={`Waypoint ${index + 1}`}
                      pinColor={Colors.warning}
                    />
                  ))}
                  
                  {/* Route polylines */}
                  {generatedRoutes.map((route) => (
                    <Polyline
                      key={route.id}
                      coordinates={route.coordinates}
                      strokeColor={route.color}
                      strokeWidth={selectedRoute?.id === route.id ? 4 : 2}
                    />
                  ))}
                  
                  {/* Attraction markers */}
                  {selectedRoute?.attractions.map((attraction) => (
                    <Marker
                      key={attraction.id}
                      coordinate={attraction.coordinates}
                      title={attraction.name}
                      description={attraction.description}
                    >
                      <View style={styles.attractionMarker}>
                        <Ionicons name={attraction.icon as any} size={16} color={Colors.white} />
                      </View>
                    </Marker>
                  ))}
                </MapView>
              </View>
              
              {/* Route options */}
              <View style={styles.routeOptions}>
                <ThemedText variant="subtitle" style={styles.routeOptionsTitle}>
                  Compare Route Options
                </ThemedText>
                
                {generatedRoutes.map((route) => (
                  <TouchableOpacity
                    key={route.id}
                    style={[
                      styles.routeCard,
                      selectedRoute?.id === route.id && styles.selectedRouteCard
                    ]}
                    onPress={() => setSelectedRoute(route)}
                  >
                    <View style={styles.routeHeader}>
                      <View style={styles.routeInfo}>
                        <View style={[styles.routeTypeIndicator, { backgroundColor: route.color }]} />
                        <ThemedText variant="subtitle">{route.name}</ThemedText>
                      </View>
                      {selectedRoute?.id === route.id && (
                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary600} />
                      )}
                    </View>
                    
                    <View style={styles.routeStats}>
                      <View style={styles.routeStat}>
                        <Ionicons name="location" size={16} color={Colors.secondary400} />
                        <ThemedText variant="caption">{route.totalDistance} km</ThemedText>
                      </View>
                      <View style={styles.routeStat}>
                        <Ionicons name="time" size={16} color={Colors.secondary400} />
                        <ThemedText variant="caption">{Math.round(route.totalDuration / 60)} hrs</ThemedText>
                      </View>
                      <View style={styles.routeStat}>
                        <Ionicons name="camera" size={16} color={Colors.secondary400} />
                        <ThemedText variant="caption">{route.attractions.length} attractions</ThemedText>
                      </View>
                    </View>
                    
                    <View style={styles.routeHighlights}>
                      {route.highlights.map((highlight, index) => (
                        <View key={index} style={styles.highlightChip}>
                          <ThemedText style={styles.highlightChipText}>{highlight}</ThemedText>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              
              {selectedRoute && (
                <CustomButton
                  title="Continue with Selected Route"
                  onPress={handleContinue}
                  variant="primary"
                  style={styles.continueRouteButton}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText variant="subtitle" style={styles.modalTitle}>
              {searchType === 'start' ? 'Select Starting Point' :
               searchType === 'destination' ? 'Select Destination' :
               'Add Waypoint'}
            </ThemedText>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.modalSearchContainer}>
              <Ionicons name="search" size={20} color={Colors.secondary400} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search locations..."
                placeholderTextColor={Colors.secondary400}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={Colors.secondary400} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredLocations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.locationOption}
                  onPress={() => handleLocationSelect(item)}
                >
                  <View style={styles.locationOptionContent}>
                    <View style={[styles.locationTypeIcon, { backgroundColor: getLocationTypeColor(item.type) + '20' }]}>
                      <Ionicons 
                        name={getLocationTypeIcon(item.type) as any} 
                        size={18} 
                        color={getLocationTypeColor(item.type)} 
                      />
                    </View>
                    <View style={styles.locationDetails}>
                      <ThemedText variant="subtitle">{item.name}</ThemedText>
                      <ThemedText variant="caption" style={styles.locationAddress}>
                        {item.address}
                      </ThemedText>
                      {item.description && (
                        <ThemedText variant="caption" style={styles.locationDescription}>
                          {item.description}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </SafeAreaView>
      </Modal>
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
  
  // Progress Steps
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activeStepCircle: {
    backgroundColor: Colors.primary600,
  },
  completedStepCircle: {
    backgroundColor: Colors.success,
  },
  stepText: {
    fontSize: 10,
    color: Colors.secondary400,
    fontWeight: '500',
  },
  activeStepText: {
    color: Colors.primary600,
    fontWeight: '600',
  },
  
  // Content
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
    marginBottom: 24,
  },
  
  // Location Steps
  locationStep: {
    flex: 1,
  },
  selectedLocationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary300,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: 2,
  },
  selectLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.primary300,
    borderStyle: 'dashed',
  },
  selectLocationText: {
    fontSize: 16,
    color: Colors.primary600,
    fontWeight: '500',
    marginLeft: 8,
  },
  stepButton: {
    marginTop: 'auto',
  },
  
  // Waypoints Step
  waypointsStep: {
    flex: 1,
  },
  waypointsList: {
    marginBottom: 24,
  },
  waypointsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },
  waypointCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waypointInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  waypointOrder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  waypointOrderText: {
    fontSize: 10,
    color: Colors.primary600,
    fontWeight: '600',
  },
  addWaypointButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.primary300,
    borderStyle: 'dashed',
  },
  addWaypointText: {
    fontSize: 16,
    color: Colors.primary600,
    fontWeight: '500',
    marginLeft: 8,
  },
  waypointActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  skipButton: {
    flex: 1,
  },
  generateButton: {
    flex: 2,
  },
  
  // Route Comparison
  routeComparison: {
    flex: 1,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  attractionMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeOptions: {
    marginBottom: 20,
  },
  routeOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },
  routeCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  selectedRouteCard: {
    borderColor: Colors.primary600,
    borderWidth: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeTypeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeHighlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  highlightChip: {
    backgroundColor: Colors.secondary200,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  highlightChipText: {
    fontSize: 10,
    color: Colors.secondary600,
    fontWeight: '500',
  },
  continueRouteButton: {
    marginTop: 'auto',
  },
  
  // Modal Styles
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
    color: Colors.primary600,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
    marginLeft: 12,
  },
  locationOption: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  locationOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDescription: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: 4,
  },
});
