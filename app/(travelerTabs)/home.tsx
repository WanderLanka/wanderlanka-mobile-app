import * as React from 'react';

import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { CustomButton, CustomTextInput, ThemedText } from '../../components';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { Colors } from '../../constants/Colors';
import { DestinationCard } from '../../components/DestinationCard';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { TopBar } from '@/components/TopBar';
import { myTripsApi } from '../../utils/itineraryApi';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 'AIzaSyBPAjLGZlFyzwIRo60j3HlhR7Qp0pmqQQ8';

interface MyTripsData {
  savedPlans: {
    count: number;
    trips: any[];
  };
  unfinished: {
    count: number;
    trips: any[];
  };
  upcoming: {
    count: number;
    trips: any[];
  };
}

interface Place {
  type: 'place' | 'activity' | 'guide';
  name: string;
  category: string;
  icon: string;
  placeId?: string;
  rating?: number;
  address?: string;
}

interface PlaceDetails {
  placeId: string;
  name: string;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
  photoReference?: string;
  openingHours?: {
    openNow?: boolean;
    weekdayText?: string[];
  };
  formattedPhoneNumber?: string;
  website?: string;
  priceLevel?: number;
  vicinity?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export default function TravelerHomeScreen() {
  const [destination, setDestination] = useState('');
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [myTripsData, setMyTripsData] = useState<MyTripsData | null>(null);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [popularPlaces, setPopularPlaces] = useState<Place[]>([]);
  const [activities, setActivities] = useState<Place[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState<PlaceDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Trending destinations state
  const [trendingDestinations, setTrendingDestinations] = useState<any[]>([]);
  const [localFavorites, setLocalFavorites] = useState<any[]>([]);
  const [hiddenGems, setHiddenGems] = useState<any[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [isLoadingLocalFavorites, setIsLoadingLocalFavorites] = useState(false);
  const [isLoadingHiddenGems, setIsLoadingHiddenGems] = useState(false);
  
  const insets = useSafeAreaInsets();

  // Fetch my trips data when screen focuses
  useFocusEffect(
    useCallback(() => {
      fetchMyTrips();
    }, [])
  );

  // Fetch popular places when search modal opens
  useEffect(() => {
    if (isSearchModalVisible && popularPlaces.length === 0) {
      fetchPopularPlaces();
    }
  }, [isSearchModalVisible]);

  // Fetch trending destinations on component mount
  useEffect(() => {
    fetchTrendingDestinations();
    fetchLocalFavorites();
    fetchHiddenGems();
  }, []);

  const fetchMyTrips = async () => {
    try {
      setIsLoadingTrips(true);
      console.log('🔄 Fetching my trips...');
      const response = await myTripsApi.getMyTrips();
      
      if (response.success && response.data) {
        console.log('✅ My trips loaded:', response.data.summary);
        setMyTripsData(response.data);
      }
    } catch (error: any) {
      console.error('❌ Error fetching my trips:', error);
      // Don't show alert for auth errors, user might not be logged in
      if (error.message && !error.message.includes('auth')) {
        Alert.alert('Error', 'Failed to load your trips');
      }
    } finally {
      setIsLoadingTrips(false);
    }
  };

  const fetchPopularPlaces = async () => {
    try {
      setIsLoadingPlaces(true);
      console.log('🔍 Fetching popular places...');
      
      // Use fallback data instead of API for now (API key issue)
      // TODO: Configure proper Google Places API key or use backend proxy
      setPopularPlaces([
        { type: 'place', name: 'Galle Fort', category: 'Historic Site', icon: 'location', placeId: 'galle_fort' },
        { type: 'place', name: 'Temple of the Tooth', category: 'Religious Site', icon: 'location', placeId: 'kandy_temple' },
        { type: 'place', name: 'Ella Rock', category: 'Hiking Spot', icon: 'location', placeId: 'ella_rock' },
        { type: 'place', name: 'Sigiriya Rock Fortress', category: 'Ancient Wonder', icon: 'location', placeId: 'sigiriya' },
        { type: 'place', name: 'Mirissa Beach', category: 'Beach', icon: 'location', placeId: 'mirissa' },
        { type: 'place', name: 'Yala National Park', category: 'Wildlife', icon: 'location', placeId: 'yala' },
      ]);
      setActivities([
        { type: 'activity', name: 'Whale Watching', category: 'Adventure', icon: 'boat', placeId: 'whale_watching' },
        { type: 'activity', name: 'Safari Tour', category: 'Wildlife', icon: 'paw', placeId: 'safari' },
        { type: 'activity', name: 'Tea Plantation Tours', category: 'Cultural', icon: 'leaf', placeId: 'tea_tours' },
        { type: 'activity', name: 'Mountain Hiking', category: 'Adventure', icon: 'walk', placeId: 'hiking' },
        { type: 'activity', name: 'Surfing Lessons', category: 'Water Sports', icon: 'water', placeId: 'surfing' },
        { type: 'activity', name: 'Photography Tours', category: 'Creative', icon: 'camera', placeId: 'photography' },
      ]);
      console.log('✅ Loaded popular places and activities');
      
    } catch (error: any) {
      console.error('❌ Error fetching places:', error);
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  // Search places using Google Places API Text Search
  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      console.log('🔍 Searching for:', query);
      
      // Use Text Search API for broader search
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' in Sri Lanka')}&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      console.log('📍 Search API response status:', data.status);
      
      if (data.status === 'OK' && data.results) {
        const places: Place[] = data.results.slice(0, 10).map((place: any) => ({
          type: 'place' as const,
          name: place.name,
          category: place.types?.[0]?.replace(/_/g, ' ') || 'Place',
          icon: 'location',
          placeId: place.place_id,
          rating: place.rating,
          address: place.formatted_address,
        }));
        
        setSearchResults(places);
        console.log(`✅ Found ${places.length} places`);
      } else if (data.status === 'ZERO_RESULTS') {
        setSearchResults([]);
        console.log('⚠️ No results found');
      } else {
        console.warn('⚠️ Search API error:', data.status, data.error_message);
        setSearchResults([]);
      }
      
    } catch (error: any) {
      console.error('❌ Error searching places:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch detailed information using Google Places Details API
  const fetchPlaceDetails = async (placeId: string) => {
    try {
      setIsLoadingDetails(true);
      console.log('🔍 Fetching details for place ID:', placeId);
      
      // Use Places Details API
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,opening_hours,rating,user_ratings_total,price_level,website,photos,types,geometry,vicinity&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(detailsUrl);
      const data = await response.json();
      
      console.log('📍 Details API response status:', data.status);
      
      if (data.status === 'OK' && data.result) {
        const result = data.result;
        
        const details: PlaceDetails = {
          placeId: placeId,
          name: result.name,
          address: result.formatted_address || result.vicinity,
          rating: result.rating,
          userRatingsTotal: result.user_ratings_total,
          types: result.types?.slice(0, 3).map((type: string) => type.replace(/_/g, ' ')),
          photoReference: result.photos?.[0]?.photo_reference,
          openingHours: result.opening_hours ? {
            openNow: result.opening_hours.open_now,
            weekdayText: result.opening_hours.weekday_text,
          } : undefined,
          formattedPhoneNumber: result.formatted_phone_number,
          website: result.website,
          priceLevel: result.price_level,
          vicinity: result.vicinity,
          geometry: result.geometry,
        };
        
        setSelectedPlaceDetails(details);
        console.log('✅ Loaded place details:', details.name);
      } else {
        console.warn('⚠️ Details API error:', data.status, data.error_message);
        Alert.alert('Error', 'Could not load place details');
        setSelectedPlaceDetails(null);
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching place details:', error);
      Alert.alert('Error', 'Failed to load place details');
      setSelectedPlaceDetails(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleStartPlanning = () => {
    if (destination.trim()) {
      router.push({
        pathname: '/planning/route-selection' as any,
        params: { destination: destination.trim() }
      });
    } else {
      router.push('/planning/route-selection' as any);
    }
  };

  const handlePlaceSelect = async (placeName: string, placeId?: string) => {
    setDestination(placeName);
    
    // If placeId looks like a fake ID (no underscores in real Google Place IDs after 'ChIJ')
    // or is just a simple string, search for the real place ID first
    if (placeId && !placeId.startsWith('ChIJ')) {
      console.log('🔍 Searching for real place ID for:', placeName);
      try {
        // Search for the place to get real place ID
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(placeName + ' Sri Lanka')}&key=${GOOGLE_PLACES_API_KEY}`;
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const realPlaceId = data.results[0].place_id;
          console.log('✅ Found real place ID:', realPlaceId);
          // Navigate to full-screen place details
          router.push({
            pathname: '/place-details/[placeId]' as any,
            params: { placeId: realPlaceId, placeName: placeName }
          });
        } else {
          console.warn('⚠️ Could not find place:', placeName);
          Alert.alert('Info', `Could not find details for ${placeName}`);
        }
      } catch (error) {
        console.error('❌ Error searching for place:', error);
      }
    } else if (placeId) {
      // Real Google Place ID, navigate to full-screen details directly
      router.push({
        pathname: '/place-details/[placeId]' as any,
        params: { placeId: placeId, placeName: placeName }
      });
    }
  };

  const handleSearchConfirm = () => {
    searchPlaces(searchQuery);
  };

  const openSearchModal = () => {
    setIsSearchModalVisible(true);
    setSearchQuery(destination);
  };

  const closeSearchModal = () => {
    setIsSearchModalVisible(false);
    setSearchResults([]);
  };

  // Fetch Trending Destinations using Google Places API
  const fetchTrendingDestinations = async () => {
    try {
      setIsLoadingTrending(true);
      console.log('🔍 Fetching trending destinations...');
      
      // Search for top tourist attractions in Sri Lanka
      const queries = ['tourist attractions Sri Lanka', 'popular destinations Sri Lanka'];
      const allResults: any[] = [];
      
      for (const query of queries) {
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.status === 'OK' && data.results) {
          allResults.push(...data.results);
        }
      }
      
      // Remove duplicates and get top rated places
      const uniquePlaces = Array.from(new Map(allResults.map(item => [item.place_id, item])).values());
      const topPlaces = uniquePlaces
        .filter(place => place.rating && place.rating >= 4.0)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 6);
      
      const destinations = topPlaces.map(place => ({
        title: place.name,
        desc: place.types?.[0]?.replace(/_/g, ' ') || 'Tourist Attraction',
        img: place.photos?.[0]?.photo_reference 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
          : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        placeId: place.place_id,
        rating: place.rating,
      }));
      
      setTrendingDestinations(destinations);
      console.log('✅ Loaded trending destinations:', destinations.length);
      
    } catch (error: any) {
      console.error('❌ Error fetching trending destinations:', error);
    } finally {
      setIsLoadingTrending(false);
    }
  };

  // Fetch Local Favorites
  const fetchLocalFavorites = async () => {
    try {
      setIsLoadingLocalFavorites(true);
      console.log('🔍 Fetching local favorites...');
      
      // Search for local favorite places
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent('local restaurants markets Sri Lanka')}&key=${GOOGLE_PLACES_API_KEY}`;
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results) {
        const favorites = data.results
          .filter((place: any) => place.rating && place.rating >= 4.0)
          .slice(0, 6)
          .map((place: any) => ({
            title: place.name,
            desc: place.vicinity || place.formatted_address?.split(',')[0] || 'Local Spot',
            img: place.photos?.[0]?.photo_reference 
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
              : 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
            placeId: place.place_id,
            rating: place.rating,
          }));
        
        setLocalFavorites(favorites);
        console.log('✅ Loaded local favorites:', favorites.length);
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching local favorites:', error);
    } finally {
      setIsLoadingLocalFavorites(false);
    }
  };

  // Fetch Hidden Gems
  const fetchHiddenGems = async () => {
    try {
      setIsLoadingHiddenGems(true);
      console.log('🔍 Fetching hidden gems...');
      
      // Search for lesser-known but highly rated places
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent('scenic spots viewpoints Sri Lanka')}&key=${GOOGLE_PLACES_API_KEY}`;
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results) {
        const gems = data.results
          .filter((place: any) => place.rating && place.rating >= 4.2)
          .slice(0, 6)
          .map((place: any) => ({
            title: place.name,
            desc: place.types?.[0]?.replace(/_/g, ' ') || 'Scenic Spot',
            img: place.photos?.[0]?.photo_reference 
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
              : 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
            placeId: place.place_id,
            rating: place.rating,
          }));
        
        setHiddenGems(gems);
        console.log('✅ Loaded hidden gems:', gems.length);
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching hidden gems:', error);
    } finally {
      setIsLoadingHiddenGems(false);
    }
  };

  // Mock search suggestions with different categories
  const searchSuggestions = [
    // Places
    { type: 'place', name: 'Galle Fort', category: 'Historic Site', icon: 'location' },
    { type: 'place', name: 'Kandy Temple', category: 'Religious Site', icon: 'location' },
    { type: 'place', name: 'Ella Rock', category: 'Hiking Spot', icon: 'location' },
    { type: 'place', name: 'Sigiriya Rock', category: 'Ancient Wonder', icon: 'location' },
    { type: 'place', name: 'Mirissa Beach', category: 'Beach', icon: 'location' },
    // Activities
    { type: 'activity', name: 'Whale Watching', category: 'Adventure', icon: 'boat' },
    { type: 'activity', name: 'Tea Plantation Tour', category: 'Cultural', icon: 'leaf' },
    { type: 'activity', name: 'Safari Experience', category: 'Wildlife', icon: 'paw' },
    // People/Guides
    { type: 'guide', name: 'Local Guide Nimal', category: 'Tour Guide', icon: 'person' },
    { type: 'guide', name: 'Cultural Expert Saman', category: 'Heritage Guide', icon: 'person' },
  ];

  const filteredSuggestions = searchSuggestions.filter(suggestion =>
    suggestion.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    suggestion.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <StatusBar style="light" translucent />

      <TopBar
        onProfilePress={() => {}}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.greetingContainer}>
          <ThemedText variant="title" style={styles.greeting}>Welcome Machan!</ThemedText>
          <ThemedText variant="caption" style={styles.caption}>Explore Sri Lanka With Us!</ThemedText>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchCard}>
            <View style={styles.searchInputWrapper}>
              <Pressable onPress={openSearchModal} style={styles.searchInputPressable}>
                <View style={styles.searchInputDisplay}>
                  <Ionicons name="search" size={20} color={Colors.primary600} style={styles.searchIcon} />
                  <ThemedText style={[styles.searchPlaceholder, {color: destination ? Colors.primary700 : Colors.secondary400}]}>
                    {destination || "Search places, people, activities..."}
                  </ThemedText>
                </View>
              </Pressable>
            </View>
            
            {/* <CustomButton
              variant='primary'
              size='medium'
              title="Start Planning"
              style={styles.searchButton}
              onPress={handleStartPlanning}
            /> */}
          </View>

          {/* Place Details Section */}
          {selectedPlaceDetails && (
            <View style={styles.placeDetailsCard}>
              <View style={styles.placeDetailsHeader}>
                <View style={styles.placeDetailsHeaderLeft}>
                  <Ionicons name="location" size={24} color={Colors.primary600} />
                  <ThemedText variant="subtitle" style={styles.placeDetailsName}>
                    {selectedPlaceDetails.name}
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={() => setSelectedPlaceDetails(null)}>
                  <Ionicons name="close-circle" size={24} color={Colors.secondary400} />
                </TouchableOpacity>
              </View>

              {selectedPlaceDetails.rating && (
                <View style={styles.placeDetailsRating}>
                  <Ionicons name="star" size={16} color={Colors.warning} />
                  <ThemedText style={styles.ratingText}>
                    {selectedPlaceDetails.rating.toFixed(1)}
                    {selectedPlaceDetails.userRatingsTotal && (
                      <ThemedText style={styles.ratingsCount}> ({selectedPlaceDetails.userRatingsTotal} reviews)</ThemedText>
                    )}
                  </ThemedText>
                </View>
              )}

              {selectedPlaceDetails.openingHours && (
                <View style={styles.placeDetailsRow}>
                  <Ionicons 
                    name={selectedPlaceDetails.openingHours.openNow ? "time" : "time-outline"} 
                    size={16} 
                    color={selectedPlaceDetails.openingHours.openNow ? Colors.success : Colors.error} 
                  />
                  <ThemedText style={[
                    styles.placeDetailsText,
                    { color: selectedPlaceDetails.openingHours.openNow ? Colors.success : Colors.error }
                  ]}>
                    {selectedPlaceDetails.openingHours.openNow ? 'Open Now' : 'Closed'}
                  </ThemedText>
                </View>
              )}

              {selectedPlaceDetails.address && (
                <View style={styles.placeDetailsRow}>
                  <Ionicons name="location-outline" size={16} color={Colors.primary600} />
                  <ThemedText style={styles.placeDetailsAddress}>
                    {selectedPlaceDetails.address}
                  </ThemedText>
                </View>
              )}

              {selectedPlaceDetails.formattedPhoneNumber && (
                <View style={styles.placeDetailsRow}>
                  <Ionicons name="call-outline" size={16} color={Colors.primary600} />
                  <ThemedText style={styles.placeDetailsText}>
                    {selectedPlaceDetails.formattedPhoneNumber}
                  </ThemedText>
                </View>
              )}

              {selectedPlaceDetails.website && (
                <TouchableOpacity 
                  style={styles.placeDetailsRow}
                  onPress={() => {/* Open website */}}
                >
                  <Ionicons name="globe-outline" size={16} color={Colors.primary600} />
                  <ThemedText style={[styles.placeDetailsText, { color: Colors.primary600, textDecorationLine: 'underline' }]}>
                    Visit Website
                  </ThemedText>
                </TouchableOpacity>
              )}

              {selectedPlaceDetails.priceLevel !== undefined && (
                <View style={styles.placeDetailsRow}>
                  <Ionicons name="cash-outline" size={16} color={Colors.primary600} />
                  <ThemedText style={styles.placeDetailsText}>
                    {'$'.repeat(selectedPlaceDetails.priceLevel)} {selectedPlaceDetails.priceLevel === 0 ? 'Free' : ''}
                  </ThemedText>
                </View>
              )}

              {selectedPlaceDetails.types && selectedPlaceDetails.types.length > 0 && (
                <View style={styles.placeDetailsTypes}>
                  {selectedPlaceDetails.types.map((type, index) => (
                    <View key={index} style={styles.typeChip}>
                      <ThemedText style={styles.typeChipText}>{type}</ThemedText>
                    </View>
                  ))}
                </View>
              )}

              {selectedPlaceDetails.openingHours?.weekdayText && (
                <View style={styles.openingHoursSection}>
                  <ThemedText style={styles.detailsSectionTitle}>Opening Hours</ThemedText>
                  {selectedPlaceDetails.openingHours.weekdayText.map((text, index) => (
                    <ThemedText key={index} style={styles.openingHoursText}>
                      {text}
                    </ThemedText>
                  ))}
                </View>
              )}

              {selectedPlaceDetails.photoReference && (
                <View style={styles.placePhoto}>
                  {/* Photo can be loaded using Google Places Photo API */}
                  <ThemedText style={styles.photoPlaceholder}>📷 Photo Available</ThemedText>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Search Modal */}
        <Modal
          visible={isSearchModalVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={closeSearchModal}
          statusBarTranslucent={false}
        >
          <View style={styles.modalContainer}>
            <StatusBar style="dark" />
            <View style={[styles.modalStatusBar, { height: insets.top }]} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeSearchModal} style={styles.closeButton}>
                <Ionicons name="arrow-back" size={24} color={Colors.primary700} />
              </TouchableOpacity>
              <ThemedText variant="subtitle" style={styles.modalTitle}>Search & Discover</ThemedText>
              <View style={styles.placeholder} />
            </View>
            
            <View style={styles.modalSearchArea}>
              <CustomTextInput
                label=""
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search places, people, activities..."
                leftIcon="search"
                containerStyle={styles.modalSearchInput}
                autoFocus
              />
              <CustomButton
                variant='primary'
                size='small'
                title="Search"
                style={styles.modalSearchButton}
                onPress={handleSearchConfirm}
              />
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Search Results from Google Places API */}
              {isSearching && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary600} />
                  <ThemedText style={styles.loadingText}>Searching places...</ThemedText>
                </View>
              )}

              {searchResults.length > 0 && !isSearching && (
                <View style={styles.suggestionsSection}>
                  <ThemedText variant="subtitle" style={styles.suggestionsTitle}>
                    Search Results ({searchResults.length})
                  </ThemedText>
                  {searchResults.map((place, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => {
                        handlePlaceSelect(place.name, place.placeId);
                        closeSearchModal();
                      }}
                    >
                      <Ionicons name="location" size={18} color={Colors.primary600} />
                      <View style={styles.suggestionTextContainer}>
                        <ThemedText style={styles.suggestionText}>{place.name}</ThemedText>
                        <ThemedText style={styles.suggestionCategory}>
                          {place.address || place.category}
                        </ThemedText>
                      </View>
                      {place.rating && (
                        <View style={styles.suggestionRating}>
                          <Ionicons name="star" size={14} color={Colors.warning} />
                          <ThemedText style={styles.suggestionRatingText}>
                            {place.rating.toFixed(1)}
                          </ThemedText>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {searchQuery.length > 0 && searchResults.length === 0 && !isSearching && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color={Colors.secondary400} />
                  <ThemedText style={styles.emptyText}>No places found</ThemedText>
                  <ThemedText style={styles.emptySubtext}>Try searching for something else</ThemedText>
                </View>
              )}
              
              <View style={styles.quickSearchSection}>
                <ThemedText variant="subtitle" style={styles.quickSearchTitle}>
                  {searchQuery.length > 0 ? 'Popular Places' : 'Quick Search'}
                </ThemedText>
                
                <View style={styles.categorySection}>
                  <ThemedText style={styles.categoryTitle}>Popular Places</ThemedText>
                  {isLoadingPlaces ? (
                    <View style={styles.loadingContainer}>
                      <ThemedText style={styles.loadingText}>Loading places...</ThemedText>
                    </View>
                  ) : (
                    <View style={styles.popularGrid}>
                      {popularPlaces.map((place, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.popularItem}
                          onPress={() => {
                            handlePlaceSelect(place.name, place.placeId);
                            closeSearchModal();
                          }}
                        >
                          <ThemedText style={styles.popularItemText}>{place.name}</ThemedText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.categorySection}>
                  <ThemedText style={styles.categoryTitle}>Activities</ThemedText>
                  {isLoadingPlaces ? (
                    <View style={styles.loadingContainer}>
                      <ThemedText style={styles.loadingText}>Loading activities...</ThemedText>
                    </View>
                  ) : (
                    <View style={styles.popularGrid}>
                      {activities.map((activity, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[styles.popularItem, {backgroundColor: Colors.secondary100}]}
                          onPress={() => {
                            handlePlaceSelect(activity.name, activity.placeId);
                            closeSearchModal();
                          }}
                        >
                          <ThemedText style={styles.popularItemText}>{activity.name}</ThemedText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.categorySection}>
                  <ThemedText style={styles.categoryTitle}>Find People</ThemedText>
                  <View style={styles.popularGrid}>
                    {['Tour Guides', 'Local Experts', 'Travel Buddies', 'Photographers'].map((people, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.popularItem, {backgroundColor: Colors.warning}]}
                        onPress={() => {
                          setSearchQuery(people);
                          setDestination(people);
                          closeSearchModal();
                        }}
                      >
                        <ThemedText style={styles.popularItemText}>{people}</ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Destination Discovery Carousels */}
        <View style={styles.discoverSection}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>Trending Destinations</ThemedText>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push({
                pathname: '/destinations/list' as any,
                params: { category: 'trending', title: 'Trending Destinations' }
              })}
            >
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary600} />
            </TouchableOpacity>
          </View>
          
          {isLoadingTrending ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary600} />
              <ThemedText style={styles.loadingText}>Loading trending destinations...</ThemedText>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.carouselContainer}
              style={styles.carousel}
            >
              {trendingDestinations.map((item, i) => (
                <TouchableOpacity 
                  key={i}
                  onPress={() => {
                    setDestination(item.title);
                    if (item.placeId) {
                      router.push({
                        pathname: '/place-details/[placeId]' as any,
                        params: { placeId: item.placeId, placeName: item.title }
                      });
                    }
                  }}
                >
                  <DestinationCard 
                    title={item.title} 
                    desc={item.desc} 
                    img={item.img} 
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
        
        <View style={styles.discoverSection}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>Local Favorites</ThemedText>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push({
                pathname: '/destinations/list' as any,
                params: { category: 'local', title: 'Local Favorites' }
              })}
            >
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary600} />
            </TouchableOpacity>
          </View>
          
          {isLoadingLocalFavorites ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary600} />
              <ThemedText style={styles.loadingText}>Loading local favorites...</ThemedText>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.carouselContainer}
              style={styles.carousel}
            >
              {localFavorites.map((item, i) => (
                <TouchableOpacity 
                  key={i}
                  onPress={() => {
                    setDestination(item.title);
                    if (item.placeId) {
                      router.push({
                        pathname: '/place-details/[placeId]' as any,
                        params: { placeId: item.placeId, placeName: item.title }
                      });
                    }
                  }}
                >
                  <DestinationCard 
                    title={item.title} 
                    desc={item.desc} 
                    img={item.img} 
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
        
        <View style={styles.discoverSection}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>Hidden Gems</ThemedText>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push({
                pathname: '/destinations/list' as any,
                params: { category: 'hidden', title: 'Hidden Gems' }
              })}
            >
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary600} />
            </TouchableOpacity>
          </View>
          
          {isLoadingHiddenGems ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary600} />
              <ThemedText style={styles.loadingText}>Loading hidden gems...</ThemedText>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.carouselContainer}
              style={styles.carousel}
            >
              {hiddenGems.map((item, i) => (
                <TouchableOpacity 
                  key={i}
                  onPress={() => {
                    setDestination(item.title);
                    if (item.placeId) {
                      router.push({
                        pathname: '/place-details/[placeId]' as any,
                        params: { placeId: item.placeId, placeName: item.title }
                      });
                    }
                  }}
                >
                  <DestinationCard 
                    title={item.title} 
                    desc={item.desc} 
                    img={item.img} 
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
        {/* Categorized Attractions Grid */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeaderWithDescription}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>Explore by Interest</ThemedText>
            <ThemedText style={styles.sectionDescription}>Find your perfect adventure</ThemedText>
          </View>
          <View style={styles.categoriesGrid}>
            {[
              {icon:'sunny',label:'Beaches',gradient:['#FFE066','#FF6B35']},
              {icon:'business',label:'History',gradient:['#667eea','#764ba2']},
              {icon:'leaf',label:'Nature',gradient:['#56ab2f','#a8e6cf']},
              {icon:'restaurant',label:'Food',gradient:['#f093fb','#f5576c']},
              {icon:'walk',label:'Hiking',gradient:['#4facfe','#00f2fe']},
              {icon:'color-palette',label:'Culture',gradient:['#a8edea','#fed6e3']}
            ].map((cat,i)=>(
              <TouchableOpacity key={i} style={styles.categoryCard}>
                <View style={[styles.categoryIconWrap, {backgroundColor: cat.gradient[0]}]}>
                  <Ionicons name={cat.icon as any} size={28} color={Colors.white} />
                </View>
                <ThemedText style={styles.categoryLabel}>{cat.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Trip Planning Tools */}
        <View style={styles.toolsSection}>
          <View style={styles.sectionHeaderWithDescription}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>Trip Planning Tools</ThemedText>
            <ThemedText style={styles.sectionDescription}>Everything you need for the perfect trip</ThemedText>
          </View>
          <View style={styles.toolsContainer}>
            {[{title:'Itineraries',desc:'Ready-made plans',icon:'map'},{title:'Seasonal Highlights',desc:'Best times to visit',icon:'calendar'},{title:'Transport Compare',desc:'Find best options',icon:'car'}].map((tool,i)=>(
              <TouchableOpacity key={i} style={styles.toolCard}>
                <View style={styles.toolIconContainer}>
                  <Ionicons name={tool.icon as any} size={28} color={Colors.primary600} />
                </View>
                <ThemedText style={styles.toolTitle}>{tool.title}</ThemedText>
                <ThemedText style={styles.toolDesc}>{tool.desc}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Personalized Elements - My Trips */}
        <View style={styles.personalSection}>
          <View style={styles.sectionHeaderWithDescription}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>My Trips</ThemedText>
            <ThemedText style={styles.sectionDescription}>Your travel memories and plans</ThemedText>
          </View>
          
          {isLoadingTrips ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary600} />
              <ThemedText style={styles.loadingText}>Loading your trips...</ThemedText>
            </View>
          ) : myTripsData ? (
            <View style={styles.personalContainer}>
              {/* Saved Plans Card */}
              <TouchableOpacity 
                style={styles.personalCard}
                onPress={() => router.push('/myTrips/saved-plans' as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.personalIconContainer, { backgroundColor: Colors.primary100 }]}>
                  <Ionicons name="bookmark" size={28} color={Colors.primary600} />
                </View>
                <ThemedText style={styles.personalTitle}>Saved Plans</ThemedText>
                <ThemedText style={styles.personalDesc}>
                  {myTripsData.savedPlans.count} {myTripsData.savedPlans.count === 1 ? 'itinerary' : 'itineraries'}
                </ThemedText>
                <View style={styles.personalBadge}>
                  <ThemedText style={styles.personalBadgeText}>Ready to use</ThemedText>
                </View>
              </TouchableOpacity>

              {/* Unfinished Trips Card */}
              <TouchableOpacity 
                style={styles.personalCard}
                onPress={() => router.push('/myTrips/unfinished' as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.personalIconContainer, { backgroundColor: Colors.warning + '20' }]}>
                  <Ionicons name="document" size={28} color={Colors.warning} />
                </View>
                <ThemedText style={styles.personalTitle}>Unfinished</ThemedText>
                <ThemedText style={styles.personalDesc}>
                  {myTripsData.unfinished.count} {myTripsData.unfinished.count === 1 ? 'draft' : 'drafts'}
                </ThemedText>
                <View style={[styles.personalBadge, { backgroundColor: Colors.warning + '20' }]}>
                  <ThemedText style={[styles.personalBadgeText, { color: Colors.warning }]}>
                    {myTripsData.unfinished.count > 0 && myTripsData.unfinished.trips[0]
                      ? `${myTripsData.unfinished.trips[0].completionPercentage}%`
                      : 'Continue'}
                  </ThemedText>
                </View>
              </TouchableOpacity>

              {/* Upcoming Trips Card */}
              <TouchableOpacity 
                style={styles.personalCard}
                onPress={() => router.push('/myTrips/upcoming' as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.personalIconContainer, { backgroundColor: Colors.success + '20' }]}>
                  <Ionicons name="airplane" size={28} color={Colors.success} />
                </View>
                <ThemedText style={styles.personalTitle}>Upcoming</ThemedText>
                <ThemedText style={styles.personalDesc}>
                  {myTripsData.upcoming.count} {myTripsData.upcoming.count === 1 ? 'trip' : 'trips'}
                </ThemedText>
                <View style={[styles.personalBadge, { backgroundColor: Colors.success + '20' }]}>
                  <ThemedText style={[styles.personalBadgeText, { color: Colors.success }]}>
                    {myTripsData.upcoming.count > 0 && myTripsData.upcoming.trips[0]
                      ? `${myTripsData.upcoming.trips[0].daysUntilStart} days`
                      : 'None'}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="map-outline" size={48} color={Colors.secondary400} />
              <ThemedText style={styles.emptyText}>No trips yet</ThemedText>
              <ThemedText style={styles.emptySubtext}>Start planning your adventure!</ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },

  scrollView: {
    flex: 1,
    zIndex: 1,
  },

  scrollContent: {
    paddingBottom: 40,
    paddingTop: 0,
  },
  
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary800,
    zIndex: 10,
  },
  greetingContainer: {
    backgroundColor: Colors.primary800,
    alignSelf: 'stretch',
    width: '100%',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 24,
    fontWeight: '400',
    color: Colors.white,
    zIndex: 2,
  },

  caption: {
    color: Colors.primary100,
    marginBottom: 20,
    zIndex: 2,
  },

  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginTop: -15,
    zIndex: 5,
  },

  searchCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
  },

  searchInputWrapper: {
    marginBottom: 16,
  },

  searchInputPressable: {
    alignSelf: 'stretch',
  },

  searchInputDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary50,
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },

  searchIcon: {
    marginRight: 12,
  },

  searchInput: {
    alignSelf: 'stretch',
    borderRadius: 15,
  },

  searchButton: {
    alignSelf: 'stretch',
    backgroundColor: Colors.primary600,
    borderRadius: 16,
  },

  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary700,
  },

  discoverSection: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionHeaderWithDescription: {
    marginBottom: 20,
  },

  sectionDescription: {
    fontSize: 14,
    color: Colors.primary600,
    marginTop: 4,
  },

  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  seeAllText: {
    fontSize: 14,
    color: Colors.primary600,
    fontWeight: '500',
    marginRight: 4,
  },

  carousel: {
    marginBottom: 8,
  },

  carouselContainer: {
    paddingRight: 20,
  },

  // Categories section
  categoriesSection: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },

  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },

  categoryCard: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    shadowColor: Colors.primary100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  categoryIconWrap: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },

  categoryLabel: {
    fontSize: 13,
    color: Colors.primary700,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Tools section
  toolsSection: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },

  toolsContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },

  toolIconContainer: {
    backgroundColor: Colors.primary100,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },

  toolCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    flex: 1,
    alignItems: 'center',
    shadowColor: Colors.primary100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  toolTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: Colors.primary800,
    marginBottom: 4,
    textAlign: 'center',
  },

  toolDesc: {
    fontSize: 12,
    color: Colors.primary700,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Personal section
  personalSection: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },

  personalContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },

  personalIconContainer: {
    backgroundColor: Colors.primary100,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },

  personalCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    flex: 1,
    alignItems: 'center',
    shadowColor: Colors.primary100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  personalTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: Colors.primary800,
    marginBottom: 4,
    textAlign: 'center',
  },

  personalDesc: {
    fontSize: 12,
    color: Colors.primary700,
    textAlign: 'center',
    lineHeight: 16,
  },

  personalBadge: {
    backgroundColor: Colors.primary100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'center',
  },

  personalBadgeText: {
    fontSize: 10,
    color: Colors.primary600,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },

  modalStatusBar: {
    backgroundColor: Colors.white,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },

  closeButton: {
    padding: 8,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary700,
  },

  placeholder: {
    width: 40,
  },

  modalSearchArea: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },

  modalSearchInput: {
    marginBottom: 16,
  },

  modalSearchButton: {
    alignSelf: 'stretch',
    backgroundColor: Colors.primary600,
  },

  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  suggestionsSection: {
    marginVertical: 20,
  },

  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary700,
    marginBottom: 12,
  },

  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: Colors.secondary200,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  suggestionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  suggestionText: {
    fontSize: 16,
    color: Colors.primary700,
  },

  suggestionCategory: {
    fontSize: 12,
    color: Colors.primary500,
    marginTop: 2,
  },

  suggestionType: {
    backgroundColor: Colors.primary100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  suggestionTypeText: {
    fontSize: 11,
    color: Colors.primary700,
    fontWeight: '600',
  },

  quickSearchSection: {
    marginVertical: 20,
  },

  quickSearchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary700,
    marginBottom: 20,
  },

  categorySection: {
    marginBottom: 24,
  },

  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary700,
    marginBottom: 12,
  },

  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  popularItem: {
    backgroundColor: Colors.primary100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 8,
  },

  popularItemText: {
    fontSize: 14,
    color: Colors.primary700,
    fontWeight: '500',
  },

  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
  },

  // Loading state styles
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.primary600,
  },

  // Empty state styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginHorizontal: 20,
  },

  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary700,
  },

  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.secondary400,
  },

  // Place details card styles
  placeDetailsCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    shadowColor: Colors.primary700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  placeDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  placeDetailsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  placeDetailsName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary800,
    marginLeft: 8,
    flex: 1,
  },

  placeDetailsRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary700,
    marginLeft: 6,
  },

  placeDetailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  placeDetailsAddress: {
    fontSize: 13,
    color: Colors.primary600,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },

  placeDetailsTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },

  typeChip: {
    backgroundColor: Colors.primary100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary700,
  },

  placeDetailsDescription: {
    fontSize: 14,
    color: Colors.primary700,
    lineHeight: 20,
    marginBottom: 16,
  },

  planTripButton: {
    alignSelf: 'stretch',
    backgroundColor: Colors.primary600,
    borderRadius: 16,
  },

  // Additional place details styles
  ratingsCount: {
    fontSize: 12,
    color: Colors.secondary400,
    fontWeight: '400',
  },

  placeDetailsText: {
    fontSize: 13,
    color: Colors.primary600,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },

  detailsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary700,
    marginBottom: 8,
  },

  openingHoursSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.secondary50,
    borderRadius: 12,
  },

  openingHoursText: {
    fontSize: 12,
    color: Colors.primary600,
    marginBottom: 4,
    lineHeight: 18,
  },

  placePhoto: {
    marginTop: 16,
    height: 200,
    backgroundColor: Colors.secondary100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoPlaceholder: {
    fontSize: 14,
    color: Colors.secondary400,
  },

  // Search result styles
  suggestionRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  suggestionRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary700,
  },
});





