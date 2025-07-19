import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '../../../components/ThemedText';
import { Colors } from '../../../constants/Colors';

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

export default function HotelDetailsScreen() {
  const params = useLocalSearchParams();
  const { id, destination, startDate, endDate, checkInDate, checkInDay } = params;

  const hotel = getHotelById(id as string);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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
    Alert.alert(
      'Confirm Booking',
      `Book ${hotel.name} for ${checkInDate}?\\n\\nCheck-in: Day ${checkInDay}\\nPrice: $${hotel.pricePerNight}/night`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book Now',
          onPress: () => {
            Alert.alert('Success!', 'Your booking has been confirmed.');
            router.back();
          },
        },
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
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
});
