import { useLocalSearchParams } from 'expo-router';
import {
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { CustomButton, CustomTextInput, HotelCard, ThemedText, TripDetailsModal } from '../../../components';
import { Calendar } from 'react-native-calendars';

import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { Colors } from '../../../constants/Colors';
import { AccommodationApiService, Accommodation } from '../../../services/accommodationApi';
import { BookingService, CreateAccommodationBookingRequest } from '../../../services/booking';
import { StorageService } from '../../../services/storage';

interface Hotel {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  location: string;
  distance: string;
  image: string;
  amenities: string[];
  description: string;
  availability: boolean;
}

interface TripDay {
  date: string;
  dayNumber: number;
  formattedDate: string;
}

interface AccommodationBookingScreenProps {
  filters?: {
    minPrice: string;
    maxPrice: string;
    location: string;
    minRating: number;
    propertyTypes: string[];
  };
}

export default function AccommodationBookingScreen({ filters }: AccommodationBookingScreenProps) {
  const params = useLocalSearchParams();
  const { destination, startPoint, startDate, endDate, destinations } = params;

  // State for selected day and trip details modal
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [tripDetailsVisible, setTripDetailsVisible] = useState(false);
  const [showDaySelector, setShowDaySelector] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  
  // Date picker states
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);
  const [checkInDate, setCheckInDate] = useState(startDate as string || new Date().toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState(endDate as string || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  // State for real data
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);

  // Filter state - initialize with passed filters or defaults
  const [minPrice, setMinPrice] = useState(filters?.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(filters?.maxPrice || '');
  const [location, setLocation] = useState(filters?.location || '');
  const [minRating, setMinRating] = useState(filters?.minRating || 0);
  const [propertyTypes, setPropertyTypes] = useState<string[]>(filters?.propertyTypes || []);

  // Fetch accommodations data
  const fetchAccommodations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏨 Fetching accommodations for booking...');
      const response = await AccommodationApiService.getAllAccommodations();
      
      if (response.success && response.data) {
        setAccommodations(response.data);
        console.log('✅ Accommodations loaded:', response.data.length);
      } else {
        throw new Error(response.message || 'Failed to fetch accommodations');
      }
    } catch (err: any) {
      console.error('❌ Error fetching accommodations:', err);
      setError(err.message || 'Failed to load accommodations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccommodations();
  }, []);

  // Date picker handlers
  const handleSelectCheckInDate = (dateString: string) => {
    setCheckInDate(dateString);
    setShowCheckInCalendar(false);
    
    // If check-in date is after check-out date, adjust check-out date
    const checkIn = new Date(dateString);
    const checkOut = new Date(checkOutDate);
    if (checkIn >= checkOut) {
      const newCheckOut = new Date(checkIn);
      newCheckOut.setDate(checkIn.getDate() + 1);
      setCheckOutDate(newCheckOut.toISOString().split('T')[0]);
    }
  };

  const handleSelectCheckOutDate = (dateString: string) => {
    setCheckOutDate(dateString);
    setShowCheckOutCalendar(false);
  };

  // Booking functionality
  const handleBookAccommodation = async (accommodation: Accommodation) => {
    try {
      setBookingLoading(accommodation._id);
      
      // Get user data for contact info
      const userData = await StorageService.getUserData();
      if (!userData) {
        throw new Error('Please log in to make a booking');
      }

      // Calculate trip duration using selected dates
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Calculate total amount
      const totalAmount = accommodation.price * nights;

      const bookingPayload: CreateAccommodationBookingRequest = {
        serviceType: 'accommodation',
        serviceId: accommodation._id,
        serviceName: accommodation.name,
        serviceProvider: accommodation.userId || 'unknown',
        totalAmount: totalAmount,
        currency: 'LKR',
        bookingDetails: {
          checkInDate: checkInDate,
          checkOutDate: checkOutDate,
          rooms: 1, // Default rooms, could be made configurable
          adults: 2, // Default adults, could be made configurable
          children: 0, // Default children
          nights: nights,
          roomBreakdown: [{
            roomType: accommodation.accommodationType || 'Standard',
            quantity: 1,
            pricePerNight: accommodation.price
          }]
        },
        contactInfo: {
          email: userData.email || '',
          phone: userData.phone || '',
          firstName: userData.firstName || userData.name || '',
          lastName: userData.lastName || '',
          emergencyContact: userData.phone || ''
        }
      };

      console.log('🏨 Creating accommodation booking:', bookingPayload);
      
      // Create booking through API gateway to booking service
      const response = await BookingService.createAccommodationBooking(bookingPayload);
      
      if (response.success) {
        Alert.alert(
          'Booking Successful!',
          `Your accommodation booking for ${accommodation.name} has been confirmed.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back or to booking summary
                console.log('✅ Accommodation booking created successfully');
              }
            }
          ]
        );
      } else {
        throw new Error(response.error || 'Failed to create booking');
      }
      
    } catch (error: any) {
      console.error('❌ Error creating accommodation booking:', error);
      Alert.alert(
        'Booking Failed',
        error.message || 'Failed to create booking. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setBookingLoading(null);
    }
  };

  // Calculate trip duration and generate days
  const generateTripDays = (): TripDay[] => {
    if (!startDate || !endDate) return [];
    
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const days: TripDay[] = [];
    
    let currentDate = new Date(start);
    let dayNumber = 1;
    
    while (currentDate < end) { // Note: < not <= because last day is checkout
      days.push({
        date: currentDate.toISOString().split('T')[0],
        dayNumber,
        formattedDate: currentDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          weekday: 'short'
        }),
      });
      currentDate.setDate(currentDate.getDate() + 1);
      dayNumber++;
    }
    
    return days;
  };

  const tripDays = generateTripDays();

  // Parse destinations from the trip planning data
  const selectedPlaces = destinations ? JSON.parse(destinations as string) : [destination];

  // Filter functions
  const propertyTypeOptions = ['Hotel', 'Villa', 'Guest House', 'Hostel', 'Apartment'];

  const togglePropertyType = (type: string) => {
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleApplyFilters = () => {
    // TODO: Connect to actual filtering logic
    setFilterVisible(false);
  };

  const handleCancelFilters = () => {
    setFilterVisible(false);
  };

  // Convert Accommodation to Hotel format for display
  const hotels: Hotel[] = accommodations.map(accommodation => ({
    id: accommodation._id,
    name: accommodation.name,
    rating: accommodation.rating || 4.5, // Default rating if not available
    reviewCount: 0, // Default review count
    pricePerNight: accommodation.price,
    location: accommodation.location,
    distance: 'Near city center', // Default distance
    image: accommodation.images && accommodation.images.length > 0 ? accommodation.images[0] : 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    amenities: accommodation.amenities || [],
    description: accommodation.description || `${accommodation.name} - ${accommodation.accommodationType}`,
    availability: accommodation.availability === 'available',
  }));

  const renderHotelCard = ({ item: hotel }: { item: Hotel }) => {
    const originalAccommodation = accommodations.find(a => a._id === hotel.id);
    
    return (
      <View style={styles.hotelCardContainer}>
        <HotelCard
          hotel={hotel}
          selectedDay={tripDays[selectedDayIndex]}
          destination={destination as string}
          startDate={startDate as string}
          endDate={endDate as string}
          destinations={destinations as string}
          startPoint={startPoint as string}
        />
        {hotel.availability && originalAccommodation && (
          <View style={styles.bookingContainer}>
            <CustomButton
              title={bookingLoading === hotel.id ? "Booking..." : "Book Now"}
              variant="primary"
              size="small"
              onPress={() => handleBookAccommodation(originalAccommodation)}
              disabled={bookingLoading === hotel.id}
              style={styles.bookButton}
            />
            {bookingLoading === hotel.id && (
              <ActivityIndicator size="small" color={Colors.primary600} style={styles.loadingIndicator} />
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary600} />
        <ThemedText style={styles.loadingText}>Loading accommodation options...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <CustomButton
          title="Retry"
          variant="primary"
          size="small"
          onPress={fetchAccommodations}
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Booking Details Section */}
      <View style={styles.bookingDetailsContainer}>
        {/* Check-in Date */}
        <TouchableOpacity 
          style={styles.bookingCard}
          onPress={() => setShowCheckInCalendar(true)}
          activeOpacity={0.8}
        >
          <View style={styles.bookingCardContent}>
            <View style={styles.calendarIconContainer}>
              <Ionicons name="calendar" size={20} color={Colors.white} />
            </View>
            <View style={styles.bookingInfo}>
              <ThemedText style={styles.bookingLabel}>Check-in Date</ThemedText>
              <ThemedText style={styles.bookingDate}>
                {new Date(checkInDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </ThemedText>
            </View>
            <View style={styles.changeButtonContainer}>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary600} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Check-out Date */}
        <TouchableOpacity 
          style={styles.bookingCard}
          onPress={() => setShowCheckOutCalendar(true)}
          activeOpacity={0.8}
        >
          <View style={styles.bookingCardContent}>
            <View style={styles.calendarIconContainer}>
              <Ionicons name="calendar" size={20} color={Colors.white} />
            </View>
            <View style={styles.bookingInfo}>
              <ThemedText style={styles.bookingLabel}>Check-out Date</ThemedText>
              <ThemedText style={styles.bookingDate}>
                {new Date(checkOutDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </ThemedText>
            </View>
            <View style={styles.changeButtonContainer}>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary600} />
            </View>
          </View>
        </TouchableOpacity>

      </View>

      {/* Search Area */}
      <View style={styles.searchArea}>
        <CustomTextInput
          label=''
          placeholder='Search accommodations'
          leftIcon='search-outline'
          containerStyle={[styles.searchInput, { marginBottom: 0 }]}
        />
        <CustomButton
          variant='primary'
          size='small'
          title=""
          rightIcon={<Ionicons name="filter" size={22} color="white" />}
          style={styles.filterButton}
          onPress={() => setFilterVisible(true)}
        />
      </View>

      <FlatList
        data={hotels}
        renderItem={renderHotelCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <TripDetailsModal
        visible={tripDetailsVisible}
        onClose={() => setTripDetailsVisible(false)}
        destination={destination as string}
        startPoint={startPoint as string}
        startDate={startDate as string}
        endDate={endDate as string}
        destinations={selectedPlaces}
        tripDays={tripDays}
        selectedDayIndex={selectedDayIndex}
      />

      {/* Check-in Date Calendar Modal */}
      <Modal
        visible={showCheckInCalendar}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCheckInCalendar(false)}
      >
        <View style={styles.calendarModalContainer}>
          <View style={styles.calendarModalHeader}>
            <ThemedText style={styles.calendarModalTitle}>Select Check-in Date</ThemedText>
            <TouchableOpacity onPress={() => setShowCheckInCalendar(false)}>
              <Ionicons name="close" size={24} color={Colors.secondary700} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.calendarContainer}>
            <Calendar
              style={styles.calendar}
              theme={{
                backgroundColor: Colors.white,
                calendarBackground: Colors.white,
                textSectionTitleColor: Colors.secondary700,
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
              minDate={new Date().toISOString().split('T')[0]}
              onDayPress={(day) => {
                handleSelectCheckInDate(day.dateString);
              }}
              markedDates={{
                [checkInDate]: {
                  selected: true,
                  selectedColor: Colors.primary600,
                  selectedTextColor: Colors.white,
                },
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Check-out Date Calendar Modal */}
      <Modal
        visible={showCheckOutCalendar}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCheckOutCalendar(false)}
      >
        <View style={styles.calendarModalContainer}>
          <View style={styles.calendarModalHeader}>
            <ThemedText style={styles.calendarModalTitle}>Select Check-out Date</ThemedText>
            <TouchableOpacity onPress={() => setShowCheckOutCalendar(false)}>
              <Ionicons name="close" size={24} color={Colors.secondary700} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.calendarContainer}>
            <Calendar
              style={styles.calendar}
              theme={{
                backgroundColor: Colors.white,
                calendarBackground: Colors.white,
                textSectionTitleColor: Colors.secondary700,
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
              minDate={checkInDate}
              onDayPress={(day) => {
                handleSelectCheckOutDate(day.dateString);
              }}
              markedDates={{
                [checkOutDate]: {
                  selected: true,
                  selectedColor: Colors.primary600,
                  selectedTextColor: Colors.white,
                },
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={filterVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelFilters}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContainer}>
            <ScrollView contentContainerStyle={styles.filterModalContent}>
              <ThemedText variant="title" style={styles.filterModalTitle}>Find Your Perfect Stay</ThemedText>
              
              {/* Price Range */}
              <View style={styles.filterModalSection}>
                <ThemedText variant='subtitle' style={styles.filterModalLabel}>Price Range ($)</ThemedText>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <CustomTextInput
                    label=''
                    placeholder="Min"
                    keyboardType="numeric"
                    value={minPrice}
                    onChangeText={setMinPrice}
                    containerStyle={[styles.filterModalInput, { flex: 1 }]}
                  />
                  <CustomTextInput
                    label=''
                    placeholder="Max"
                    keyboardType="numeric"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    containerStyle={[styles.filterModalInput, { flex: 1 }]}
                  />
                </View>
              </View>

              {/* Location */}
              <View style={styles.filterModalSection}>
                <ThemedText variant='subtitle' style={styles.filterModalLabel}>Location</ThemedText>
                <CustomTextInput
                  label=""
                  placeholder="Enter preferred location"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              {/* Minimum Rating */}
              <View style={styles.filterModalSection}>
                <ThemedText variant='subtitle' style={[styles.filterModalLabel, {marginBottom: 20}]}>Minimum Rating</ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[1,2,3,4,5].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.typeChip, minRating === r && styles.typeChipSelected]}
                      onPress={() => setMinRating(r)}
                    >
                      <Text style={[styles.typeChipText, minRating === r && styles.typeChipTextSelected]}>{r} Star{r > 1 ? 's' : ''}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Property Type */}
              <View style={styles.filterModalSection}>
                <ThemedText variant='subtitle' style={[styles.filterModalLabel, {marginBottom: 20}]}>Property Type</ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {propertyTypeOptions.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeChip, propertyTypes.includes(type) && styles.typeChipSelected]}
                      onPress={() => togglePropertyType(type)}
                    >
                      <Text style={[styles.typeChipText, propertyTypes.includes(type) && styles.typeChipTextSelected]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.filterModalActions}>
              <CustomButton
                title="Cancel"
                variant="secondary"
                style={styles.filterModalActionBtn}
                onPress={handleCancelFilters}
              />
              <CustomButton
                title="Apply Filters"
                variant="primary"
                style={styles.filterModalActionBtn}
                onPress={handleApplyFilters}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  bookingDetailsContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
    position: 'relative',
  },
  bookingCard: {
    backgroundColor: Colors.primary700,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.primary100,
  },
  bookingCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  bookingDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 14,
    color: Colors.secondary50,
    fontWeight: '500',
  },
  changeButtonContainer: {
    alignItems: 'flex-end',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  changeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary700,
  },
  searchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
  },
  filterButton: {
    height: 48,
    aspectRatio: 1, // makes it square
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: Colors.white,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  filtersHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondary700,
  },
  filtersScroll: {
    paddingHorizontal: 20,
  },
  primaryFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary600,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 12,
    gap: 8,
    shadowColor: Colors.primary600,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryFilterText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary50,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },
  filterText: {
    fontSize: 13,
    color: Colors.secondary700,
    fontWeight: '500',
  },
  listContent: {
    padding: 20,
    paddingTop: 16,
  },
  listHeader: {
    marginBottom: 24,
  },
  simpleResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    textAlign: 'center',
    paddingVertical: 12,
  },
  daySelectionContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    maxHeight: 280,
    marginHorizontal: 20,
  },
  daySelectionBackdrop: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    bottom: -1000, // Extend beyond the container
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 999,
  },
  daySelectionOverlay: {
    position: 'absolute',
    top: 120, // Position it below the booking card with proper spacing
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  daySelectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.secondary50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  daySelectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
    flex: 1,
    marginLeft: 8,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daysList: {
    paddingVertical: 4,
    maxHeight: 220,
  },
  dayItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
    marginHorizontal: 4,
    marginVertical: 1,
    borderRadius: 6,
  },
  selectedDayItem: {
    backgroundColor: Colors.primary600,
    borderRadius: 6,
    marginHorizontal: 4,
    marginVertical: 1,
    borderBottomWidth: 0, // Remove border for selected item
  },
  dayItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayItemLeft: {
    flex: 1,
  },
  dayItemNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 2,
  },
  dayItemDate: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  selectedDayItemText: {
    color: Colors.white,
  },
  dayItemCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalContainer: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.secondary500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  filterModalContent: {
    paddingBottom: 10,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
    color: Colors.primary800,
    textAlign: 'center',
  },
  filterModalSection: {
    marginBottom: 20,
  },
  filterModalLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    color: Colors.primary700,
  },
  filterModalInput: {
    flex: 1,
    padding: 12,
    marginBottom: 0,
    fontSize: 15,
    minWidth: 80,
  },
  typeChip: {
    borderWidth: 1,
    borderColor: Colors.primary100,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 6,
    backgroundColor: Colors.secondary50,
  },
  typeChipSelected: {
    borderColor: Colors.primary600,
    backgroundColor: Colors.primary100,
  },
  typeChipText: {
    color: Colors.primary700,
    fontWeight: '500',
  },
  typeChipTextSelected: {
    color: Colors.primary800,
    fontWeight: '700',
  },
  filterModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  filterModalActionBtn: {
    flex: 1,
  },
  hotelCardContainer: {
    marginBottom: 16,
  },
  bookingContainer: {
    marginTop: 12,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bookButton: {
    minWidth: 120,
  },
  loadingIndicator: {
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondary50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.secondary600,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondary50,
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 20,
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 100,
  },
  calendarModalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  calendarModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  calendarContainer: {
    flex: 1,
    padding: 20,
  },
  calendar: {
    borderRadius: 10,
  },
});
