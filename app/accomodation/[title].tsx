import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Modal } from 'react-native';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Calendar } from 'react-native-calendars';

import { Colors } from '../../constants/Colors';
import { CustomButton } from '../../components/CustomButton';
import { CustomTextInput } from '../../components/CustomTextInput';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ThemedText';
import { UserReview } from '../../components/UserReview';
import { AccommodationMap } from '../../components/AccommodationMap';
import { AccommodationApiService, Accommodation } from '../../services/accommodationApi';
import { BookingService, CreateAccommodationBookingRequest } from '../../services/booking';
// import { StorageService } from '../../services/storage';


export default function AccomodationDetailsScreen() {
  const { title: id } = useLocalSearchParams(); // Now expecting ID instead of title
  const screenWidth = Dimensions.get('window').width;
  const [currentImage, setCurrentImage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // API data state
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Booking state (currently unused but kept for future booking functionality)
  // const [bookingLoading, setBookingLoading] = useState(false);
  // const [bookingError, setBookingError] = useState<string | null>(null);
  // const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  
  // Booking form state (matching web app structure)
  const [bookingData, setBookingData] = useState({
    checkInDate: '',
    checkOutDate: '',
    adults: 2,
    children: 0,
    selectedRooms: [], // Array of {type, quantity, pricePerNight} - matching web app
    guestDetails: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      emergencyContact: '',
    }
  });

  // Calendar state
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Calendar handlers
  const handleSelectCheckInDate = (dateString: string) => {
    setBookingData(prev => ({ ...prev, checkInDate: dateString }));
    setShowCheckInCalendar(false);
    
    // If check-in date is after check-out date, adjust check-out date
    if (bookingData.checkOutDate) {
      const checkIn = new Date(dateString);
      const checkOut = new Date(bookingData.checkOutDate);
      if (checkIn >= checkOut) {
        const newCheckOut = new Date(checkIn);
        newCheckOut.setDate(checkIn.getDate() + 1);
        setBookingData(prev => ({ ...prev, checkOutDate: newCheckOut.toISOString().split('T')[0] }));
      }
    }
  };

  const handleSelectCheckOutDate = (dateString: string) => {
    setBookingData(prev => ({ ...prev, checkOutDate: dateString }));
    setShowCheckOutCalendar(false);
  };

  // Room management functions (matching web app)
  const addRoomType = (roomType: any) => {
    setBookingData(prev => {
      const existingRoom = prev.selectedRooms.find((room: any) => room.type === roomType.type);
      if (existingRoom) {
        if (roomType.availableRooms <= existingRoom.quantity) return prev;
        return {
          ...prev,
          selectedRooms: prev.selectedRooms.map((room: any) =>
            room.type === roomType.type
              ? { ...room, quantity: room.quantity + 1 }
              : room
          )
        };
      } else {
        if ((roomType.availableRooms || 0) <= 0) return prev;
        return {
          ...prev,
          selectedRooms: [...prev.selectedRooms, { 
            type: roomType.type, 
            quantity: 1, 
            pricePerNight: roomType.pricePerNight 
          }]
        };
      }
    });
  };

  const removeRoomType = (roomType: any) => {
    setBookingData(prev => {
      const existingRoom = prev.selectedRooms.find((room: any) => room.type === roomType.type);
      if (existingRoom && existingRoom.quantity > 1) {
        return {
          ...prev,
          selectedRooms: prev.selectedRooms.map((room: any) =>
            room.type === roomType.type
              ? { ...room, quantity: room.quantity - 1 }
              : room
          )
        };
      } else {
        return {
          ...prev,
          selectedRooms: prev.selectedRooms.filter((room: any) => room.type !== roomType.type)
        };
      }
    });
  };

  const getTotalRooms = () => {
    return bookingData.selectedRooms.reduce((total: number, room: any) => total + room.quantity, 0);
  };
  
  // Map accommodation data to display format (matching web app structure)
  const details = accommodation ? {
    images: accommodation.images && accommodation.images.length > 0 ? accommodation.images : ['/placeholder-hotel.jpg'],
    title: accommodation.name,
    city: accommodation.location,
    rating: accommodation.rating,
    price: `$${accommodation.price}/night`,
    description: accommodation.description,
    amenities: accommodation.amenities,
    roomTypes: accommodation.roomTypes,
    checkInTime: accommodation.checkInTime,
    checkOutTime: accommodation.checkOutTime,
    phone: accommodation.phone,
    accommodationType: accommodation.accommodationType,
    totalRooms: accommodation.totalRooms,
    nearbyAttractions: accommodation.nearbyAttractions,
    policies: accommodation.policies,
    userReviews: accommodation.userReviews,
    reviews: accommodation.reviews,
    coordinates: accommodation.coordinates
  } : null;

  // Fetch accommodation data
  const fetchAccommodationDetails = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏨 Fetching accommodation details for ID:', id);
      const response = await AccommodationApiService.getAccommodationById(id);
      
      if (response.success && response.data) {
        setAccommodation(response.data);
        console.log('✅ Accommodation details loaded:', response.data.name);
      } else {
        throw new Error(response.message || 'Failed to fetch accommodation details');
      }
    } catch (err: any) {
      console.error('❌ Error fetching accommodation details:', err);
      setError(err.message || 'Failed to load accommodation details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAccommodationDetails();
  }, [fetchAccommodationDetails]);


  // Booking handler
  const handleConfirmBooking = async () => {
    if (!accommodation) return;
    
    // Validate booking data
    if (!bookingData.checkInDate || !bookingData.checkOutDate) {
      console.error('Please select check-in and check-out dates');
      return;
    }
    
    if (!bookingData.guestDetails.firstName || !bookingData.guestDetails.lastName || 
        !bookingData.guestDetails.email || !bookingData.guestDetails.phone) {
      console.error('Please fill in all guest details');
      return;
    }
    
    if (getTotalRooms() <= 0) {
      console.error('Please select at least one room');
      return;
    }

    try {
      setBookingLoading(true);
      
      // Calculate nights
      const checkIn = new Date(bookingData.checkInDate);
      const checkOut = new Date(bookingData.checkOutDate);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      if (nights <= 0) {
        console.error('Check-out date must be after check-in date');
        return;
      }
      
      // Calculate total amount based on selected rooms
      const totalAmount = bookingData.selectedRooms.reduce((total: number, room: any) => {
        return total + (room.pricePerNight * room.quantity * nights);
      }, 0) + 25; // Add service fee
      
      // Get user data for contact info (if needed for future use)
      // const userData = await StorageService.getUserData();
      
      const bookingPayload: CreateAccommodationBookingRequest = {
        serviceType: 'accommodation',
        serviceId: accommodation._id,
        serviceName: accommodation.name,
        serviceProvider: accommodation.userId || 'unknown',
        totalAmount: totalAmount,
        currency: 'USD',
        bookingDetails: {
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
          rooms: getTotalRooms(),
          adults: bookingData.adults,
          children: bookingData.children,
          nights: nights,
          roomBreakdown: bookingData.selectedRooms.map((room: any) => ({
            roomType: room.type,
            quantity: room.quantity,
            pricePerNight: room.pricePerNight
          }))
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
      
      console.log('🏨 Creating accommodation booking:', bookingPayload);
      
      // Create booking
      const response = await BookingService.createAccommodationBooking(bookingPayload);
      
      if (response.success) {
        console.log('✅ Accommodation booking created successfully');
        // You can add success handling here (e.g., show success message, navigate, etc.)
      } else {
        throw new Error(response.error || 'Failed to create booking');
      }
      
    } catch (error: any) {
      console.error('❌ Error creating accommodation booking:', error);
      // You can add error handling here (e.g., show error message)
    } finally {
      setBookingLoading(false);
    }
  };

interface ScrollEvent {
    nativeEvent: {
        contentOffset: {
            x: number;
        };
    };
}

const handleScroll = (event: ScrollEvent) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const idx = Math.round(offsetX / screenWidth);
    setCurrentImage(idx);
};

const openBookingModal = () => {
  console.log('🔘 Book Now button pressed - opening modal');
  setShowBookingModal(true);
};

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary600} />
          <ThemedText style={styles.loadingText}>Loading accommodation details...</ThemedText>
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
            onPress={fetchAccommodationDetails}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // No data state
  if (!loading && !error && !accommodation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="home-outline" size={48} color={Colors.secondary400} style={styles.errorIcon} />
          <ThemedText style={styles.errorText}>Accommodation not found</ThemedText>
          <ThemedText style={styles.errorSubtext}>The accommodation you&apos;re looking for doesn&apos;t exist</ThemedText>
          <CustomButton
            title="Go Back"
            variant="primary"
            size="small"
            onPress={() => router.back()}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageContainer}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imageScroll}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {details.images.map((img, idx) => (
            <Image
              key={idx}
              source={{ uri: img }}
              style={[styles.image, { width: screenWidth }]}
            />
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary300} />
        </TouchableOpacity>
        <View style={styles.imageMarkers}>
          {details.images.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.marker,
                currentImage === idx ? styles.markerActive : null,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.infoRow}>
          <View style={styles.nameAddressCol}>
            <ThemedText variant="title" style={styles.title}>{details.title}</ThemedText>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={Colors.primary600} />
              <ThemedText variant='caption' style={styles.city}>{details.city}</ThemedText>
            </View>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={Colors.warning || '#FFD700'} />
            <ThemedText  variant='caption' style={styles.rating}>{details.rating}</ThemedText>
          </View>
        </View>

        <Text style={styles.price}>{details.price}</Text>

        <ThemedText variant="subtitle" style={styles.sectionHeading}>Description</ThemedText>
        <ThemedText variant='caption' style={styles.description}>{details.description}</ThemedText>

        {/* Room Types Display */}
        {details.roomTypes && details.roomTypes.length > 0 && (
          <>
            <ThemedText variant="subtitle" style={styles.sectionHeading}>Available Room Types</ThemedText>
            <View style={styles.roomTypesDisplayContainer}>
              {details.roomTypes.map((room, i) => (
                <View key={i} style={styles.roomTypeDisplayCard}>
                  <View style={styles.roomTypeDisplayInfo}>
                    <ThemedText style={styles.roomTypeDisplayName}>
                      {room.type.charAt(0).toUpperCase() + room.type.slice(1)} Room
                    </ThemedText>
                    {room.size && (
                      <ThemedText style={styles.roomTypeDisplayDetails}>{room.size}</ThemedText>
                    )}
                    {room.occupancy && (
                      <ThemedText style={styles.roomTypeDisplayDetails}>Up to {room.occupancy} guests</ThemedText>
                    )}
                    <ThemedText style={styles.roomTypeDisplayAvailability}>
                      {room.availableRooms} of {room.totalRooms} available
                    </ThemedText>
                  </View>
                  <View style={styles.roomTypeDisplayPrice}>
                    <ThemedText style={styles.roomTypeDisplayPriceText}>${room.pricePerNight}/night</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

         <ThemedText variant="subtitle" style={styles.sectionHeading}>Amenities</ThemedText>
         <View style={styles.amenitiesChipsContainer}>
           {details.amenities.map((amenity, i) => (
             <View key={i} style={styles.amenityChip}>
               <Ionicons name="checkmark-circle" size={16} color={Colors.primary600} />
               <ThemedText variant='caption' style={styles.amenityChipText}>{amenity}</ThemedText>
             </View>
           ))}
         </View>

        {/* Nearby Attractions */}
        {details.nearbyAttractions && details.nearbyAttractions.length > 0 && (
          <>
            <ThemedText variant="subtitle" style={styles.sectionHeading}>Nearby Attractions</ThemedText>
            <View style={styles.attractionsContainer}>
              {details.nearbyAttractions.map((attraction, i) => (
                <View key={i} style={styles.attractionCard}>
                  <View style={styles.attractionInfo}>
                    <Ionicons name="location" size={16} color={Colors.primary600} />
                    <View style={styles.attractionDetails}>
                      <ThemedText style={styles.attractionName}>{attraction.name}</ThemedText>
                      {attraction.type && (
                        <ThemedText style={styles.attractionType}>{attraction.type}</ThemedText>
                      )}
                    </View>
                  </View>
                  {attraction.distance && (
                    <ThemedText style={styles.attractionDistance}>{attraction.distance}</ThemedText>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Policies */}
        {details.policies && details.policies.length > 0 && (
          <>
            <ThemedText variant="subtitle" style={styles.sectionHeading}>Policies</ThemedText>
            <View style={styles.policiesContainer}>
              {details.policies.map((policy, i) => (
                <View key={i} style={styles.policyItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.primary600} />
                  <ThemedText style={styles.policyText}>{policy}</ThemedText>
                </View>
              ))}
            </View>
          </>
        )}

         <ThemedText variant="subtitle" style={styles.sectionHeading}>Location</ThemedText>
         <AccommodationMap
           coordinates={accommodation?.coordinates}
           accommodationName={accommodation?.name}
           location={accommodation?.location}
         />
        <ThemedText variant="subtitle" style={styles.sectionHeading}>Reviews</ThemedText>
        <View style={styles.reviewsList}>
          <UserReview
            name="John Doe"
            rating={4.8}
            review="Amazing stay! Highly recommended."
            profileImage="https://randomuser.me/api/portraits/men/1.jpg"
          />
          <UserReview
            name="Jane Smith"
            rating={4.7}
            review="Beautiful location and friendly staff."
            profileImage="https://randomuser.me/api/portraits/women/2.jpg"
          />
          <TouchableOpacity style={styles.seeMoreBtn} onPress={() => router.push('/accomodation/reviews')}>
            <ThemedText variant='caption' style={styles.seeMoreText}>See more</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
      <View style={[styles.bottomBar, { zIndex: 1, elevation: 1 }]}>
        <CustomButton
          title="Book Now"
          variant="primary"
          size="large"
          style={styles.bookBtn}
          onPress={openBookingModal}
        />
      </View>
      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText variant="title" style={styles.modalTitle}>Booking Details</ThemedText>
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
          {/* Book Now Button at Top */}
          <View style={styles.topBookButtonContainer}>
            <CustomButton
              title={bookingLoading ? "Processing..." : "Confirm Booking"}
              variant="primary"
              size="large"
              style={styles.topBookButton}
              onPress={handleConfirmBooking}
              disabled={bookingLoading || !bookingData.checkInDate || !bookingData.checkOutDate || getTotalRooms() <= 0}
            />
          </View>
          
          <View style={styles.sheetBody}>
            <View style={styles.dateRow}>
              {/* Check-in Date Picker */}
              <TouchableOpacity 
                style={[styles.datePickerButton, { flex: 1, marginRight: 8 }]}
                onPress={() => setShowCheckInCalendar(true)}
                activeOpacity={0.7}
              >
                <View style={styles.datePickerContent}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.primary600} />
                  <View style={styles.datePickerTextContainer}>
                    <ThemedText style={styles.datePickerLabel}>Check-in Date</ThemedText>
                    <ThemedText style={styles.datePickerValue}>
                      {bookingData.checkInDate 
                        ? new Date(bookingData.checkInDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'Select date'
                      }
                    </ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.secondary400} />
                </View>
              </TouchableOpacity>

              {/* Check-out Date Picker */}
              <TouchableOpacity 
                style={[styles.datePickerButton, { flex: 1, marginLeft: 8 }]}
                onPress={() => setShowCheckOutCalendar(true)}
                activeOpacity={0.7}
              >
                <View style={styles.datePickerContent}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.primary600} />
                  <View style={styles.datePickerTextContainer}>
                    <ThemedText style={styles.datePickerLabel}>Check-out Date</ThemedText>
                    <ThemedText style={styles.datePickerValue}>
                      {bookingData.checkOutDate 
                        ? new Date(bookingData.checkOutDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'Select date'
                      }
                    </ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.secondary400} />
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.peopleRow}>
              <View style={styles.peopleCol}>
                <ThemedText style={styles.peopleLabel}>Adults</ThemedText>
                <View style={styles.counterRow}>
                  <TouchableOpacity 
                    style={styles.counterBtn}
                    onPress={() => setBookingData(prev => ({ 
                      ...prev, 
                      adults: Math.max(1, prev.adults - 1) 
                    }))}
                  >
                    <Ionicons name="remove-circle-outline" size={28} color={Colors.primary600} />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{bookingData.adults}</Text>
                  <TouchableOpacity 
                    style={styles.counterBtn}
                    onPress={() => setBookingData(prev => ({ 
                      ...prev, 
                      adults: Math.min(10, prev.adults + 1) 
                    }))}
                  >
                    <Ionicons name="add-circle-outline" size={28} color={Colors.primary600} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.peopleCol}>
                <ThemedText style={styles.peopleLabel}>Children</ThemedText>
                <View style={styles.counterRow}>
                  <TouchableOpacity 
                    style={styles.counterBtn}
                    onPress={() => setBookingData(prev => ({ 
                      ...prev, 
                      children: Math.max(0, prev.children - 1) 
                    }))}
                  >
                    <Ionicons name="remove-circle-outline" size={28} color={Colors.primary600} />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{bookingData.children}</Text>
                  <TouchableOpacity 
                    style={styles.counterBtn}
                    onPress={() => setBookingData(prev => ({ 
                      ...prev, 
                      children: Math.min(10, prev.children + 1) 
                    }))}
                  >
                    <Ionicons name="add-circle-outline" size={28} color={Colors.primary600} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Room Type Selection with Quantity (matching web app) */}
            {details.roomTypes && details.roomTypes.length > 0 && (
              <View style={styles.roomTypeSelectionContainer}>
                <ThemedText style={styles.roomTypeSelectionLabel}>Select Room Types</ThemedText>
                <View style={styles.roomTypeOptions}>
                  {details.roomTypes.map((room, index) => {
                    const selectedRoom = bookingData.selectedRooms.find((r: any) => r.type === room.type);
                    const selectedQuantity = selectedRoom?.quantity || 0;
                    
                    return (
                      <View key={index} style={styles.roomTypeCard}>
                        <View style={styles.roomTypeInfo}>
                          <ThemedText style={styles.roomTypeName}>
                            {room.type.charAt(0).toUpperCase() + room.type.slice(1)} Room
                          </ThemedText>
                          {room.size && (
                            <ThemedText style={styles.roomTypeDetails}>{room.size}</ThemedText>
                          )}
                          {room.occupancy && (
                            <ThemedText style={styles.roomTypeDetails}>Up to {room.occupancy} guests</ThemedText>
                          )}
                          <ThemedText style={styles.roomAvailability}>
                            {room.availableRooms} of {room.totalRooms} available
                          </ThemedText>
                        </View>
                        <View style={styles.roomTypePrice}>
                          <ThemedText style={styles.roomPrice}>${room.pricePerNight}/night</ThemedText>
                        </View>
                        
                        {/* Quantity Selection */}
                        <View style={styles.quantitySelection}>
                          <TouchableOpacity
                            style={[
                              styles.quantityButton,
                              selectedQuantity === 0 && styles.quantityButtonDisabled
                            ]}
                            onPress={() => removeRoomType(room)}
                            disabled={selectedQuantity === 0}
                          >
                            <Ionicons 
                              name="remove" 
                              size={16} 
                              color={selectedQuantity === 0 ? Colors.secondary400 : Colors.primary600} 
                            />
                          </TouchableOpacity>
                          <ThemedText style={styles.quantityValue}>{selectedQuantity}</ThemedText>
                          <TouchableOpacity
                            style={[
                              styles.quantityButton,
                              room.availableRooms <= selectedQuantity && styles.quantityButtonDisabled
                            ]}
                            onPress={() => addRoomType(room)}
                            disabled={room.availableRooms <= selectedQuantity}
                          >
                            <Ionicons 
                              name="add" 
                              size={16} 
                              color={room.availableRooms <= selectedQuantity ? Colors.secondary400 : Colors.primary600} 
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
                
                {/* Total Rooms Summary */}
                {getTotalRooms() > 0 && (
                  <View style={styles.totalRoomsSummary}>
                    <ThemedText style={styles.totalRoomsText}>
                      Total Rooms Selected: {getTotalRooms()}
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Guest Details */}
            <View style={styles.guestDetailsContainer}>
              <ThemedText style={styles.guestDetailsTitle}>Guest Information</ThemedText>
              
              <View style={styles.guestDetailsRow}>
                <CustomTextInput
                  label="First Name"
                  placeholder="Enter first name"
                  value={bookingData.guestDetails.firstName}
                  onChangeText={(val) => setBookingData(prev => ({ 
                    ...prev, 
                    guestDetails: { ...prev.guestDetails, firstName: val }
                  }))}
                  containerStyle={{ flex: 1, marginRight: 8 }}
                />
                <CustomTextInput
                  label="Last Name"
                  placeholder="Enter last name"
                  value={bookingData.guestDetails.lastName}
                  onChangeText={(val) => setBookingData(prev => ({ 
                    ...prev, 
                    guestDetails: { ...prev.guestDetails, lastName: val }
                  }))}
                  containerStyle={{ flex: 1, marginLeft: 8 }}
                />
              </View>
              
              <CustomTextInput
                label="Email"
                placeholder="Enter email address"
                value={bookingData.guestDetails.email}
                onChangeText={(val) => setBookingData(prev => ({ 
                  ...prev, 
                  guestDetails: { ...prev.guestDetails, email: val }
                }))}
                keyboardType="email-address"
                containerStyle={{ marginBottom: 12 }}
              />
              
              <CustomTextInput
                label="Phone Number"
                placeholder="Enter phone number"
                value={bookingData.guestDetails.phone}
                onChangeText={(val) => setBookingData(prev => ({ 
                  ...prev, 
                  guestDetails: { ...prev.guestDetails, phone: val }
                }))}
                keyboardType="phone-pad"
                containerStyle={{ marginBottom: 12 }}
              />
              
              <CustomTextInput
                label="Emergency Contact (Optional)"
                placeholder="Enter emergency contact"
                value={bookingData.guestDetails.emergencyContact}
                onChangeText={(val) => setBookingData(prev => ({ 
                  ...prev, 
                  guestDetails: { ...prev.guestDetails, emergencyContact: val }
                }))}
                keyboardType="phone-pad"
                containerStyle={{ marginBottom: 12 }}
              />
            </View>

            {/* Price Breakdown */}
            {bookingData.checkInDate && bookingData.checkOutDate && getTotalRooms() > 0 && (
              <View style={styles.priceBreakdownContainer}>
                <ThemedText style={styles.priceBreakdownTitle}>Price Breakdown</ThemedText>
                <View style={styles.priceBreakdownContent}>
                  {bookingData.selectedRooms.map((room: any, index: number) => {
                    const nights = Math.ceil((new Date(bookingData.checkOutDate).getTime() - new Date(bookingData.checkInDate).getTime()) / (1000 * 60 * 60 * 24));
                    const roomTotal = room.pricePerNight * room.quantity * nights;
                    
                    return (
                      <View key={index} style={styles.priceBreakdownItem}>
                        <ThemedText style={styles.priceBreakdownDescription}>
                          {room.quantity} {room.type} room(s) × {nights} nights
                        </ThemedText>
                        <ThemedText style={styles.priceBreakdownAmount}>
                          ${roomTotal}
                        </ThemedText>
                      </View>
                    );
                  })}
                  
                  <View style={styles.priceBreakdownItem}>
                    <ThemedText style={styles.priceBreakdownDescription}>Subtotal</ThemedText>
                    <ThemedText style={styles.priceBreakdownAmount}>
                      ${bookingData.selectedRooms.reduce((total: number, room: any) => {
                        const nights = Math.ceil((new Date(bookingData.checkOutDate).getTime() - new Date(bookingData.checkInDate).getTime()) / (1000 * 60 * 60 * 24));
                        return total + (room.pricePerNight * room.quantity * nights);
                      }, 0)}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.priceBreakdownItem}>
                    <ThemedText style={styles.priceBreakdownDescription}>Service fee</ThemedText>
                    <ThemedText style={styles.priceBreakdownAmount}>$25</ThemedText>
                  </View>
                  
                  <View style={[styles.priceBreakdownItem, styles.priceBreakdownTotal]}>
                    <ThemedText style={styles.priceBreakdownTotalText}>Total</ThemedText>
                    <ThemedText style={styles.priceBreakdownTotalAmount}>
                      ${bookingData.selectedRooms.reduce((total: number, room: any) => {
                        const nights = Math.ceil((new Date(bookingData.checkOutDate).getTime() - new Date(bookingData.checkInDate).getTime()) / (1000 * 60 * 60 * 24));
                        return total + (room.pricePerNight * room.quantity * nights);
                      }, 0) + 25}
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}
          </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Check-in Date Calendar Modal */}
      <Modal
        visible={showCheckInCalendar}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCheckInCalendar(false)}
      >
        <View style={styles.calendarModalContainer}>
          <View style={styles.calendarModalHeader}>
            <ThemedText style={styles.calendarModalTitle}>Select Check-in Date</ThemedText>
            <TouchableOpacity onPress={() => setShowCheckInCalendar(false)}>
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
                handleSelectCheckInDate(day.dateString);
              }}
              markedDates={{
                [bookingData.checkInDate]: {
                  selected: true,
                  selectedColor: Colors.primary600,
                  selectedTextColor: Colors.white,
                },
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Check-out Date Calendar Modal */}
      <Modal
        visible={showCheckOutCalendar}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCheckOutCalendar(false)}
      >
        <View style={styles.calendarModalContainer}>
          <View style={styles.calendarModalHeader}>
            <ThemedText style={styles.calendarModalTitle}>Select Check-out Date</ThemedText>
            <TouchableOpacity onPress={() => setShowCheckOutCalendar(false)}>
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
              minDate={bookingData.checkInDate || new Date().toISOString().split('T')[0]}
              onDayPress={(day) => {
                handleSelectCheckOutDate(day.dateString);
              }}
              markedDates={{
                [bookingData.checkOutDate]: {
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
    backgroundColor: Colors.secondary50,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 260,
    overflow: 'hidden',
  },
  imageScroll: {
    width: '100%',
    height: 260,
  },
  image: {
    height: 260,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    resizeMode: 'cover',
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: Colors.primary700,
    borderRadius: 20,
    padding: 6,
    zIndex: 2,
  },
  imageMarkers: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  marker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary200,
    marginHorizontal: 4,
    opacity: 0.7,
  },
  markerActive: {
    backgroundColor: Colors.primary500,
    opacity: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    backgroundColor: Colors.secondary50,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 6,
  },
  nameAddressCol: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary800,
    marginBottom: 6,
    textAlign: 'left',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  city: {
    fontSize: 15,
    color: Colors.primary700,
    marginLeft: 2,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 12,
  },
  rating: {
    fontSize: 15,
    color: Colors.primary700,
    marginLeft: 2,
    fontWeight: '500',
  },
  price: {
    fontSize: 22,
    color: Colors.primary600,
    fontWeight: '700',
    marginBottom: 18,
    textAlign: 'left',
    marginHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.primary800,
    marginTop: 14,
    marginBottom: 8,
    alignSelf: 'flex-start',
    marginLeft: 16,
  },
  description: {
    fontSize: 15,
    color: Colors.primary700,
    marginBottom: 10,
    marginHorizontal: 16,
    textAlign: 'left',
  },
   amenitiesChipsContainer: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     paddingHorizontal: 16,
     marginBottom: 24,
     gap: 8,
   },
   amenityChip: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: Colors.primary50,
     paddingHorizontal: 12,
     paddingVertical: 8,
     borderRadius: 20,
     borderWidth: 1,
     borderColor: Colors.primary200,
     marginBottom: 8,
   },
  amenityChipText: {
    fontSize: 14,
    color: Colors.primary700,
    marginLeft: 6,
    fontWeight: '500',
  },

  // Room Types Display Styles (for main content)
  roomTypesDisplayContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  roomTypeDisplayCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    marginBottom: 12,
  },
  roomTypeDisplayInfo: {
    flex: 1,
  },
  roomTypeDisplayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary800,
    marginBottom: 4,
  },
  roomTypeDisplayDetails: {
    fontSize: 14,
    color: Colors.secondary600,
    marginBottom: 2,
  },
  roomTypeDisplayAvailability: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  roomTypeDisplayPrice: {
    alignItems: 'flex-end',
  },
  roomTypeDisplayPriceText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
  },
  guestDetailsContainer: {
    marginBottom: 20,
  },
  guestDetailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  guestDetailsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Room Types Styles (for booking form)
  roomTypesContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  roomTypeCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    marginBottom: 12,
  },
  roomTypeInfo: {
    marginBottom: 12,
  },
  roomTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary800,
    marginBottom: 4,
  },
  roomTypeDetails: {
    fontSize: 14,
    color: Colors.secondary600,
    marginBottom: 2,
  },
  roomAvailability: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  roomTypePrice: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
  },

  // Quantity Selection Styles
  quantitySelection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary600,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    borderColor: Colors.secondary400,
    backgroundColor: Colors.secondary100,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary800,
    minWidth: 24,
    textAlign: 'center',
  },
  totalRoomsSummary: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.primary50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary200,
  },
  totalRoomsText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary700,
    textAlign: 'center',
  },

  // Price Breakdown Styles
  priceBreakdownContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  priceBreakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary800,
    marginBottom: 12,
  },
  priceBreakdownContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },
  priceBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceBreakdownDescription: {
    fontSize: 14,
    color: Colors.secondary600,
    flex: 1,
  },
  priceBreakdownAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary800,
  },
  priceBreakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
    marginTop: 8,
    paddingTop: 12,
  },
  priceBreakdownTotalText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary800,
  },
  priceBreakdownTotalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
  },

  // Nearby Attractions Styles
  attractionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  attractionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.secondary50,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  attractionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attractionDetails: {
    marginLeft: 12,
    flex: 1,
  },
  attractionName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary800,
    marginBottom: 2,
  },
  attractionType: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  attractionDistance: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.secondary600,
  },

  // Policies Styles
  policiesContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  policyText: {
    fontSize: 14,
    color: Colors.secondary700,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },

  // Room Type Selection Styles
  roomTypeSelectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  roomTypeSelectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary800,
    marginBottom: 12,
  },
  roomTypeOptions: {
    gap: 8,
  },

  reviewsList: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  reviewItem: {
    marginBottom: 10,
  },
  reviewUser: {
    fontWeight: '600',
    color: Colors.primary800,
    fontSize: 15,
  },
  reviewText: {
    color: Colors.primary700,
    fontSize: 14,
  },
  seeMoreBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  seeMoreText: {
    color: Colors.primary600,
    fontWeight: '600',
    fontSize: 15,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.secondary50,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
    zIndex: 10,
  },
  bookBtn: {
    width: '100%',
    borderRadius: 16,
  },
  sheetContent: {
    alignItems: 'stretch',
    minHeight: 500,
    alignSelf: 'center',
    borderRadius: 18,
    marginTop: 10,
    marginBottom: 24,
    width: '95%',
    backgroundColor: Colors.secondary50,
    overflow: 'hidden',
    position: 'relative',
    paddingBottom: 20,
  },
  sheetTitle: {
    width: '100%',
    backgroundColor: Colors.primary800,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  sheetTitleText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 0,
    alignSelf: 'center',
  },
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
  sheetBody: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    backgroundColor: Colors.secondary50,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    alignItems: 'stretch',
    gap: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    gap: 12,
  },
  peopleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
    gap: 24,
  },
  peopleCol: {
    flex: 1,
    alignItems: 'center',
  },
  peopleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary800,
    marginBottom: 8,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterBtn: {
    padding: 4,
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary800,
    marginHorizontal: 8,
  },
  
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.secondary600,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
  datePickerButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    padding: 16,
    marginBottom: 16,
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  datePickerLabel: {
    fontSize: 14,
    color: Colors.secondary600,
    marginBottom: 4,
  },
  datePickerValue: {
    fontSize: 16,
    color: Colors.primary800,
    fontWeight: '500',
  },
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
});
