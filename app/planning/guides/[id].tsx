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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomButton, CustomTextInput, ThemedText } from '../../../components';
import { Colors } from '../../../constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

// Mock guide data - in real app, this would come from API
const getGuideById = (id: string) => {
  const guides = [
    {
      id: '1',
      name: 'Nimal Perera',
      rating: 4.9,
      reviewCount: 156,
      pricePerDay: 45,
      location: 'Galle & Southern Province',
      specialties: ['Cultural Tours', 'History', 'Photography'],
      languages: ['English', 'Sinhala', 'German'],
      experience: '8 years',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      description: 'Passionate local guide specializing in Galle Fort history and southern coastal culture.',
      verified: true,
      availability: true,
      images: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        'https://images.unsplash.com/photo-1494790108755-2616c2d623d4',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'
      ],
      reviews: [
        { name: 'John Smith', rating: 5, comment: 'Amazing guide! Very knowledgeable and friendly.' },
        { name: 'Sarah Johnson', rating: 5, comment: 'Best cultural tour experience in Sri Lanka!' }
      ],
    },
    {
      id: '2',
      name: 'Kamala Wickramasinghe',
      rating: 4.8,
      reviewCount: 89,
      pricePerDay: 55,
      location: 'Kandy & Hill Country',
      specialties: ['Temple Tours', 'Tea Plantations', 'Nature'],
      languages: ['English', 'Sinhala', 'Tamil'],
      experience: '12 years',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b7c5',
      description: 'Expert in Buddhist culture and tea plantation tours with deep knowledge of hill country.',
      verified: true,
      availability: true,
      images: [
        'https://images.unsplash.com/photo-1494790108755-2616b612b7c5',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'
      ],
      reviews: [
        { name: 'Michael Brown', rating: 5, comment: 'Excellent knowledge of tea plantations!' },
        { name: 'Emma Wilson', rating: 4, comment: 'Very professional and punctual.' }
      ],
    },
    {
      id: '3',
      name: 'Roshan Silva',
      rating: 4.7,
      reviewCount: 203,
      pricePerDay: 50,
      location: 'Ella & Uva Province',
      specialties: ['Hiking', 'Adventure', 'Wildlife'],
      languages: ['English', 'Sinhala'],
      experience: '6 years',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
      description: 'Adventure guide specializing in hiking trails, waterfalls, and wildlife spotting.',
      verified: true,
      availability: true,
      images: [
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        'https://images.unsplash.com/photo-1494790108755-2616b612b7c5'
      ],
      reviews: [
        { name: 'Tom Adventure', rating: 5, comment: 'Best hiking guide in Sri Lanka!' },
        { name: 'Alice Nature', rating: 4, comment: 'Great wildlife knowledge and enthusiasm.' }
      ],
    },
    {
      id: '4',
      name: 'Amara Jayawardena',
      rating: 4.9,
      reviewCount: 134,
      pricePerDay: 60,
      location: 'Sigiriya & Cultural Triangle',
      specialties: ['Ancient History', 'Archaeology', 'Art'],
      languages: ['English', 'Sinhala', 'French', 'Japanese'],
      experience: '15 years',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
      description: 'Archaeological expert with extensive knowledge of ancient Sri Lankan civilizations.',
      verified: true,
      availability: false,
      images: [
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'
      ],
      reviews: [
        { name: 'History Buff', rating: 5, comment: 'Incredible knowledge of ancient sites!' },
        { name: 'Cultural Explorer', rating: 5, comment: 'Perfect guide for archaeology enthusiasts.' }
      ],
    },
  ];

  return guides.find(guide => guide.id === id) || guides[0];
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

export default function GuideDetailsScreen() {
  const params = useLocalSearchParams();
  const { id, destination, startDate, endDate, destinations, startPoint } = params;

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedDays, setSelectedDays] = useState(1);
  const [meetingPoint, setMeetingPoint] = useState(destination as string || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [tourType, setTourType] = useState('');

  const guide = getGuideById(id as string);
  const totalDays = useMemo(() => {
    if (startDate && endDate) {
      return calculateDays(startDate as string, endDate as string);
    }
    return 1;
  }, [startDate, endDate]);

  const totalPrice = useMemo(() => {
    return guide.pricePerDay * selectedDays;
  }, [guide.pricePerDay, selectedDays]);

  const handleBookNow = () => {
    setSelectedDays(totalDays);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = () => {
    const booking = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: 'guide',
      guideName: guide.name,
      guideId: guide.id,
      destination: destination as string,
      startDate: startDate as string,
      endDate: endDate as string,
      days: selectedDays,
      pricePerDay: guide.pricePerDay,
      totalPrice,
      meetingPoint,
      tourType,
      specialRequests,
      guideInfo: {
        rating: guide.rating,
        experience: guide.experience,
        specialties: guide.specialties,
        languages: guide.languages,
        avatar: guide.avatar,
        location: guide.location,
      },
    };

    setShowBookingModal(false);

    // Show success alert like accommodation booking
    Alert.alert(
      'Booking Confirmed!', 
      `Your tour guide booking with ${guide.name} has been successfully confirmed. Thank you for choosing us!`,
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
        <ThemedText style={styles.headerTitle}>Guide Profile</ThemedText>
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
            {guide.images?.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.guideImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          
          {/* Image indicators */}
          <View style={styles.imageIndicators}>
            {guide.images?.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  selectedImageIndex === index && styles.activeIndicator
                ]}
              />
            ))}
          </View>

          {/* Verification Badge */}
          {guide.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.white} />
              <ThemedText style={styles.verifiedText}>Verified</ThemedText>
            </View>
          )}
        </View>

        {/* Guide Info */}
        <View style={styles.guideInfo}>
          <View style={styles.guideHeader}>
            <View style={styles.guideTitleContainer}>
              <ThemedText style={styles.guideName}>{guide.name}</ThemedText>
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={16} color={Colors.secondary500} />
                <ThemedText style={styles.location}>{guide.location}</ThemedText>
              </View>
            </View>
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {renderStars(guide.rating)}
              </View>
              <ThemedText style={styles.rating}>{guide.rating}</ThemedText>
              <ThemedText style={styles.reviewCount}>({guide.reviewCount})</ThemedText>
            </View>
          </View>

          <ThemedText style={styles.description}>{guide.description}</ThemedText>

          {/* Experience & Languages */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color={Colors.primary600} />
              <View>
                <ThemedText style={styles.detailLabel}>Experience</ThemedText>
                <ThemedText style={styles.detailValue}>{guide.experience}</ThemedText>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="language-outline" size={20} color={Colors.primary600} />
              <View>
                <ThemedText style={styles.detailLabel}>Languages</ThemedText>
                <ThemedText style={styles.detailValue}>{guide.languages.join(', ')}</ThemedText>
              </View>
            </View>
          </View>

          {/* Specialties */}
          <View style={styles.specialtiesContainer}>
            <ThemedText style={styles.specialtiesTitle}>Tour Specialties</ThemedText>
            <View style={styles.specialtiesList}>
              {guide.specialties.map((specialty, index) => (
                <View key={index} style={styles.specialtyTag}>
                  <ThemedText style={styles.specialtyText}>{specialty}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Reviews Preview */}
          {guide.reviews && guide.reviews.length > 0 && (
            <View style={styles.reviewsContainer}>
              <ThemedText style={styles.reviewsTitle}>Recent Reviews</ThemedText>
              {guide.reviews.slice(0, 2).map((review, index) => (
                <View key={index} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <ThemedText style={styles.reviewerName}>{review.name}</ThemedText>
                    <View style={styles.reviewRating}>
                      {renderStars(review.rating)}
                    </View>
                  </View>
                  <ThemedText style={styles.reviewComment}>{review.comment}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Pricing */}
          <View style={styles.pricingContainer}>
            <View style={styles.pricingHeader}>
              <ThemedText style={styles.pricingTitle}>Service Details</ThemedText>
            </View>
            <View style={styles.pricingDetails}>
              <View style={styles.pricingRow}>
                <ThemedText style={styles.pricingLabel}>Daily Rate:</ThemedText>
                <ThemedText style={styles.pricingValue}>${guide.pricePerDay}</ThemedText>
              </View>
              <View style={styles.pricingRow}>
                <ThemedText style={styles.pricingLabel}>Duration:</ThemedText>
                <ThemedText style={styles.pricingValue}>{totalDays} {totalDays === 1 ? 'day' : 'days'}</ThemedText>
              </View>
              <View style={[styles.pricingRow, styles.totalRow]}>
                <ThemedText style={styles.totalLabel}>Total Cost:</ThemedText>
                <ThemedText style={styles.totalValue}>${guide.pricePerDay * totalDays}</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Book Now Button */}
      <View style={styles.bookingFooter}>
        <CustomButton
          title="Book Guide"
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
            <ThemedText style={styles.modalTitle}>Book Guide</ThemedText>
            <TouchableOpacity onPress={() => setShowBookingModal(false)}>
              <Ionicons name="close" size={24} color={Colors.secondary700} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Selected Guide Summary */}
            <View style={styles.selectedGuideSummary}>
              <Image source={{ uri: guide.avatar }} style={styles.summaryImage} />
              <View style={styles.summaryDetails}>
                <ThemedText style={styles.summaryName}>{guide.name}</ThemedText>
                <ThemedText style={styles.summaryLocation}>{guide.location}</ThemedText>
                <View style={styles.summaryRating}>
                  <View style={styles.stars}>
                    {renderStars(guide.rating)}
                  </View>
                  <ThemedText style={styles.ratingText}>{guide.rating}</ThemedText>
                </View>
              </View>
              <View style={styles.summaryPrice}>
                <ThemedText style={styles.priceText}>${guide.pricePerDay}</ThemedText>
                <ThemedText style={styles.priceUnit}>/day</ThemedText>
              </View>
            </View>

            {/* Booking Details */}
            <View style={styles.bookingForm}>
              <ThemedText style={styles.formTitle}>Tour Details</ThemedText>

              <View style={styles.dateContainer}>
                <ThemedText style={styles.dateLabel}>Tour Period</ThemedText>
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
                label="Meeting Point"
                placeholder="Enter meeting location"
                value={meetingPoint}
                onChangeText={setMeetingPoint}
                containerStyle={styles.inputContainer}
              />

              <CustomTextInput
                label="Preferred Tour Type"
                placeholder="Cultural, Nature, Food, etc."
                value={tourType}
                onChangeText={setTourType}
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
                <ThemedText style={styles.breakdownLabel}>Guide fee x {selectedDays} {selectedDays === 1 ? 'day' : 'days'}</ThemedText>
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
  guideImage: {
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
  verifiedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  guideInfo: {
    padding: 20,
  },
  guideHeader: {
    marginBottom: 16,
  },
  guideTitleContainer: {
    marginBottom: 8,
  },
  guideName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
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
  detailsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.secondary600,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: Colors.secondary700,
    fontWeight: '600',
  },
  specialtiesContainer: {
    marginBottom: 24,
  },
  specialtiesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 12,
  },
  specialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyTag: {
    backgroundColor: Colors.primary100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialtyText: {
    fontSize: 14,
    color: Colors.primary700,
    fontWeight: '500',
  },
  reviewsContainer: {
    marginBottom: 24,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 12,
  },
  reviewItem: {
    backgroundColor: Colors.secondary50,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
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
    color: Colors.primary700,
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
  selectedGuideSummary: {
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
    height: 80,
    borderRadius: 40,
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
  summaryLocation: {
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
