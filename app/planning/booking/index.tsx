import { router, useLocalSearchParams } from 'expo-router';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CustomButton, CustomTextInput, ThemedText } from '../../../components';

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { useBooking } from '../../../context/BookingContext';
import AccommodationBookingScreen from './accommodation';
import GuidesBookingScreen from './guides';
import SummaryBookingScreen from './summary';
import TransportBookingScreen from './transport';

export default function BookingScreen() {
  const params = useLocalSearchParams();
  const { destination, startDate, endDate, destinations, newBooking, hideModal, clearPrevious, activeTab: initialTab } = params;

  // State management
  const [activeTab, setActiveTab] = useState('accommodation');
  const [showTripModal, setShowTripModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [sessionInitialized, setSessionInitialized] = useState(false);

  // Filter state
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [location, setLocation] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);

  // Use booking context instead of local state
  const { 
    bookings, 
    addBooking, 
    removeBooking, 
    clearAllBookings,
    clearBookingsForNewSession,
    getTotalAmount,
    getAccommodationTotal,
    getTransportTotal,
    getGuidesTotal
  } = useBooking();

  // Set initial tab if provided
  useEffect(() => {
    if (initialTab && typeof initialTab === 'string') {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Clear previous bookings when starting a new booking session
  useEffect(() => {
    // Clear bookings when:
    // 1. Component mounts with destination data and no ongoing booking
    // 2. Or explicitly requested via clearPrevious parameter
    if (((destination || destinations) && !newBooking && !sessionInitialized) || clearPrevious === 'true') {
      clearBookingsForNewSession();
      setSessionInitialized(true);
      
      // Clean up the clearPrevious parameter
      if (clearPrevious === 'true') {
        router.setParams({ clearPrevious: undefined });
      }
    }
  }, [destination, destinations, newBooking, sessionInitialized, clearPrevious, clearBookingsForNewSession, setSessionInitialized]);

  // Handle new booking data
  useEffect(() => {
    if (newBooking) {
      try {
        const booking = JSON.parse(newBooking as string);
        console.log('Received new booking:', booking);
        
        // Validate booking data
        if (!booking.id || !booking.type || !booking.totalPrice) {
          console.error('Invalid booking data:', booking);
          return;
        }
        
        addBooking(booking);
          
        if (hideModal !== 'true') {
          setShowBookingsModal(true);
        } else {
          setActiveTab('summary');
        }
        
        router.setParams({ newBooking: undefined, hideModal: undefined });
      } catch (error) {
        console.error('Error parsing new booking:', error);
      }
    }
  }, [newBooking, hideModal, addBooking]);

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
    setFilterVisible(false);
  };

  const handleCancelFilters = () => {
    setFilterVisible(false);
  };

  const handleClearAllBookings = () => {
    clearAllBookings();
  };

  const handleStartNewSession = () => {
    Alert.alert(
      'Start New Session',
      'This will clear all current bookings and start fresh. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start Fresh',
          style: 'destructive',
          onPress: () => {
            clearBookingsForNewSession();
            setActiveTab('accommodation');
          },
        },
      ]
    );
  };

  const handleCancelBooking = (bookingId: string, bookingType: 'accommodation' | 'transport' | 'guides') => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            removeBooking(bookingId, bookingType);
          },
        },
      ]
    );
  };

  const tabs = [
    { id: 'accommodation', title: 'Stay', icon: 'bed-outline' },
    { id: 'transport', title: 'Travel', icon: 'car-outline' },
    { id: 'guides', title: 'Guides', icon: 'person-outline' },
    { id: 'summary', title: 'Summary', icon: 'receipt-outline' },
  ];

  // State for expanded booking items
  const [expandedBookings, setExpandedBookings] = useState<{[key: string]: boolean}>({});

  const toggleBookingExpansion = (bookingId: string) => {
    setExpandedBookings(prev => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
  };

  const renderBookingCard = (booking: any, index: number, type: 'accommodation' | 'transport' | 'guides') => {
    const bookingKey = `${type}-${booking.id || index}`;
    const isExpanded = expandedBookings[bookingKey];
    
    const getIcon = () => {
      switch (type) {
        case 'accommodation': return 'bed-outline';
        case 'transport': return 'car-outline';
        case 'guides': return 'person-outline';
        default: return 'cube-outline';
      }
    };

    const getTitle = () => {
      switch (type) {
        case 'accommodation': return booking.hotelName || booking.name || 'Hotel Booking';
        case 'transport': return booking.transportName || booking.name || 'Transport Booking';
        case 'guides': return booking.guideName || booking.name || 'Guide Booking';
        default: return 'Booking';
      }
    };

    const getSubtitle = () => {
      const destination = booking.destination || 'Unknown Location';
      switch (type) {
        case 'accommodation': 
          const nights = booking.numberOfNights || booking.nights || 1;
          return `${destination} • ${nights} ${nights === 1 ? 'night' : 'nights'}`;
        case 'transport': 
          const transportDays = booking.days || 1;
          return `${destination} • ${transportDays} ${transportDays === 1 ? 'day' : 'days'}`;
        case 'guides': 
          const guideDays = booking.days || 1;
          return `${destination} • ${guideDays} ${guideDays === 1 ? 'day' : 'days'}`;
        default: return destination;
      }
    };

    const getStartDate = () => {
      switch (type) {
        case 'accommodation': return booking.checkInDate || booking.startDate;
        case 'transport': return booking.startDate;
        case 'guides': return booking.startDate;
        default: return booking.startDate;
      }
    };

    const getEndDate = () => {
      switch (type) {
        case 'accommodation': return booking.checkOutDate || booking.endDate;
        case 'transport': return booking.endDate;
        case 'guides': return booking.endDate;
        default: return booking.endDate;
      }
    };

    return (
      <View key={bookingKey} style={styles.modernBookingCard}>
        <TouchableOpacity 
          style={styles.modernBookingHeader}
          onPress={() => toggleBookingExpansion(bookingKey)}
          activeOpacity={0.7}
        >
          <View style={styles.modernBookingIcon}>
            <Ionicons name={getIcon() as any} size={20} color={Colors.primary600} />
          </View>
          
          <View style={styles.modernBookingInfo}>
            <ThemedText style={styles.modernBookingTitle}>{getTitle()}</ThemedText>
            <ThemedText style={styles.modernBookingSubtitle}>{getSubtitle()}</ThemedText>
          </View>
          
          <View style={styles.modernBookingRight}>
            <ThemedText style={styles.modernBookingPrice}>
              ${booking.totalPrice || 0}
            </ThemedText>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={Colors.secondary500} 
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.modernBookingDetails}>
            <View style={styles.modernBookingDetailsContent}>
              {type === 'accommodation' && (
                <>
                  <View style={styles.modernDetailRow}>
                    <Ionicons name="location-outline" size={16} color={Colors.secondary500} />
                    <ThemedText style={styles.modernDetailText}>
                      {booking.destination || 'Unknown Location'}
                    </ThemedText>
                  </View>
                  <View style={styles.modernDetailRow}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.secondary500} />
                    <ThemedText style={styles.modernDetailText}>
                      {getStartDate()} → {getEndDate()}
                    </ThemedText>
                  </View>
                  <View style={styles.modernDetailRow}>
                    <Ionicons name="bed-outline" size={16} color={Colors.secondary500} />
                    <ThemedText style={styles.modernDetailText}>
                      {booking.numberOfRooms || 1} {(booking.numberOfRooms || 1) === 1 ? 'room' : 'rooms'}
                    </ThemedText>
                  </View>
                  {(booking.numberOfGuests && booking.numberOfGuests > 1) && (
                    <View style={styles.modernDetailRow}>
                      <Ionicons name="people-outline" size={16} color={Colors.secondary500} />
                      <ThemedText style={styles.modernDetailText}>
                        {booking.numberOfGuests} guests
                      </ThemedText>
                    </View>
                  )}
                  {booking.pricePerNight && (
                    <View style={styles.modernDetailRow}>
                      <Ionicons name="cash-outline" size={16} color={Colors.secondary500} />
                      <ThemedText style={styles.modernDetailText}>
                        ${booking.pricePerNight}/night × {booking.numberOfNights || 1} nights
                      </ThemedText>
                    </View>
                  )}
                </>
              )}
              
              {type === 'transport' && (
                <>
                  <View style={styles.modernDetailRow}>
                    <Ionicons name="location-outline" size={16} color={Colors.secondary500} />
                    <ThemedText style={styles.modernDetailText}>
                      {booking.destination || 'Unknown Location'}
                    </ThemedText>
                  </View>
                  <View style={styles.modernDetailRow}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.secondary500} />
                    <ThemedText style={styles.modernDetailText}>
                      {getStartDate()} → {getEndDate()}
                    </ThemedText>
                  </View>
                  <View style={styles.modernDetailRow}>
                    <Ionicons name="car-outline" size={16} color={Colors.secondary500} />
                    <ThemedText style={styles.modernDetailText}>
                      {booking.provider || 'Transport Service'} - {booking.transportInfo?.type || 'Vehicle'}
                    </ThemedText>
                  </View>
                  {booking.pickupLocation && (
                    <View style={styles.modernDetailRow}>
                      <Ionicons name="navigate-outline" size={16} color={Colors.secondary500} />
                      <ThemedText style={styles.modernDetailText}>
                        Pickup: {booking.pickupLocation}
                      </ThemedText>
                    </View>
                  )}
                  {booking.dropoffLocation && (
                    <View style={styles.modernDetailRow}>
                      <Ionicons name="location" size={16} color={Colors.secondary500} />
                      <ThemedText style={styles.modernDetailText}>
                        Drop-off: {booking.dropoffLocation}
                      </ThemedText>
                    </View>
                  )}
                  {booking.pricePerDay && (
                    <View style={styles.modernDetailRow}>
                      <Ionicons name="cash-outline" size={16} color={Colors.secondary500} />
                      <ThemedText style={styles.modernDetailText}>
                        ${booking.pricePerDay}/day × {booking.days || 1} days
                      </ThemedText>
                    </View>
                  )}
                </>
              )}
              
              {type === 'guides' && (
                <>
                  <View style={styles.modernDetailRow}>
                    <Ionicons name="location-outline" size={16} color={Colors.secondary500} />
                    <ThemedText style={styles.modernDetailText}>
                      {booking.destination || 'Unknown Location'}
                    </ThemedText>
                  </View>
                  <View style={styles.modernDetailRow}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.secondary500} />
                    <ThemedText style={styles.modernDetailText}>
                      {getStartDate()} → {getEndDate()}
                    </ThemedText>
                  </View>
                  <View style={styles.modernDetailRow}>
                    <Ionicons name="person-outline" size={16} color={Colors.secondary500} />
                    <ThemedText style={styles.modernDetailText}>
                      {booking.tourType || 'Custom Tour'}
                    </ThemedText>
                  </View>
                  {booking.meetingPoint && (
                    <View style={styles.modernDetailRow}>
                      <Ionicons name="navigate-outline" size={16} color={Colors.secondary500} />
                      <ThemedText style={styles.modernDetailText}>
                        Meet at: {booking.meetingPoint}
                      </ThemedText>
                    </View>
                  )}
                  {booking.guideInfo?.experience && (
                    <View style={styles.modernDetailRow}>
                      <Ionicons name="time-outline" size={16} color={Colors.secondary500} />
                      <ThemedText style={styles.modernDetailText}>
                        Experience: {booking.guideInfo.experience}
                      </ThemedText>
                    </View>
                  )}
                  {booking.pricePerDay && (
                    <View style={styles.modernDetailRow}>
                      <Ionicons name="cash-outline" size={16} color={Colors.secondary500} />
                      <ThemedText style={styles.modernDetailText}>
                        ${booking.pricePerDay}/day × {booking.days || 1} days
                      </ThemedText>
                    </View>
                  )}
                </>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.modernCancelButton}
              onPress={() => handleCancelBooking(booking.id, type)}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <ThemedText style={styles.modernCancelButtonText}>Cancel Booking</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'accommodation':
        return <AccommodationBookingScreen />;
      case 'transport':
        return <TransportBookingScreen />;
      case 'guides':
        return <GuidesBookingScreen />;
      case 'summary':
        return <SummaryBookingScreen onNavigateToTab={setActiveTab} />;
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
          {(bookings.accommodation.length > 0 || bookings.transport.length > 0 || bookings.guides.length > 0) && (
            <TouchableOpacity 
              style={[styles.headerButton, styles.newSessionButton]}
              onPress={handleStartNewSession}
            >
              <Ionicons name="refresh-outline" size={18} color={Colors.error} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowTripModal(true)}
          >
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary600} />
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
            onPress={() => {
              setActiveTab(tab.id);
            }}
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
            <View style={styles.modalHeaderActions}>
              {(bookings.accommodation.length > 0 || bookings.transport.length > 0 || bookings.guides.length > 0) && (
                <TouchableOpacity 
                  onPress={handleClearAllBookings}
                  style={styles.clearAllButton}
                >
                  <ThemedText style={styles.clearAllText}>Clear All</ThemedText>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowBookingsModal(false)}>
                <Ionicons name="close" size={24} color={Colors.secondary700} />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.modernBookingSummary}>
              {/* Accommodation Section */}
              {bookings.accommodation.length > 0 && (
                <View style={styles.modernSectionContainer}>
                  <View style={styles.modernSectionHeader}>
                    <Ionicons name="bed-outline" size={22} color={Colors.primary600} />
                    <ThemedText style={styles.modernSectionTitle}>Accommodation</ThemedText>
                    <View style={styles.modernBookingCount}>
                      <ThemedText style={styles.modernBookingCountText}>{bookings.accommodation.length}</ThemedText>
                    </View>
                  </View>
                  {bookings.accommodation.map((booking: any, index: number) => 
                    renderBookingCard(booking, index, 'accommodation')
                  )}
                </View>
              )}

              {/* Transportation Section */}
              {bookings.transport.length > 0 && (
                <View style={styles.modernSectionContainer}>
                  <View style={styles.modernSectionHeader}>
                    <Ionicons name="car-outline" size={22} color={Colors.primary600} />
                    <ThemedText style={styles.modernSectionTitle}>Transportation</ThemedText>
                    <View style={styles.modernBookingCount}>
                      <ThemedText style={styles.modernBookingCountText}>{bookings.transport.length}</ThemedText>
                    </View>
                  </View>
                  {bookings.transport.map((booking: any, index: number) => 
                    renderBookingCard(booking, index, 'transport')
                  )}
                </View>
              )}

              {/* Tour Guides Section */}
              {bookings.guides.length > 0 && (
                <View style={styles.modernSectionContainer}>
                  <View style={styles.modernSectionHeader}>
                    <Ionicons name="person-outline" size={22} color={Colors.primary600} />
                    <ThemedText style={styles.modernSectionTitle}>Tour Guides</ThemedText>
                    <View style={styles.modernBookingCount}>
                      <ThemedText style={styles.modernBookingCountText}>{bookings.guides.length}</ThemedText>
                    </View>
                  </View>
                  {bookings.guides.map((booking: any, index: number) => 
                    renderBookingCard(booking, index, 'guides')
                  )}
                </View>
              )}

              {/* Show message when no bookings */}
              {bookings.accommodation.length === 0 && bookings.transport.length === 0 && bookings.guides.length === 0 && (
                <View style={styles.modernEmptyState}>
                  <View style={styles.modernEmptyIconContainer}>
                    <Ionicons name="receipt-outline" size={48} color={Colors.secondary400} />
                  </View>
                  <ThemedText style={styles.modernEmptyTitle}>No Bookings Yet</ThemedText>
                  <ThemedText style={styles.modernEmptyText}>
                    Start exploring our accommodations, transportation, and guide services.
                  </ThemedText>
                </View>
              )}
            </View>
            
            {/* Modern Total Summary */}
            {(bookings.accommodation.length > 0 || bookings.transport.length > 0 || bookings.guides.length > 0) && (
              <View style={styles.modernTotalSummary}>
                <View style={styles.modernTotalHeader}>
                  <View style={styles.modernTotalIconContainer}>
                    <Ionicons name="receipt-outline" size={24} color={Colors.primary600} />
                  </View>
                  <ThemedText style={styles.modernTotalTitle}>Trip Summary</ThemedText>
                </View>
                
                <View style={styles.modernTotalContent}>
                  {bookings.accommodation.length > 0 && (
                    <View style={styles.modernTotalRow}>
                      <View style={styles.modernTotalRowLeft}>
                        <Ionicons name="bed-outline" size={18} color={Colors.secondary600} />
                        <ThemedText style={styles.modernTotalLabel}>Accommodation</ThemedText>
                      </View>
                      <ThemedText style={styles.modernTotalValue}>${getAccommodationTotal()}</ThemedText>
                    </View>
                  )}
                  
                  {bookings.transport.length > 0 && (
                    <View style={styles.modernTotalRow}>
                      <View style={styles.modernTotalRowLeft}>
                        <Ionicons name="car-outline" size={18} color={Colors.secondary600} />
                        <ThemedText style={styles.modernTotalLabel}>Transportation</ThemedText>
                      </View>
                      <ThemedText style={styles.modernTotalValue}>${getTransportTotal()}</ThemedText>
                    </View>
                  )}
                  
                  {bookings.guides.length > 0 && (
                    <View style={styles.modernTotalRow}>
                      <View style={styles.modernTotalRowLeft}>
                        <Ionicons name="person-outline" size={18} color={Colors.secondary600} />
                        <ThemedText style={styles.modernTotalLabel}>Tour Guides</ThemedText>
                      </View>
                      <ThemedText style={styles.modernTotalValue}>${getGuidesTotal()}</ThemedText>
                    </View>
                  )}
                  
                  <View style={styles.modernTotalDivider} />
                  
                  <View style={styles.modernTotalFinalRow}>
                    <ThemedText style={styles.modernTotalFinalLabel}>Total Trip Cost</ThemedText>
                    <ThemedText style={styles.modernTotalFinalValue}>${getTotalAmount()}</ThemedText>
                  </View>
                </View>
              </View>
            )}
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
  newSessionButton: {
    backgroundColor: Colors.error + '15',
    borderColor: Colors.error + '30',
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
    paddingBottom: 20,
    paddingTop: 6,
  },
  navItem: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginHorizontal: 3,
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
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.secondary100,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },
  clearAllText: {
    fontSize: 14,
    color: Colors.secondary600,
    fontWeight: '500',
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
    justifyContent: 'space-between',
  },
  bookingSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    flex: 1,
  },
  bookingCount: {
    backgroundColor: Colors.primary600,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingCountText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  noBookingsText: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bookingItem: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.primary300,
    position: 'relative',
  },
  bookingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    flex: 1,
    marginRight: 12,
  },
  bookingItemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary600,
  },
  cancelButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.error + '15',
    borderWidth: 1,
    borderColor: Colors.error + '30',
    zIndex: 1,
  },
  bookingItemDetails: {
    gap: 6,
  },
  bookingItemDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingItemDetailText: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 18,
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
  // Total Summary Styles
  totalSummaryContainer: {
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.primary300,
  },
  totalSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  totalSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary700,
  },
  totalSummaryContent: {
    gap: 8,
  },
  totalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalSummaryLabel: {
    fontSize: 14,
    color: Colors.secondary600,
  },
  totalSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  totalSummaryFinalRow: {
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.primary300,
  },
  totalSummaryFinalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary700,
  },
  totalSummaryFinalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary600,
  },
  // Summary Tab Styles
  summaryTabContent: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.secondary50,
  },
  clearAllButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.error + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  clearAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  proceedToPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary600,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary700,
  },
  proceedToPaymentText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.secondary700,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Modern Booking Card Styles
  modernBookingSummary: {
    gap: 20,
  },
  modernSectionContainer: {
    marginBottom: 8,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },
  modernSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary700,
    flex: 1,
  },
  modernBookingCount: {
    backgroundColor: Colors.primary600,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernBookingCountText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  modernBookingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modernBookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  modernBookingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary300,
  },
  modernBookingInfo: {
    flex: 1,
    gap: 4,
  },
  modernBookingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
    lineHeight: 20,
  },
  modernBookingSubtitle: {
    fontSize: 14,
    color: Colors.secondary500,
    lineHeight: 18,
  },
  modernBookingRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  modernBookingPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary600,
  },
  modernBookingDetails: {
    backgroundColor: Colors.secondary50,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
  },
  modernBookingDetailsContent: {
    padding: 20,
    gap: 12,
  },
  modernDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modernDetailText: {
    fontSize: 14,
    color: Colors.secondary600,
    flex: 1,
    lineHeight: 18,
  },
  modernCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.error + '10',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  modernCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },

  // Modern Total Summary Styles
  modernTotalSummary: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.primary300,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  modernTotalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary600,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  modernTotalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernTotalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    flex: 1,
  },
  modernTotalContent: {
    padding: 20,
    gap: 12,
  },
  modernTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  modernTotalRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modernTotalLabel: {
    fontSize: 15,
    color: Colors.secondary600,
    fontWeight: '500',
  },
  modernTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
  },
  modernTotalDivider: {
    height: 1,
    backgroundColor: Colors.secondary200,
    marginVertical: 8,
  },
  modernTotalFinalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    marginTop: 8,
  },
  modernTotalFinalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary700,
  },
  modernTotalFinalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary600,
  },
  modernTotalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
  },
  modernClearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.error + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  modernClearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  modernPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 2,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary600,
    borderRadius: 12,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modernPaymentButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },

  // Modern Empty State Styles
  modernEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  modernEmptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.secondary100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.secondary200,
  },
  modernEmptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 12,
    textAlign: 'center',
  },
  modernEmptyText: {
    fontSize: 16,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  modernEmptyActions: {
    alignItems: 'center',
  },
  modernEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary300,
  },
  modernEmptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary700,
  },
});
