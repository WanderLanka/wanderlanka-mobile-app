import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
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

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

interface DayChecklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface DayItinerary {
  date: string;
  dayNumber: number;
  places: Place[];
  notes: string;
  checklists: DayChecklist[];
}

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY;

export default function ItineraryPlanningScreen() {
  const params = useLocalSearchParams();
  const { itineraryId } = params;

  const [itinerary, setItinerary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dayItineraries, setDayItineraries] = useState<DayItinerary[]>([]);
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Notes and Checklists states
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [editingNotesDay, setEditingNotesDay] = useState<number | null>(null);
  
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [checklistTitle, setChecklistTitle] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistDay, setEditingChecklistDay] = useState<number | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Load itinerary from backend
  useEffect(() => {
    loadItinerary();
  }, [itineraryId]);

  const loadItinerary = async () => {
    if (!itineraryId) {
      Alert.alert('Error', 'No itinerary ID provided');
      router.back();
      return;
    }

    try {
      setIsLoading(true);
      const { itineraryApi } = require('../../../utils/itineraryApi');
      
      console.log('📥 Loading itinerary:', itineraryId);
      const response = await itineraryApi.getItinerary(itineraryId);

      if (response.success && response.data) {
        const itineraryData = response.data;
        setItinerary(itineraryData);
        
        // Convert backend day plans to local format
        const days: DayItinerary[] = itineraryData.dayPlans.map((dayPlan: any) => ({
          date: new Date(dayPlan.date).toISOString().split('T')[0],
          dayNumber: dayPlan.dayNumber,
          places: dayPlan.places.map((place: any) => ({
            id: place.placeId || place._id,
            name: place.name,
            address: place.address || '',
            description: place.description,
            coordinates: {
              latitude: place.location.latitude,
              longitude: place.location.longitude,
            },
            rating: place.rating,
          })),
          notes: dayPlan.notes || '',
          checklists: (dayPlan.checklists || []).map((checklist: any) => ({
            id: checklist.id,
            title: checklist.title,
            items: checklist.items.map((item: any) => ({
              id: item.id,
              title: item.title,
              completed: item.completed || false,
            })),
          })),
        }));
        
        setDayItineraries(days);
        console.log(`✅ Loaded ${days.length} days of itinerary`);
        const totalChecklists = days.reduce((sum, day) => sum + day.checklists.length, 0);
        console.log(`📋 Loaded ${totalChecklists} checklists`);
      } else {
        Alert.alert('Error', 'Failed to load itinerary');
        router.back();
      }
    } catch (error: any) {
      console.error('❌ Error loading itinerary:', error);
      Alert.alert('Error', error.message || 'Failed to load itinerary');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

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
        `key=${GOOGLE_PLACES_API_KEY}&` +
        `region=LK&` +
        `language=en`;

      const response = await fetch(textSearchUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        const places: Place[] = await Promise.all(
          data.results.slice(0, 10).map(async (place: any) => {
            // Get comprehensive place details
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?` +
              `place_id=${place.place_id}&` +
              `fields=name,formatted_address,photos,opening_hours,rating,editorial_summary,types,website,formatted_phone_number,price_level,reviews&` +
              `key=${GOOGLE_PLACES_API_KEY}`;

            try {
              const detailsResponse = await fetch(detailsUrl);
              const detailsData = await detailsResponse.json();
              
              if (detailsData.status === 'OK' && detailsData.result) {
                const placeDetails = detailsData.result;
                
                // Format opening hours properly
                let openingHours = 'Hours not available';
                if (placeDetails.opening_hours) {
                  if (placeDetails.opening_hours.open_now !== undefined) {
                    openingHours = placeDetails.opening_hours.open_now ? 
                      'Open now' : 'Closed now';
                  }
                  
                  // Get today's hours if available
                  const today = new Date().getDay();
                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  
                  if (placeDetails.opening_hours.weekday_text) {
                    const todayHours = placeDetails.opening_hours.weekday_text.find(
                      (day: string) => day.toLowerCase().includes(dayNames[today].toLowerCase())
                    );
                    if (todayHours) {
                      openingHours = todayHours.replace(dayNames[today] + ': ', '');
                    } else if (placeDetails.opening_hours.weekday_text.length > 0) {
                      openingHours = placeDetails.opening_hours.weekday_text[0].split(': ')[1] || 'Check hours';
                    }
                  }
                }
                
                // Get proper description
                let description = '';
                if (placeDetails.editorial_summary?.overview) {
                  description = placeDetails.editorial_summary.overview;
                } else if (placeDetails.reviews && placeDetails.reviews.length > 0) {
                  // Use first review excerpt as description
                  const review = placeDetails.reviews[0];
                  if (review.text && review.text.length > 20) {
                    description = review.text.substring(0, 150) + '...';
                  }
                } else if (placeDetails.types && placeDetails.types.length > 0) {
                  // Generate description from place types
                  const typeDescriptions: { [key: string]: string } = {
                    'tourist_attraction': 'A popular tourist destination with cultural or historical significance',
                    'restaurant': 'A dining establishment serving local and international cuisine',
                    'lodging': 'Accommodation facility for travelers',
                    'shopping_mall': 'Shopping center with various stores and services',
                    'museum': 'Cultural institution with exhibits and historical artifacts',
                    'park': 'Recreation area with natural beauty and outdoor activities',
                    'place_of_worship': 'Sacred site for religious practices and ceremonies',
                    'zoo': 'Wildlife park with diverse animal species',
                    'amusement_park': 'Entertainment venue with rides and attractions',
                    'beach': 'Coastal area perfect for relaxation and water activities',
                    'hospital': 'Medical facility providing healthcare services',
                    'school': 'Educational institution',
                    'bank': 'Financial services center',
                    'gas_station': 'Fuel station for vehicles',
                    'pharmacy': 'Medical supplies and prescription services',
                    'supermarket': 'Grocery store with daily necessities',
                    'gym': 'Fitness facility with exercise equipment',
                    'beauty_salon': 'Beauty and grooming services',
                    'spa': 'Wellness center for relaxation and treatments',
                    'temple': 'Buddhist or Hindu religious temple',
                    'church': 'Christian place of worship',
                    'mosque': 'Islamic place of worship'
                  };
                  
                  const primaryType = placeDetails.types.find((type: string) => typeDescriptions[type]);
                  if (primaryType) {
                    description = typeDescriptions[primaryType];
                  }
                }
                
                // Fallback description if none found
                if (!description) {
                  description = `A notable place in ${itinerary?.endLocation?.name || 'Sri Lanka'}`;
                }
                
                return {
                  id: place.place_id,
                  name: placeDetails.name,
                  address: placeDetails.formatted_address,
                  description: description,
                  coordinates: {
                    latitude: place.geometry.location.lat,
                    longitude: place.geometry.location.lng,
                  },
                  openingHours: openingHours,
                  rating: placeDetails.rating,
                  image: placeDetails.photos?.[0] ? 
                    `https://maps.googleapis.com/maps/api/place/photo?` +
                    `maxwidth=400&photo_reference=${placeDetails.photos[0].photo_reference}&` +
                    `key=${GOOGLE_PLACES_API_KEY}` : undefined,
                };
              } else {
                console.warn('Place details not found for:', place.name);
                return null;
              }
            } catch (error) {
              console.warn('Error fetching place details for:', place.name, error);
              return null;
            }
          })
        );                // Filter out null results
                const validPlaces = places.filter(place => place !== null) as Place[];
                
                // Debug log to verify we're getting real data
                console.log('🗺️ Places found:', validPlaces.length);
                validPlaces.forEach(place => {
                  console.log(`📍 ${place.name}:`);
                  console.log(`   Hours: ${place.openingHours}`);
                  console.log(`   Description: ${place.description?.substring(0, 100) || 'No description'}...`);
                  console.log(`   Rating: ${place.rating || 'N/A'}`);
                });
                
                setSearchResults(validPlaces);
      } else {
        console.warn('Places API response:', data.status, data.error_message);
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

  const addPlaceToDay = async (place: Place) => {
    if (selectedDay === null) return;

    setDayItineraries(prev => prev.map(day => {
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

    // Auto-save after adding place
    setTimeout(() => saveItineraryToDatabase(), 500);
  };

  const removePlaceFromDay = async (dayNumber: number, placeId: string) => {
    setDayItineraries(prev => prev.map(day => {
      if (day.dayNumber === dayNumber) {
        return {
          ...day,
          places: day.places.filter(place => place.id !== placeId),
        };
      }
      return day;
    }));

    // Auto-save after removing place
    setTimeout(() => saveItineraryToDatabase(), 500);
  };

  const handleAddPlace = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    setShowPlaceSearch(true);
  };

  const saveItineraryToDatabase = async () => {
    if (!itinerary || !itineraryId) return;

    try {
      console.log('💾 Saving itinerary to database...');
      const { itineraryApi } = require('../../../utils/itineraryApi');

      // Convert dayItineraries back to backend format
      const dayPlans = dayItineraries.map(day => ({
        dayNumber: day.dayNumber,
        date: day.date,
        places: day.places.map(place => ({
          placeId: place.id,
          name: place.name,
          address: place.address,
          description: place.description,
          location: {
            latitude: place.coordinates.latitude,
            longitude: place.coordinates.longitude,
          },
          rating: place.rating,
        })),
        activities: [], // Can be populated if you add activity tracking
        meals: [], // Can be populated if you add meal planning
        checklists: day.checklists.map(checklist => ({
          id: checklist.id,
          title: checklist.title,
          items: checklist.items.map(item => ({
            id: item.id,
            title: item.title,
            completed: item.completed,
          })),
        })),
        notes: day.notes || '',
      }));

      const updates = {
        dayPlans,
        status: 'active', // Mark as active since user is planning
      };

      console.log('📦 Saving day plans:', dayPlans.length);
      console.log('📋 Total checklists:', dayPlans.reduce((sum, day) => sum + day.checklists.length, 0));

      const response = await itineraryApi.updateItinerary(itineraryId as string, updates);

      if (response.success) {
        console.log('✅ Itinerary saved successfully');
        return true;
      } else {
        console.error('❌ Failed to save itinerary:', response.message);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error saving itinerary:', error);
      Alert.alert('Save Error', 'Failed to save itinerary. Please try again.');
      return false;
    }
  };

  const handleFinalizeItinerary = async () => {
    const totalPlaces = dayItineraries.reduce((total, day) => total + day.places.length, 0);
    
    if (totalPlaces === 0) {
      Alert.alert('Empty Itinerary', 'Please add at least one place to your itinerary.');
      return;
    }

    // Save itinerary before finalizing
    console.log('📝 Finalizing itinerary...');
    const saved = await saveItineraryToDatabase();
    
    if (!saved) {
      Alert.alert('Error', 'Failed to save itinerary. Please try again.');
      return;
    }

    // Navigate to route display
    router.push({
      pathname: '/planning/route-display',
      params: {
        itineraryId: itinerary._id,
        tripName: itinerary.tripName,
        startLocation: JSON.stringify(itinerary.startLocation),
        endLocation: JSON.stringify(itinerary.endLocation),
        startDate: itinerary.startDate,
        endDate: itinerary.endDate,
        dayPlans: JSON.stringify(dayItineraries),
      },
    });
  };

  // Notes functions
  const handleEditNotes = (dayNumber: number) => {
    const day = dayItineraries.find(d => d.dayNumber === dayNumber);
    setNotesText(day?.notes || '');
    setEditingNotesDay(dayNumber);
    setShowNotesModal(true);
  };

  const handleSaveNotes = () => {
    if (editingNotesDay === null) return;

    // Dismiss keyboard before saving
    Keyboard.dismiss();

    setDayItineraries(prev => prev.map(day => {
      if (day.dayNumber === editingNotesDay) {
        return {
          ...day,
          notes: notesText,
        };
      }
      return day;
    }));

    setShowNotesModal(false);
    setNotesText('');
    setEditingNotesDay(null);

    // Auto-save after updating notes
    setTimeout(() => saveItineraryToDatabase(), 500);
  };

  const handleCancelNotes = () => {
    Keyboard.dismiss();
    setShowNotesModal(false);
    setNotesText('');
    setEditingNotesDay(null);
  };

  // Checklist functions
  const handleAddChecklist = (dayNumber: number) => {
    setChecklistTitle('');
    setChecklistItems([]);
    setEditingChecklistId(null);
    setEditingChecklistDay(dayNumber);
    setShowChecklistModal(true);
  };

  const handleEditChecklist = (dayNumber: number, checklistId: string) => {
    const day = dayItineraries.find(d => d.dayNumber === dayNumber);
    const checklist = day?.checklists.find(c => c.id === checklistId);
    
    if (checklist) {
      setChecklistTitle(checklist.title);
      setChecklistItems([...checklist.items]);
      setEditingChecklistId(checklistId);
      setEditingChecklistDay(dayNumber);
      setShowChecklistModal(true);
    }
  };

  const handleSaveChecklist = () => {
    if (editingChecklistDay === null || !checklistTitle.trim()) return;

    // Dismiss keyboard before saving
    Keyboard.dismiss();

    const checklistId = editingChecklistId || Date.now().toString();
    const newChecklist: DayChecklist = {
      id: checklistId,
      title: checklistTitle.trim(),
      items: checklistItems,
    };

    setDayItineraries(prev => prev.map(day => {
      if (day.dayNumber === editingChecklistDay) {
        if (editingChecklistId) {
          // Update existing checklist
          return {
            ...day,
            checklists: day.checklists.map(c => 
              c.id === editingChecklistId ? newChecklist : c
            ),
          };
        } else {
          // Add new checklist
          return {
            ...day,
            checklists: [...day.checklists, newChecklist],
          };
        }
      }
      return day;
    }));

    handleCancelChecklist();
    
    // Auto-save after saving checklist
    setTimeout(() => saveItineraryToDatabase(), 500);
  };

  const handleCancelChecklist = () => {
    Keyboard.dismiss();
    setShowChecklistModal(false);
    setChecklistTitle('');
    setChecklistItems([]);
    setEditingChecklistId(null);
    setEditingChecklistDay(null);
    setNewChecklistItem('');
  };

  const handleDeleteChecklist = (dayNumber: number, checklistId: string) => {
    Alert.alert(
      'Delete Checklist',
      'Are you sure you want to delete this checklist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDayItineraries(prev => prev.map(day => {
              if (day.dayNumber === dayNumber) {
                return {
                  ...day,
                  checklists: day.checklists.filter(c => c.id !== checklistId),
                };
              }
              return day;
            }));
            
            // Auto-save after deleting checklist
            setTimeout(() => saveItineraryToDatabase(), 500);
          },
        },
      ]
    );
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      title: newChecklistItem.trim(),
      completed: false,
    };

    setChecklistItems(prev => [...prev, newItem]);
    setNewChecklistItem('');
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    setChecklistItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleToggleChecklistItem = (dayNumber: number, checklistId: string, itemId: string) => {
    setDayItineraries(prev => prev.map(day => {
      if (day.dayNumber === dayNumber) {
        return {
          ...day,
          checklists: day.checklists.map(checklist => {
            if (checklist.id === checklistId) {
              return {
                ...checklist,
                items: checklist.items.map(item => 
                  item.id === itemId ? { ...item, completed: !item.completed } : item
                ),
              };
            }
            return checklist;
          }),
        };
      }
      return day;
    }));
    
    // Auto-save after toggling checklist item
    setTimeout(() => saveItineraryToDatabase(), 500);
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
          <ThemedText style={styles.placeDescription} numberOfLines={3}>
            {item.description}
          </ThemedText>
        )}
        <View style={styles.placeActionHint}>
          <Ionicons name="add-circle" size={16} color={Colors.primary600} />
          <ThemedText style={styles.placeActionText}>Tap to add to itinerary</ThemedText>
        </View>
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

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ThemedText>Loading itinerary...</ThemedText>
        </View>
      ) : itinerary ? (
        <>
          <View style={styles.tripSummary}>
            <ThemedText style={styles.tripTitle}>{itinerary.tripName}</ThemedText>
            <ThemedText style={styles.tripSubtitle}>
              From {itinerary.startLocation.name} to {itinerary.endLocation.name} • {dayItineraries.length} days
            </ThemedText>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {dayItineraries.map((day, index) => (
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
                      {place.rating && (
                        <>
                          <Ionicons name="star" size={12} color="#fbbf24" style={{ marginLeft: 8 }} />
                          <ThemedText style={styles.placeCardRating}>{place.rating}</ThemedText>
                        </>
                      )}
                    </View>
                    {place.description && place.description !== 'Hours not available' && (
                      <ThemedText style={styles.placeCardDescription} numberOfLines={2}>
                        {place.description}
                      </ThemedText>
                    )}
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

            {/* Notes Section */}
            <View style={styles.notesSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text-outline" size={20} color={Colors.secondary600} />
                <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
                <TouchableOpacity onPress={() => handleEditNotes(day.dayNumber)}>
                  <Ionicons name="pencil" size={16} color={Colors.primary600} />
                </TouchableOpacity>
              </View>
              {day.notes ? (
                <View style={styles.notesContent}>
                  <ThemedText style={styles.notesText}>{day.notes}</ThemedText>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addNotesButton}
                  onPress={() => handleEditNotes(day.dayNumber)}
                >
                  <Ionicons name="add" size={16} color={Colors.primary600} />
                  <ThemedText style={styles.addNotesText}>Add notes for this day</ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {/* Checklists Section */}
            <View style={styles.checklistsSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.secondary600} />
                <ThemedText style={styles.sectionTitle}>Checklists</ThemedText>
                <TouchableOpacity onPress={() => handleAddChecklist(day.dayNumber)}>
                  <Ionicons name="add" size={16} color={Colors.primary600} />
                </TouchableOpacity>
              </View>
              
              {day.checklists.map((checklist) => (
                <View key={checklist.id} style={styles.checklistCard}>
                  <View style={styles.checklistHeader}>
                    <ThemedText style={styles.checklistTitle}>{checklist.title}</ThemedText>
                    <View style={styles.checklistActions}>
                      <TouchableOpacity
                        onPress={() => handleEditChecklist(day.dayNumber, checklist.id)}
                        style={styles.checklistAction}
                      >
                        <Ionicons name="pencil" size={14} color={Colors.primary600} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteChecklist(day.dayNumber, checklist.id)}
                        style={styles.checklistAction}
                      >
                        <Ionicons name="trash" size={14} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.checklistItems}>
                    {checklist.items.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.checklistItem}
                        onPress={() => handleToggleChecklistItem(day.dayNumber, checklist.id, item.id)}
                      >
                        <Ionicons
                          name={item.completed ? "checkmark-circle" : "ellipse-outline"}
                          size={20}
                          color={item.completed ? Colors.success : Colors.secondary400}
                        />
                        <ThemedText
                          style={[
                            styles.checklistItemText,
                            item.completed && styles.checklistItemCompleted
                          ]}
                        >
                          {item.title}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <View style={styles.checklistProgress}>
                    <ThemedText style={styles.checklistProgressText}>
                      {checklist.items.filter(item => item.completed).length} of {checklist.items.length} completed
                    </ThemedText>
                  </View>
                </View>
              ))}

              {day.checklists.length === 0 && (
                <TouchableOpacity
                  style={styles.addChecklistButton}
                  onPress={() => handleAddChecklist(day.dayNumber)}
                >
                  <Ionicons name="add" size={16} color={Colors.primary600} />
                  <ThemedText style={styles.addChecklistText}>Add checklist for this day</ThemedText>
                </TouchableOpacity>
              )}
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
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <ThemedText>Failed to load itinerary</ThemedText>
        </View>
      )}

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
              placeholder={`Search places in ${itinerary?.endLocation?.name || 'Sri Lanka'}... (e.g., temples, restaurants, attractions)`}
              placeholderTextColor={Colors.secondary400}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchPlaces(text);
              }}
              autoFocus
              autoCapitalize="words"
              autoCorrect={true}
            />
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderPlaceItem}
            ListEmptyComponent={
              isSearching ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="refresh-outline" size={24} color={Colors.primary600} />
                  <ThemedText style={styles.loadingText}>
                    Searching places with Google Maps...
                  </ThemedText>
                </View>
              ) : searchQuery.length > 2 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="location-outline" size={48} color={Colors.secondary400} />
                  <ThemedText style={styles.noResultsText}>
                    No places found for "{searchQuery}"
                  </ThemedText>
                  <ThemedText style={styles.noResultsSubtext}>
                    Try different keywords or check spelling
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color={Colors.secondary400} />
                  <ThemedText style={styles.noResultsText}>
                    Search for places in {itinerary?.endLocation?.name || 'Sri Lanka'}
                  </ThemedText>
                  <ThemedText style={styles.noResultsSubtext}>
                    Try: temples, restaurants, attractions, hotels, etc.
                  </ThemedText>
                </View>
              )
            }
            style={styles.searchResults}
          />
        </SafeAreaView>
      </Modal>

      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              Notes for Day {editingNotesDay}
            </ThemedText>
            <TouchableOpacity onPress={handleCancelNotes}>
              <Ionicons name="close" size={24} color={Colors.secondary700} />
            </TouchableOpacity>
          </View>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.notesInput}
                placeholder="Enter your notes for this day..."
                placeholderTextColor={Colors.secondary400}
                value={notesText}
                onChangeText={setNotesText}
                multiline
                textAlignVertical="top"
                autoFocus
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>
          </TouchableWithoutFeedback>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalActionButton, styles.cancelButton]}
              onPress={handleCancelNotes}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalActionButton, styles.saveButton]}
              onPress={handleSaveNotes}
            >
              <ThemedText style={styles.saveButtonText}>Save Notes</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Checklist Modal */}
      <Modal
        visible={showChecklistModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              {editingChecklistId ? 'Edit Checklist' : 'New Checklist'} - Day {editingChecklistDay}
            </ThemedText>
            <TouchableOpacity onPress={handleCancelChecklist}>
              <Ionicons name="close" size={24} color={Colors.secondary700} />
            </TouchableOpacity>
          </View>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.checklistTitleInput}
                placeholder="Checklist title (e.g., Packing List, Things to Do)"
                placeholderTextColor={Colors.secondary400}
                value={checklistTitle}
                onChangeText={setChecklistTitle}
                autoFocus
                returnKeyType="done"
                blurOnSubmit={true}
              />

              <View style={styles.checklistItemsContainer}>
                <ThemedText style={styles.checklistItemsTitle}>Items:</ThemedText>
                
                {checklistItems.map((item) => (
                  <View key={item.id} style={styles.checklistItemRow}>
                    <TouchableOpacity
                      style={styles.checklistItemToggle}
                      onPress={() => {
                        setChecklistItems(prev => prev.map(prevItem => 
                          prevItem.id === item.id 
                            ? { ...prevItem, completed: !prevItem.completed }
                            : prevItem
                        ));
                      }}
                    >
                      <Ionicons
                        name={item.completed ? "checkmark-circle" : "ellipse-outline"}
                        size={20}
                        color={item.completed ? Colors.success : Colors.secondary400}
                      />
                    </TouchableOpacity>
                    <ThemedText
                      style={[
                        styles.checklistItemRowText,
                        item.completed && styles.checklistItemRowCompleted
                      ]}
                    >
                      {item.title}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => handleDeleteChecklistItem(item.id)}
                      style={styles.deleteItemButton}
                    >
                      <Ionicons name="trash" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={styles.addItemContainer}>
                  <TextInput
                    style={styles.newItemInput}
                    placeholder="Add new item..."
                    placeholderTextColor={Colors.secondary400}
                    value={newChecklistItem}
                    onChangeText={setNewChecklistItem}
                    onSubmitEditing={handleAddChecklistItem}
                    returnKeyType="done"
                    blurOnSubmit={false}
                  />
                  <TouchableOpacity
                    style={styles.addItemButton}
                    onPress={handleAddChecklistItem}
                  >
                    <Ionicons name="add" size={20} color={Colors.primary600} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalActionButton, styles.cancelButton]}
              onPress={handleCancelChecklist}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalActionButton, styles.saveButton]}
              onPress={handleSaveChecklist}
            >
              <ThemedText style={styles.saveButtonText}>
                {editingChecklistId ? 'Update List' : 'Save List'}
              </ThemedText>
            </TouchableOpacity>
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
    marginBottom: 16,
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
  placeCardRating: {
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
  
  // Notes section styles
  notesSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginLeft: 8,
    flex: 1,
  },
  notesContent: {
    backgroundColor: Colors.secondary50,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary600,
  },
  notesText: {
    fontSize: 14,
    color: Colors.secondary700,
    lineHeight: 20,
  },
  addNotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary100,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    borderStyle: 'dashed',
  },
  addNotesText: {
    fontSize: 14,
    color: Colors.primary600,
    marginLeft: 8,
  },
  
  // Checklist section styles
  checklistsSection: {
    marginBottom: 16,
  },
  checklistCard: {
    backgroundColor: Colors.secondary50,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    flex: 1,
  },
  checklistActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistAction: {
    padding: 4,
    marginLeft: 8,
  },
  checklistItems: {
    marginBottom: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checklistItemText: {
    fontSize: 14,
    color: Colors.secondary700,
    marginLeft: 8,
    flex: 1,
  },
  checklistItemCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.secondary500,
  },
  checklistProgress: {
    alignItems: 'flex-end',
  },
  checklistProgressText: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  addChecklistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary100,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    borderStyle: 'dashed',
  },
  addChecklistText: {
    fontSize: 14,
    color: Colors.primary600,
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
  
  // Modal styles
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary600,
    marginLeft: 8,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: Colors.secondary200,
    marginRight: 8,
  },
  cancelButtonText: {
    color: Colors.secondary700,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Search styles
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
  placeActionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
  },
  placeActionText: {
    fontSize: 12,
    color: Colors.primary600,
    marginLeft: 4,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.secondary500,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: Colors.secondary500,
    textAlign: 'center',
    marginTop: 12,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: Colors.secondary400,
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Notes modal styles
  notesInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.secondary700,
    textAlignVertical: 'top',
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },
  
  // Checklist modal styles
  checklistTitleInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.secondary700,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },
  checklistItemsContainer: {
    flex: 1,
    marginBottom: 16,
  },
  checklistItemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 12,
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },
  checklistItemToggle: {
    marginRight: 12,
  },
  checklistItemRowText: {
    fontSize: 14,
    color: Colors.secondary700,
    flex: 1,
  },
  checklistItemRowCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.secondary500,
  },
  deleteItemButton: {
    padding: 4,
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    paddingHorizontal: 12,
  },
  newItemInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.secondary700,
    paddingVertical: 12,
  },
  addItemButton: {
    padding: 8,
  },
});
