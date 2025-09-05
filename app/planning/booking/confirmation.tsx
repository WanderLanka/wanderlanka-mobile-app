import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Linking,
    ScrollView,
    Share,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomButton } from '../../../components/CustomButton';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';
import { Colors } from '../../../constants/Colors';
import { useBooking } from '../../../context/BookingContext';
import { BookingDataManager } from '../../../utils/BookingDataManager';

interface ConfirmedBooking {
  id: string;
  bookingId: string;
  tripName: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  paymentDate: string;
  transactionId: string;
  email: string;
  status: 'confirmed' | 'upcoming' | 'completed' | 'cancelled';
  accommodation: any[];
  transport: any[];
  guides: any[];
  createdAt: string;
}

export default function BookingConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { bookings, clearAllBookings } = useBooking();
  
  const [isLoading, setIsLoading] = useState(true);
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBooking | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const generateTripName = () => {
      const destinations: string[] = [];
      
      bookings.accommodation.forEach(acc => {
        if (acc.location && !destinations.includes(acc.location)) {
          destinations.push(acc.location);
        }
      });
      
      if (destinations.length === 0) return 'Sri Lanka Adventure';
      if (destinations.length === 1) return `${destinations[0]} Trip`;
      if (destinations.length === 2) return `${destinations[0]} & ${destinations[1]} Tour`;
      return `${destinations[0]} & ${destinations.length - 1} More Destinations`;
    };

    const calculateTripDates = () => {
      let earliestDate = new Date();
      let latestDate = new Date();

      if (bookings.accommodation.length > 0) {
        const checkInDates = bookings.accommodation
          .map(acc => new Date(acc.checkInDate))
          .filter(date => !isNaN(date.getTime()));
        
        const checkOutDates = bookings.accommodation
          .map(acc => new Date(acc.checkOutDate))
          .filter(date => !isNaN(date.getTime()));

        if (checkInDates.length > 0) {
          earliestDate = new Date(Math.min(...checkInDates.map(d => d.getTime())));
        }
        
        if (checkOutDates.length > 0) {
          latestDate = new Date(Math.max(...checkOutDates.map(d => d.getTime())));
        }
      }

      return {
        startDate: earliestDate.toISOString(),
        endDate: latestDate.toISOString(),
      };
    };

    const saveToUpcomingBookings = async (mainBooking: ConfirmedBooking) => {
      try {
        // Create separate booking entries for each service type
        const individualBookings: ConfirmedBooking[] = [];
        
        // Add accommodation bookings separately
        if (mainBooking.accommodation.length > 0) {
          mainBooking.accommodation.forEach((acc, index) => {
            const accommodationBooking: ConfirmedBooking = {
              id: `booking_acc_${index}`,
              bookingId: `WLA${index + 1}`,
              tripName: acc.name || `${acc.location} Accommodation`,
              startDate: acc.checkInDate || mainBooking.startDate,
              endDate: acc.checkOutDate || mainBooking.endDate,
              totalAmount: acc.totalPrice || 0,
              paymentDate: mainBooking.paymentDate,
              transactionId: mainBooking.transactionId,
              email: mainBooking.email,
              status: 'upcoming',
              accommodation: [acc],
              transport: [],
              guides: [],
              createdAt: '2025-07-24T00:00:00.000Z',
            };
            individualBookings.push(accommodationBooking);
          });
        }
        
        // Add transport bookings separately
        if (mainBooking.transport.length > 0) {
          mainBooking.transport.forEach((transport, index) => {
            const transportBooking: ConfirmedBooking = {
              id: `booking_transport_${index}`,
              bookingId: `WLT${index + 1}`,
              tripName: transport.name || `${transport.type} Transport`,
              startDate: transport.pickupDate || mainBooking.startDate,
              endDate: transport.dropoffDate || mainBooking.endDate,
              totalAmount: transport.totalPrice || 0,
              paymentDate: mainBooking.paymentDate,
              transactionId: mainBooking.transactionId,
              email: mainBooking.email,
              status: 'upcoming',
              accommodation: [],
              transport: [transport],
              guides: [],
              createdAt: '2025-07-24T00:00:00.000Z',
            };
            individualBookings.push(transportBooking);
          });
        }
        
        // Add guide bookings separately
        if (mainBooking.guides.length > 0) {
          mainBooking.guides.forEach((guide, index) => {
            const guideBooking: ConfirmedBooking = {
              id: `booking_guide_${index}`,
              bookingId: `WLG${index + 1}`,
              tripName: guide.name || `Tour Guide Service`,
              startDate: guide.serviceDate || mainBooking.startDate,
              endDate: guide.serviceEndDate || mainBooking.endDate,
              totalAmount: guide.totalPrice || 0,
              paymentDate: mainBooking.paymentDate,
              transactionId: mainBooking.transactionId,
              email: mainBooking.email,
              status: 'upcoming',
              accommodation: [],
              transport: [],
              guides: [guide],
              createdAt: '2025-07-24T00:00:00.000Z',
            };
            individualBookings.push(guideBooking);
          });
        }
        
        // If no individual services, save the main booking as is
        if (individualBookings.length === 0) {
          individualBookings.push(mainBooking);
        }
        
        // Use BookingDataManager to add bookings (includes automatic cleanup)
        await BookingDataManager.addToUpcomingBookings(individualBookings);
        
        // Clear temporary data
        await BookingDataManager.clearTemporaryData();
        
        console.log(`✅ Saved ${individualBookings.length} individual bookings`);
        
      } catch (error) {
        console.error('Error saving booking:', error);
        throw error;
      }
    };

    const initializeConfirmation = async () => {
      try {
        // Extract booking details from params
        const transactionId = params.transactionId as string || `TXN001`;
        const totalAmount = params.totalAmount as string || '0';
        const email = params.email as string || '';

        // Generate trip details
        const tripName = generateTripName();
        const { startDate, endDate } = calculateTripDates();
        
        // Create confirmed booking object
        const newBooking: ConfirmedBooking = {
          id: `main_booking`,
          bookingId: `WL001`,
          tripName,
          startDate,
          endDate,
          totalAmount: parseFloat(totalAmount),
          paymentDate: '2025-07-24T00:00:00.000Z',
          transactionId,
          email,
          status: 'upcoming',
          accommodation: bookings.accommodation,
          transport: bookings.transport,
          guides: bookings.guides,
          createdAt: '2025-07-24T00:00:00.000Z',
        };

        // Save to AsyncStorage with proper data lifecycle management
        await saveToUpcomingBookings(newBooking);
        
        // Clear temporary bookings from BookingContext
        clearAllBookings();
        
        // Set confirmed booking for display
        setConfirmedBooking(newBooking);
        setIsLoading(false);

        // Start animations
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();

        // Confetti animation
        Animated.timing(confettiAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }).start(() => {
          setShowConfetti(false);
        });

      } catch (error) {
        console.error('Failed to initialize confirmation:', error);
        setIsLoading(false);
      }
    };

    initializeConfirmation();
  }, [params, bookings, clearAllBookings, fadeAnim, scaleAnim, confettiAnim]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleViewBookings = () => {
    router.replace('/(travelerTabs)/bookNow');
  };

  const handleAddToCalendar = async () => {
    if (!confirmedBooking) return;

    const startDate = new Date(confirmedBooking.startDate);
    const endDate = new Date(confirmedBooking.endDate);
    
    const title = encodeURIComponent(confirmedBooking.tripName);
    const details = encodeURIComponent(`Booking ID: ${confirmedBooking.bookingId}`);
    const startDateString = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDateString = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateString}/${endDateString}&details=${details}`;
    
    try {
      await Linking.openURL(calendarUrl);
    } catch {
      Alert.alert('Error', 'Unable to open calendar app');
    }
  };

  const handleShareTrip = async () => {
    if (!confirmedBooking) return;

    try {
      await Share.share({
        message: `🎉 Trip Confirmed! ${confirmedBooking.tripName}\n\nBooking ID: ${confirmedBooking.bookingId}\nDates: ${formatDate(confirmedBooking.startDate)} - ${formatDate(confirmedBooking.endDate)}\n\nSee you in Sri Lanka! 🇱🇰`,
        title: 'My Sri Lanka Trip',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (isLoading || !confirmedBooking) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ThemedText>Processing your booking...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Success Animation */}
        <Animated.View style={[styles.successContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {showConfetti && (
            <Animated.View style={[styles.confetti, { opacity: confettiAnim }]}>
              <ThemedText style={styles.confettiText}>🎉 ✨ 🎊 ✨ 🎉</ThemedText>
            </Animated.View>
          )}
          
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>
          
          <ThemedText style={styles.successTitle}>Booking Confirmed!</ThemedText>
          <ThemedText style={styles.successSubtitle}>
            Your Sri Lankan adventure is all set! 🇱🇰
          </ThemedText>
        </Animated.View>

        {/* Booking Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.bookingHeader}>
            <ThemedText style={styles.bookingId}>
              Booking ID: {confirmedBooking.bookingId}
            </ThemedText>
            <View style={styles.statusBadge}>
              <ThemedText style={styles.statusText}>CONFIRMED</ThemedText>
            </View>
          </View>

          <View style={styles.tripInfo}>
            <ThemedText style={styles.tripName}>{confirmedBooking.tripName}</ThemedText>
            
            <View style={styles.dateRange}>
              <Ionicons name="calendar-outline" size={16} color={Colors.primary600} />
              <ThemedText style={styles.dateText}>
                {formatDate(confirmedBooking.startDate)} - {formatDate(confirmedBooking.endDate)}
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Transaction ID:</ThemedText>
              <ThemedText style={styles.detailValue}>{confirmedBooking.transactionId}</ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Payment Date:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatDate(confirmedBooking.paymentDate)}
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Email:</ThemedText>
              <ThemedText style={styles.detailValue}>{confirmedBooking.email}</ThemedText>
            </View>
          </View>

          {/* Service Breakdown */}
          <View style={styles.serviceBreakdown}>
            {confirmedBooking.accommodation.length > 0 && (
              <>
                <ThemedText style={styles.serviceGroupTitle}>Accommodations</ThemedText>
                {confirmedBooking.accommodation.map((acc, index) => (
                  <View key={index} style={styles.serviceRow}>
                    <View style={styles.serviceInfo}>
                      <Ionicons name="bed-outline" size={20} color={Colors.primary600} />
                      <View style={styles.serviceDetails}>
                        <ThemedText style={styles.serviceName}>
                          {acc.name || `${acc.location} Accommodation`}
                        </ThemedText>
                        <ThemedText style={styles.serviceSubtext}>
                          {acc.checkInDate && acc.checkOutDate ? 
                            `${formatDate(acc.checkInDate)} - ${formatDate(acc.checkOutDate)}` : 
                            'Check-in/out dates'}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.servicePrice}>${acc.totalPrice || 0}</ThemedText>
                  </View>
                ))}
              </>
            )}

            {confirmedBooking.transport.length > 0 && (
              <>
                <ThemedText style={styles.serviceGroupTitle}>Transportation</ThemedText>
                {confirmedBooking.transport.map((transport, index) => (
                  <View key={index} style={styles.serviceRow}>
                    <View style={styles.serviceInfo}>
                      <Ionicons name="car-outline" size={20} color={Colors.primary600} />
                      <View style={styles.serviceDetails}>
                        <ThemedText style={styles.serviceName}>
                          {transport.name || `${transport.type} Transport`}
                        </ThemedText>
                        <ThemedText style={styles.serviceSubtext}>
                          {transport.pickupDate ? 
                            `Pickup: ${formatDate(transport.pickupDate)}` : 
                            'Transport service'}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.servicePrice}>${transport.totalPrice || 0}</ThemedText>
                  </View>
                ))}
              </>
            )}

            {confirmedBooking.guides.length > 0 && (
              <>
                <ThemedText style={styles.serviceGroupTitle}>Tour Guides</ThemedText>
                {confirmedBooking.guides.map((guide, index) => (
                  <View key={index} style={styles.serviceRow}>
                    <View style={styles.serviceInfo}>
                      <Ionicons name="person-outline" size={20} color={Colors.primary600} />
                      <View style={styles.serviceDetails}>
                        <ThemedText style={styles.serviceName}>
                          {guide.name || 'Tour Guide Service'}
                        </ThemedText>
                        <ThemedText style={styles.serviceSubtext}>
                          {guide.serviceDate ? 
                            `Service: ${formatDate(guide.serviceDate)}` : 
                            'Guide service'}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.servicePrice}>${guide.totalPrice || 0}</ThemedText>
                  </View>
                ))}
              </>
            )}
          </View>

          {/* Total Amount */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <ThemedText style={styles.totalLabel}>Total Paid</ThemedText>
              <ThemedText style={styles.totalAmount}>${confirmedBooking.totalAmount}</ThemedText>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {/* Primary Action */}
          <CustomButton
            title="View My Bookings"
            onPress={handleViewBookings}
            variant="primary"
            size="large"
            style={styles.primaryButton}
          />

          {/* Secondary Actions */}
          <View style={styles.secondaryActions}>
            <CustomButton
              title="Add to Calendar"
              onPress={handleAddToCalendar}
              variant="outline"
              size="medium"
              leftIcon="calendar-outline"
              style={styles.secondaryButton}
            />

            <CustomButton
              title="Share Trip"
              onPress={handleShareTrip}
              variant="outline"
              size="medium"
              leftIcon="share-outline"
              style={styles.secondaryButton}
            />
          </View>
        </View>

        {/* Confirmation Notice */}
        <View style={styles.confirmationNotice}>
          <Ionicons name="mail-outline" size={20} color={Colors.primary600} />
          <ThemedText style={styles.noticeText}>
            A confirmation email with your itinerary details has been sent to {confirmedBooking.email}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },

  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Success Animation
  successContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },

  confetti: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  confettiText: {
    fontSize: 24,
    letterSpacing: 4,
  },

  successIcon: {
    marginBottom: 20,
  },

  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.success,
    marginBottom: 8,
    textAlign: 'center',
  },

  successSubtitle: {
    fontSize: 16,
    color: Colors.secondary600,
    textAlign: 'center',
    marginBottom: 10,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },

  bookingId: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary600,
  },

  statusBadge: {
    backgroundColor: Colors.success100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success700,
  },

  tripInfo: {
    marginBottom: 20,
  },

  tripName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 8,
  },
  
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },

  dateText: {
    fontSize: 14,
    color: Colors.secondary600,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  detailLabel: {
    fontSize: 14,
    color: Colors.secondary500,
  },

  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary700,
  },

  // Service Breakdown
  serviceBreakdown: {
    marginBottom: 20,
    gap: 12,
  },

  serviceGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginTop: 8,
    marginBottom: 8,
  },

  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },

  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },

  serviceDetails: {
    flex: 1,
  },

  serviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary700,
    marginBottom: 2,
  },

  serviceSubtext: {
    fontSize: 12,
    color: Colors.secondary500,
  },

  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
    marginLeft: 8,
  },

  // Total Section
  totalSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
    paddingTop: 16,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },

  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary600,
  },

  // Actions
  actionSection: {
    marginBottom: 30,
  },

  primaryButton: {
    marginBottom: 16,
  },

  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },

  secondaryButton: {
    flex: 1,
  },

  // Confirmation Notice
  confirmationNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.primary100,
    padding: 16,
    borderRadius: 8,
    marginBottom: 40,
  },

  noticeText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary700,
    lineHeight: 20,
  },
});
