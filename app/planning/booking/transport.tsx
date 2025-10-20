import { router, useLocalSearchParams } from 'expo-router';
import {
    FlatList,
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
    Alert,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { ThemedText, CustomButton } from '../../../components';
import { Calendar } from 'react-native-calendars';

import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { Colors } from '../../../constants/Colors';
import { TransportationApiService, Transportation } from '../../../services/transportationApi';
import { BookingService, CreateTransportationBookingRequest } from '../../../services/booking';
import { StorageService } from '../../../services/storage';

interface Transport {
  id: string;
  type: 'car' | 'van' | 'bus' | 'bike' | 'tuk-tuk';
  name: string;
  provider: string;
  rating: number;
  reviewCount: number;
  pricePerDay: number;
  capacity: string;
  transmission: string;
  fuel: string;
  features: string[];
  image: string;
  description: string;
  availability: boolean;
}

interface TransportBookingScreenProps {
  filters?: {
    minPrice: string;
    maxPrice: string;
    location: string;
    minRating: number;
    propertyTypes: string[];
  };
}

export default function TransportBookingScreen({ filters }: TransportBookingScreenProps) {
  const params = useLocalSearchParams();
  const { destination, startDate, endDate, destinations, startPoint } = params;

  // State for real data
  const [transportation, setTransportation] = useState<Transportation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);
  
  // Date picker states
  const [showStartDateCalendar, setShowStartDateCalendar] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(startDate as string || new Date().toISOString().split('T')[0]);

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

  // Fetch transportation data
  const fetchTransportation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚗 Fetching transportation for booking...');
      const response = await TransportationApiService.getAllTransportation();
      
      if (response.success && response.data) {
        setTransportation(response.data);
        console.log('✅ Transportation loaded:', response.data.length);
      } else {
        throw new Error(response.message || 'Failed to fetch transportation');
      }
    } catch (err: any) {
      console.error('❌ Error fetching transportation:', err);
      setError(err.message || 'Failed to load transportation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransportation();
  }, []);

  // Date picker handler
  const handleSelectStartDate = (dateString: string) => {
    setSelectedStartDate(dateString);
    setShowStartDateCalendar(false);
  };

  // Booking functionality
  const handleBookTransport = async (transport: Transportation) => {
    try {
      setBookingLoading(transport._id);
      
      // Get user data for contact info
      const userData = await StorageService.getUserData();
      if (!userData) {
        throw new Error('Please log in to make a booking');
      }

      // Calculate total amount (simplified - using pricing per km * estimated distance)
      const estimatedDistance = 100; // Default distance, could be calculated based on pickup/dropoff
      const totalAmount = transport.pricingPerKm * estimatedDistance * tripDuration;

      const bookingPayload: CreateTransportationBookingRequest = {
        serviceType: 'transportation',
        serviceId: transport._id,
        serviceName: `${transport.brand} ${transport.model}`,
        serviceProvider: transport.userId || 'unknown',
        totalAmount: totalAmount,
        currency: 'LKR',
        bookingDetails: {
          startDate: selectedStartDate,
          days: tripDuration,
          passengers: 2, // Default passengers, could be made configurable
          pickupLocation: startPoint as string || 'Colombo',
          dropoffLocation: destination as string || 'Kandy',
          estimatedDistance: estimatedDistance,
          pricingPerKm: transport.pricingPerKm,
          vehicleType: transport.vehicleType,
          departureTime: '09:00' // Default departure time
        },
        contactInfo: {
          email: userData.email || '',
          phone: userData.phone || '',
          firstName: userData.firstName || userData.name || '',
          lastName: userData.lastName || '',
          emergencyContact: userData.phone || ''
        }
      };

      console.log('🚗 Creating transportation booking:', bookingPayload);
      
      // Create booking through API gateway to booking service
      const response = await BookingService.createTransportationBooking(bookingPayload);
      
      if (response.success) {
        Alert.alert(
          'Booking Successful!',
          `Your transportation booking for ${transport.brand} ${transport.model} has been confirmed.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back or to booking summary
                console.log('✅ Transportation booking created successfully');
              }
            }
          ]
        );
      } else {
        throw new Error(response.error || 'Failed to create booking');
      }
      
    } catch (error: any) {
      console.error('❌ Error creating transportation booking:', error);
      Alert.alert(
        'Booking Failed',
        error.message || 'Failed to create booking. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setBookingLoading(null);
    }
  };

  // Convert Transportation to Transport format for display
  const transports: Transport[] = transportation.map(transport => ({
    id: transport._id,
    type: transport.vehicleType as 'car' | 'van' | 'bus' | 'bike' | 'tuk-tuk',
    name: `${transport.brand} ${transport.model}`,
    provider: transport.driverName,
    rating: 4.5, // Default rating since not in API
    reviewCount: 0, // Default review count
    pricePerDay: transport.pricingPerKm * 50, // Estimate daily price
    capacity: `${transport.seats} passengers`,
    transmission: 'Automatic', // Default since not in API
    fuel: transport.fuelType,
    features: transport.features || [],
    image: transport.images && transport.images.length > 0 ? transport.images[0] : 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d',
    description: transport.description || `${transport.brand} ${transport.model} - ${transport.vehicleType}`,
    availability: transport.availability === 'available',
  }));

  const getTypeIcon = (type: Transport['type']) => {
    switch (type) {
      case 'car':
        return 'car-outline';
      case 'van':
        return 'car-outline';
      case 'bus':
        return 'bus-outline';
      case 'bike':
        return 'bicycle-outline';
      case 'tuk-tuk':
        return 'car-outline';
      default:
        return 'car-outline';
    }
  };

  const getTypeColor = (type: Transport['type']) => {
    switch (type) {
      case 'car':
        return Colors.primary600;
      case 'van':
        return Colors.success;
      case 'bus':
        return Colors.warning;
      case 'bike':
        return Colors.error;
      case 'tuk-tuk':
        return Colors.info;
      default:
        return Colors.secondary500;
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={14} color={Colors.warning} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color={Colors.warning} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={14} color={Colors.secondary200} />
      );
    }

    return stars;
  };

  const renderTransportCard = ({ item: transport }: { item: Transport }) => (
    <TouchableOpacity
      style={[styles.transportCard, !transport.availability && styles.unavailableCard]}
      onPress={() => {
        if (transport.availability) {
          router.push({
            pathname: '/planning/transport/[id]',
            params: {
              id: transport.id,
              destination,
              startDate,
              endDate,
              destinations,
              startPoint,
            },
          });
        }
      }}
      disabled={!transport.availability}
    >
      <View style={styles.transportHeader}>
        <View style={[styles.typeIcon, { backgroundColor: getTypeColor(transport.type) + '20' }]}>
          <Ionicons 
            name={getTypeIcon(transport.type) as any} 
            size={24} 
            color={getTypeColor(transport.type)} 
          />
        </View>
        <View style={styles.transportInfo}>
          <ThemedText style={styles.transportName}>{transport.name}</ThemedText>
          <ThemedText style={styles.providerName}>{transport.provider}</ThemedText>
        </View>
        {!transport.availability && (
          <View style={styles.unavailableOverlay}>
            <ThemedText style={styles.unavailableText}>Unavailable</ThemedText>
          </View>
        )}
      </View>

      <Image source={{ uri: transport.image }} style={styles.transportImage} />

      <View style={styles.transportDetails}>
        <View style={styles.detailsRow}>
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {renderStars(transport.rating)}
            </View>
            <ThemedText style={styles.rating}>{transport.rating}</ThemedText>
            <ThemedText style={styles.reviewCount}>({transport.reviewCount})</ThemedText>
          </View>
          <View style={styles.priceContainer}>
            <ThemedText style={styles.price}>${transport.pricePerDay}</ThemedText>
            <ThemedText style={styles.priceUnit}>/day</ThemedText>
            <ThemedText style={styles.totalPrice}>
              ${transport.pricePerDay * tripDuration} total
            </ThemedText>
          </View>
        </View>

        <ThemedText style={styles.description} numberOfLines={2}>
          {transport.description}
        </ThemedText>

        <View style={styles.specsContainer}>
          <View style={styles.specItem}>
            <Ionicons name="people-outline" size={16} color={Colors.secondary500} />
            <ThemedText style={styles.specText}>{transport.capacity}</ThemedText>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="settings-outline" size={16} color={Colors.secondary500} />
            <ThemedText style={styles.specText}>{transport.transmission}</ThemedText>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="speedometer-outline" size={16} color={Colors.secondary500} />
            <ThemedText style={styles.specText}>{transport.fuel}</ThemedText>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          {transport.features.slice(0, 3).map((feature, index) => (
            <View key={index} style={styles.featureTag}>
              <ThemedText style={styles.featureText}>{feature}</ThemedText>
            </View>
          ))}
          {transport.features.length > 3 && (
            <ThemedText style={styles.moreFeatures}>
              +{transport.features.length - 3} more
            </ThemedText>
          )}
        </View>

        {transport.availability && (
          <View style={styles.bookingContainer}>
            <CustomButton
              title={bookingLoading === transport.id ? "Booking..." : "Book Now"}
              variant="primary"
              size="small"
              onPress={() => {
                const originalTransport = transportation.find(t => t._id === transport.id);
                if (originalTransport) {
                  handleBookTransport(originalTransport);
                }
              }}
              disabled={bookingLoading === transport.id}
              style={styles.bookButton}
            />
            {bookingLoading === transport.id && (
              <ActivityIndicator size="small" color={Colors.primary600} style={styles.loadingIndicator} />
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary600} />
        <ThemedText style={styles.loadingText}>Loading transportation options...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <CustomButton
          title="Retry"
          variant="primary"
          size="small"
          onPress={fetchTransportation}
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Date Selection Section */}
      <View style={styles.dateSelectionContainer}>
        <TouchableOpacity 
          style={styles.dateSelectionCard}
          onPress={() => setShowStartDateCalendar(true)}
          activeOpacity={0.8}
        >
          <View style={styles.dateSelectionContent}>
            <View style={styles.calendarIconContainer}>
              <Ionicons name="calendar" size={20} color={Colors.white} />
            </View>
            <View style={styles.dateSelectionInfo}>
              <ThemedText style={styles.dateSelectionLabel}>Start Date</ThemedText>
              <ThemedText style={styles.dateSelectionDate}>
                {new Date(selectedStartDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </ThemedText>
            </View>
            <View style={styles.dateSelectionArrow}>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary600} />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={transports}
        renderItem={renderTransportCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <ThemedText style={styles.resultsCount}>
              {transports.filter(t => t.availability).length} vehicles available
            </ThemedText>
            <ThemedText style={styles.resultsSubtitle}>
              Choose your perfect ride for the journey
            </ThemedText>
          </View>
        }
      />

      {/* Start Date Calendar Modal */}
      <Modal
        visible={showStartDateCalendar}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStartDateCalendar(false)}
      >
        <View style={styles.calendarModalContainer}>
          <View style={styles.calendarModalHeader}>
            <ThemedText style={styles.calendarModalTitle}>Select Start Date</ThemedText>
            <TouchableOpacity onPress={() => setShowStartDateCalendar(false)}>
              <Ionicons name="close" size={24} color={Colors.secondary700} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.calendarContainer}>
            <Calendar
              style={styles.calendar}
              theme={{
                backgroundColor: Colors.white,
                calendarBackground: Colors.white,
                textSectionTitleColor: Colors.secondary700,
                selectedDayBackgroundColor: Colors.primary600,
                selectedDayTextColor: Colors.white,
                todayTextColor: Colors.primary600,
                dayTextColor: Colors.secondary700,
                textDisabledColor: Colors.secondary400,
                dotColor: Colors.primary600,
                selectedDotColor: Colors.white,
                arrowColor: Colors.primary600,
                disabledArrowColor: Colors.secondary400,
                monthTextColor: Colors.secondary700,
                indicatorColor: Colors.primary600,
                textDayFontWeight: '500',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              minDate={new Date().toISOString().split('T')[0]}
              onDayPress={(day) => {
                handleSelectStartDate(day.dateString);
              }}
              markedDates={{
                [selectedStartDate]: {
                  selected: true,
                  selectedColor: Colors.primary600,
                  selectedTextColor: Colors.white,
                },
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  listContent: {
    padding: 24,
    paddingTop: 20,
  },
  listHeader: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  resultsCount: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  transportCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.secondary100,
  },
  unavailableCard: {
    opacity: 0.7,
  },
  transportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    backgroundColor: Colors.secondary50,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transportInfo: {
    flex: 1,
  },
  transportName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 2,
  },
  providerName: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  unavailableOverlay: {
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unavailableText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  transportImage: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.secondary200,
  },
  transportDetails: {
    padding: 20,
    paddingTop: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  reviewCount: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary600,
  },
  priceUnit: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  totalPrice: {
    fontSize: 11,
    color: Colors.primary600,
    fontWeight: '600',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
    marginBottom: 12,
  },
  specsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 13,
    color: Colors.secondary600,
    fontWeight: '500',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  featureTag: {
    backgroundColor: Colors.primary100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featureText: {
    fontSize: 12,
    color: Colors.primary700,
    fontWeight: '500',
  },
  moreFeatures: {
    fontSize: 12,
    color: Colors.secondary500,
    fontStyle: 'italic',
  },
  bookingContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  bookButton: {
    minWidth: 120,
  },
  loadingIndicator: {
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondary50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.secondary600,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondary50,
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 20,
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 100,
  },
  dateSelectionContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  dateSelectionCard: {
    backgroundColor: Colors.primary600,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.primary700,
  },
  dateSelectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary700,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateSelectionInfo: {
    flex: 1,
  },
  dateSelectionLabel: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 2,
  },
  dateSelectionDate: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '600',
  },
  dateSelectionArrow: {
    marginLeft: 8,
  },
  calendarModalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  calendarModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  calendarContainer: {
    flex: 1,
    padding: 24,
  },
  calendar: {
    borderRadius: 10,
  },
});
