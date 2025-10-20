import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Modal } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { Colors } from '../../constants/Colors';
import { CustomButton } from '../../components/CustomButton';
import { CustomTextInput } from '../../components/CustomTextInput';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../../components/ThemedText';
import { TransportationApiService, Transportation } from '../../services/transportationApi';
import { BookingService, CreateTransportationBookingRequest } from '../../services/booking';
import { StorageService } from '../../services/storage';
import { Calendar } from 'react-native-calendars';

export default function VehicleDetailScreen() {
  const { title: id } = useLocalSearchParams(); // Now expecting ID instead of title
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // API data state
  const [transportation, setTransportation] = useState<Transportation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking state
  const [bookingData, setBookingData] = useState({
    startDate: new Date().toISOString().split('T')[0], // Default to today
    days: 1,
    passengers: 1,
    pickupLocation: '',
    dropoffLocation: '',
    estimatedDistance: 0,
    guestDetails: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      emergencyContact: ''
    }
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showStartDateCalendar, setShowStartDateCalendar] = useState(false);
  
  // Map transportation data to display format using actual database fields
  const details = transportation ? {
    image: transportation.images && transportation.images.length > 0 ? transportation.images[0] : 'https://via.placeholder.com/400x280/3b82f6/ffffff?text=Vehicle+Image',
    title: `${transportation.brand}${transportation.model ? ` ${transportation.model}` : ''}`,
    city: transportation.location || 'Location not specified',
    price: `LKR ${transportation.pricingPerKm}/km`,
    capacity: transportation.seats,
    ac: transportation.ac,
    type: transportation.vehicleType,
    year: transportation.year,
    fuel: transportation.fuelType,
    licensePlate: transportation.licensePlate,
    availability: transportation.availability,
    features: transportation.features || [],
    description: transportation.description || 'No description available',
    driver: {
      name: transportation.driverName || 'Driver information not available',
      phone: transportation.driverPhone || 'Contact not available',
      license: transportation.driverLicense || 'License not available',
      bio: transportation.driverName && transportation.driverPhone 
        ? `Professional driver: ${transportation.driverName}. Contact: ${transportation.driverPhone}`
        : 'Driver information will be provided upon booking confirmation.'
    },
    insurance: transportation.insuranceNumber || 'Insurance details available upon request'
  } : null;

  // Fetch transportation data
  const fetchTransportationDetails = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚗 Fetching transportation details for ID:', id);
      const response = await TransportationApiService.getTransportationById(id);
      
      if (response.success && response.data) {
        setTransportation(response.data);
        console.log('✅ Transportation details loaded:', `${response.data.brand} ${response.data.model}`);
      } else {
        throw new Error(response.message || 'Failed to fetch transportation details');
      }
    } catch (err: any) {
      console.error('❌ Error fetching transportation details:', err);
      setError(err.message || 'Failed to load transportation details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTransportationDetails();
  }, [fetchTransportationDetails]);


  // Booking functions
  const handleSelectStartDate = (dateString: string) => {
    setBookingData(prev => ({ ...prev, startDate: dateString }));
    setShowStartDateCalendar(false);
  };

  const calculateTotal = () => {
    if (!transportation || !bookingData.estimatedDistance) return 0;
    const distancePrice = (transportation.pricingPerKm || 0) * bookingData.estimatedDistance * bookingData.days;
    const serviceFee = 500; // LKR 500 service fee (matching web app)
    return distancePrice + serviceFee;
  };

  const handleBookTransport = async () => {
    if (!transportation) {
      console.error('Transportation data not available');
      return;
    }

    if (!bookingData.startDate || !bookingData.pickupLocation || 
        !bookingData.guestDetails.firstName || !bookingData.guestDetails.lastName || 
        !bookingData.guestDetails.email || !bookingData.guestDetails.phone) {
      console.error('Please fill in all required fields');
      return;
    }

    try {
      setBookingLoading(true);
      
      const userData = await StorageService.getUserData();
      if (!userData) {
        throw new Error('Please log in to make a booking');
      }

      const totalAmount = calculateTotal();

      const bookingPayload: CreateTransportationBookingRequest = {
        serviceType: 'transportation',
        serviceId: transportation._id,
        serviceName: `${transportation.brand} ${transportation.model}`,
        serviceProvider: transportation.userId || 'unknown',
        totalAmount: totalAmount,
        currency: 'LKR',
        bookingDetails: {
          startDate: bookingData.startDate,
          days: bookingData.days,
          passengers: bookingData.passengers,
          pickupLocation: bookingData.pickupLocation,
          dropoffLocation: bookingData.dropoffLocation,
          estimatedDistance: bookingData.estimatedDistance,
          pricingPerKm: transportation.pricingPerKm,
          vehicleType: transportation.vehicleType,
          departureTime: '09:00'
        },
        contactInfo: {
          email: bookingData.guestDetails.email,
          phone: bookingData.guestDetails.phone,
          firstName: bookingData.guestDetails.firstName,
          lastName: bookingData.guestDetails.lastName,
          emergencyContact: bookingData.guestDetails.emergencyContact
        },
        paymentDetails: {
          cardNumber: '4242424242424242', // Mock card number for testing
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: `${bookingData.guestDetails.firstName} ${bookingData.guestDetails.lastName}`
        }
      };

      console.log('🚗 Creating transportation booking:', bookingPayload);
      
      const response = await BookingService.createTransportationBooking(bookingPayload);
      
      if (response.success) {
        console.log('✅ Transportation booking created successfully');
        // You can add success handling here (e.g., show success message, navigate, etc.)
      } else {
        throw new Error(response.error || 'Failed to create booking');
      }
      
    } catch (error: any) {
      console.error('❌ Error creating transportation booking:', error);
      // You can add error handling here (e.g., show error message)
    } finally {
      setBookingLoading(false);
    }
  };

  const openBookingModal = () => {
    console.log('🔘 Book Now button pressed - opening modal (Transportation)');
    setShowBookingModal(true);
  };

  // Loading state
  if (loading) {
  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary600} />
          <ThemedText style={styles.loadingText}>Loading vehicle details...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.secondary400} style={styles.errorIcon} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <ThemedText style={styles.errorSubtext}>Please check again later</ThemedText>
          <CustomButton
            title="Retry"
            variant="primary"
            size="small"
            onPress={fetchTransportationDetails}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // No data state
  if (!loading && !error && !transportation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="car-outline" size={48} color={Colors.secondary400} style={styles.errorIcon} />
          <ThemedText style={styles.errorText}>Vehicle not found</ThemedText>
          <ThemedText style={styles.errorSubtext}>The vehicle you&apos;re looking for doesn&apos;t exist</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!details) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: details.image }} style={styles.headerImage} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary300} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoRow}>
          <View style={styles.nameTypeCol}>
            <ThemedText variant="title" style={styles.title}>{details.title}</ThemedText>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={Colors.primary600} />
              <ThemedText variant='caption' style={styles.city}>{details.city}</ThemedText>
            </View>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="car" size={16} color={Colors.primary600} />
            <ThemedText variant='caption' style={styles.rating}>{details.type}</ThemedText>
          </View>
        </View>

        <Text style={styles.price}>{details.price}</Text>

        <ThemedText variant="subtitle" style={styles.sectionHeading}>Description</ThemedText>
        <ThemedText variant='caption' style={styles.description}>{details.description}</ThemedText>

        <ThemedText variant="subtitle" style={styles.sectionHeading}>Vehicle Information</ThemedText>
        <View style={styles.vehicleInfoGrid}>
          <View style={styles.vehicleInfoItem}>
            <Ionicons name="car" size={16} color={Colors.primary600} />
            <ThemedText style={styles.vehicleInfoText}>Model: {details.title}</ThemedText>
          </View>
          <View style={styles.vehicleInfoItem}>
            <Ionicons name="people" size={16} color={Colors.primary600} />
            <ThemedText style={styles.vehicleInfoText}>Capacity: {details.capacity} passengers</ThemedText>
          </View>
          <View style={styles.vehicleInfoItem}>
            <Ionicons name="calendar" size={16} color={Colors.primary600} />
            <ThemedText style={styles.vehicleInfoText}>Year: {details.year}</ThemedText>
          </View>
          <View style={styles.vehicleInfoItem}>
            <Ionicons name="flash" size={16} color={Colors.primary600} />
            <ThemedText style={styles.vehicleInfoText}>Fuel: {details.fuel}</ThemedText>
          </View>
          <View style={styles.vehicleInfoItem}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.primary600} />
            <ThemedText style={styles.vehicleInfoText}>License: {details.licensePlate}</ThemedText>
          </View>
          <View style={styles.vehicleInfoItem}>
            <Ionicons name="snow" size={16} color={Colors.primary600} />
            <ThemedText style={styles.vehicleInfoText}>AC: {details.ac ? 'Yes' : 'No'}</ThemedText>
          </View>
        </View>

        {/* Features */}
        {details.features && details.features.length > 0 && (
          <>
            <ThemedText variant="subtitle" style={styles.sectionHeading}>Features</ThemedText>
            <View style={styles.amenitiesChipsContainer}>
              {details.features.map((feature, i) => (
                <View key={i} style={styles.amenityChip}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.primary600} />
                  <ThemedText variant='caption' style={styles.amenityChipText}>{feature}</ThemedText>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Driver Information */}
        <ThemedText variant="subtitle" style={styles.sectionHeading}>Driver Information</ThemedText>
        <View style={styles.driverCard}>
          <View style={styles.driverHeader}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={24} color={Colors.primary600} />
            </View>
            <View style={styles.driverBasicInfo}>
              <ThemedText style={styles.driverName}>{details.driver.name}</ThemedText>
              <ThemedText style={styles.driverTitle}>Professional Driver</ThemedText>
            </View>
          </View>
          
          {details.driver.name !== 'Driver information not available' ? (
            <>
              <View style={styles.driverDetails}>
                <View style={styles.driverDetailItem}>
                  <Ionicons name="call" size={16} color={Colors.primary600} />
                  <ThemedText style={styles.driverDetailText}>{details.driver.phone}</ThemedText>
                </View>
                <View style={styles.driverDetailItem}>
                  <Ionicons name="card" size={16} color={Colors.primary600} />
                  <ThemedText style={styles.driverDetailText}>License: {details.driver.license}</ThemedText>
                </View>
                <View style={styles.driverDetailItem}>
                  <Ionicons name="shield-checkmark" size={16} color={Colors.primary600} />
                  <ThemedText style={styles.driverDetailText}>Verified & Insured</ThemedText>
                </View>
              </View>
              
              <View style={styles.driverBio}>
                <ThemedText style={styles.driverBioText}>{details.driver.bio}</ThemedText>
              </View>
            </>
          ) : (
            <View style={styles.driverInfoUnavailable}>
              <Ionicons name="information-circle" size={20} color={Colors.secondary500} />
              <ThemedText style={styles.driverInfoUnavailableText}>
                Driver details will be provided upon booking confirmation. All our drivers are professionally licensed and insured.
              </ThemedText>
            </View>
          )}
        </View>

        <CustomButton
          title="Book Now"
          variant="primary"
          size="large"
          style={styles.bookButton}
          onPress={openBookingModal}
        />
      </ScrollView>

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <ThemedText variant="title" style={styles.modalTitle}>Book Vehicle</ThemedText>
              <ThemedText style={styles.modalSubtitle}>Complete your booking details</ThemedText>
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowBookingModal(false)}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Vehicle Summary */}
            <View style={styles.vehicleSummaryCard}>
              <Image source={{ uri: details.image }} style={styles.vehicleSummaryImage} />
              <View style={styles.vehicleSummaryInfo}>
                <ThemedText style={styles.vehicleSummaryTitle}>{details.title}</ThemedText>
                <ThemedText style={styles.vehicleSummaryDetails}>
                  {details.capacity} passengers • {details.type} • {details.ac ? 'AC' : 'Non-AC'}
                </ThemedText>
                <ThemedText style={styles.vehicleSummaryPrice}>{details.price}</ThemedText>
              </View>
            </View>

            {/* Trip Details Section */}
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Trip Details</ThemedText>
            </View>

            {/* Start Date Selection */}
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowStartDateCalendar(true)}
              activeOpacity={0.7}
            >
              <View style={styles.datePickerContent}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary600} />
                <View style={styles.datePickerTextContainer}>
                  <ThemedText style={styles.datePickerLabel}>Pickup Date</ThemedText>
                  <ThemedText style={styles.datePickerValue}>
                    {new Date(bookingData.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.secondary400} />
              </View>
            </TouchableOpacity>

            {/* Duration Selection */}
            <View style={styles.durationContainer}>
              <ThemedText style={styles.durationLabel}>Duration</ThemedText>
              <View style={styles.durationOptions}>
                {[1, 3, 7, 14].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.durationOption,
                      bookingData.days === days && styles.durationOptionSelected
                    ]}
                    onPress={() => setBookingData(prev => ({ ...prev, days }))}
                  >
                    <ThemedText style={[
                      styles.durationOptionText,
                      bookingData.days === days && styles.durationOptionTextSelected
                    ]}>
                      {days === 1 ? '1 day' : days === 7 ? '1 week' : days === 14 ? '2 weeks' : `${days} days`}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pickup Location */}
            <CustomTextInput
              label="Pickup Location"
              placeholder="Enter pickup address"
              value={bookingData.pickupLocation}
              onChangeText={(val) => setBookingData(prev => ({ ...prev, pickupLocation: val }))}
              leftIcon="location-outline"
              containerStyle={{ marginBottom: 12 }}
            />

            {/* Drop-off Location */}
            <CustomTextInput
              label="Drop-off Location (Optional)"
              placeholder="Enter drop-off address"
              value={bookingData.dropoffLocation}
              onChangeText={(val) => setBookingData(prev => ({ ...prev, dropoffLocation: val }))}
              leftIcon="location-outline"
              containerStyle={{ marginBottom: 12 }}
            />

            {/* Estimated Distance */}
            <CustomTextInput
              label="Estimated Distance (km)"
              placeholder="Enter estimated distance"
              value={bookingData.estimatedDistance.toString()}
              onChangeText={(val) => setBookingData(prev => ({ ...prev, estimatedDistance: parseInt(val) || 0 }))}
              leftIcon="speedometer-outline"
              containerStyle={{ marginBottom: 12 }}
              keyboardType="numeric"
            />
            <ThemedText style={styles.distanceHelper}>
              This helps calculate the total fare based on LKR {transportation?.pricingPerKm || 0}/km
            </ThemedText>

            {/* Passengers Selection */}
            <View style={styles.passengersContainer}>
              <ThemedText style={styles.passengersLabel}>Passengers</ThemedText>
              <View style={styles.passengersRow}>
                <TouchableOpacity
                  style={styles.passengerButton}
                  onPress={() => setBookingData(prev => ({ 
                    ...prev, 
                    passengers: Math.max(1, prev.passengers - 1) 
                  }))}
                >
                  <Ionicons name="remove" size={16} color={Colors.primary600} />
              </TouchableOpacity>
                <ThemedText style={styles.passengerValue}>{bookingData.passengers}</ThemedText>
                <TouchableOpacity
                  style={styles.passengerButton}
                  onPress={() => setBookingData(prev => ({ 
                    ...prev, 
                    passengers: Math.min(transportation?.seats || 10, prev.passengers + 1) 
                  }))}
                >
                  <Ionicons name="add" size={16} color={Colors.primary600} />
              </TouchableOpacity>
            </View>
              <ThemedText style={styles.passengerHelper}>
                Maximum {transportation?.seats || 10} passengers
              </ThemedText>
            </View>

            {/* Guest Details Section */}
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Guest Information</ThemedText>
            </View>

            {/* Guest Details */}
            <View style={styles.guestDetailsContainer}>
              <View style={styles.guestDetailsRow}>
                <CustomTextInput
                  label="First Name" 
                  value={bookingData.guestDetails.firstName} 
                  onChangeText={(val) => setBookingData(prev => ({ ...prev, guestDetails: { ...prev.guestDetails, firstName: val } }))} 
                  containerStyle={{ flex: 1, marginRight: 8 }} 
                />
                <CustomTextInput 
                  label="Last Name" 
                  value={bookingData.guestDetails.lastName} 
                  onChangeText={(val) => setBookingData(prev => ({ ...prev, guestDetails: { ...prev.guestDetails, lastName: val } }))} 
                  containerStyle={{ flex: 1, marginLeft: 8 }} 
                />
              </View>
              <CustomTextInput
                label="Email" 
                value={bookingData.guestDetails.email} 
                onChangeText={(val) => setBookingData(prev => ({ ...prev, guestDetails: { ...prev.guestDetails, email: val } }))} 
                keyboardType="email-address" 
                containerStyle={{ marginBottom: 12 }} 
              />
              <CustomTextInput 
                label="Phone Number" 
                value={bookingData.guestDetails.phone} 
                onChangeText={(val) => setBookingData(prev => ({ ...prev, guestDetails: { ...prev.guestDetails, phone: val } }))} 
                keyboardType="phone-pad" 
                containerStyle={{ marginBottom: 12 }} 
              />
              <CustomTextInput 
                label="Emergency Contact (Optional)" 
                value={bookingData.guestDetails.emergencyContact} 
                onChangeText={(val) => setBookingData(prev => ({ ...prev, guestDetails: { ...prev.guestDetails, emergencyContact: val } }))} 
                keyboardType="phone-pad" 
                containerStyle={{ marginBottom: 12 }} 
              />
            </View>

            {/* Price Breakdown Section */}
            {bookingData.estimatedDistance > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Price Breakdown</ThemedText>
                </View>
                <View style={styles.priceBreakdownContainer}>
                <View style={styles.priceBreakdownContent}>
                  <View style={styles.priceBreakdownItem}>
                    <ThemedText style={styles.priceBreakdownDescription}>
                      LKR {transportation?.pricingPerKm || 0}/km × {bookingData.estimatedDistance} km × {bookingData.days} day(s)
                    </ThemedText>
                    <ThemedText style={styles.priceBreakdownAmount}>
                      LKR {((transportation?.pricingPerKm || 0) * bookingData.estimatedDistance * bookingData.days).toLocaleString()}
                    </ThemedText>
                  </View>
                  <View style={styles.priceBreakdownItem}>
                    <ThemedText style={styles.priceBreakdownDescription}>Service fee</ThemedText>
                    <ThemedText style={styles.priceBreakdownAmount}>LKR 500</ThemedText>
                  </View>
                  <View style={[styles.priceBreakdownItem, styles.priceBreakdownTotal]}>
                    <ThemedText style={styles.priceBreakdownTotalText}>Total</ThemedText>
                    <ThemedText style={styles.priceBreakdownTotalAmount}>
                      LKR {calculateTotal().toLocaleString()}
                    </ThemedText>
                  </View>
                </View>
                </View>
              </>
            )}

            {/* Proceed to Payment Button */}
            <CustomButton
              title={bookingLoading ? "Processing..." : "Proceed to Payment"}
              variant="primary"
              size="large"
              style={styles.proceedButton}
              onPress={handleBookTransport}
              disabled={!bookingData.startDate || !bookingData.pickupLocation || 
                       !bookingData.guestDetails.firstName || !bookingData.guestDetails.lastName || 
                       !bookingData.guestDetails.email || !bookingData.guestDetails.phone || 
                       bookingLoading}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Start Date Calendar Modal */}
      <Modal
        visible={showStartDateCalendar}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStartDateCalendar(false)}
      >
        <View style={styles.calendarModalContainer}>
          <View style={styles.calendarModalHeader}>
            <ThemedText style={styles.calendarModalTitle}>Select Pickup Date</ThemedText>
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
                [bookingData.startDate]: {
                  selected: true,
                  selectedColor: Colors.primary600,
                  selectedTextColor: Colors.white,
                },
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  imageContainer: {
    position: 'relative',
    height: 280,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e2e8f0',
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 12,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollContent: {
    paddingBottom: 60,
    backgroundColor: '#f8fafc',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 24,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  nameTypeCol: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 34,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  city: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rating: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  price: {
    fontSize: 24,
    color: '#059669',
    fontWeight: '700',
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 32,
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  description: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginHorizontal: 24,
    marginBottom: 8,
  },
  amenitiesChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  amenityChipText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  vehicleInfoGrid: {
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  vehicleInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleInfoText: {
    fontSize: 16,
    color: Colors.secondary700,
  },
  driverCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  driverBasicInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  driverTitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  driverDetails: {
    marginBottom: 20,
  },
  driverDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  driverDetailText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  driverBio: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary600,
  },
  driverBioText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  driverInfoUnavailable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    gap: 12,
  },
  driverInfoUnavailableText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
    fontWeight: '500',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeaderLeft: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  closeButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalContent: {
    padding: 24,
    paddingBottom: 60,
  },
  
  // Vehicle Summary Styles
  vehicleSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  vehicleSummaryImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  vehicleSummaryInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  vehicleSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  vehicleSummaryDetails: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  vehicleSummaryPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  
  // Section Styles
  sectionHeader: {
    marginTop: 32,
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  bookButton: {
    marginHorizontal: 24,
    marginTop: 32,
    marginBottom: 40,
    borderRadius: 20,
    minHeight: 56,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.secondary600,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    minWidth: 120,
  },

  // Transportation Booking Form Styles
  datePickerButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  datePickerLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '500',
  },
  datePickerValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },

  // Duration Selection Styles
  durationContainer: {
    marginBottom: 20,
  },
  durationLabel: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 12,
    fontWeight: '600',
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  durationOption: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  durationOptionSelected: {
    borderColor: Colors.primary600,
    backgroundColor: Colors.primary600,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  durationOptionText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  durationOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // Distance Helper
  distanceHelper: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 4,
  },

  // Passengers Selection Styles
  passengersContainer: {
    marginBottom: 20,
  },
  passengersLabel: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 12,
    fontWeight: '600',
  },
  passengersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  passengerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary600,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  passengerValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    minWidth: 32,
    textAlign: 'center',
  },
  passengerHelper: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },

  // Price Breakdown Styles
  priceBreakdownContainer: {
    marginBottom: 20,
  },
  priceBreakdownContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  priceBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  priceBreakdownDescription: {
    fontSize: 15,
    color: '#64748b',
    flex: 1,
    fontWeight: '500',
  },
  priceBreakdownAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  priceBreakdownTotal: {
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
    marginTop: 12,
    paddingTop: 16,
  },
  priceBreakdownTotalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  priceBreakdownTotalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },

  // Calendar Modal Styles
  calendarModalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
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
    padding: 20,
  },
  calendar: {
    borderRadius: 10,
  },

  // Top Book Button Styles
  topBookButtonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  topBookButton: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
