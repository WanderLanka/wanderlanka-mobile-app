import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomButton, CustomTextInput, ThemedText } from '../../../components';
import { Colors } from '../../../constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

// Mock transport data - in real app, this would come from API
const getTransportById = (id: string) => {
  const transports = [
    {
      id: '1',
      type: 'car' as const,
      name: 'Toyota Corolla',
      provider: 'Lanka Car Rentals',
      rating: 4.8,
      reviewCount: 156,
      pricePerDay: 45,
      capacity: '4 passengers',
      transmission: 'Automatic',
      fuel: 'Petrol',
      features: ['AC', 'GPS', 'Bluetooth', 'USB Charging'],
      image: 'https://images.unsplash.com/photo-1549924231-f129b911e442',
      description: 'Reliable and comfortable sedan perfect for city tours and short trips.',
      availability: true,
      images: [
        'https://images.unsplash.com/photo-1549924231-f129b911e442',
        'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7',
        'https://images.unsplash.com/photo-1563720223185-11003d516935'
      ],
    },
    {
      id: '2',
      type: 'van' as const,
      name: 'Toyota Hiace',
      provider: 'Island Tours',
      rating: 4.9,
      reviewCount: 203,
      pricePerDay: 75,
      capacity: '8 passengers',
      transmission: 'Manual',
      fuel: 'Diesel',
      features: ['AC', 'GPS', 'WiFi', 'Large Storage'],
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957',
      description: 'Spacious van ideal for group travel and long-distance journeys.',
      availability: true,
      images: [
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957',
        'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13',
        'https://images.unsplash.com/photo-1507136566006-cfc505b114fc'
      ],
    },
  ];

  return transports.find(transport => transport.id === id) || transports[0];
};

// Helper function to calculate number of days between two dates
const calculateDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 1;
};

// Helper function to format date for display
const formatDateDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function TransportDetailsScreen() {
  const params = useLocalSearchParams();
  const { id, destination, startDate, endDate, destinations, startPoint } = params;

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [pickupLocation, setPickupLocation] = useState(destination as string || '');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedDays, setSelectedDays] = useState(1);

  const transport = getTransportById(id as string);
  const totalDays = useMemo(() => {
    if (startDate && endDate) {
      return calculateDays(startDate as string, endDate as string);
    }
    return 1;
  }, [startDate, endDate]);

  const totalPrice = useMemo(() => {
    return transport.pricePerDay * selectedDays;
  }, [transport.pricePerDay, selectedDays]);

  const handleBookNow = () => {
    setSelectedDays(totalDays);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = () => {
    const booking = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: 'transport',
      transportName: transport.name,
      transportId: transport.id,
      provider: transport.provider,
      destination: destination as string,
      startDate: startDate as string,
      endDate: endDate as string,
      days: selectedDays,
      pricePerDay: transport.pricePerDay,
      totalPrice,
      pickupLocation,
      dropoffLocation,
      specialRequests,
      transportInfo: {
        type: transport.type,
        capacity: transport.capacity,
        transmission: transport.transmission,
        fuel: transport.fuel,
        features: transport.features,
        image: transport.image,
        rating: transport.rating,
      },
    };

    setShowBookingModal(false);

    // Show success alert like accommodation booking
    Alert.alert(
      'Booking Confirmed!', 
      `Your ${transport.name} rental has been successfully confirmed. Thank you for choosing us!`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to booking screen with the new booking data
            router.replace({
              pathname: '/planning/booking',
              params: {
                destination,
                startDate,
                endDate,
                destinations,
                startPoint,
                newBooking: JSON.stringify(booking),
                hideModal: 'true'
              },
            });
          }
        }
      ]
    );
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={16} color={Colors.warning} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={16} color={Colors.warning} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={16} color={Colors.secondary400} />
      );
    }

    return stars;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.secondary700} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Transport Details</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setSelectedImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {transport.images?.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.transportImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          
          {/* Image indicators */}
          <View style={styles.imageIndicators}>
            {transport.images?.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  selectedImageIndex === index && styles.activeIndicator
                ]}
              />
            ))}
          </View>
        </View>

        {/* Transport Info */}
        <View style={styles.transportInfo}>
          <View style={styles.transportHeader}>
            <View style={styles.transportTitleContainer}>
              <ThemedText style={styles.transportName}>{transport.name}</ThemedText>
              <ThemedText style={styles.provider}>{transport.provider}</ThemedText>
            </View>
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {renderStars(transport.rating)}
              </View>
              <ThemedText style={styles.rating}>{transport.rating}</ThemedText>
              <ThemedText style={styles.reviewCount}>({transport.reviewCount})</ThemedText>
            </View>
          </View>

          <ThemedText style={styles.description}>{transport.description}</ThemedText>

          {/* Transport Specifications */}
          <View style={styles.specsContainer}>
            <ThemedText style={styles.specsTitle}>Vehicle Specifications</ThemedText>
            <View style={styles.specsGrid}>
              <View style={styles.specItem}>
                <Ionicons name="people-outline" size={20} color={Colors.primary600} />
                <ThemedText style={styles.specLabel}>Capacity</ThemedText>
                <ThemedText style={styles.specValue}>{transport.capacity}</ThemedText>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="settings-outline" size={20} color={Colors.primary600} />
                <ThemedText style={styles.specLabel}>Transmission</ThemedText>
                <ThemedText style={styles.specValue}>{transport.transmission}</ThemedText>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="speedometer-outline" size={20} color={Colors.primary600} />
                <ThemedText style={styles.specLabel}>Fuel Type</ThemedText>
                <ThemedText style={styles.specValue}>{transport.fuel}</ThemedText>
              </View>
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <ThemedText style={styles.featuresTitle}>Included Features</ThemedText>
            <View style={styles.featuresList}>
              {transport.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <ThemedText style={styles.featureText}>{feature}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.pricingContainer}>
            <View style={styles.pricingHeader}>
              <ThemedText style={styles.pricingTitle}>Rental Details</ThemedText>
            </View>
            <View style={styles.pricingDetails}>
              <View style={styles.pricingRow}>
                <ThemedText style={styles.pricingLabel}>Daily Rate:</ThemedText>
                <ThemedText style={styles.pricingValue}>${transport.pricePerDay}</ThemedText>
              </View>
              <View style={styles.pricingRow}>
                <ThemedText style={styles.pricingLabel}>Duration:</ThemedText>
                <ThemedText style={styles.pricingValue}>{totalDays} {totalDays === 1 ? 'day' : 'days'}</ThemedText>
              </View>
              <View style={[styles.pricingRow, styles.totalRow]}>
                <ThemedText style={styles.totalLabel}>Total Cost:</ThemedText>
                <ThemedText style={styles.totalValue}>${transport.pricePerDay * totalDays}</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Book Now Button */}
      <View style={styles.bookingFooter}>
        <CustomButton
          title="Book Now"
          variant="primary"
          onPress={handleBookNow}
          style={styles.bookButton}
        />
      </View>

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Book Transport</ThemedText>
            <TouchableOpacity onPress={() => setShowBookingModal(false)}>
              <Ionicons name="close" size={24} color={Colors.secondary700} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Selected Transport Summary */}
            <View style={styles.selectedTransportSummary}>
              <Image source={{ uri: transport.image }} style={styles.summaryImage} />
              <View style={styles.summaryDetails}>
                <ThemedText style={styles.summaryName}>{transport.name}</ThemedText>
                <ThemedText style={styles.summaryProvider}>{transport.provider}</ThemedText>
                <View style={styles.summaryRating}>
                  <View style={styles.stars}>
                    {renderStars(transport.rating)}
                  </View>
                  <ThemedText style={styles.ratingText}>{transport.rating}</ThemedText>
                </View>
              </View>
              <View style={styles.summaryPrice}>
                <ThemedText style={styles.priceText}>${transport.pricePerDay}</ThemedText>
                <ThemedText style={styles.priceUnit}>/day</ThemedText>
              </View>
            </View>

            {/* Booking Details */}
            <View style={styles.bookingForm}>
              <ThemedText style={styles.formTitle}>Rental Details</ThemedText>

              <View style={styles.dateContainer}>
                <ThemedText style={styles.dateLabel}>Rental Period</ThemedText>
                <View style={styles.dateRow}>
                  <View style={styles.dateItem}>
                    <ThemedText style={styles.dateTitle}>Start Date</ThemedText>
                    <ThemedText style={styles.dateValue}>{formatDateDisplay(startDate as string)}</ThemedText>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color={Colors.secondary400} />
                  <View style={styles.dateItem}>
                    <ThemedText style={styles.dateTitle}>End Date</ThemedText>
                    <ThemedText style={styles.dateValue}>{formatDateDisplay(endDate as string)}</ThemedText>
                  </View>
                </View>
              </View>

              <View style={styles.daysSelector}>
                <ThemedText style={styles.daysLabel}>Number of Days</ThemedText>
                <View style={styles.daysControls}>
                  <TouchableOpacity 
                    style={styles.dayButton}
                    onPress={() => setSelectedDays(Math.max(1, selectedDays - 1))}
                  >
                    <Ionicons name="remove" size={20} color={Colors.primary600} />
                  </TouchableOpacity>
                  <ThemedText style={styles.daysText}>{selectedDays}</ThemedText>
                  <TouchableOpacity 
                    style={styles.dayButton}
                    onPress={() => setSelectedDays(Math.min(totalDays, selectedDays + 1))}
                  >
                    <Ionicons name="add" size={20} color={Colors.primary600} />
                  </TouchableOpacity>
                </View>
              </View>

              <CustomTextInput
                label="Pickup Location"
                placeholder="Enter pickup address"
                value={pickupLocation}
                onChangeText={setPickupLocation}
                containerStyle={styles.inputContainer}
              />

              <CustomTextInput
                label="Drop-off Location (Optional)"
                placeholder="Enter drop-off address"
                value={dropoffLocation}
                onChangeText={setDropoffLocation}
                containerStyle={styles.inputContainer}
              />

              <CustomTextInput
                label="Special Requirements (Optional)"
                placeholder="Any special requests or requirements"
                value={specialRequests}
                onChangeText={setSpecialRequests}
                multiline
                numberOfLines={3}
                containerStyle={styles.inputContainer}
              />
            </View>

            {/* Price Breakdown */}
            <View style={styles.priceBreakdown}>
              <ThemedText style={styles.breakdownTitle}>Price Breakdown</ThemedText>
              <View style={styles.breakdownRow}>
                <ThemedText style={styles.breakdownLabel}>Daily rate x {selectedDays} {selectedDays === 1 ? 'day' : 'days'}</ThemedText>
                <ThemedText style={styles.breakdownValue}>${totalPrice}</ThemedText>
              </View>
              <View style={[styles.breakdownRow, styles.totalBreakdownRow]}>
                <ThemedText style={styles.breakdownTotalLabel}>Total Amount</ThemedText>
                <ThemedText style={styles.breakdownTotalValue}>${totalPrice}</ThemedText>
              </View>
            </View>

            <View style={styles.modalActions}>
              <CustomButton
                title="Confirm Booking"
                variant="primary"
                onPress={() => handleConfirmBooking()}
                style={styles.confirmButton}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  transportImage: {
    width: screenWidth,
    height: 250,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white + '60',
  },
  activeIndicator: {
    backgroundColor: Colors.white,
  },
  transportInfo: {
    padding: 20,
  },
  transportHeader: {
    marginBottom: 16,
  },
  transportTitleContainer: {
    marginBottom: 8,
  },
  transportName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  provider: {
    fontSize: 16,
    color: Colors.secondary500,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  reviewCount: {
    fontSize: 16,
    color: Colors.secondary500,
  },
  description: {
    fontSize: 16,
    color: Colors.secondary600,
    lineHeight: 24,
    marginBottom: 24,
  },
  specsContainer: {
    marginBottom: 24,
  },
  specsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 16,
  },
  specsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  specItem: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  specLabel: {
    fontSize: 14,
    color: Colors.secondary600,
    fontWeight: '500',
  },
  specValue: {
    fontSize: 16,
    color: Colors.secondary700,
    fontWeight: '600',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: Colors.secondary700,
  },
  pricingContainer: {
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary300,
  },
  pricingHeader: {
    marginBottom: 12,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary800,
  },
  pricingDetails: {
    gap: 8,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricingLabel: {
    fontSize: 16,
    color: Colors.secondary600,
  },
  pricingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.primary300,
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary800,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary600,
  },
  bookingFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
    backgroundColor: Colors.white,
  },
  bookButton: {
    minHeight: 48,
  },
  // Modal styles
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  selectedTransportSummary: {
    flexDirection: 'row',
    backgroundColor: Colors.primary100,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary300,
  },
  summaryImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  summaryDetails: {
    flex: 1,
  },
  summaryName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  summaryProvider: {
    fontSize: 14,
    color: Colors.secondary500,
    marginBottom: 4,
  },
  summaryRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary600,
    marginLeft: 4,
  },
  summaryPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary600,
  },
  priceUnit: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  bookingForm: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 16,
  },
  dateContainer: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.secondary700,
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.secondary50,
    padding: 16,
    borderRadius: 8,
  },
  dateItem: {
    alignItems: 'center',
    flex: 1,
  },
  dateTitle: {
    fontSize: 14,
    color: Colors.secondary500,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  daysSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  daysLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.secondary700,
  },
  daysControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary300,
  },
  daysText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    minWidth: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  priceBreakdown: {
    backgroundColor: Colors.secondary50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 14,
    color: Colors.secondary600,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary700,
  },
  totalBreakdownRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
    marginTop: 8,
    paddingTop: 8,
  },
  breakdownTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  breakdownTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary600,
  },
  modalActions: {
    marginTop: 'auto',
  },
  confirmButton: {
    minHeight: 48,
  },
});
