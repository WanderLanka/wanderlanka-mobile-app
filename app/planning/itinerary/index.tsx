import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CustomButton, ThemedText } from '../../../components';
import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { Colors } from '../../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Types
interface Place {
  id: string;
  name: string;
  address: string;
  description?: string;
  image?: string;
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

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY;

export default function ItineraryPlanningScreen() {
  const params = useLocalSearchParams();
  const { destination, startPoint, startDate, endDate } = params;

  const [itinerary, setItinerary] = useState<DayItinerary[]>([]);
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Generate days between start and end dates
  useEffect(() => {
    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);
    const days: DayItinerary[] = [];
    
    let currentDate = new Date(startDateObj);
    let dayNumber = 1;
    
    while (currentDate <= endDateObj) {
      days.push({
        date: currentDate.toISOString().split('T')[0],
        dayNumber,
        places: [],
      });
      currentDate.setDate(currentDate.getDate() + 1);
      dayNumber++;
    }
    
    setItinerary(days);
  }, [startDate, endDate]);

  const searchPlaces = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    try {
      if (!GOOGLE_PLACES_API_KEY) {
        throw new Error('Google Places API key not configured');
      }

      // Text search for places in Sri Lanka
      const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
        `query=${encodeURIComponent(query + ' Sri Lanka')}&` +
        `key=${GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(textSearchUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        const places: Place[] = await Promise.all(
          data.results.slice(0, 10).map(async (place: any) => {
            // Get place details for more information
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?` +
              `place_id=${place.place_id}&` +
              `fields=name,formatted_address,photos,opening_hours,rating,editorial_summary&` +
              `key=${GOOGLE_PLACES_API_KEY}`;

            try {
              const detailsResponse = await fetch(detailsUrl);
              const detailsData = await detailsResponse.json();
              
              const placeDetails = detailsData.result || place;
              
              return {
                id: place.place_id,
                name: placeDetails.name || place.name,
                address: placeDetails.formatted_address || place.formatted_address,
                description: placeDetails.editorial_summary?.overview || 
                           `Popular destination in ${destination}`,
                coordinates: {
                  latitude: place.geometry.location.lat,
                  longitude: place.geometry.location.lng,
                },
                openingHours: placeDetails.opening_hours?.weekday_text?.[0] || 
                             placeDetails.opening_hours?.open_now ? 'Open now' : 'Check hours',
                rating: placeDetails.rating || place.rating,
                image: placeDetails.photos?.[0] ? 
                  `https://maps.googleapis.com/maps/api/place/photo?` +
                  `maxwidth=400&photo_reference=${placeDetails.photos[0].photo_reference}&` +
                  `key=${GOOGLE_PLACES_API_KEY}` : undefined,
              };
            } catch (error) {
              console.warn('Error fetching place details:', error);
              return {
                id: place.place_id,
                name: place.name,
                address: place.formatted_address,
                description: `Popular destination in ${destination}`,
                coordinates: {
                  latitude: place.geometry.location.lat,
                  longitude: place.geometry.location.lng,
                },
                openingHours: 'Check hours',
                rating: place.rating,
              };
            }
          })
        );

        setSearchResults(places);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      Alert.alert('Search Error', 'Failed to search places. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addPlaceToDay = (place: Place) => {
    if (selectedDay === null) return;

    setItinerary(prev => prev.map(day => {
      if (day.dayNumber === selectedDay) {
        return {
          ...day,
          places: [...day.places, place],
        };
      }
      return day;
    }));

    setShowPlaceSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedDay(null);
  };

  const removePlaceFromDay = (dayNumber: number, placeId: string) => {
    setItinerary(prev => prev.map(day => {
      if (day.dayNumber === dayNumber) {
        return {
          ...day,
          places: day.places.filter(place => place.id !== placeId),
        };
      }
      return day;
    }));
  };

  const handleAddPlace = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    setShowPlaceSearch(true);
  };

  const handleFinalizeItinerary = () => {
    const totalPlaces = itinerary.reduce((total, day) => total + day.places.length, 0);
    
    if (totalPlaces === 0) {
      Alert.alert('Empty Itinerary', 'Please add at least one place to your itinerary.');
      return;
    }

    // Navigate to route display
    router.push({
      pathname: '/planning/route-display',
      params: {
        destination,
        startPoint,
        startDate,
        endDate,
        itinerary: JSON.stringify(itinerary),
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderPlaceItem = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => addPlaceToDay(item)}
    >
      <View style={styles.placeImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.placeImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={24} color={Colors.secondary400} />
          </View>
        )}
      </View>
      <View style={styles.placeInfo}>
        <ThemedText style={styles.placeName}>{item.name}</ThemedText>
        <View style={styles.placeMetaRow}>
          <Ionicons name="location-outline" size={14} color={Colors.secondary500} />
          <ThemedText style={styles.placeAddress} numberOfLines={1}>
            {item.address}
          </ThemedText>
        </View>
        <View style={styles.placeMetaRow}>
          <Ionicons name="time-outline" size={14} color={Colors.secondary500} />
          <ThemedText style={styles.placeHours}>{item.openingHours}</ThemedText>
          {item.rating && (
            <>
              <Ionicons name="star" size={14} color="#fbbf24" style={{ marginLeft: 12 }} />
              <ThemedText style={styles.placeRating}>{item.rating}</ThemedText>
            </>
          )}
        </View>
        {item.description && (
          <ThemedText style={styles.placeDescription} numberOfLines={2}>
            {item.description}
          </ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.secondary700} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Plan Your Itinerary</ThemedText>
        <TouchableOpacity onPress={handleFinalizeItinerary}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.primary600} />
        </TouchableOpacity>
      </View>

      <View style={styles.tripSummary}>
        <ThemedText style={styles.tripTitle}>{destination}</ThemedText>
        <ThemedText style={styles.tripSubtitle}>
          From {startPoint} • {itinerary.length} days
        </ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {itinerary.map((day, index) => (
          <View key={day.date} style={styles.dayContainer}>
            <View style={styles.dayHeader}>
              <View style={styles.dayNumber}>
                <ThemedText style={styles.dayNumberText}>{day.dayNumber}</ThemedText>
              </View>
              <View style={styles.dayInfo}>
                <ThemedText style={styles.dayTitle}>Day {day.dayNumber}</ThemedText>
                <ThemedText style={styles.dayDate}>{formatDate(day.date)}</ThemedText>
              </View>
            </View>

            <View style={styles.placesContainer}>
              {day.places.map((place, placeIndex) => (
                <View key={place.id} style={styles.placeCard}>
                  <View style={styles.placeCardImageContainer}>
                    {place.image ? (
                      <Image source={{ uri: place.image }} style={styles.placeCardImage} />
                    ) : (
                      <View style={styles.placeCardPlaceholder}>
                        <Ionicons name="image-outline" size={20} color={Colors.secondary400} />
                      </View>
                    )}
                  </View>
                  <View style={styles.placeCardInfo}>
                    <ThemedText style={styles.placeCardName}>{place.name}</ThemedText>
                    <View style={styles.placeCardMeta}>
                      <Ionicons name="time-outline" size={12} color={Colors.secondary500} />
                      <ThemedText style={styles.placeCardHours}>{place.openingHours}</ThemedText>
                    </View>
                    <ThemedText style={styles.placeCardDescription} numberOfLines={2}>
                      {place.description}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.removePlaceButton}
                    onPress={() => removePlaceFromDay(day.dayNumber, place.id)}
                  >
                    <Ionicons name="close" size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addPlaceButton}
                onPress={() => handleAddPlace(day.dayNumber)}
              >
                <Ionicons name="add" size={20} color={Colors.primary600} />
                <ThemedText style={styles.addPlaceText}>Add Place</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomActions}>
        <CustomButton
          title="Finalize Itinerary"
          onPress={handleFinalizeItinerary}
          style={styles.finalizeButton}
        />
      </View>

      {/* Place Search Modal */}
      <Modal
        visible={showPlaceSearch}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              Add Place to Day {selectedDay}
            </ThemedText>
            <TouchableOpacity onPress={() => setShowPlaceSearch(false)}>
              <Ionicons name="close" size={24} color={Colors.secondary700} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for places, attractions, restaurants..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchPlaces(text);
              }}
              autoFocus
            />
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderPlaceItem}
            ListEmptyComponent={
              isSearching ? (
                <View style={styles.loadingContainer}>
                  <ThemedText style={styles.loadingText}>Searching places...</ThemedText>
                </View>
              ) : searchQuery.length > 2 ? (
                <ThemedText style={styles.noResultsText}>No places found</ThemedText>
              ) : (
                <ThemedText style={styles.noResultsText}>
                  Start typing to search for places in {destination}
                </ThemedText>
              )
            }
            style={styles.searchResults}
          />
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  tripSummary: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  tripTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  tripSubtitle: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dayContainer: {
    backgroundColor: Colors.white,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary600,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dayNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  dayInfo: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  dayDate: {
    fontSize: 14,
    color: Colors.secondary500,
    marginTop: 2,
  },
  placesContainer: {
    gap: 12,
  },
  placeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary50,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  placeCardImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  placeCardImage: {
    width: '100%',
    height: '100%',
  },
  placeCardPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.secondary200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeCardInfo: {
    flex: 1,
  },
  placeCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  placeCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  placeCardHours: {
    fontSize: 12,
    color: Colors.secondary500,
    marginLeft: 4,
  },
  placeCardDescription: {
    fontSize: 12,
    color: Colors.secondary500,
    lineHeight: 16,
  },
  removePlaceButton: {
    padding: 8,
  },
  addPlaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary100,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary600,
    borderStyle: 'dashed',
  },
  addPlaceText: {
    fontSize: 16,
    color: Colors.primary600,
    fontWeight: '500',
    marginLeft: 8,
  },
  bottomActions: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
  },
  finalizeButton: {
    backgroundColor: Colors.primary600,
    borderRadius: 12,
    paddingVertical: 16,
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },
  searchInput: {
    backgroundColor: Colors.secondary100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.secondary700,
  },
  searchResults: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  placeImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  placeImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.secondary200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  placeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 12,
    color: Colors.secondary500,
    marginLeft: 4,
    flex: 1,
  },
  placeHours: {
    fontSize: 12,
    color: Colors.secondary500,
    marginLeft: 4,
  },
  placeRating: {
    fontSize: 12,
    color: Colors.secondary500,
    marginLeft: 4,
  },
  placeDescription: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: 4,
    lineHeight: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.secondary500,
  },
  noResultsText: {
    fontSize: 16,
    color: Colors.secondary500,
    textAlign: 'center',
    padding: 40,
  },
});
