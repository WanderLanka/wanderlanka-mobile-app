import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import vehicleIcon from '../../assets/images/car.png';
import guideIcon from '../../assets/images/guide.png';
import accomodationIcon from '../../assets/images/hotel.png';
import { CustomButton, ThemedText, TopBar } from '../../components';
import { Colors } from '../../constants/Colors';
import { BookingDataManager, ConfirmedBooking } from '../../utils/BookingDataManager';
import { clearAllStorage } from '../../utils/StorageUtils';

export default function BookNowScreen() {
  const insets = useSafeAreaInsets();
  const [upcomingBookings, setUpcomingBookings] = useState<ConfirmedBooking[]>([]);
  const [loading, setLoading] = useState(true);

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
      // Use BookingDataManager for automatic cleanup and filtering
      const bookings = await BookingDataManager.getUpcomingBookings();
      setUpcomingBookings(bookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setUpcomingBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Temporary function to clear all AsyncStorage data
  const handleClearAllStorage = async () => {
    try {
      console.log('🗑️ Clearing all AsyncStorage data...');
      await clearAllStorage();
      
      // Reload bookings to reflect the change
      setUpcomingBookings([]);
      await loadUpcomingBookings();
      
      console.log('✅ All AsyncStorage data cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing AsyncStorage:', error);
    }
  };

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
    return accomodationIcon; // default
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
      case 'upcoming':
        return Colors.success;
      case 'confirmed':
        return Colors.primary600;
      case 'completed':
        return Colors.secondary400;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.secondary400;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <StatusBar style="light" translucent />
      <TopBar
        onProfilePress={() => { /* handle profile/account */ }}
        onNotificationsPress={() => { /* handle notifications */ }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.greetingContainer}>
          <ThemedText variant="title" style={styles.greeting}>Book Now !</ThemedText>
          <ThemedText variant="caption" style={styles.caption}>You&#39;re just moments away from booking.</ThemedText>
          
          {/* Temporary Clear Storage Button */}
          <CustomButton
            title="🗑️ Clear All Data (Debug)"
            variant="outline"
            size="small"
            style={styles.debugButton}
            onPress={handleClearAllStorage}
          />
        </View>

        {/* Book Services Section */}
        <View style={styles.servicesSection}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>What do you want to book?</ThemedText>
          <View style={styles.buttonRow}>
            <View style={styles.buttonContainer}>
              <View style={styles.serviceButton}>
                <Image source={accomodationIcon} style={styles.buttonIcon} />
                <ThemedText style={styles.buttonText}>Accommodations</ThemedText>
                <CustomButton
                  title=""
                  variant="primary"
                  style={styles.invisibleButton}
                  onPress={() => router.push('/accomodation/acc_home')}
                />
              </View>
            </View>
            <View style={styles.buttonContainer}>
              <View style={styles.serviceButton}>
                <Image source={vehicleIcon} style={styles.buttonIcon} />
                <ThemedText style={styles.buttonText}>Transportation</ThemedText>
                <CustomButton
                  title=""
                  variant="primary"
                  style={styles.invisibleButton}
                  onPress={() => router.push('/transportation/tra_home')}
                />
              </View>
            </View>
            <View style={styles.buttonContainer}>
              <View style={styles.serviceButton}>
                <Image source={guideIcon} style={styles.buttonIcon} />
                <ThemedText style={styles.buttonText}>Tour Guides</ThemedText>
                <CustomButton
                  title=""
                  variant="primary"
                  style={styles.invisibleButton}
                  onPress={() => router.push('/tour_guides/gui_home')}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Section Separator */}
        <View style={styles.sectionSeparator} />

        {/* Upcoming Bookings Section */}
        <View style={styles.upcomingSection}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>Upcoming Bookings</ThemedText>
            <CustomButton
              title="See More"
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
                <View key={booking.id} style={styles.bookingItem}>
                  <View style={[styles.bookingDot, { 
                    backgroundColor: getStatusColor(booking)
                  }]} />
                  <View style={styles.bookingDetails}>
                    <ThemedText style={styles.bookingTitle}>{getServiceName(booking)}</ThemedText>
                    <ThemedText style={styles.bookingDate}>
                      {getServiceTypeDisplay(booking)} • {booking.status === 'upcoming' ? 'Confirmed' : booking.status}
                    </ThemedText>
                    <ThemedText style={styles.bookingPrice}>${booking.totalAmount}</ThemedText>
                  </View>
                  <View style={styles.bookingImage}>
                    <Image source={getServiceIcon(booking)} style={styles.bookingIcon} />
                  </View>
                </View>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 24,
    fontWeight: '400',
    color: Colors.white,
    zIndex: 2,
  },
  caption: {
    color: Colors.primary100,
    marginBottom: 20,
    zIndex: 2,
  },
  debugButton: {
    marginBottom: 16,
    borderColor: Colors.primary100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Services Section
  servicesSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
    paddingHorizontal: 0,
  },
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
    gap: 0,
  },
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