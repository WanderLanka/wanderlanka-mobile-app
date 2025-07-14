import { CustomButton, ThemedText } from '../../components';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Tabs, router } from 'expo-router';

import { Calendar } from 'react-native-calendars';
import { Colors } from '../../constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Modalize } from 'react-native-modalize';

// If you get module not found errors, check that these files exist at app/ui/CustomTextInput.tsx and app/ui/ThemedText.tsx
// If not, update the import paths to the correct location or create the missing files.

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY;

// Location interface
interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export default function TravelerTabsLayout() {
  const modalRef = useRef<Modalize>(null);
  
  // Location states
  const [destination, setDestination] = useState<Location | null>(null);
  const [startPoint, setStartPoint] = useState<Location | null>(null);
  
  // Date states
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days later
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // Search states
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [locationSearchType, setLocationSearchType] = useState<'start' | 'destination'>('start');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  // Form errors
  const [errors, setErrors] = useState<{
    startPoint?: string;
    destination?: string;
    dates?: string;
  }>({});

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const openBottomSheet = () => {
    modalRef.current?.open();
  };

  const closeBottomSheet = () => {
    modalRef.current?.close();
  };

  const handleStartPlanning = () => {
    // Clear previous errors
    setErrors({});
    
    const newErrors: { startPoint?: string; destination?: string; dates?: string } = {};
    
    if (!startPoint) {
      newErrors.startPoint = 'Please select a starting point';
    }
    
    if (!destination) {
      newErrors.destination = 'Please select a destination';
    }
    
    if (startDate >= endDate) {
      newErrors.dates = 'End date must be after start date';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Close bottom sheet and navigate to itinerary planning
    closeBottomSheet();
    router.push({
      pathname: '/planning/itinerary',
      params: {
        destination: destination!.name,
        startPoint: startPoint!.name,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
    });
  };

  const searchLocations = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debouncing
    const timeout = setTimeout(async () => {
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
          const locations: Location[] = data.results.slice(0, 10).map((place: any) => ({
            id: place.place_id,
            name: place.name,
            address: place.formatted_address,
            coordinates: {
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            },
          }));

          setSearchResults(locations);
        } else {
          console.warn('Places API response:', data.status, data.error_message);
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching locations:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    setSearchTimeout(timeout);
  };

  const handleLocationSelect = (location: Location) => {
    if (locationSearchType === 'start') {
      setStartPoint(location);
      setErrors(prev => ({ ...prev, startPoint: undefined }));
    } else {
      setDestination(location);
      setErrors(prev => ({ ...prev, destination: undefined }));
    }
    setShowLocationSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      if (event.type === 'dismissed') {
        return;
      }
    }
    
    if (selectedDate) {
      setStartDate(selectedDate);
      
      // If start date is after end date, adjust end date to be at least one day after start date
      if (selectedDate >= endDate) {
        const newEndDate = new Date(selectedDate);
        newEndDate.setDate(selectedDate.getDate() + 1);
        setEndDate(newEndDate);
      }
      
      setErrors(prev => ({ ...prev, dates: undefined }));
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
      if (event.type === 'dismissed') {
        return;
      }
    }
    
    if (selectedDate) {
      setEndDate(selectedDate);
      setErrors(prev => ({ ...prev, dates: undefined }));
    }
  };

  const openLocationSearch = (type: 'start' | 'destination') => {
    setLocationSearchType(type);
    setShowLocationSearch(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: Colors.primary800,
            tabBarInactiveTintColor: Colors.secondary400,
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <Ionicons name="home-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="bookNow"
            options={{
              title: 'Book Now',
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <Ionicons name="briefcase-outline" size={size} color={color} />
              ),
            }}
          />
          {/* Custom + Button in the middle */}
         <Tabs.Screen
            name="plan"
            options={{
              tabBarButton: () => (
                <Pressable onPress={openBottomSheet} style={styles.fabButton}>
                  <Ionicons name="add" size={32} color={Colors.primary300} />
                </Pressable>
              ),
              listeners: {
                tabPress: (e: { preventDefault: () => void; }) => {
                  e.preventDefault();
                },
              },
            }}
          />
          <Tabs.Screen
            name="community"
            options={{
              title: 'Community',
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <Ionicons name="newspaper-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <Ionicons name="person-circle-outline" size={size} color={color} />
              ),
            }}
          />
        </Tabs>
      </View>
      {/* Bottom Sheet */}
      <Modalize 
        ref={modalRef} 
        adjustToContentHeight
        avoidKeyboardLikeIOS={Platform.OS === 'ios'}
        keyboardAvoidingBehavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        closeOnOverlayTap={false}
        panGestureEnabled={true}
        withHandle={true}
        modalStyle={{
          backgroundColor: Colors.white,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
        overlayStyle={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
        handleStyle={{
          backgroundColor: Colors.secondary200,
          width: 40,
          height: 4,
          borderRadius: 2,
        }}
        disableScrollIfPossible={false}
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.sheetTitle}>
            <ThemedText variant="title" style={styles.bottomSheetTitle}>Your Dream Trip Starts Here</ThemedText>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closeBottomSheet}
            >
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={styles.sheetBody} 
            contentContainerStyle={styles.sheetBodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Destination Selection */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Where are you going?</Text>
              <TouchableOpacity
                style={[styles.locationInputContainer, errors.destination && styles.inputError]}
                onPress={() => openLocationSearch('destination')}
              >
                <Ionicons name="location-outline" size={20} color={Colors.primary600} />
                <Text style={[styles.locationInputText, !destination && styles.placeholderText]}>
                  {destination ? destination.name : 'Select destination'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.secondary400} />
              </TouchableOpacity>
              {errors.destination && (
                <Text style={styles.errorText}>{errors.destination}</Text>
              )}
            </View>

            {/* Starting Point Selection */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Starting from</Text>
              <TouchableOpacity
                style={[styles.locationInputContainer, errors.startPoint && styles.inputError]}
                onPress={() => openLocationSearch('start')}
              >
                <Ionicons name="home-outline" size={20} color={Colors.primary600} />
                <Text style={[styles.locationInputText, !startPoint && styles.placeholderText]}>
                  {startPoint ? startPoint.name : 'Select starting point'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.secondary400} />
              </TouchableOpacity>
              {errors.startPoint && (
                <Text style={styles.errorText}>{errors.startPoint}</Text>
              )}
            </View>

            {/* Date Selection */}
            <View style={styles.dateSection}>
              <Text style={styles.inputLabel}>Travel dates</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={[styles.dateInputContainer, errors.dates && styles.inputError]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={Colors.primary600} />
                  <View style={styles.dateInputContent}>
                    <Text style={styles.dateInputLabel}>Start Date</Text>
                    <Text style={styles.dateInputText}>{formatDate(startDate)}</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.dateInputContainer, errors.dates && styles.inputError]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={Colors.primary600} />
                  <View style={styles.dateInputContent}>
                    <Text style={styles.dateInputLabel}>End Date</Text>
                    <Text style={styles.dateInputText}>{formatDate(endDate)}</Text>
                  </View>
                </TouchableOpacity>
              </View>
              {errors.dates && (
                <Text style={styles.errorText}>{errors.dates}</Text>
              )}
            </View>

            {/* Trip Summary */}
            {startPoint && destination && (
              <View style={styles.tripSummary}>
                <Text style={styles.tripSummaryTitle}>Trip Summary</Text>
                <View style={styles.tripSummaryItem}>
                  <Ionicons name="location" size={16} color={Colors.primary600} />
                  <Text style={styles.tripSummaryText}>
                    From {startPoint.name} to {destination.name}
                  </Text>
                </View>
                <View style={styles.tripSummaryItem}>
                  <Ionicons name="calendar" size={16} color={Colors.primary600} />
                  <Text style={styles.tripSummaryText}>
                    {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1)} days
                  </Text>
                </View>
              </View>
            )}

            <CustomButton
              title="Start Planning"
              onPress={handleStartPlanning}
              style={styles.startPlanningButton}
            />
          </ScrollView>
        </View>
      </Modalize>

      {/* Date Pickers */}
      <Modal
        visible={showStartDatePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
      >
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerHeader}>
            <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
              <Text style={styles.datePickerCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.datePickerTitle}>Select Start Date</Text>
            <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
              <Text style={styles.datePickerDoneButton}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.calendarContainer}>
            <Calendar
              current={startDate.toISOString().split('T')[0]}
              onDayPress={(day) => {
                const selectedDate = new Date(day.timestamp);
                setStartDate(selectedDate);
                
                // If start date is after end date, adjust end date
                if (selectedDate >= endDate) {
                  const newEndDate = new Date(selectedDate);
                  newEndDate.setDate(selectedDate.getDate() + 1);
                  setEndDate(newEndDate);
                }
                
                setErrors(prev => ({ ...prev, dates: undefined }));
                
                // Auto-close on selection for better UX
                setTimeout(() => {
                  setShowStartDatePicker(false);
                }, 300);
              }}
              markedDates={{
                [startDate.toISOString().split('T')[0]]: {
                  selected: true,
                  selectedColor: Colors.primary600,
                  selectedTextColor: Colors.white,
                },
              }}
              minDate={new Date().toISOString().split('T')[0]}
              theme={{
                backgroundColor: Colors.white,
                calendarBackground: Colors.white,
                textSectionTitleColor: Colors.secondary600,
                selectedDayBackgroundColor: Colors.primary600,
                selectedDayTextColor: Colors.white,
                todayTextColor: Colors.primary600,
                dayTextColor: Colors.secondary700,
                textDisabledColor: Colors.secondary400,
                dotColor: Colors.primary600,
                selectedDotColor: Colors.white,
                arrowColor: Colors.primary600,
                disabledArrowColor: Colors.secondary400,
                monthTextColor: Colors.secondary700,
                indicatorColor: Colors.primary600,
                textDayFontWeight: '500',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              style={styles.calendar}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEndDatePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
      >
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerHeader}>
            <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
              <Text style={styles.datePickerCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.datePickerTitle}>Select End Date</Text>
            <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
              <Text style={styles.datePickerDoneButton}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.calendarContainer}>
            <Calendar
              current={endDate.toISOString().split('T')[0]}
              onDayPress={(day) => {
                const selectedDate = new Date(day.timestamp);
                setEndDate(selectedDate);
                setErrors(prev => ({ ...prev, dates: undefined }));
                
                // Auto-close on selection for better UX
                setTimeout(() => {
                  setShowEndDatePicker(false);
                }, 300);
              }}
              markedDates={{
                [endDate.toISOString().split('T')[0]]: {
                  selected: true,
                  selectedColor: Colors.primary600,
                  selectedTextColor: Colors.white,
                },
              }}
              minDate={startDate.toISOString().split('T')[0]}
              theme={{
                backgroundColor: Colors.white,
                calendarBackground: Colors.white,
                textSectionTitleColor: Colors.secondary600,
                selectedDayBackgroundColor: Colors.primary600,
                selectedDayTextColor: Colors.white,
                todayTextColor: Colors.primary600,
                dayTextColor: Colors.secondary700,
                textDisabledColor: Colors.secondary400,
                dotColor: Colors.primary600,
                selectedDotColor: Colors.white,
                arrowColor: Colors.primary600,
                disabledArrowColor: Colors.secondary400,
                monthTextColor: Colors.secondary700,
                indicatorColor: Colors.primary600,
                textDayFontWeight: '500',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              style={styles.calendar}
            />
          </View>
        </View>
      </Modal>

      {/* Location Search Modal */}
      <Modal
        visible={showLocationSearch}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select {locationSearchType === 'start' ? 'Starting Point' : 'Destination'}
            </Text>
            <TouchableOpacity onPress={() => setShowLocationSearch(false)}>
              <Ionicons name="close" size={24} color={Colors.secondary700} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={Colors.secondary400} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for places in Sri Lanka..."
                placeholderTextColor={Colors.secondary400}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  searchLocations(text);
                }}
                autoFocus
              />
              {isSearching && (
                <View style={styles.searchLoadingIcon}>
                  <Ionicons name="refresh" size={16} color={Colors.primary600} />
                </View>
              )}
              {!isSearching && searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.searchClearButton}
                  onPress={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setIsSearching(false);
                  }}
                >
                  <Ionicons name="close-circle" size={16} color={Colors.secondary400} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => handleLocationSelect(item)}
              >
                <Ionicons name="location" size={20} color={Colors.primary600} />
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultName}>{item.name}</Text>
                  <Text style={styles.searchResultAddress} numberOfLines={2}>
                    {item.address}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.secondary400} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              isSearching ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="refresh" size={24} color={Colors.primary600} />
                  <Text style={styles.loadingText}>Searching places...</Text>
                </View>
              ) : searchQuery.length > 1 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="location-outline" size={48} color={Colors.secondary400} />
                  <Text style={styles.noResultsText}>No places found</Text>
                  <Text style={styles.noResultsSubtext}>Try a different search term</Text>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search" size={48} color={Colors.secondary400} />
                  <Text style={styles.noResultsText}>
                    Start typing to search for places in Sri Lanka
                  </Text>
                </View>
              )
            }
            style={styles.searchResults}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabButton: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary800,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  bottomSheetContent: {
    flex: 1,
    alignItems: 'stretch',
    backgroundColor: Colors.secondary50,
    paddingBottom: 20,
  },
  sheetTitle: {
    width: '100%',
    backgroundColor: Colors.primary800,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 28,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sheetBody: {
    backgroundColor: Colors.secondary50,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  sheetBodyContent: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'stretch',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    gap: 12,
  },
  bottomSheetTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 0,
    alignSelf: 'center',
  },
  startPlanningButton: {
    marginTop: 24,
    backgroundColor: Colors.primary600,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 8,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  locationInputText: {
    flex: 1,
    fontSize: 16,
    color: Colors.secondary700,
    marginLeft: 12,
  },
  placeholderText: {
    color: Colors.secondary400,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    marginHorizontal: 4,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dateInputContent: {
    flex: 1,
    marginLeft: 12,
  },
  dateInputLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    marginBottom: 2,
  },
  dateInputText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary700,
  },
  tripSummary: {
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary600,
  },
  tripSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 12,
  },
  tripSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripSummaryText: {
    fontSize: 14,
    color: Colors.secondary600,
    marginLeft: 8,
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
    backgroundColor: Colors.white,
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.secondary700,
    marginLeft: 8,
  },
  searchLoadingIcon: {
    marginLeft: 8,
  },
  searchClearButton: {
    marginLeft: 8,
    padding: 4,
  },
  searchResults: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  searchResultAddress: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.secondary500,
    marginTop: 12,
  },
  emptyContainer: {
    padding: 32,
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
    marginTop: 4,
  },
  datePickerModal: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'flex-start',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
    backgroundColor: Colors.white,
  },
  datePickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  calendarContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  calendar: {
    borderRadius: 12,
    backgroundColor: Colors.white,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  datePickerCancelButton: {
    fontSize: 16,
    color: Colors.secondary500,
  },
  datePickerDoneButton: {
    fontSize: 16,
    color: Colors.primary600,
    fontWeight: '600',
  },
  datePickerComponent: {
    backgroundColor: Colors.white,
    width: '100%',
  },
});
