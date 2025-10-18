import { router, useFocusEffect } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, View, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import vehicleIcon from '../../assets/images/car.png';
import guideIcon from '../../assets/images/guide.png';
import accomodationIcon from '../../assets/images/hotel.png';
import { CustomButton, ThemedText, TopBar } from '../../components';
import { Colors } from '../../constants/Colors';
import { ConfirmedBooking } from '../../utils/BookingDataManager';
import { BookingService, TourPackageBookingItem } from '../../services/booking';
import { StorageService } from '../../services/storage';

export default function BookNowScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  // Ensure tab press scrolls to top and proper scrollable node is registered
  useScrollToTop(scrollRef);
  const [upcomingBookings, setUpcomingBookings] = useState<ConfirmedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUpcomingBookings();
  }, []);

  // Refresh bookings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUpcomingBookings();
    }, [])
  );

  const loadUpcomingBookings = async () => {
    try {
      // Prefer backend data
      const user = await StorageService.getUserData();
      const userId = user?.id || user?._id;
      if (!userId) throw new Error('Not logged in');

      const res = await BookingService.listTourPackageBookings({ userId: String(userId) });
      const items: TourPackageBookingItem[] = (res?.success && Array.isArray(res.data)) ? (res.data as any) : [];

      const now = new Date();
      const mapped: ConfirmedBooking[] = items.map((it) => {
        // Compute UI status based on backend status and dates
        const end = new Date(it.endDate);
        let status: ConfirmedBooking['status'] = 'confirmed';
        
        // Priority order: cancelled/declined > completed > confirmed > approved > pending
        if (it.status === 'cancelled') {
          status = 'cancelled';
        } else if (it.status === 'declined') {
          status = 'declined';
        } else if (it.status === 'completed') {
          status = 'completed';
        } else if (end < now && it.status === 'confirmed') {
          // Auto-mark as completed if end date has passed and still confirmed
          status = 'completed';
        } else if (it.status === 'pending') {
          status = 'pending';
        } else if (it.status === 'approved') {
          status = 'approved';
        } else if (it.status === 'confirmed') {
          status = 'upcoming'; // future confirmed bookings are "upcoming"
        } else {
          status = 'upcoming';
        }

        return {
          id: String(it._id),
          bookingId: String(it._id),
          tripName: it.packageTitle,
          startDate: new Date(it.startDate).toISOString(),
          endDate: new Date(it.endDate).toISOString(),
          totalAmount: Number(it.pricing?.totalAmount || 0),
          paymentDate: new Date(it.createdAt).toISOString(),
          transactionId: (it as any)?.payment?.intentId || '',
          email: user?.email || '',
          status,
          accommodation: [],
          transport: [],
          guides: [],
          createdAt: new Date(it.createdAt).toISOString(),
        };
      })
      // Filter to upcoming section: future and not cancelled
  .filter(b => (['upcoming','pending','approved','confirmed'] as ConfirmedBooking['status'][]).includes(b.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setUpcomingBookings(mapped);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setUpcomingBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUpcomingBookings();
  }, []);

  // Temporary function to clear all AsyncStorage data (debug only)
  // const handleClearAllStorage = async () => {
  //   try {
  //     console.log('🗑️ Clearing all AsyncStorage data...');
  //     await clearAllStorage();
  //     setUpcomingBookings([]);
  //     await loadUpcomingBookings();
  //     console.log('✅ All AsyncStorage data cleared successfully');
  //   } catch (error) {
  //     console.error('❌ Error clearing AsyncStorage:', error);
  //   }
  // };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getServiceIcon = (booking: ConfirmedBooking) => {
    if (booking.accommodation.length > 0) return accomodationIcon;
    if (booking.transport.length > 0) return vehicleIcon;
    if (booking.guides.length > 0) return guideIcon;
    // Default to tour package (guide icon) for tour packages
    return guideIcon;
  };

  const getBookingType = (booking: ConfirmedBooking) => {
    if (booking.accommodation.length > 0) return 'Accommodation';
    if (booking.transport.length > 0) return 'Transportation';
    return 'Tour Package';
  };

  const getTypeColor = (booking: ConfirmedBooking) => {
    const type = getBookingType(booking);
    switch (type) {
      case 'Accommodation':
        return Colors.info;
      case 'Transportation':
        return Colors.warning;
      default:
        return Colors.primary600;
    }
  };

  const getServiceTypeDisplay = (booking: ConfirmedBooking) => {
    if (booking.accommodation.length > 0) {
      return `Check-in: ${formatDate(booking.startDate)}`;
    }
    if (booking.transport.length > 0) {
      return `Pickup: ${formatDate(booking.startDate)}`;
    }
    if (booking.guides.length > 0) {
      return `Service: ${formatDate(booking.startDate)}`;
    }
    return `${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}`;
  };

  const getServiceName = (booking: ConfirmedBooking) => {
    if (booking.accommodation.length > 0) {
      const hotel = booking.accommodation[0];
      return hotel.name || hotel.location || 'Hotel Booking';
    }
    if (booking.transport.length > 0) {
      const vehicle = booking.transport[0];
      return vehicle.name || vehicle.type || 'Transport Booking';
    }
    if (booking.guides.length > 0) {
      const guide = booking.guides[0];
      return guide.name || 'Tour Guide Service';
    }
    return booking.tripName;
  };

  const getStatusColor = (booking: ConfirmedBooking) => {
    switch (booking.status) {
      case 'pending':
        return Colors.warning;
      case 'approved':
        return Colors.info;
      case 'upcoming':
        return Colors.success;
      case 'confirmed':
        return Colors.primary600;
      case 'completed':
        return Colors.secondary400;
      case 'cancelled':
        return Colors.error;
      case 'declined':
        return Colors.error;
      default:
        return Colors.secondary400;
    }
  };

  const getStatusLabel = (booking: ConfirmedBooking) => {
    // Show "Confirmed" for both confirmed and upcoming
    const raw = booking.status === 'upcoming' ? 'Confirmed' : booking.status;
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <StatusBar style="light" translucent />
      <TopBar
        onProfilePress={() => { /* handle profile/account */ }}
        onNotificationsPress={() => { /* handle notifications */ }}
      />
  <ScrollView 
    ref={scrollRef} 
    style={styles.scrollView} 
    contentContainerStyle={styles.scrollContent}
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={Colors.white}
        colors={[Colors.primary600]}
        progressBackgroundColor={Colors.primary800}
        progressViewOffset={0}
      />
    }
  >
        {/* Header Section */}
        <View style={styles.greetingContainer}>
          <ThemedText variant="title" style={styles.greeting}>Book Your Adventure</ThemedText>
          <ThemedText variant="caption" style={styles.caption}>Discover amazing experiences across Sri Lanka</ThemedText>
        </View>

        {/* Book Services Section */}
        <View style={styles.servicesSection}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>What would you like to book?</ThemedText>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.serviceCard}
              activeOpacity={0.7}
              onPress={() => router.push('/accomodation/acc_home')}
            >
              <View style={[styles.serviceIconBg, { backgroundColor: `${Colors.info}15` }]}>
                <Image source={accomodationIcon} style={styles.serviceCardIcon} />
              </View>
              <ThemedText style={styles.serviceCardText}>Accommodations</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.serviceCard}
              activeOpacity={0.7}
              onPress={() => router.push('/transportation/tra_home')}
            >
              <View style={[styles.serviceIconBg, { backgroundColor: `${Colors.warning}15` }]}>
                <Image source={vehicleIcon} style={styles.serviceCardIcon} />
              </View>
              <ThemedText style={styles.serviceCardText}>Transportation</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.serviceCard}
              activeOpacity={0.7}
              onPress={() => router.push('/tour_guides/gui_home')}
            >
              <View style={[styles.serviceIconBg, { backgroundColor: `${Colors.primary600}15` }]}>
                <Image source={guideIcon} style={styles.serviceCardIcon} />
              </View>
              <ThemedText style={styles.serviceCardText}>Tour Guides</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Separator */}
        <View style={styles.sectionSeparator} />

        {/* Upcoming Bookings Section */}
        <View style={styles.upcomingSection}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>Upcoming Bookings</ThemedText>
            <CustomButton
              title="See All"
              variant="outline"
              size="small"
              style={styles.seeMoreButton}
              onPress={() => router.push('/bookings')}
            />
          </View>
          
          <View style={styles.bookingsList}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ThemedText style={styles.loadingText}>Loading bookings...</ThemedText>
              </View>
            ) : upcomingBookings.length > 0 ? (
              upcomingBookings.slice(0, 5).map((booking) => (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingCard}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/bookings/${encodeURIComponent(booking.id)}`)}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.bookingIconWrapper, { backgroundColor: `${getTypeColor(booking)}15` }]}>
                      <Image source={getServiceIcon(booking)} style={styles.cardIcon} />
                    </View>
                    <View style={styles.cardHeaderText}>
                      <View style={styles.titleRow}>
                        <ThemedText style={styles.cardTitle} numberOfLines={1}>{getServiceName(booking)}</ThemedText>
                      </View>
                      <View style={[styles.typeChip, { backgroundColor: getTypeColor(booking) }]}>
                        <ThemedText style={styles.typeChipText}>{getBookingType(booking)}</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking) }]}>
                      <ThemedText style={styles.statusText}>{getStatusLabel(booking)}</ThemedText>
                    </View>
                  </View>
                  
                  <View style={styles.cardDivider} />
                  
                  <View style={styles.cardFooter}>
                    <View style={styles.dateInfo}>
                      <ThemedText style={styles.dateLabel}>
                        {getServiceTypeDisplay(booking)}
                      </ThemedText>
                    </View>
                    <View style={styles.priceInfo}>
                      <ThemedText style={styles.priceLabel}>Total</ThemedText>
                      <ThemedText style={styles.priceAmount}>Rs. {booking.totalAmount.toLocaleString()}</ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>No upcoming bookings</ThemedText>
                <ThemedText style={styles.emptySubtext}>Start planning your next adventure!</ThemedText>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary800,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 0,
  },

  
  // Section Separator
  sectionSeparator: {
    height: 1,
    backgroundColor: Colors.secondary200,
    marginVertical: 20,
    marginHorizontal: 20,
  },
  
  // Header Section
  greetingContainer: {
    backgroundColor: Colors.primary800,
    alignSelf: 'stretch',
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    zIndex: 2,
  },
  caption: {
    color: Colors.primary100,
    fontSize: 15,
    zIndex: 2,
  },

  // Services Section - Modern Card Layout
  servicesSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.secondary100,
  },
  serviceIconBg: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceCardIcon: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  serviceCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary700,
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // Legacy service button styles (deprecated, kept for reference)
  buttonContainer: {
    width: '32%',
    alignItems: 'center',
    marginHorizontal: '0.67%',
  },
  serviceButton: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.primary800,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    position: 'relative',
  },
  buttonIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 14,
  },
  invisibleButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  debugButton: {
    marginBottom: 16,
    borderColor: Colors.primary100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Upcoming Bookings Section
  upcomingSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  seeMoreButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bookingsList: {
    gap: 12,
  },
  
  // Modern Card-Based Booking Items
  bookingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.secondary100,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bookingIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  cardHeaderText: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
    flex: 1,
  },
  typeChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.secondary100,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    color: Colors.secondary500,
    fontWeight: '500',
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    color: Colors.secondary400,
    fontWeight: '500',
    marginBottom: 2,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary600,
  },
  
  // Legacy styles (kept for backward compatibility)
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },
  bookingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary600,
    marginRight: 12,
  },
  bookingDetails: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  bookingPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary600,
    marginTop: 2,
  },
  bookingImage: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },

  // Loading and Empty States
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.secondary600,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
  },
});