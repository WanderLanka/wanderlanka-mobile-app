import { router, useLocalSearchParams } from 'expo-router';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CustomButton, CustomTextInput, ThemedText } from '../../../components';

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import AccommodationBookingScreen from './accommodation';
import GuidesBookingScreen from './guides';
import TransportBookingScreen from './transport';

export default function BookingScreen() {
  const params = useLocalSearchParams();
  const { destination, startDate, endDate, destinations } = params;

  // State management
  const [activeTab, setActiveTab] = useState('accommodation');
  const [showTripModal, setShowTripModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  // Filter state
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [location, setLocation] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);

  // Mock bookings data - in real app this would come from context or API
  const [bookings] = useState({
    accommodation: [],
    transport: [],
    guides: [],
  });

  // Calculate trip duration
  const calculateTripDuration = () => {
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 1;
  };

  const tripDuration = calculateTripDuration();

  const selectedPlaces = destinations ? JSON.parse(destinations as string) : [destination];

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

  const tabs = [
    { id: 'accommodation', title: 'Stay', icon: 'bed-outline' },
    { id: 'transport', title: 'Travel', icon: 'car-outline' },
    { id: 'guides', title: 'Guides', icon: 'person-outline' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'accommodation':
        return <AccommodationBookingScreen />;
      case 'transport':
        return <TransportBookingScreen />;
      case 'guides':
        return <GuidesBookingScreen />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.secondary700} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Book Your Trip</ThemedText>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setFilterVisible(true)}
          >
            <Ionicons name="filter" size={20} color={Colors.primary600} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowTripModal(true)}
          >
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary600} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowBookingsModal(true)}
          >
            <Ionicons name="receipt-outline" size={20} color={Colors.primary600} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.navItem, activeTab === tab.id && styles.activeNavItem]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={activeTab === tab.id ? Colors.primary700 : Colors.secondary500} 
            />
            <ThemedText style={[
              styles.navText, 
              activeTab === tab.id && styles.activeNavText
            ]}>
              {tab.title}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trip Overview Modal */}
      <Modal
        visible={showTripModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTripModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Trip Overview</ThemedText>
            <TouchableOpacity onPress={() => setShowTripModal(false)}>
              <Ionicons name="close" size={24} color={Colors.secondary700} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.tripDetailsContainer}>
              <View style={styles.tripDetailsHeader}>
                <Ionicons name="map" size={20} color={Colors.primary600} />
                <ThemedText style={styles.tripDetailsTitle}>Trip Details</ThemedText>
              </View>
              
              <View style={styles.tripStatsRow}>
                <View style={styles.tripStat}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.secondary500} />
                  <ThemedText style={styles.tripStatValue}>{tripDuration}</ThemedText>
                  <ThemedText style={styles.tripStatLabel}>{tripDuration === 1 ? 'Day' : 'Days'}</ThemedText>
                </View>
                <View style={styles.tripStat}>
                  <Ionicons name="location-outline" size={16} color={Colors.secondary500} />
                  <ThemedText style={styles.tripStatValue}>{selectedPlaces.length}</ThemedText>
                  <ThemedText style={styles.tripStatLabel}>{selectedPlaces.length === 1 ? 'Place' : 'Places'}</ThemedText>
                </View>
                <View style={styles.tripStat}>
                  <Ionicons name="home-outline" size={16} color={Colors.secondary500} />
                  <ThemedText style={styles.tripStatValue}>1</ThemedText>
                  <ThemedText style={styles.tripStatLabel}>Start Point</ThemedText>
                </View>
              </View>

              {selectedPlaces.length > 1 && (
                <View style={styles.destinationsContainer}>
                  <ThemedText style={styles.destinationsLabel}>Your Planned Destinations:</ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.destinationsScroll}>
                    {selectedPlaces.map((place: string, index: number) => (
                      <View key={index} style={styles.destinationChip}>
                        <ThemedText style={styles.destinationChipText}>{place}</ThemedText>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Bookings Summary Modal */}
      <Modal
        visible={showBookingsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBookingsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Booking Summary</ThemedText>
            <TouchableOpacity onPress={() => setShowBookingsModal(false)}>
              <Ionicons name="close" size={24} color={Colors.secondary700} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.bookingSummaryContainer}>
              <View style={styles.bookingSection}>
                <View style={styles.bookingSectionHeader}>
                  <Ionicons name="bed-outline" size={20} color={Colors.primary600} />
                  <ThemedText style={styles.bookingSectionTitle}>Accommodation</ThemedText>
                </View>
                {bookings.accommodation.length === 0 ? (
                  <ThemedText style={styles.noBookingsText}>No bookings made yet</ThemedText>
                ) : (
                  bookings.accommodation.map((booking: any, index: number) => (
                    <View key={index} style={styles.bookingItem}>
                      <ThemedText style={styles.bookingItemTitle}>{booking.name}</ThemedText>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.bookingSection}>
                <View style={styles.bookingSectionHeader}>
                  <Ionicons name="car-outline" size={20} color={Colors.primary600} />
                  <ThemedText style={styles.bookingSectionTitle}>Transportation</ThemedText>
                </View>
                {bookings.transport.length === 0 ? (
                  <ThemedText style={styles.noBookingsText}>No bookings made yet</ThemedText>
                ) : (
                  bookings.transport.map((booking: any, index: number) => (
                    <View key={index} style={styles.bookingItem}>
                      <ThemedText style={styles.bookingItemTitle}>{booking.name}</ThemedText>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.bookingSection}>
                <View style={styles.bookingSectionHeader}>
                  <Ionicons name="person-outline" size={20} color={Colors.primary600} />
                  <ThemedText style={styles.bookingSectionTitle}>Tour Guides</ThemedText>
                </View>
                {bookings.guides.length === 0 ? (
                  <ThemedText style={styles.noBookingsText}>No bookings made yet</ThemedText>
                ) : (
                  bookings.guides.map((booking: any, index: number) => (
                    <View key={index} style={styles.bookingItem}>
                      <ThemedText style={styles.bookingItemTitle}>{booking.name}</ThemedText>
                    </View>
                  ))
                )}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={filterVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelFilters}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContainer}>
            <ScrollView contentContainerStyle={styles.filterModalContent}>
              <ThemedText variant="title" style={styles.filterModalTitle}>
                {activeTab === 'accommodation' ? 'Find Your Perfect Stay' : 
                 activeTab === 'transport' ? 'Choose Your Ride' : 
                 'Select Your Guide'}
              </ThemedText>
              
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
                  placeholder={
                    activeTab === 'accommodation' ? 'Enter preferred location' : 
                    activeTab === 'transport' ? 'Pickup location' : 
                    'Guide service area'
                  }
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

              {/* Dynamic Filter Based on Active Tab */}
              <View style={styles.filterModalSection}>
                <ThemedText variant='subtitle' style={[styles.filterModalLabel, {marginBottom: 20}]}>
                  {activeTab === 'accommodation' ? 'Property Type' : 
                   activeTab === 'transport' ? 'Vehicle Type' : 
                   'Guide Specialties'}
                </ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(activeTab === 'accommodation' ? propertyTypeOptions : 
                    activeTab === 'transport' ? ['Car', 'Van', 'Bus', 'Tuk Tuk', 'Motorcycle'] :
                    ['Cultural Tours', 'Nature Walks', 'Adventure Sports', 'Food Tours', 'Photography']).map((type) => (
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary100,
    borderWidth: 1,
    borderColor: Colors.primary300,
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
    paddingBottom: 20, // Reduced from 34
    paddingTop: 6, // Reduced from 8
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    paddingVertical: 6, // Reduced from 8
    paddingHorizontal: 8, // Reduced from 12
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10, // Reduced from 12
    marginHorizontal: 3, // Reduced from 4
  },
  activeNavItem: {
    backgroundColor: Colors.primary100,
    borderWidth: 1,
    borderColor: Colors.primary300,
  },
  navText: {
    fontSize: 10,
    color: Colors.secondary500,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeNavText: {
    color: Colors.primary700,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  tripDetailsContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },
  tripDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  tripDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  tripStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  tripStat: {
    alignItems: 'center',
    gap: 4,
  },
  tripStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary600,
  },
  tripStatLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    fontWeight: '500',
  },
  destinationsContainer: {
    marginTop: 8,
  },
  destinationsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 8,
  },
  destinationsScroll: {
    marginBottom: 4,
  },
  destinationChip: {
    backgroundColor: Colors.primary100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  destinationChipText: {
    fontSize: 13,
    color: Colors.primary700,
    fontWeight: '500',
  },
  bookingSummaryContainer: {
    gap: 24,
  },
  bookingSection: {
    backgroundColor: Colors.secondary50,
    borderRadius: 12,
    padding: 16,
  },
  bookingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  bookingSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  noBookingsText: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bookingItem: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  bookingItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
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
    padding: Platform.OS === 'ios' ? 12 : 8,
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
