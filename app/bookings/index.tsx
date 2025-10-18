import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { BookingService, TourPackageBookingItem } from '../../services/booking';
import { StorageService } from '../../services/storage';
import { ConfirmedBooking } from '../../utils/BookingDataManager';
import vehicleIcon from '../../assets/images/car.png';
import guideIcon from '../../assets/images/guide.png';
import accomodationIcon from '../../assets/images/hotel.png';

export default function AllBookingsScreen() {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<ConfirmedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load bookings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [])
  );

  const loadBookings = async () => {
    try {
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
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setBookings(mapped);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookings();
  }, []);

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
    const raw = booking.status === 'upcoming' ? 'Confirmed' : booking.status;
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };

  // Group bookings by category
  const upcomingBookings = bookings.filter(b => 
    ['upcoming', 'pending', 'approved', 'confirmed'].includes(b.status)
  );
  const pastBookings = bookings.filter(b => 
    ['completed', 'cancelled', 'declined'].includes(b.status)
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Bookings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary600}
            colors={[Colors.primary600]}
            progressViewOffset={0}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={Colors.secondary400} />
            <Text style={styles.emptyTitle}>No Bookings Yet</Text>
            <Text style={styles.emptyText}>Start planning your adventure!</Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => router.push('/(travelerTabs)/bookNow')}
            >
              <Text style={styles.exploreButtonText}>Explore Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="calendar" size={20} color={Colors.primary600} />
                  <Text style={styles.sectionTitle}>Upcoming ({upcomingBookings.length})</Text>
                </View>
                {upcomingBookings.map((booking) => (
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
                          <Text style={styles.cardTitle} numberOfLines={1}>{getServiceName(booking)}</Text>
                        </View>
                        <View style={[styles.typeChip, { backgroundColor: getTypeColor(booking) }]}>
                          <Text style={styles.typeChipText}>{getBookingType(booking)}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking) }]}>
                        <Text style={styles.statusText}>{getStatusLabel(booking)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.cardDivider} />
                    
                    <View style={styles.cardFooter}>
                      <View style={styles.dateInfo}>
                        <Text style={styles.dateLabel}>
                          {getServiceTypeDisplay(booking)}
                        </Text>
                      </View>
                      <View style={styles.priceInfo}>
                        <Text style={styles.priceLabel}>Total</Text>
                        <Text style={styles.priceAmount}>Rs. {booking.totalAmount.toLocaleString()}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="time" size={20} color={Colors.secondary500} />
                  <Text style={styles.sectionTitle}>Past ({pastBookings.length})</Text>
                </View>
                {pastBookings.map((booking) => (
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
                          <Text style={styles.cardTitle} numberOfLines={1}>{getServiceName(booking)}</Text>
                        </View>
                        <View style={[styles.typeChip, { backgroundColor: getTypeColor(booking) }]}>
                          <Text style={styles.typeChipText}>{getBookingType(booking)}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking) }]}>
                        <Text style={styles.statusText}>{getStatusLabel(booking)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.cardDivider} />
                    
                    <View style={styles.cardFooter}>
                      <View style={styles.dateInfo}>
                        <Text style={styles.dateLabel}>
                          {getServiceTypeDisplay(booking)}
                        </Text>
                      </View>
                      <View style={styles.priceInfo}>
                        <Text style={styles.priceLabel}>Total</Text>
                        <Text style={styles.priceAmount}>Rs. {booking.totalAmount.toLocaleString()}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
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
  header: {
    backgroundColor: Colors.primary800,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  
  // Section
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary700,
  },

  // Booking Card
  bookingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.secondary500,
    fontWeight: '500',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary700,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.secondary500,
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: Colors.primary600,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  exploreButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
