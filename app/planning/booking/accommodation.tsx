import { useLocalSearchParams } from 'expo-router';
import {
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { CustomButton, CustomTextInput, HotelCard, ThemedText, TripDetailsModal } from '../../../components';

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Colors } from '../../../constants/Colors';

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

export default function AccommodationBookingScreen() {
  const params = useLocalSearchParams();
  const { destination, startPoint, startDate, endDate, destinations } = params;

  // State for selected day and trip details modal
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [tripDetailsVisible, setTripDetailsVisible] = useState(false);
  const [showDaySelector, setShowDaySelector] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  // Filter state
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [location, setLocation] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);

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

  const hotels: Hotel[] = [
    {
      id: '1',
      name: 'Galle Heritage Villa',
      rating: 4.8,
      reviewCount: 142,
      pricePerNight: 85,
      location: 'Galle Fort',
      distance: '0.2 km from Galle Fort',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      amenities: ['Free WiFi', 'Pool', 'Breakfast', 'AC'],
      description: 'Charming heritage villa in the heart of Galle Fort with stunning ocean views.',
      availability: true,
    },
    {
      id: '2',
      name: 'Kandy Hills Resort',
      rating: 4.6,
      reviewCount: 89,
      pricePerNight: 120,
      location: 'Kandy',
      distance: '1.5 km from Temple of Tooth',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
      amenities: ['Mountain View', 'Spa', 'Restaurant', 'Free WiFi'],
      description: 'Luxury resort with panoramic views of Kandy hills and the sacred temple.',
      availability: true,
    },
    {
      id: '3',
      name: 'Ella Rock View Hotel',
      rating: 4.7,
      reviewCount: 76,
      pricePerNight: 95,
      location: 'Ella',
      distance: '0.8 km from Ella Rock',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
      amenities: ['Hiking Trails', 'Tea Garden', 'Breakfast', 'Balcony'],
      description: 'Boutique hotel with direct access to hiking trails and tea plantations.',
      availability: true,
    },
    {
      id: '4',
      name: 'Sigiriya Eco Lodge',
      rating: 4.5,
      reviewCount: 124,
      pricePerNight: 110,
      location: 'Sigiriya',
      distance: '2.0 km from Sigiriya Rock',
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d',
      amenities: ['Eco-friendly', 'Safari Tours', 'Pool', 'Restaurant'],
      description: 'Sustainable eco lodge offering authentic Sri Lankan experiences.',
      availability: false,
    },
  ];

  const renderHotelCard = ({ item: hotel }: { item: Hotel }) => (
    <HotelCard
      hotel={hotel}
      selectedDay={tripDays[selectedDayIndex]}
      destination={destination as string}
      startDate={startDate as string}
      endDate={endDate as string}
      destinations={destinations as string}
      startPoint={startPoint as string}
    />
  );

  return (
    <View style={styles.container}>
      {/* Booking Details Section */}
      <View style={styles.bookingDetailsContainer}>
        <TouchableOpacity 
          style={styles.bookingCard}
          onPress={() => setShowDaySelector(!showDaySelector)}
          activeOpacity={0.8}
        >
          <View style={styles.bookingCardContent}>
            <View style={styles.calendarIconContainer}>
              <Ionicons name="calendar" size={20} color={Colors.white} />
            </View>
            <View style={styles.bookingInfo}>
              <ThemedText style={styles.bookingLabel}>Check-in Date</ThemedText>
              <ThemedText style={styles.bookingDay}>
                Day {tripDays[selectedDayIndex]?.dayNumber}
              </ThemedText>
              <ThemedText style={styles.bookingDate}>
                {tripDays[selectedDayIndex]?.formattedDate}
              </ThemedText>
            </View>
            <View style={styles.changeButtonContainer}>
              <View style={styles.changeButton}>
                <ThemedText style={styles.changeButtonText}>Change</ThemedText>
                <Ionicons 
                  name={showDaySelector ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color={Colors.primary600} 
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {showDaySelector && (
          <>
            <View style={styles.daySelectionBackdrop} />
            <View style={styles.daySelectionOverlay}>
              <View style={styles.daySelectionContainer}>
                <View style={styles.daySelectionHeader}>
                  <Ionicons name="calendar" size={16} color={Colors.primary600} />
                  <ThemedText style={styles.daySelectionTitle}>Select Check-in Day</ThemedText>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowDaySelector(false)}
                  >
                    <Ionicons name="close" size={16} color={Colors.secondary500} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.daysList} showsVerticalScrollIndicator={false}>
                  {tripDays.map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayItem,
                        selectedDayIndex === index && styles.selectedDayItem
                      ]}
                      onPress={() => {
                        setSelectedDayIndex(index);
                        setShowDaySelector(false);
                      }}
                    >
                      <View style={styles.dayItemContent}>
                        <View style={styles.dayItemLeft}>
                          <ThemedText style={[
                            styles.dayItemNumber,
                            selectedDayIndex === index && styles.selectedDayItemText
                          ]}>
                            Day {day.dayNumber}
                          </ThemedText>
                          <ThemedText style={[
                            styles.dayItemDate,
                            selectedDayIndex === index && styles.selectedDayItemText
                          ]}>
                            {day.formattedDate}
                          </ThemedText>
                        </View>
                        {selectedDayIndex === index && (
                          <View style={styles.dayItemCheckmark}>
                            <Ionicons name="checkmark" size={16} color={Colors.white} />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </>
        )}
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
});
