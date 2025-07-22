import { router, useLocalSearchParams } from 'expo-router';
import {
  Alert,
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
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { useBooking } from '../../../context/BookingContext';
import AccommodationBookingScreen from './accommodation';
import GuidesBookingScreen from './guides';
import TransportBookingScreen from './transport';

export default function BookingScreen() {
  const params = useLocalSearchParams();
  const { destination, startDate, endDate, destinations, newBooking, hideModal } = params;
  const { bookings, addBooking, clearAllBookings, removeBooking, getTotalAmount } = useBooking();

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

  // Handle new booking data
  useEffect(() => {
    if (newBooking) {
      try {
        const booking = JSON.parse(newBooking as string);
        console.log('Processing new booking:', booking);
        
        // Use the context's addBooking method
        addBooking(booking);

        console.log('Booking processing finished for type:', booking.type);
          
        // Only show booking summary modal automatically if hideModal is not true
        if (hideModal !== 'true') {
          setShowBookingsModal(true);
        } else {
          // If hideModal is true, automatically switch to summary tab to show the booking
          console.log('Switching to summary tab after adding booking');
          setActiveTab('summary');
        }
        
        // Clear the newBooking param to prevent reprocessing
        router.setParams({ newBooking: undefined, hideModal: undefined });
      } catch (error) {
        console.error('Error parsing new booking:', error);
      }
    }
  }, [newBooking, hideModal, addBooking]);

  // Debug effect to monitor bookings state changes
  useEffect(() => {
    console.log('=== Bookings State Changed ===');
    console.log('Accommodation count:', bookings.accommodation.length);
    console.log('Transport count:', bookings.transport.length);
    console.log('Guides count:', bookings.guides.length);
    console.log('Accommodation bookings:', bookings.accommodation.map(b => ({ id: b.id, name: b.hotelName })));
    console.log('Transport bookings:', bookings.transport.map(b => ({ id: b.id, name: b.transportName })));
    console.log('Guides bookings:', bookings.guides.map(b => ({ id: b.id, name: b.guideName })));
    console.log('===============================');
  }, [bookings.accommodation, bookings.transport, bookings.guides]);

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

  const handleClearAllBookings = () => {
    clearAllBookings();
  };

  const handleProceedToPayment = () => {
    // Calculate total amount using context method
    const totalAmount = getTotalAmount();
    
    // TODO: Navigate to payment screen or integrate with payment gateway
    Alert.alert(
      'Proceed to Payment',
      `Total Amount: $${totalAmount}\n\nThis will redirect you to the secure payment gateway.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          style: 'default',
          onPress: () => {
            // TODO: Implement actual payment navigation
            // router.push({ pathname: '/payment', params: { bookings: JSON.stringify(bookings), total: totalAmount } });
            console.log('Proceeding to payment with bookings:', bookings, 'Total:', totalAmount);
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

  const renderSummaryContent = () => {
    console.log('=== RENDERING SUMMARY TAB ===');
    console.log('Current bookings state when rendering summary:');
    console.log('Accommodation:', bookings.accommodation.length, 'items');
    console.log('Transport:', bookings.transport.length, 'items');
    console.log('Guides:', bookings.guides.length, 'items');
    console.log('==============================');
    
    return (
      <ScrollView style={styles.summaryTabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.bookingSummaryContainer}>
          <View style={styles.bookingSection}>
            <View style={styles.bookingSectionHeader}>
              <Ionicons name="bed-outline" size={20} color={Colors.primary600} />
              <ThemedText style={styles.bookingSectionTitle}>Accommodation</ThemedText>
              {bookings.accommodation.length > 0 && (
                <View style={styles.bookingCount}>
                  <ThemedText style={styles.bookingCountText}>{bookings.accommodation.length}</ThemedText>
                </View>
              )}
            </View>
            {bookings.accommodation.length === 0 ? (
              <ThemedText style={styles.noBookingsText}>No bookings made yet</ThemedText>
            ) : (
              bookings.accommodation.map((booking: any, index: number) => (
                <View key={booking.id || index} style={styles.bookingItem}>
                  <View style={styles.bookingItemHeader}>
                    <ThemedText style={styles.bookingItemTitle}>{booking.hotelName}</ThemedText>
                    <ThemedText style={styles.bookingItemPrice}>${booking.totalPrice}</ThemedText>
                  </View>
                  <View style={styles.bookingItemDetails}>
                    <View style={styles.bookingItemDetail}>
                      <Ionicons name="location-outline" size={14} color={Colors.secondary500} />
                      <ThemedText style={styles.bookingItemDetailText}>{booking.destination}</ThemedText>
                    </View>
                    <View style={styles.bookingItemDetail}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.secondary500} />
                      <ThemedText style={styles.bookingItemDetailText}>
                        {booking.checkInDate} → {booking.checkOutDate}
                      </ThemedText>
                    </View>
                    <View style={styles.bookingItemDetail}>
                      <Ionicons name="bed-outline" size={14} color={Colors.secondary500} />
                      <ThemedText style={styles.bookingItemDetailText}>
                        {booking.numberOfRooms} {booking.numberOfRooms === 1 ? 'room' : 'rooms'} - {booking.numberOfNights} {booking.numberOfNights === 1 ? 'night' : 'nights'}
                      </ThemedText>
                    </View>
                    {booking.numberOfGuests > 1 && (
                      <View style={styles.bookingItemDetail}>
                        <Ionicons name="people-outline" size={14} color={Colors.secondary500} />
                        <ThemedText style={styles.bookingItemDetailText}>
                          {booking.numberOfGuests} guests
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => handleCancelBooking(booking.id, 'accommodation')}
                  >
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          <View style={styles.bookingSection}>
            <View style={styles.bookingSectionHeader}>
              <Ionicons name="car-outline" size={20} color={Colors.primary600} />
              <ThemedText style={styles.bookingSectionTitle}>Transportation</ThemedText>
              {bookings.transport.length > 0 && (
                <View style={styles.bookingCount}>
                  <ThemedText style={styles.bookingCountText}>{bookings.transport.length}</ThemedText>
                </View>
              )}
            </View>
            {bookings.transport.length === 0 ? (
              <ThemedText style={styles.noBookingsText}>No bookings made yet</ThemedText>
            ) : (
              bookings.transport.map((booking: any, index: number) => (
                <View key={booking.id || index} style={styles.bookingItem}>
                  <View style={styles.bookingItemHeader}>
                    <ThemedText style={styles.bookingItemTitle}>{booking.transportName}</ThemedText>
                    <ThemedText style={styles.bookingItemPrice}>${booking.totalPrice}</ThemedText>
                  </View>
                  <View style={styles.bookingItemDetails}>
                    <View style={styles.bookingItemDetail}>
                      <Ionicons name="location-outline" size={14} color={Colors.secondary500} />
                      <ThemedText style={styles.bookingItemDetailText}>{booking.destination}</ThemedText>
                    </View>
                    <View style={styles.bookingItemDetail}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.secondary500} />
                      <ThemedText style={styles.bookingItemDetailText}>
                        {booking.startDate} → {booking.endDate}
                      </ThemedText>
                    </View>
                    <View style={styles.bookingItemDetail}>
                      <Ionicons name="car-outline" size={14} color={Colors.secondary500} />
                      <ThemedText style={styles.bookingItemDetailText}>
                        {booking.provider} - {booking.transportInfo?.type}
                      </ThemedText>
                    </View>
                    {booking.pickupLocation && (
                      <View style={styles.bookingItemDetail}>
                        <Ionicons name="navigate-outline" size={14} color={Colors.secondary500} />
                        <ThemedText style={styles.bookingItemDetailText}>
                          Pickup: {booking.pickupLocation}
                        </ThemedText>
                      </View>
                    )}
                    {booking.dropoffLocation && (
                      <View style={styles.bookingItemDetail}>
                        <Ionicons name="location" size={14} color={Colors.secondary500} />
                        <ThemedText style={styles.bookingItemDetailText}>
                          Drop-off: {booking.dropoffLocation}
                        </ThemedText>
                      </View>
                    )}
                    <View style={styles.bookingItemDetail}>
                      <Ionicons name="time-outline" size={14} color={Colors.secondary500} />
                      <ThemedText style={styles.bookingItemDetailText}>
                        {booking.days} {booking.days === 1 ? 'day' : 'days'} rental
                      </ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => handleCancelBooking(booking.id, 'transport')}
                  >
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          <View style={styles.bookingSection}>
            <View style={styles.bookingSectionHeader}>
              <Ionicons name="person-outline" size={20} color={Colors.primary600} />
              <ThemedText style={styles.bookingSectionTitle}>Tour Guides</ThemedText>
              {bookings.guides.length > 0 && (
                <View style={styles.bookingCount}>
                  <ThemedText style={styles.bookingCountText}>{bookings.guides.length}</ThemedText>
                </View>
              )}
            </View>
            {bookings.guides.length === 0 ? (
              <ThemedText style={styles.noBookingsText}>No bookings made yet</ThemedText>
            ) : (
              bookings.guides.map((booking: any, index: number) => (
                <View key={booking.id || index} style={styles.bookingItem}>
                  <View style={styles.bookingItemHeader}>
                    <ThemedText style={styles.bookingItemTitle}>{booking.guideName}</ThemedText>
                    <ThemedText style={styles.bookingItemPrice}>${booking.totalPrice}</ThemedText>
                  </View>
                  <View style={styles.bookingItemDetails}>
                    <View style={styles.bookingItemDetail}>
                      <Ionicons name="location-outline" size={14} color={Colors.secondary500} />
                      <ThemedText style={styles.bookingItemDetailText}>{booking.destination}</ThemedText>
                    </View>
                    <View style={styles.bookingItemDetail}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.secondary500} />
                      <ThemedText style={styles.bookingItemDetailText}>
                        {booking.startDate} → {booking.endDate}
                      </ThemedText>
                    </View>
                    <View style={styles.bookingItemDetail}>
                      <Ionicons name="person-outline" size={14} color={Colors.secondary500} />
                      <ThemedText style={styles.bookingItemDetailText}>
                        {booking.tourType || 'Custom Tour'} - {booking.days} {booking.days === 1 ? 'day' : 'days'}
                      </ThemedText>
                    </View>
                    {booking.meetingPoint && (
                      <View style={styles.bookingItemDetail}>
                        <Ionicons name="navigate-outline" size={14} color={Colors.secondary500} />
                        <ThemedText style={styles.bookingItemDetailText}>
                          Meet at: {booking.meetingPoint}
                        </ThemedText>
                      </View>
                    )}
                    {booking.guideInfo?.experience && (
                      <View style={styles.bookingItemDetail}>
                        <Ionicons name="time-outline" size={14} color={Colors.secondary500} />
                        <ThemedText style={styles.bookingItemDetailText}>
                          Experience: {booking.guideInfo.experience}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => handleCancelBooking(booking.id, 'guides')}
                  >
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>
        
        {/* Total Summary */}
        {(bookings.accommodation.length > 0 || bookings.transport.length > 0 || bookings.guides.length > 0) && (
          <View style={styles.totalSummaryContainer}>
            <View style={styles.totalSummaryHeader}>
              <Ionicons name="receipt-outline" size={20} color={Colors.primary600} />
              <ThemedText style={styles.totalSummaryTitle}>Trip Total</ThemedText>
            </View>
            <View style={styles.totalSummaryContent}>
              <View style={styles.totalSummaryRow}>
                <ThemedText style={styles.totalSummaryLabel}>Accommodation:</ThemedText>
                <ThemedText style={styles.totalSummaryValue}>
                  ${bookings.accommodation.reduce((sum: number, booking: any) => sum + booking.totalPrice, 0)}
                </ThemedText>
              </View>
              <View style={styles.totalSummaryRow}>
                <ThemedText style={styles.totalSummaryLabel}>Transportation:</ThemedText>
                <ThemedText style={styles.totalSummaryValue}>
                  ${bookings.transport.reduce((sum: number, booking: any) => sum + (booking.totalPrice || 0), 0)}
                </ThemedText>
              </View>
              <View style={styles.totalSummaryRow}>
                <ThemedText style={styles.totalSummaryLabel}>Tour Guides:</ThemedText>
                <ThemedText style={styles.totalSummaryValue}>
                  ${bookings.guides.reduce((sum: number, booking: any) => sum + (booking.totalPrice || 0), 0)}
                </ThemedText>
              </View>
              <View style={[styles.totalSummaryRow, styles.totalSummaryFinalRow]}>
                <ThemedText style={styles.totalSummaryFinalLabel}>Total Trip Cost:</ThemedText>
                <ThemedText style={styles.totalSummaryFinalValue}>
                  ${getTotalAmount()}
                </ThemedText>
              </View>
            </View>
            
            {/* Clear All Button */}
            <TouchableOpacity 
              onPress={handleClearAllBookings}
              style={styles.clearAllButtonInline}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
              <ThemedText style={styles.clearAllButtonText}>Clear All Bookings</ThemedText>
            </TouchableOpacity>

            {/* Proceed to Payment Button */}
            <TouchableOpacity 
              onPress={() => handleProceedToPayment()}
              style={styles.proceedToPaymentButton}
            >
              <Ionicons name="card-outline" size={20} color={Colors.white} />
              <ThemedText style={styles.proceedToPaymentText}>Proceed to Payment</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {bookings.accommodation.length === 0 && bookings.transport.length === 0 && bookings.guides.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="receipt-outline" size={64} color={Colors.secondary400} />
            <ThemedText style={styles.emptyStateTitle}>No Bookings Yet</ThemedText>
            <ThemedText style={styles.emptyStateText}>
              Start by browsing accommodations, transportation, or guides using the tabs above.
            </ThemedText>
          </View>
        )}
      </ScrollView>
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
        return renderSummaryContent();
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
              console.log('Switching to tab:', tab.id);
              console.log('Bookings before tab switch:', {
                accommodation: bookings.accommodation.length,
                transport: bookings.transport.length,
                guides: bookings.guides.length
              });
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
            <View style={styles.bookingSummaryContainer}>
              <View style={styles.bookingSection}>
                <View style={styles.bookingSectionHeader}>
                  <Ionicons name="bed-outline" size={20} color={Colors.primary600} />
                  <ThemedText style={styles.bookingSectionTitle}>Accommodation</ThemedText>
                  {bookings.accommodation.length > 0 && (
                    <View style={styles.bookingCount}>
                      <ThemedText style={styles.bookingCountText}>{bookings.accommodation.length}</ThemedText>
                    </View>
                  )}
                </View>
                {bookings.accommodation.length === 0 ? (
                  <ThemedText style={styles.noBookingsText}>No bookings made yet</ThemedText>
                ) : (
                  bookings.accommodation.map((booking: any, index: number) => (
                    <View key={booking.id || index} style={styles.bookingItem}>
                      <View style={styles.bookingItemHeader}>
                        <ThemedText style={styles.bookingItemTitle}>{booking.hotelName}</ThemedText>
                        <ThemedText style={styles.bookingItemPrice}>${booking.totalPrice}</ThemedText>
                      </View>
                      <View style={styles.bookingItemDetails}>
                        <View style={styles.bookingItemDetail}>
                          <Ionicons name="location-outline" size={14} color={Colors.secondary500} />
                          <ThemedText style={styles.bookingItemDetailText}>{booking.destination}</ThemedText>
                        </View>
                        <View style={styles.bookingItemDetail}>
                          <Ionicons name="calendar-outline" size={14} color={Colors.secondary500} />
                          <ThemedText style={styles.bookingItemDetailText}>
                            {booking.checkInDate} → {booking.checkOutDate}
                          </ThemedText>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => handleCancelBooking(booking.id, 'accommodation')}
                      >
                        <Ionicons name="close-circle" size={20} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>              <View style={styles.bookingSection}>
                <View style={styles.bookingSectionHeader}>
                  <Ionicons name="car-outline" size={20} color={Colors.primary600} />
                  <ThemedText style={styles.bookingSectionTitle}>Transportation</ThemedText>
                  {bookings.transport.length > 0 && (
                    <View style={styles.bookingCount}>
                      <ThemedText style={styles.bookingCountText}>{bookings.transport.length}</ThemedText>
                    </View>
                  )}
                </View>
                {bookings.transport.length === 0 ? (
                  <ThemedText style={styles.noBookingsText}>No bookings made yet</ThemedText>
                ) : (
                  bookings.transport.map((booking: any, index: number) => (
                    <View key={booking.id || index} style={styles.bookingItem}>
                      <View style={styles.bookingItemHeader}>
                        <ThemedText style={styles.bookingItemTitle}>{booking.transportName}</ThemedText>
                        <ThemedText style={styles.bookingItemPrice}>${booking.totalPrice}</ThemedText>
                      </View>
                      <View style={styles.bookingItemDetails}>
                        <View style={styles.bookingItemDetail}>
                          <Ionicons name="location-outline" size={14} color={Colors.secondary500} />
                          <ThemedText style={styles.bookingItemDetailText}>{booking.destination}</ThemedText>
                        </View>
                        <View style={styles.bookingItemDetail}>
                          <Ionicons name="calendar-outline" size={14} color={Colors.secondary500} />
                          <ThemedText style={styles.bookingItemDetailText}>
                            {booking.startDate} → {booking.endDate}
                          </ThemedText>
                        </View>
                        <View style={styles.bookingItemDetail}>
                          <Ionicons name="car-outline" size={14} color={Colors.secondary500} />
                          <ThemedText style={styles.bookingItemDetailText}>
                            {booking.provider} - {booking.days} {booking.days === 1 ? 'day' : 'days'}
                          </ThemedText>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => handleCancelBooking(booking.id, 'transport')}
                      >
                        <Ionicons name="close-circle" size={20} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.bookingSection}>
                <View style={styles.bookingSectionHeader}>
                  <Ionicons name="person-outline" size={20} color={Colors.primary600} />
                  <ThemedText style={styles.bookingSectionTitle}>Tour Guides</ThemedText>
                  {bookings.guides.length > 0 && (
                    <View style={styles.bookingCount}>
                      <ThemedText style={styles.bookingCountText}>{bookings.guides.length}</ThemedText>
                    </View>
                  )}
                </View>
                {bookings.guides.length === 0 ? (
                  <ThemedText style={styles.noBookingsText}>No bookings made yet</ThemedText>
                ) : (
                  bookings.guides.map((booking: any, index: number) => (
                    <View key={booking.id || index} style={styles.bookingItem}>
                      <View style={styles.bookingItemHeader}>
                        <ThemedText style={styles.bookingItemTitle}>{booking.guideName}</ThemedText>
                        <ThemedText style={styles.bookingItemPrice}>${booking.totalPrice}</ThemedText>
                      </View>
                      <View style={styles.bookingItemDetails}>
                        <View style={styles.bookingItemDetail}>
                          <Ionicons name="location-outline" size={14} color={Colors.secondary500} />
                          <ThemedText style={styles.bookingItemDetailText}>{booking.destination}</ThemedText>
                        </View>
                        <View style={styles.bookingItemDetail}>
                          <Ionicons name="calendar-outline" size={14} color={Colors.secondary500} />
                          <ThemedText style={styles.bookingItemDetailText}>
                            {booking.startDate} → {booking.endDate}
                          </ThemedText>
                        </View>
                        <View style={styles.bookingItemDetail}>
                          <Ionicons name="person-outline" size={14} color={Colors.secondary500} />
                          <ThemedText style={styles.bookingItemDetailText}>
                            {booking.tourType || 'Custom Tour'} - {booking.days} {booking.days === 1 ? 'day' : 'days'}
                          </ThemedText>
                        </View>
                        {booking.meetingPoint && (
                          <View style={styles.bookingItemDetail}>
                            <Ionicons name="navigate-outline" size={14} color={Colors.secondary500} />
                            <ThemedText style={styles.bookingItemDetailText}>
                              Meet at: {booking.meetingPoint}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => handleCancelBooking(booking.id, 'guides')}
                      >
                        <Ionicons name="close-circle" size={20} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>
            
            {/* Total Summary */}
            {(bookings.accommodation.length > 0 || bookings.transport.length > 0 || bookings.guides.length > 0) && (
              <View style={styles.totalSummaryContainer}>
                <View style={styles.totalSummaryHeader}>
                  <Ionicons name="receipt-outline" size={20} color={Colors.primary600} />
                  <ThemedText style={styles.totalSummaryTitle}>Trip Total</ThemedText>
                </View>
                <View style={styles.totalSummaryContent}>
                  <View style={styles.totalSummaryRow}>
                    <ThemedText style={styles.totalSummaryLabel}>Accommodation:</ThemedText>
                    <ThemedText style={styles.totalSummaryValue}>
                      ${bookings.accommodation.reduce((sum: number, booking: any) => sum + booking.totalPrice, 0)}
                    </ThemedText>
                  </View>
                  <View style={styles.totalSummaryRow}>
                    <ThemedText style={styles.totalSummaryLabel}>Transportation:</ThemedText>
                    <ThemedText style={styles.totalSummaryValue}>
                      ${bookings.transport.reduce((sum: number, booking: any) => sum + (booking.totalPrice || 0), 0)}
                    </ThemedText>
                  </View>
                  <View style={styles.totalSummaryRow}>
                    <ThemedText style={styles.totalSummaryLabel}>Tour Guides:</ThemedText>
                    <ThemedText style={styles.totalSummaryValue}>
                      ${bookings.guides.reduce((sum: number, booking: any) => sum + (booking.totalPrice || 0), 0)}
                    </ThemedText>
                  </View>
                  <View style={[styles.totalSummaryRow, styles.totalSummaryFinalRow]}>
                    <ThemedText style={styles.totalSummaryFinalLabel}>Total Trip Cost:</ThemedText>
                    <ThemedText style={styles.totalSummaryFinalValue}>
                      ${getTotalAmount()}
                    </ThemedText>
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
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
});
