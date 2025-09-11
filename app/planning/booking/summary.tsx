import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

  const handleProceedToPayment = () => {
    const totalAmount = getTotalAmount();
    
    if (totalAmount === 0) {
      Alert.alert('No Bookings', 'Please add some bookings before proceeding to payment.');
      return;
    }
    
    // Navigate to payment screen
    router.push('/planning/booking/payment');
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
      <View key={bookingKey} style={styles.bookingCard}>
        <TouchableOpacity 
          style={styles.bookingHeader}
          onPress={() => toggleBookingExpansion(bookingKey)}
          activeOpacity={0.7}
        >
          <View style={styles.bookingIcon}>
            <Ionicons name={getIcon() as any} size={20} color={Colors.primary600} />
          </View>
          
          <View style={styles.bookingInfo}>
            <ThemedText style={styles.bookingTitle}>{getTitle()}</ThemedText>
            <ThemedText style={styles.bookingSubtitle}>{getSubtitle()}</ThemedText>
          </View>
          
          <View style={styles.bookingRight}>
            <ThemedText style={styles.bookingPrice}>
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
          <View style={styles.bookingDetails}>
            <View style={styles.bookingDetailsContent}>
              {type === 'accommodation' && (
                <>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailText}>
                      {booking.destination || 'Unknown Location'}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailText}>
                      {getStartDate()} → {getEndDate()}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailText}>
                      {booking.numberOfRooms || 1} {(booking.numberOfRooms || 1) === 1 ? 'room' : 'rooms'}
                    </ThemedText>
                  </View>
                  {(booking.numberOfGuests && booking.numberOfGuests > 1) && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailText}>
                        {booking.numberOfGuests} guests
                      </ThemedText>
                    </View>
                  )}
                  {booking.pricePerNight && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailText}>
                        ${booking.pricePerNight}/night × {booking.numberOfNights || 1} nights
                      </ThemedText>
                    </View>
                  )}
                </>
              )}
              
              {type === 'transport' && (
                <>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailText}>
                      {booking.destination || 'Unknown Location'}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailText}>
                      {getStartDate()} → {getEndDate()}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailText}>
                      {booking.provider || 'Transport Service'} - {booking.transportInfo?.type || 'Vehicle'}
                    </ThemedText>
                  </View>
                  {booking.pickupLocation && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailText}>
                        Pickup: {booking.pickupLocation}
                      </ThemedText>
                    </View>
                  )}
                  {booking.dropoffLocation && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailText}>
                        Drop-off: {booking.dropoffLocation}
                      </ThemedText>
                    </View>
                  )}
                  {booking.pricePerDay && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailText}>
                        ${booking.pricePerDay}/day × {booking.days || 1} days
                      </ThemedText>
                    </View>
                  )}
                </>
              )}
              
              {type === 'guides' && (
                <>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailText}>
                      {booking.destination || 'Unknown Location'}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailText}>
                      {getStartDate()} → {getEndDate()}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailText}>
                      {booking.tourType || 'Custom Tour'}
                    </ThemedText>
                  </View>
                  {booking.meetingPoint && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailText}>
                        Meet at: {booking.meetingPoint}
                      </ThemedText>
                    </View>
                  )}
                  {booking.guideInfo?.experience && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailText}>
                        Experience: {booking.guideInfo.experience}
                      </ThemedText>
                    </View>
                  )}
                  {booking.pricePerDay && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailText}>
                        ${booking.pricePerDay}/day × {booking.days || 1} days
                      </ThemedText>
                    </View>
                  )}
                </>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => handleCancelBooking(booking.id, type)}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <ThemedText style={styles.cancelButtonText}>Cancel Booking</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.summaryTabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.bookingSummary}>
        {/* All Bookings in a single clean list */}
        {bookings.accommodation.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bed-outline" size={22} color={Colors.primary600} />
              <ThemedText style={styles.sectionTitle}>Accommodation</ThemedText>
              <View style={styles.bookingCount}>
                <ThemedText style={styles.bookingCountText}>{bookings.accommodation.length}</ThemedText>
              </View>
            </View>
            {bookings.accommodation.map((booking: any, index: number) => 
              renderBookingCard(booking, index, 'accommodation')
            )}
          </View>
        )}

        {bookings.transport.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="car-outline" size={22} color={Colors.primary600} />
              <ThemedText style={styles.sectionTitle}>Transportation</ThemedText>
              <View style={styles.bookingCount}>
                <ThemedText style={styles.bookingCountText}>{bookings.transport.length}</ThemedText>
              </View>
            </View>
            {bookings.transport.map((booking: any, index: number) => 
              renderBookingCard(booking, index, 'transport')
            )}
          </View>
        )}

        {bookings.guides.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={22} color={Colors.primary600} />
              <ThemedText style={styles.sectionTitle}>Tour Guides</ThemedText>
              <View style={styles.bookingCount}>
                <ThemedText style={styles.bookingCountText}>{bookings.guides.length}</ThemedText>
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
        <View style={styles.totalSummary}>
          <View style={styles.totalHeader}>
            <View style={styles.totalIconContainer}>
              <Ionicons name="receipt-outline" size={24} color={Colors.white} />
            </View>
            <ThemedText style={styles.totalTitle}>Booking Summary</ThemedText>
          </View>
          
          <View style={styles.totalContent}>
            {bookings.accommodation.length > 0 && (
              <View style={styles.totalRow}>
                <View style={styles.totalRowLeft}>
                  <Ionicons name="bed-outline" size={18} color={Colors.secondary600} />
                  <ThemedText style={styles.totalLabel}>Accommodation</ThemedText>
                </View>
                <ThemedText style={styles.totalValue}>${getAccommodationTotal()}</ThemedText>
              </View>
            )}
            
            {bookings.transport.length > 0 && (
              <View style={styles.totalRow}>
                <View style={styles.totalRowLeft}>
                  <Ionicons name="car-outline" size={18} color={Colors.secondary600} />
                  <ThemedText style={styles.totalLabel}>Transportation</ThemedText>
                </View>
                <ThemedText style={styles.totalValue}>${getTransportTotal()}</ThemedText>
              </View>
            )}
            
            {bookings.guides.length > 0 && (
              <View style={styles.totalRow}>
                <View style={styles.totalRowLeft}>
                  <Ionicons name="person-outline" size={18} color={Colors.secondary600} />
                  <ThemedText style={styles.totalLabel}>Tour Guides</ThemedText>
                </View>
                <ThemedText style={styles.totalValue}>${getGuidesTotal()}</ThemedText>
              </View>
            )}
            
            <View style={styles.totalDivider} />
            
            <View style={styles.totalFinalRow}>
              <ThemedText style={styles.totalFinalLabel}>Total Bookings Cost</ThemedText>
              <ThemedText style={styles.totalFinalValue}>${getTotalAmount()}</ThemedText>
            </View>
          </View>
          
          <View style={styles.totalActions}>
            <TouchableOpacity 
              onPress={() => handleProceedToPayment()}
              style={styles.paymentButton}
            >
              <Ionicons name="card-outline" size={20} color={Colors.white} />
              <ThemedText style={styles.paymentButtonText}>Proceed to Payment</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modern Empty State */}
      {bookings.accommodation.length === 0 && bookings.transport.length === 0 && bookings.guides.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="receipt-outline" size={64} color={Colors.secondary400} />
          </View>
          <ThemedText style={styles.emptyTitle}>No Bookings Yet</ThemedText>
          <ThemedText style={styles.emptyText}>
            Start by browsing accommodations, transportation, or guides using the tabs below.
          </ThemedText>
          
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Main Container
  summaryTabContent: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },

  // Booking Summary
  bookingSummary: {
    padding: 16,
    gap: 16,
  },

  // Section Styles
  sectionContainer: {
    marginBottom: 8,
    backgroundColor: Colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    flex: 1,
  },
  bookingCount: {
    backgroundColor: Colors.primary600,
    borderRadius: 16,
    paddingHorizontal: 10,
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

  // Booking Card
  bookingCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 8,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingInfo: {
    flex: 1,
    gap: 4,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  bookingSubtitle: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  bookingRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  bookingPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary600,
  },

  // Booking Details
  bookingDetails: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
  },
  bookingDetailsContent: {
    padding: 16,
    gap: 12,
  },
  detailRow: {
    paddingVertical: 4,
  },
  detailText: {
    fontSize: 14,
    color: Colors.secondary600,
    flex: 1,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.secondary100,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.error,
  },

  // Total Summary
  totalSummary: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    margin: 16,
  },
  totalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary600,
    padding: 16,
    gap: 12,
    borderRadius: 16,
  },
  totalIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
    borderRadius: 16,
  },
  totalContent: {
    padding: 16,
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.secondary50,
    borderRadius: 8,
  },
  totalRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.secondary600,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  totalDivider: {
    height: 1,
    backgroundColor: Colors.secondary200,
    marginVertical: 8,
  },
  totalFinalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary100,
    borderRadius: 8,
  },
  totalFinalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary700,
  },
  totalFinalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary700,
  },
  totalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
    backgroundColor: Colors.secondary50,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary600,
    borderRadius: 8,
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 12,
    marginTop: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.secondary100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 280,
  },
  emptyActions: {
    alignItems: 'center',
    width: '100%',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary600,
    borderRadius: 8,
    minWidth: 160,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
