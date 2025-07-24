import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CustomButton, ThemedText } from '../../components';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

// Mock data for upcoming trips
const UPCOMING_TRIPS = [
  {
    id: 'trip1',
    title: 'Kandy Cultural Heritage Tour',
    destination: 'Kandy, Central Province',
    startDate: '2024-08-15',
    endDate: '2024-08-18',
    daysUntil: 22,
    thumbnail: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400',
    status: 'confirmed',
    totalBudget: '$485',
    spentAmount: '$485',
    travelers: 2,
    itinerary: {
      days: 4,
      places: ['Temple of the Tooth', 'Royal Botanical Gardens', 'Kandy Lake', 'Cultural Show'],
      activities: 8,
    },
    bookings: {
      accommodation: { confirmed: true, name: 'Earl\'s Regency Hotel', checkIn: '2024-08-15', checkOut: '2024-08-18' },
      transport: { confirmed: true, type: 'Private Car', pickup: '2024-08-15 09:00' },
      guides: { confirmed: true, name: 'Saman Perera', contact: '+94 77 123 4567' },
    },
    weather: {
      condition: 'Partly Cloudy',
      temperature: '24°C - 28°C',
      precipitation: '20%',
    },
    documents: {
      eTickets: ['flight_boarding_pass.pdf', 'hotel_confirmation.pdf'],
      vouchers: ['transport_voucher.pdf', 'guide_booking.pdf'],
    },
    reminders: [
      { type: 'packing', message: 'Start packing checklist', dueDate: '2024-08-13' },
      { type: 'documents', message: 'Print travel documents', dueDate: '2024-08-14' },
    ],
  },
];

export default function UpcomingTripsScreen() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'details' | 'checklist'>('overview');

  const getDaysUntilTrip = (startDate: string) => {
    const today = new Date();
    const tripDate = new Date(startDate);
    const diffTime = tripDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return Colors.success;
      case 'pending': return Colors.warning;
      case 'cancelled': return Colors.error;
      default: return Colors.secondary500;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const handleTripPress = (trip: any) => {
    // Navigate to detailed trip view
    router.push({
      pathname: '/myTrips/trip-details' as any,
      params: { tripId: trip.id }
    });
  };

  const handleCancelTrip = (tripId: string) => {
    Alert.alert(
      'Cancel Trip',
      'Are you sure you want to cancel this trip? This may incur cancellation charges.',
      [
        { text: 'Keep Trip', style: 'cancel' },
        { 
          text: 'Cancel Trip', 
          style: 'destructive',
          onPress: () => {
            console.log('Cancelling trip:', tripId);
          }
        },
      ]
    );
  };

  const handleModifyTrip = (trip: any) => {
    Alert.alert(
      'Modify Trip',
      'What would you like to change about your trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Change Dates', 
          onPress: () => {
            router.push({
              pathname: '/planning/route-selection' as any,
              params: { 
                tripId: trip.id,
                mode: 'modify',
                action: 'dates'
              }
            });
          }
        },
        { 
          text: 'Edit Bookings', 
          onPress: () => {
            router.push({
              pathname: '/planning/booking' as any,
              params: { 
                tripId: trip.id,
                mode: 'modify'
              }
            });
          }
        },
      ]
    );
  };

  const renderTripCard = ({ item: trip }: { item: any }) => (
    <TouchableOpacity 
      style={styles.tripCard}
      onPress={() => handleTripPress(trip)}
      activeOpacity={0.7}
    >
      <View style={styles.tripImageContainer}>
        <Image 
          source={{ uri: trip.thumbnail }} 
          style={styles.tripImage}
          resizeMode="cover"
        />
        <View style={styles.tripImageOverlay}>
          <View style={styles.countdownContainer}>
            <ThemedText style={styles.countdownNumber}>{trip.daysUntil}</ThemedText>
            <ThemedText style={styles.countdownText}>days to go</ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
            <Ionicons name={getStatusIcon(trip.status) as any} size={12} color={Colors.white} />
            <ThemedText style={styles.statusText}>{trip.status}</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.tripContent}>
        <View style={styles.tripHeader}>
          <View style={styles.tripTitleContainer}>
            <ThemedText style={styles.tripTitle} numberOfLines={1}>
              {trip.title}
            </ThemedText>
            <ThemedText style={styles.tripDestination} numberOfLines={1}>
              {trip.destination}
            </ThemedText>
          </View>
          
          <TouchableOpacity 
            style={styles.tripOptionsButton}
            onPress={() => {
              Alert.alert(
                'Trip Options',
                'What would you like to do?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Modify Trip', onPress: () => handleModifyTrip(trip) },
                  { text: 'Cancel Trip', style: 'destructive', onPress: () => handleCancelTrip(trip.id) },
                ]
              );
            }}
          >
            <Ionicons name="ellipsis-vertical" size={16} color={Colors.secondary500} />
          </TouchableOpacity>
        </View>

        {/* Trip Dates */}
        <View style={styles.tripDates}>
          <Ionicons name="calendar" size={16} color={Colors.primary600} />
          <ThemedText style={styles.tripDatesText}>
            {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
          </ThemedText>
          <ThemedText style={styles.tripDuration}>
            ({trip.itinerary.days} days)
          </ThemedText>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Ionicons name="location" size={14} color={Colors.secondary500} />
            <ThemedText style={styles.statText}>{trip.itinerary.places.length} places</ThemedText>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="compass" size={14} color={Colors.secondary500} />
            <ThemedText style={styles.statText}>{trip.itinerary.activities} activities</ThemedText>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="people" size={14} color={Colors.secondary500} />
            <ThemedText style={styles.statText}>{trip.travelers} travelers</ThemedText>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="wallet" size={14} color={Colors.success} />
            <ThemedText style={styles.statText}>{trip.totalBudget}</ThemedText>
          </View>
        </View>

        {/* Booking Status */}
        <View style={styles.bookingStatus}>
          <ThemedText style={styles.bookingStatusTitle}>Booking Status</ThemedText>
          <View style={styles.bookingItems}>
            <View style={styles.bookingItem}>
              <Ionicons 
                name={trip.bookings.accommodation.confirmed ? "checkmark-circle" : "time"} 
                size={12} 
                color={trip.bookings.accommodation.confirmed ? Colors.success : Colors.warning} 
              />
              <ThemedText style={styles.bookingItemText}>Accommodation</ThemedText>
            </View>
            <View style={styles.bookingItem}>
              <Ionicons 
                name={trip.bookings.transport.confirmed ? "checkmark-circle" : "time"} 
                size={12} 
                color={trip.bookings.transport.confirmed ? Colors.success : Colors.warning} 
              />
              <ThemedText style={styles.bookingItemText}>Transport</ThemedText>
            </View>
            <View style={styles.bookingItem}>
              <Ionicons 
                name={trip.bookings.guides.confirmed ? "checkmark-circle" : "time"} 
                size={12} 
                color={trip.bookings.guides.confirmed ? Colors.success : Colors.warning} 
              />
              <ThemedText style={styles.bookingItemText}>Guide</ThemedText>
            </View>
          </View>
        </View>

        {/* Weather Preview */}
        <View style={styles.weatherPreview}>
          <View style={styles.weatherHeader}>
            <Ionicons name="partly-sunny" size={16} color={Colors.warning} />
            <ThemedText style={styles.weatherTitle}>Weather Forecast</ThemedText>
          </View>
          <ThemedText style={styles.weatherText}>
            {trip.weather.condition} • {trip.weather.temperature} • {trip.weather.precipitation} rain
          </ThemedText>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <CustomButton
            title="View Details"
            variant="outline"
            size="small"
            onPress={() => handleTripPress(trip)}
            style={styles.actionButton}
          />
          <CustomButton
            title="Start Checklist"
            variant="primary"
            size="small"
            onPress={() => {
              router.push({
                pathname: '/myTrips/checklist' as any,
                params: { tripId: trip.id }
              });
            }}
            style={styles.actionButton}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.secondary700} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.headerTitle}>Upcoming Trips</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {UPCOMING_TRIPS.length} trip{UPCOMING_TRIPS.length !== 1 ? 's' : ''} planned
          </ThemedText>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="notifications-outline" size={24} color={Colors.primary600} />
        </TouchableOpacity>
      </View>

      {/* Trips List */}
      <FlatList
        data={UPCOMING_TRIPS}
        renderItem={renderTripCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.tripsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="airplane-outline" size={64} color={Colors.secondary400} />
            <ThemedText style={styles.emptyStateTitle}>No Upcoming Trips</ThemedText>
            <ThemedText style={styles.emptyStateDescription}>
              Plan your next adventure and see your confirmed trips here
            </ThemedText>
            <CustomButton
              title="Plan New Trip"
              variant="primary"
              size="medium"
              onPress={() => router.push('/planning')}
              style={styles.emptyStateButton}
            />
          </View>
        }
      />

      {/* Quick Actions FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {
          Alert.alert(
            'Quick Actions',
            'What would you like to do?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Plan New Trip', onPress: () => router.push('/planning') },
              { text: 'Travel Checklist', onPress: () => router.push('/myTrips/checklist' as any) },
              { text: 'Travel Documents', onPress: () => router.push('/myTrips/documents' as any) },
            ]
          );
        }}
      >
        <Ionicons name="add" size={24} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: 2,
  },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Trips List
  tripsList: {
    padding: 20,
    gap: 20,
  },
  tripCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  tripImageContainer: {
    position: 'relative',
    height: 140,
  },
  tripImage: {
    width: '100%',
    height: '100%',
  },
  tripImageOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  countdownContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  countdownText: {
    fontSize: 10,
    color: Colors.white,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Trip Content
  tripContent: {
    padding: 20,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tripTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  tripDestination: {
    fontSize: 14,
    color: Colors.primary600,
    fontWeight: '500',
  },
  tripOptionsButton: {
    padding: 4,
  },
  
  // Trip Dates
  tripDates: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  tripDatesText: {
    fontSize: 14,
    color: Colors.secondary700,
    fontWeight: '500',
  },
  tripDuration: {
    fontSize: 14,
    color: Colors.secondary500,
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.secondary600,
    fontWeight: '500',
  },

  // Booking Status
  bookingStatus: {
    backgroundColor: Colors.secondary50,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  bookingStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 8,
  },
  bookingItems: {
    flexDirection: 'row',
    gap: 20,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingItemText: {
    fontSize: 12,
    color: Colors.secondary600,
    fontWeight: '500',
  },

  // Weather Preview
  weatherPreview: {
    backgroundColor: Colors.warning + '20',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  weatherTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  weatherText: {
    fontSize: 12,
    color: Colors.secondary600,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary600,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 32,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary600,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
