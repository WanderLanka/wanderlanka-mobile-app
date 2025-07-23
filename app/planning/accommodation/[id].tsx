import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomButton } from '../../../components';
import { ThemedText } from '../../../components/ThemedText';
import { Colors } from '../../../constants/Colors';
import { useBooking } from '../../../context/BookingContext';

const { width: screenWidth } = Dimensions.get('window');

// Mock hotel data - in real app, this would come from API
const getHotelById = (id: string) => {
  const hotels = [
    {
      id: '1',
      name: 'Galle Heritage Villa',
      rating: 4.8,
      reviewCount: 142,
      pricePerNight: 85,
      location: 'Galle Fort',
      distance: '0.2 km from Galle Fort',
      coordinates: { latitude: 6.0329, longitude: 80.2168 },
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
      ],
      amenities: ['Free WiFi', 'Pool', 'Breakfast', 'AC', 'Spa', 'Restaurant', 'Parking'],
      description: 'Charming heritage villa in the heart of Galle Fort with stunning ocean views. This beautifully restored colonial property offers an authentic Sri Lankan experience with modern comforts.',
      fullDescription: 'Experience the magic of Galle Fort at this beautifully restored heritage villa. Built in the Dutch colonial era, this property seamlessly blends historical charm with modern luxury. Each room is uniquely decorated with antique furniture and traditional Sri Lankan artwork.\\n\\nThe villa features a stunning infinity pool overlooking the Indian Ocean, a world-class spa offering traditional Ayurvedic treatments, and a restaurant serving both local and international cuisine prepared by our award-winning chef.\\n\\nLocation is everything - you are just steps away from the iconic Galle Fort walls, historic lighthouse, and vibrant local markets. The property also offers guided tours of the fort and surrounding areas.',
      availability: true,
      checkInTime: '3:00 PM',
      checkOutTime: '11:00 AM',
      policies: [
        'Free cancellation up to 24 hours before check-in',
        'No smoking in rooms',
        'Pets not allowed',
        'Valid ID required at check-in',
      ],
      contactInfo: {
        phone: '+94 91 224 3751',
        email: 'info@galleheritage.lk',
        website: 'www.galleheritage.lk',
      },
    },
    {
      id: '2',
      name: 'Kandy Hills Resort',
      rating: 4.6,
      reviewCount: 89,
      pricePerNight: 120,
      location: 'Kandy',
      distance: '1.5 km from Temple of Tooth',
      coordinates: { latitude: 7.2906, longitude: 80.6337 },
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
      ],
      amenities: ['Mountain View', 'Spa', 'Restaurant', 'Free WiFi', 'Gym', 'Pool'],
      description: 'Luxury resort with panoramic views of Kandy hills and the sacred temple.',
      fullDescription: 'Nestled in the lush hills overlooking the sacred city of Kandy, this luxury resort offers breathtaking panoramic views and world-class amenities. Each suite features private balconies with mountain views and traditional Sri Lankan decor.\\n\\nThe resort specializes in wellness tourism, offering a full-service spa with traditional Ayurvedic treatments, yoga sessions, and meditation classes. Our restaurant serves organic cuisine sourced from our own herb garden.',
      availability: true,
      checkInTime: '2:00 PM',
      checkOutTime: '12:00 PM',
      policies: [
        'Free cancellation up to 48 hours before check-in',
        'No smoking throughout the property',
        'Children welcome',
        'Spa reservations recommended',
      ],
      contactInfo: {
        phone: '+94 81 223 4567',
        email: 'reservations@kandyhills.lk',
        website: 'www.kandyhillsresort.lk',
      },
    },
    // Add more hotels as needed
  ];

  return hotels.find(hotel => hotel.id === id);
};

// Helper function to calculate number of nights between two dates
const calculateNights = (checkIn: string, checkOut: string): number => {
  if (!checkIn || !checkOut) return 1;
  
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  if (checkOutDate <= checkInDate) return 1;
  
  const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Helper function to format date for display
const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

export default function HotelDetailsScreen() {
  const params = useLocalSearchParams();
  const { id, destination, startDate, endDate, destinations, startPoint, checkInDate, checkInDay } = params;
  const { addBooking } = useBooking();

  const hotel = getHotelById(id as string);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [showRoomsDropdown, setShowRoomsDropdown] = useState(false);
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const [showCheckoutCalendar, setShowCheckoutCalendar] = useState(false);
  
  // Booking form state
  // Guest information state - commented out for now
  // const [guestName, setGuestName] = useState('');
  // const [guestEmail, setGuestEmail] = useState('');
  // const [phoneNumber, setPhoneNumber] = useState('');
  // const [specialRequests, setSpecialRequests] = useState('');
  const [numberOfRooms, setNumberOfRooms] = useState('1');
  const [numberOfGuests, setNumberOfGuests] = useState('2');
  const [checkoutDate, setCheckoutDate] = useState(endDate as string || '');

  // Calculate number of nights and total price
  const bookingDetails = useMemo(() => {
    const nights = calculateNights(checkInDate as string, checkoutDate);
    const totalPrice = hotel ? hotel.pricePerNight * parseInt(numberOfRooms) * nights : 0;
    
    return {
      nights,
      totalPrice,
      pricePerRoom: hotel?.pricePerNight || 0
    };
  }, [checkInDate, checkoutDate, numberOfRooms, hotel]);

  if (!hotel) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Hotel not found</ThemedText>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        <Ionicons key={`empty-${i}`} name="star-outline" size={16} color={Colors.secondary200} />
      );
    }

    return stars;
  };

  const handleBookNow = () => {
    setShowBookingSheet(true);
  };

  const handleSelectCheckoutDate = (date: string) => {
    setCheckoutDate(date);
    setShowCheckoutCalendar(false);
  };

  const handleConfirmBooking = async () => {
    // Temporarily skip guest information validation since it's commented out
    /* 
    if (!guestName.trim() || !guestEmail.trim() || !phoneNumber.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    */

    // Create booking object
    const booking = {
      id: `booking_${hotel.id}_${checkInDate}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      hotelId: hotel.id,
      hotelName: hotel.name,
      checkInDate: checkInDate as string,
      checkOutDate: checkoutDate,
      checkInDay: checkInDay as string,
      destination: destination as string,
      pricePerNight: hotel.pricePerNight,
      numberOfRooms: parseInt(numberOfRooms),
      numberOfGuests: parseInt(numberOfGuests),
      numberOfNights: bookingDetails.nights,
      totalPrice: bookingDetails.totalPrice,
      guestName: '', // Placeholder values since guest info is commented out
      guestEmail: '',
      phoneNumber: '',
      specialRequests: '',
      bookingDate: new Date().toISOString(),
      type: 'accommodation' as const // Add booking type
    };

    setShowBookingSheet(false);

    // Simple confirmation alert with single OK button
    Alert.alert(
      'Booking Confirmed!', 
      `Your reservation at ${hotel.name} has been successfully confirmed. Thank you for choosing us!`,
      [
        {
          text: 'OK',
          onPress: async () => {
            // Add booking to context
            await addBooking(booking);
          }
        }
      ]
    );
  };

  const handleCallHotel = () => {
    Linking.openURL(`tel:${hotel.contactInfo.phone}`);
  };

  const handleOpenMaps = () => {
    const url = `https://maps.google.com/?q=${hotel.coordinates.latitude},${hotel.coordinates.longitude}`;
    Linking.openURL(url);
  };

  const handleShareLocation = () => {
    Alert.alert(
      'Share Location',
      'Location sharing feature will be implemented soon.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              setSelectedImageIndex(index);
            }}
          >
            {hotel.images.map((image, index) => (
              <Image key={index} source={{ uri: image }} style={styles.hotelImage} />
            ))}
          </ScrollView>
          
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={handleShareLocation}>
            <Ionicons name="share-outline" size={24} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.imageIndicator}>
            {hotel.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicatorDot,
                  selectedImageIndex === index && styles.indicatorDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.content}>
          {/* Hotel Header */}
          <View style={styles.headerSection}>
            <View style={styles.titleRow}>
              <ThemedText style={styles.hotelName}>{hotel.name}</ThemedText>
              <View style={styles.priceContainer}>
                <ThemedText style={styles.price}>${hotel.pricePerNight}</ThemedText>
                <ThemedText style={styles.priceUnit}>/night</ThemedText>
              </View>
            </View>

            <View style={styles.ratingRow}>
              <View style={styles.stars}>
                {renderStars(hotel.rating)}
              </View>
              <ThemedText style={styles.rating}>{hotel.rating}</ThemedText>
              <ThemedText style={styles.reviewCount}>({hotel.reviewCount} reviews)</ThemedText>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={Colors.secondary500} />
              <ThemedText style={styles.location}>{hotel.location}</ThemedText>
              <ThemedText style={styles.distance}>• {hotel.distance}</ThemedText>
            </View>
          </View>

          {/* Booking Info */}
          <View style={styles.bookingInfoSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color={Colors.primary600} />
              <ThemedText style={styles.sectionTitle}>Your Booking Details</ThemedText>
            </View>
            <View style={styles.bookingCard}>
              <View style={styles.bookingRow}>
                <ThemedText style={styles.bookingLabel}>Check-in Date:</ThemedText>
                <ThemedText style={styles.bookingValue}>{checkInDate}</ThemedText>
              </View>
              <View style={styles.bookingRow}>
                <ThemedText style={styles.bookingLabel}>Trip Day:</ThemedText>
                <ThemedText style={styles.bookingValue}>Day {checkInDay}</ThemedText>
              </View>
              <View style={styles.bookingRow}>
                <ThemedText style={styles.bookingLabel}>Check-in Time:</ThemedText>
                <ThemedText style={styles.bookingValue}>{hotel.checkInTime}</ThemedText>
              </View>
              <View style={styles.bookingRow}>
                <ThemedText style={styles.bookingLabel}>Check-out Time:</ThemedText>
                <ThemedText style={styles.bookingValue}>{hotel.checkOutTime}</ThemedText>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={20} color={Colors.primary600} />
              <ThemedText style={styles.sectionTitle}>About This Hotel</ThemedText>
            </View>
            <ThemedText style={styles.description}>
              {hotel.fullDescription.replace(/\\n/g, '\\n\\n')}
            </ThemedText>
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary600} />
              <ThemedText style={styles.sectionTitle}>Amenities</ThemedText>
            </View>
            <View style={styles.amenitiesGrid}>
              {hotel.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityItem}>
                  <Ionicons name="checkmark" size={16} color={Colors.success} />
                  <ThemedText style={styles.amenityText}>{amenity}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Policies */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color={Colors.primary600} />
              <ThemedText style={styles.sectionTitle}>Hotel Policies</ThemedText>
            </View>
            {hotel.policies.map((policy, index) => (
              <View key={index} style={styles.policyItem}>
                <Ionicons name="ellipse" size={6} color={Colors.secondary500} />
                <ThemedText style={styles.policyText}>{policy}</ThemedText>
              </View>
            ))}
          </View>

          {/* Contact & Location */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call" size={20} color={Colors.primary600} />
              <ThemedText style={styles.sectionTitle}>Contact & Location</ThemedText>
            </View>
            <View style={styles.contactButtons}>
              <TouchableOpacity style={styles.contactButton} onPress={handleCallHotel}>
                <Ionicons name="call" size={20} color={Colors.primary600} />
                <ThemedText style={styles.contactButtonText}>Call Hotel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactButton} onPress={handleOpenMaps}>
                <Ionicons name="map" size={20} color={Colors.primary600} />
                <ThemedText style={styles.contactButtonText}>View on Map</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {/* Fixed Booking Bar */}
      <View style={styles.bookingBar}>
        <View style={styles.bookingBarContent}>
          <View style={styles.priceInfo}>
            <ThemedText style={styles.bookingBarPrice}>${hotel.pricePerNight}</ThemedText>
            <ThemedText style={styles.bookingBarPriceUnit}>/night</ThemedText>
          </View>
          <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
            <ThemedText style={styles.bookButtonText}>Book Now</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Booking Sheet Modal */}
      <Modal
        visible={showBookingSheet}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBookingSheet(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.sheetHeader}>
            <ThemedText style={styles.sheetTitle}>Book Hotel</ThemedText>
            <TouchableOpacity onPress={() => setShowBookingSheet(false)}>
              <Ionicons name="close" size={24} color={Colors.secondary700} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.sheetContent}>
            {/* Hotel Summary */}
            <View style={styles.hotelSummaryCard}>
              <View style={styles.hotelSummaryHeader}>
                <Ionicons name="business-outline" size={20} color={Colors.primary600} />
                <ThemedText style={styles.hotelTitle}>{hotel.name}</ThemedText>
              </View>
              <View style={styles.hotelSummaryContent}>
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={14} color={Colors.primary600} />
                  <ThemedText style={styles.hotelLocation}>{hotel.location}</ThemedText>
                </View>
                <ThemedText style={styles.hotelPrice}>${hotel.pricePerNight}/night</ThemedText>
              </View>
            </View>

            {/* Booking Dates */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar" size={20} color={Colors.primary600} />
                <ThemedText style={styles.sectionTitle}>Dates</ThemedText>
              </View>
              
              <View style={styles.dateContainer}>
                <View style={styles.dateItem}>
                  <ThemedText style={styles.dateLabel}>
                    <Ionicons name="log-in-outline" size={14} color={Colors.primary600} /> Check-in
                  </ThemedText>
                  <View style={styles.dateInputWrapper}>
                    <ThemedText style={styles.dateValue}>{checkInDate} (Day {checkInDay})</ThemedText>
                  </View>
                </View>
                
                <View style={styles.dateItem}>
                  <ThemedText style={styles.dateLabel}>
                    <Ionicons name="log-out-outline" size={14} color={Colors.primary600} /> Check-out
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.dateSelector}
                    onPress={() => setShowCheckoutCalendar(true)}
                  >
                    <ThemedText style={[
                      styles.dateSelectorText, 
                      !checkoutDate && styles.dateSelectorPlaceholder
                    ]}>
                      {checkoutDate ? formatDateDisplay(checkoutDate) : 'Select checkout date'}
                    </ThemedText>
                    <Ionicons name="calendar-outline" size={16} color={Colors.secondary500} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Booking Details */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="settings-outline" size={20} color={Colors.primary600} />
                <ThemedText style={styles.sectionTitle}>Details</ThemedText>
              </View>
              
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <ThemedText style={styles.detailLabel}>
                    <Ionicons name="bed-outline" size={14} color={Colors.primary600} /> Rooms
                  </ThemedText>
                  <TouchableOpacity 
                    style={styles.dropdown}
                    onPress={() => setShowRoomsDropdown(true)}
                  >
                    <ThemedText style={styles.dropdownText}>{numberOfRooms}</ThemedText>
                    <Ionicons name="chevron-down" size={16} color={Colors.secondary500} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.detailItem}>
                  <ThemedText style={styles.detailLabel}>
                    <Ionicons name="people-outline" size={14} color={Colors.primary600} /> Guests
                  </ThemedText>
                  <TouchableOpacity 
                    style={styles.dropdown}
                    onPress={() => setShowGuestsDropdown(true)}
                  >
                    <ThemedText style={styles.dropdownText}>{numberOfGuests}</ThemedText>
                    <Ionicons name="chevron-down" size={16} color={Colors.secondary500} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.totalPriceCard}>
                <View style={styles.priceRow}>
                  <View style={styles.priceLabelContainer}>
                    <Ionicons name="card-outline" size={16} color={Colors.primary600} />
                    <ThemedText style={styles.priceLabel}>Total</ThemedText>
                  </View>
                  <ThemedText style={styles.priceAmount}>${bookingDetails.totalPrice}</ThemedText>
                </View>
                <ThemedText style={styles.priceNote}>
                  For {numberOfRooms} room{numberOfRooms !== '1' ? 's' : ''} × {bookingDetails.nights} night{bookingDetails.nights !== 1 ? 's' : ''}
                </ThemedText>
              </View>
            </View>

            {/* Guest Information - Commented out for now */}
            {/* 
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-outline" size={20} color={Colors.primary600} />
                <ThemedText style={styles.sectionTitle}>Guest Information</ThemedText>
              </View>
              
              <CustomTextInput
                label="Full Name"
                placeholder="Enter your full name"
                value={guestName}
                onChangeText={setGuestName}
              />

              <CustomTextInput
                label="Email Address"
                placeholder="Enter your email"
                value={guestEmail}
                onChangeText={setGuestEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <CustomTextInput
                label="Phone Number"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />

              <CustomTextInput
                label="Special Requests (Optional)"
                placeholder="Any special requests?"
                value={specialRequests}
                onChangeText={setSpecialRequests}
                multiline
                numberOfLines={3}
              />
            </View>
            */}

            <View style={styles.termsContainer}>
              <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary600} />
              <ThemedText style={styles.termsText}>
                By booking, you agree to our terms of service and cancellation policy.
              </ThemedText>
            </View>
          </ScrollView>

          {/* Booking Actions */}
          <View style={styles.sheetFooter}>
            <CustomButton
              title="Cancel"
              variant="secondary"
              onPress={() => setShowBookingSheet(false)}
            />
            <CustomButton
              title="Book Now"
              variant="primary"
              onPress={handleConfirmBooking}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Rooms Dropdown Modal */}
      <Modal
        visible={showRoomsDropdown}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRoomsDropdown(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.sheetHeader}>
            <ThemedText style={styles.sheetTitle}>Select Rooms</ThemedText>
            <TouchableOpacity onPress={() => setShowRoomsDropdown(false)}>
              <Ionicons name="close" size={24} color={Colors.secondary700} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.dropdownList}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.dropdownItem,
                  numberOfRooms === String(num) && styles.dropdownItemSelected
                ]}
                onPress={() => {
                  setNumberOfRooms(String(num));
                  setShowRoomsDropdown(false);
                }}
              >
                <View style={styles.dropdownItemContent}>
                  <Ionicons 
                    name="bed-outline" 
                    size={20} 
                    color={numberOfRooms === String(num) ? Colors.primary600 : Colors.secondary500} 
                  />
                  <ThemedText style={[
                    styles.dropdownItemText,
                    numberOfRooms === String(num) && styles.dropdownItemTextSelected
                  ]}>
                    {num} Room{num > 1 ? 's' : ''}
                  </ThemedText>
                </View>
                {numberOfRooms === String(num) && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary600} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Guests Dropdown Modal */}
      <Modal
        visible={showGuestsDropdown}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGuestsDropdown(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.sheetHeader}>
            <ThemedText style={styles.sheetTitle}>Select Guests</ThemedText>
            <TouchableOpacity onPress={() => setShowGuestsDropdown(false)}>
              <Ionicons name="close" size={24} color={Colors.secondary700} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.dropdownList}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.dropdownItem,
                  numberOfGuests === String(num) && styles.dropdownItemSelected
                ]}
                onPress={() => {
                  setNumberOfGuests(String(num));
                  setShowGuestsDropdown(false);
                }}
              >
                <View style={styles.dropdownItemContent}>
                  <Ionicons 
                    name="people-outline" 
                    size={20} 
                    color={numberOfGuests === String(num) ? Colors.primary600 : Colors.secondary500} 
                  />
                  <ThemedText style={[
                    styles.dropdownItemText,
                    numberOfGuests === String(num) && styles.dropdownItemTextSelected
                  ]}>
                    {num} Guest{num > 1 ? 's' : ''}
                  </ThemedText>
                </View>
                {numberOfGuests === String(num) && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary600} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Checkout Date Calendar Modal */}
      <Modal
        visible={showCheckoutCalendar}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCheckoutCalendar(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.sheetHeader}>
            <ThemedText style={styles.sheetTitle}>Select Checkout Date</ThemedText>
            <TouchableOpacity onPress={() => setShowCheckoutCalendar(false)}>
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
              minDate={checkInDate as string}
              onDayPress={(day) => {
                handleSelectCheckoutDate(day.dateString);
              }}
              markedDates={{
                [checkInDate as string]: {
                  startingDay: true,
                  color: Colors.primary600,
                  textColor: Colors.white,
                },
                ...(checkoutDate && {
                  [checkoutDate]: {
                    endingDay: true,
                    color: Colors.primary600,
                    textColor: Colors.white,
                  }
                }),
              }}
              markingType="period"
              hideExtraDays={true}
              firstDay={1}
            />
            
            <View style={styles.calendarFooter}>
              <View style={styles.dateRangeInfo}>
                <View style={styles.dateInfoRow}>
                  <Ionicons name="log-in-outline" size={16} color={Colors.primary600} />
                  <ThemedText style={styles.dateInfoLabel}>Check-in:</ThemedText>
                  <ThemedText style={styles.dateInfoValue}>{formatDateDisplay(checkInDate as string)}</ThemedText>
                </View>
                {checkoutDate && (
                  <>
                    <View style={styles.dateInfoRow}>
                      <Ionicons name="log-out-outline" size={16} color={Colors.primary600} />
                      <ThemedText style={styles.dateInfoLabel}>Check-out:</ThemedText>
                      <ThemedText style={styles.dateInfoValue}>{formatDateDisplay(checkoutDate)}</ThemedText>
                    </View>
                    <View style={styles.dateInfoRow}>
                      <Ionicons name="moon-outline" size={16} color={Colors.primary600} />
                      <ThemedText style={styles.dateInfoLabel}>Nights:</ThemedText>
                      <ThemedText style={styles.dateInfoValue}>{calculateNights(checkInDate as string, checkoutDate)}</ThemedText>
                    </View>
                    <View style={styles.dateInfoRow}>
                      <Ionicons name="card-outline" size={16} color={Colors.primary600} />
                      <ThemedText style={styles.dateInfoLabel}>Estimated Total:</ThemedText>
                      <ThemedText style={styles.dateInfoValue}>${bookingDetails.totalPrice}</ThemedText>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  hotelImage: {
    width: screenWidth,
    height: 300,
    backgroundColor: Colors.secondary200,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  shareButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  indicatorDotActive: {
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  headerSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  hotelName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.secondary700,
    flex: 1,
    marginRight: 16,
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginTop: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary600,
  },
  priceUnit: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 16,
    color: Colors.secondary600,
    fontWeight: '500',
  },
  distance: {
    fontSize: 16,
    color: Colors.secondary500,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  bookingInfoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  bookingCard: {
    backgroundColor: Colors.primary100,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingLabel: {
    fontSize: 14,
    color: Colors.secondary600,
  },
  bookingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary700,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.secondary600,
  },
  amenitiesGrid: {
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amenityText: {
    fontSize: 16,
    color: Colors.secondary700,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
    paddingTop: 2,
  },
  policyText: {
    fontSize: 14,
    color: Colors.secondary600,
    flex: 1,
    lineHeight: 20,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary700,
  },
  bottomSpacing: {
    height: 100, // Space for fixed booking bar
  },
  bookingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
    padding: 20,
    paddingBottom: 34, // Account for home indicator on iOS
  },
  bookingBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  bookingBarPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary600,
  },
  bookingBarPriceUnit: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  bookButton: {
    backgroundColor: Colors.primary600,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary600,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  bookingSummary: {
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.secondary600,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
    flex: 1,
    textAlign: 'right',
  },
  summaryPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary600,
  },
  formSection: {
    marginBottom: 28,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary700,
    marginBottom: 8,
  },
  input: {
    marginBottom: 0,
  },
  textArea: {
    minHeight: 80,
  },
  termsSection: {
    backgroundColor: Colors.secondary100,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  termsText: {
    fontSize: 12,
    color: Colors.primary600,
    lineHeight: 16,
    flex: 1,
  },
  // Terms container with green background
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.primary100,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary300,
  },
  sheetFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
    gap: 12,
    backgroundColor: Colors.white,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateColumn: {
    flex: 1,
  },
  // New improved date styles
  dateContainer: {
    gap: 16,
  },
  dateItem: {
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary700,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateValue: {
    fontSize: 16,
    color: Colors.secondary700,
    backgroundColor: Colors.secondary100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },
  dateInputWrapper: {
    backgroundColor: Colors.white,
    borderRadius: 8,
  },
  // Date selector styles
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  dateSelectorText: {
    fontSize: 16,
    color: Colors.secondary700,
    fontWeight: '500',
  },
  dateSelectorPlaceholder: {
    color: Colors.secondary400,
  },
  // New improved details styles
  detailsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  detailItem: {
    flex: 1,
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary700,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.secondary700,
    fontWeight: '500',
  },

  totalPriceContainer: {
    backgroundColor: Colors.success100,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.success700,
  },
  priceNote: {
    fontSize: 12,
    color: Colors.primary600,
    marginTop: 8,
    textAlign: 'center',
  },
  // New minimalistic styles
  hotelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary700,
    flex: 1,
  },
  hotelLocation: {
    fontSize: 14,
    color: Colors.primary600,
  },
  hotelPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary700,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary700,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary700,
  },
  // Hotel summary card with green background
  hotelSummaryCard: {
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary300,
  },
  hotelSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  hotelSummaryContent: {
    gap: 8,
    marginTop: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },

  // Price label containers
  priceLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // Total price card with green background
  totalPriceCard: {
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.primary300,
  },
  // Dropdown list styles
  dropdownList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
    backgroundColor: Colors.white,
  },
  dropdownItemSelected: {
    backgroundColor: Colors.primary100,
    borderBottomColor: Colors.primary300,
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.secondary700,
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: Colors.primary700,
    fontWeight: '600',
  },
  // Calendar styles
  calendarContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  calendar: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  calendarFooter: {
    marginTop: 20,
    paddingVertical: 16,
  },
  dateRangeInfo: {
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary300,
  },
  dateInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  dateInfoLabel: {
    fontSize: 14,
    color: Colors.primary700,
    fontWeight: '500',
  },
  dateInfoValue: {
    fontSize: 14,
    color: Colors.primary700,
    fontWeight: '600',
    marginLeft: 'auto',
  },
});
