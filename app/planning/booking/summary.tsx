import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from '../../../components';
import { Colors } from '../../../constants/Colors';
import { useBooking } from '../../../context/BookingContext';

interface SummaryBookingScreenProps {
  onNavigateToTab?: (tab: string) => void;
}

export default function SummaryBookingScreen({ onNavigateToTab }: SummaryBookingScreenProps) {
  const { 
    bookings, 
    removeBooking, 
    clearAllBookings,
    clearBookingsForNewSession,
    getTotalAmount,
    getAccommodationTotal,
    getTransportTotal,
    getGuidesTotal
  } = useBooking();

  // State for expanded booking items
  const [expandedBookings, setExpandedBookings] = useState<{[key: string]: boolean}>({});

  const toggleBookingExpansion = (bookingId: string) => {
    setExpandedBookings(prev => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
  };

  const handleClearAllBookings = () => {
    clearAllBookings();
  };

  const handleStartNewSession = () => {
    Alert.alert(
      'Start New Session',
      'This will clear all current bookings and start a fresh booking session. Are you sure?',
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
            // Navigate to accommodation tab if callback is provided
            if (onNavigateToTab) {
              onNavigateToTab('accommodation');
            }
          },
        },
      ]
    );
  };

  const handleProceedToPayment = () => {
    const totalAmount = getTotalAmount();
    
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

  return (
    <ScrollView style={styles.summaryTabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.modernBookingSummary}>
        {/* All Bookings in a single clean list */}
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
          
          <View style={styles.modernTotalActions}>
            <View style={styles.modernTotalLeftActions}>
              <TouchableOpacity 
                onPress={handleStartNewSession}
                style={styles.modernNewSessionButton}
              >
                <Ionicons name="refresh-outline" size={16} color={Colors.error} />
                <ThemedText style={styles.modernNewSessionButtonText}>New Session</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleClearAllBookings}
                style={styles.modernClearButton}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
                <ThemedText style={styles.modernClearButtonText}>Clear All</ThemedText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={() => handleProceedToPayment()}
              style={styles.modernPaymentButton}
            >
              <Ionicons name="card-outline" size={20} color={Colors.white} />
              <ThemedText style={styles.modernPaymentButtonText}>Proceed to Payment</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modern Empty State */}
      {bookings.accommodation.length === 0 && bookings.transport.length === 0 && bookings.guides.length === 0 && (
        <View style={styles.modernEmptyState}>
          <View style={styles.modernEmptyIconContainer}>
            <Ionicons name="receipt-outline" size={64} color={Colors.secondary400} />
          </View>
          <ThemedText style={styles.modernEmptyTitle}>No Bookings Yet</ThemedText>
          <ThemedText style={styles.modernEmptyText}>
            Start by browsing accommodations, transportation, or guides using the tabs below.
          </ThemedText>
          <View style={styles.modernEmptyActions}>
            <TouchableOpacity 
              style={styles.modernEmptyButton}
              onPress={() => {
                if (onNavigateToTab) {
                  onNavigateToTab('accommodation');
                } else {
                  console.log('Navigate to accommodation tab');
                }
              }}
            >
              <Ionicons name="bed-outline" size={20} color={Colors.primary600} />
              <ThemedText style={styles.modernEmptyButtonText}>Browse Hotels</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Summary Tab Styles
  summaryTabContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Modern Booking Card Styles
  modernBookingSummary: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 24,
  },
  modernSectionContainer: {
    marginBottom: 12,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modernSectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    letterSpacing: -0.3,
  },
  modernBookingCount: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  modernBookingCountText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  modernBookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  modernBookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  modernBookingIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  modernBookingInfo: {
    flex: 1,
    gap: 6,
  },
  modernBookingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  modernBookingSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    fontWeight: '500',
  },
  modernBookingRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  modernBookingPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: -0.3,
  },
  modernBookingDetails: {
    backgroundColor: '#FAFBFC',
    borderTopWidth: 0.5,
    borderTopColor: '#E2E8F0',
  },
  modernBookingDetailsContent: {
    padding: 24,
    paddingBottom: 16,
    gap: 16,
  },
  modernDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modernDetailText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  modernCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  modernCancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: -0.1,
  },

  // Modern Total Summary Styles
  modernTotalSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 32,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  modernTotalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },
  modernTotalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modernTotalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    letterSpacing: -0.3,
  },
  modernTotalContent: {
    padding: 24,
    gap: 16,
  },
  modernTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  modernTotalRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modernTotalLabel: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '600',
  },
  modernTotalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  modernTotalDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  modernTotalFinalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  modernTotalFinalLabel: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: -0.2,
  },
  modernTotalFinalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0284C7',
    letterSpacing: -0.4,
  },
  modernTotalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    gap: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FAFBFC',
  },
  modernClearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  modernClearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    letterSpacing: -0.1,
  },
  modernPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  modernPaymentButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // Modern Empty State Styles
  modernEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
    paddingHorizontal: 40,
    backgroundColor: '#FAFBFC',
    marginHorizontal: 16,
    borderRadius: 24,
    marginTop: 40,
  },
  modernEmptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  modernEmptyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  modernEmptyText: {
    fontSize: 17,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    fontWeight: '500',
    maxWidth: 280,
  },
  modernEmptyActions: {
    alignItems: 'center',
    width: '100%',
  },
  modernEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 32,
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    minWidth: 200,
  },
  modernEmptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  modernTotalLeftActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modernNewSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.error + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  modernNewSessionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.error,
  },
});
