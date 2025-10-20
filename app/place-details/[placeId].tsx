import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  Dimensions,
  Linking,
  Alert
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components';
import { Colors } from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 'AIzaSyBPAjLGZlFyzwIRo60j3HlhR7Qp0pmqQQ8';

interface PlaceDetails {
  placeId: string;
  name: string;
  photos: string[];
  rating?: number;
  userRatingsTotal?: number;
  formattedAddress?: string;
  formattedPhoneNumber?: string;
  website?: string;
  openingHours?: {
    openNow?: boolean;
    weekdayText?: string[];
  };
  priceLevel?: number;
  types?: string[];
  reviews?: Array<{
    authorName: string;
    rating: number;
    text: string;
    time: number;
  }>;
  editorialSummary?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export default function PlaceDetailsScreen() {
  const params = useLocalSearchParams();
  const placeId = params.placeId as string;
  const placeName = params.placeName as string;
  
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (placeId) {
      fetchPlaceDetails();
    }
  }, [placeId]);

  const fetchPlaceDetails = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching full details for place ID:', placeId);
      
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,opening_hours,rating,user_ratings_total,price_level,website,photos,types,geometry,reviews,editorial_summary&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(detailsUrl);
      const data = await response.json();
      
      if (data.status === 'OK' && data.result) {
        const result = data.result;
        
        // Get multiple photos
        const photos = result.photos?.slice(0, 10).map((photo: any) => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
        ) || [];
        
        const details: PlaceDetails = {
          placeId,
          name: result.name,
          photos,
          rating: result.rating,
          userRatingsTotal: result.user_ratings_total,
          formattedAddress: result.formatted_address,
          formattedPhoneNumber: result.formatted_phone_number,
          website: result.website,
          openingHours: result.opening_hours,
          priceLevel: result.price_level,
          types: result.types?.slice(0, 5).map((type: string) => type.replace(/_/g, ' ')),
          reviews: result.reviews?.slice(0, 3),
          editorialSummary: result.editorial_summary?.overview,
          geometry: result.geometry,
        };
        
        setPlaceDetails(details);
        console.log('✅ Loaded full place details:', details.name);
      } else {
        console.warn('⚠️ Details API error:', data.status, data.error_message);
        Alert.alert('Error', 'Could not load place details');
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching place details:', error);
      Alert.alert('Error', 'Failed to load place details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    if (placeDetails?.formattedPhoneNumber) {
      Linking.openURL(`tel:${placeDetails.formattedPhoneNumber}`);
    }
  };

  const handleWebsite = () => {
    if (placeDetails?.website) {
      Linking.openURL(placeDetails.website);
    }
  };

  const handleDirections = () => {
    if (placeDetails?.geometry?.location) {
      const { lat, lng } = placeDetails.geometry.location;
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    }
  };

  const getPriceLevelText = (level?: number) => {
    if (!level) return 'N/A';
    return '$'.repeat(level);
  };

  const getNextOpeningTime = (weekdayText?: string[]) => {
    if (!weekdayText || weekdayText.length === 0) return null;
    
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Try to find next opening time in the next 7 days
    for (let i = 0; i < 7; i++) {
      const checkDay = (currentDay + i) % 7;
      const dayName = daysOfWeek[checkDay];
      
      // Find the schedule for this day
      const daySchedule = weekdayText.find(schedule => 
        schedule.toLowerCase().startsWith(dayName.toLowerCase())
      );
      
      if (!daySchedule) continue;
      
      // Check if it's closed
      if (daySchedule.toLowerCase().includes('closed')) {
        continue;
      }
      
      // Extract opening time (format: "Monday: 9:00 AM – 5:00 PM")
      const timeMatch = daySchedule.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
      if (timeMatch) {
        const openingTime = timeMatch[1];
        
        // If checking today, make sure the opening time hasn't passed
        if (i === 0) {
          // For today, we need to check if opening time is in the future
          const openingHour = parseInt(openingTime.split(':')[0]);
          const isPM = openingTime.toLowerCase().includes('pm');
          const hour24 = isPM && openingHour !== 12 ? openingHour + 12 : openingHour;
          
          if (now.getHours() >= hour24) {
            continue; // Opening time already passed today
          }
        }
        
        if (i === 0) {
          return `Opens today at ${openingTime}`;
        } else if (i === 1) {
          return `Opens tomorrow at ${openingTime}`;
        } else {
          return `Opens ${dayName} at ${openingTime}`;
        }
      }
    }
    
    return null;
  };

  const getClosingTime = (weekdayText?: string[]) => {
    if (!weekdayText || weekdayText.length === 0) return null;
    
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const currentDay = now.getDay();
    const dayName = daysOfWeek[currentDay];
    
    // Find today's schedule
    const todaySchedule = weekdayText.find(schedule => 
      schedule.toLowerCase().startsWith(dayName.toLowerCase())
    );
    
    if (!todaySchedule || todaySchedule.toLowerCase().includes('closed')) {
      return null;
    }
    
    // Extract closing time (format: "Monday: 9:00 AM – 5:00 PM")
    // Match the second time (closing time) using a more specific pattern
    const timeMatches = todaySchedule.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*[–-]\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
    if (timeMatches && timeMatches[2]) {
      return `Closes at ${timeMatches[2]}`;
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary600} />
          <ThemedText style={styles.loadingText}>Loading place details...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!placeDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
          <ThemedText style={styles.errorText}>Place details not found</ThemedText>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
        {placeDetails.photos.length > 0 && (
          <View style={styles.imageGalleryContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setCurrentImageIndex(index);
              }}
            >
              {placeDetails.photos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            
            {/* Image indicators */}
            <View style={styles.imageIndicators}>
              {placeDetails.photos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentImageIndex && styles.activeIndicator,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Back Button Overlay */}
        <TouchableOpacity 
          style={styles.backButtonOverlay}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText variant="title" style={styles.placeName}>
              {placeDetails.name}
            </ThemedText>
            
            {placeDetails.rating && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={20} color={Colors.warning} />
                <ThemedText style={styles.ratingText}>
                  {placeDetails.rating.toFixed(1)}
                </ThemedText>
                {placeDetails.userRatingsTotal && (
                  <ThemedText style={styles.ratingCount}>
                    ({placeDetails.userRatingsTotal.toLocaleString()} reviews)
                  </ThemedText>
                )}
              </View>
            )}
          </View>

          {/* Types/Categories */}
          {placeDetails.types && placeDetails.types.length > 0 && (
            <View style={styles.typesContainer}>
              {placeDetails.types.map((type, index) => (
                <View key={index} style={styles.typeChip}>
                  <ThemedText style={styles.typeText}>{type}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Editorial Summary/Description */}
          {placeDetails.editorialSummary && (
            <View style={styles.section}>
              <ThemedText variant="subtitle" style={styles.sectionTitle}>
                About
              </ThemedText>
              <ThemedText style={styles.descriptionText}>
                {placeDetails.editorialSummary}
              </ThemedText>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            {placeDetails.formattedPhoneNumber && (
              <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                <Ionicons name="call" size={24} color={Colors.primary600} />
                <ThemedText style={styles.actionText}>Call</ThemedText>
              </TouchableOpacity>
            )}
            
            {placeDetails.website && (
              <TouchableOpacity style={styles.actionButton} onPress={handleWebsite}>
                <Ionicons name="globe" size={24} color={Colors.primary600} />
                <ThemedText style={styles.actionText}>Website</ThemedText>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
              <Ionicons name="navigate" size={24} color={Colors.primary600} />
              <ThemedText style={styles.actionText}>Directions</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Information */}
          <View style={styles.section}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>
              Information
            </ThemedText>
            
            {placeDetails.formattedAddress && (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color={Colors.primary600} />
                <ThemedText style={styles.infoText}>{placeDetails.formattedAddress}</ThemedText>
              </View>
            )}
            
            {placeDetails.formattedPhoneNumber && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color={Colors.primary600} />
                <ThemedText style={styles.infoText}>{placeDetails.formattedPhoneNumber}</ThemedText>
              </View>
            )}
            
            {placeDetails.priceLevel && (
              <View style={styles.infoRow}>
                <Ionicons name="cash" size={20} color={Colors.primary600} />
                <ThemedText style={styles.infoText}>
                  Price Level: {getPriceLevelText(placeDetails.priceLevel)}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Opening Hours */}
          {placeDetails.openingHours && (
            <View style={styles.section}>
              <ThemedText variant="subtitle" style={styles.sectionTitle}>
                Opening Hours
              </ThemedText>
              
              <View style={styles.openNowContainer}>
                <Ionicons 
                  name={placeDetails.openingHours.openNow ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={placeDetails.openingHours.openNow ? Colors.success : Colors.error} 
                />
                <View style={styles.openStatusTextContainer}>
                  <ThemedText style={[
                    styles.openNowText,
                    { color: placeDetails.openingHours.openNow ? Colors.success : Colors.error }
                  ]}>
                    {placeDetails.openingHours.openNow ? 'Open Now' : 'Closed'}
                  </ThemedText>
                  
                  {/* Show closing time if currently open */}
                  {placeDetails.openingHours.openNow && placeDetails.openingHours.weekdayText && (
                    <ThemedText style={styles.nextOpeningText}>
                      {getClosingTime(placeDetails.openingHours.weekdayText) || ''}
                    </ThemedText>
                  )}
                  
                  {/* Show next opening time if currently closed */}
                  {!placeDetails.openingHours.openNow && placeDetails.openingHours.weekdayText && (
                    <ThemedText style={styles.nextOpeningText}>
                      {getNextOpeningTime(placeDetails.openingHours.weekdayText) || 'Check schedule below'}
                    </ThemedText>
                  )}
                </View>
              </View>
              
              {placeDetails.openingHours.weekdayText && (
                <View style={styles.hoursContainer}>
                  {placeDetails.openingHours.weekdayText.map((day, index) => (
                    <ThemedText key={index} style={styles.hourText}>
                      {day}
                    </ThemedText>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Reviews */}
          {placeDetails.reviews && placeDetails.reviews.length > 0 && (
            <View style={styles.section}>
              <ThemedText variant="subtitle" style={styles.sectionTitle}>
                Reviews
              </ThemedText>
              
              {placeDetails.reviews.map((review, index) => (
                <View key={index} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <ThemedText style={styles.reviewAuthor}>
                      {review.authorName}
                    </ThemedText>
                    <View style={styles.reviewRating}>
                      <Ionicons name="star" size={14} color={Colors.warning} />
                      <ThemedText style={styles.reviewRatingText}>
                        {review.rating}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.reviewText} numberOfLines={3}>
                    {review.text}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
  
  scrollContent: {
    paddingBottom: 40,
  },
  
  imageGalleryContainer: {
    height: 300,
    position: 'relative',
  },
  
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  
  activeIndicator: {
    backgroundColor: Colors.white,
    width: 24,
  },
  
  backButtonOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  
  contentContainer: {
    padding: 20,
  },
  
  header: {
    marginBottom: 16,
  },
  
  placeName: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.primary800,
    marginBottom: 8,
  },
  
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  ratingText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary800,
  },
  
  ratingCount: {
    fontSize: 14,
    color: Colors.primary600,
    marginLeft: 4,
  },
  
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  
  typeChip: {
    backgroundColor: Colors.primary100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary700,
    textTransform: 'capitalize',
  },
  
  section: {
    marginBottom: 24,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary800,
    marginBottom: 12,
  },
  
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.primary700,
  },
  
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    gap: 6,
  },
  
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary700,
  },
  
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary700,
    lineHeight: 20,
  },
  
  openNowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  
  openStatusTextContainer: {
    flex: 1,
  },
  
  openNowText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  nextOpeningText: {
    fontSize: 13,
    color: Colors.primary600,
    marginTop: 4,
  },
  
  hoursContainer: {
    gap: 6,
  },
  
  hourText: {
    fontSize: 14,
    color: Colors.primary600,
  },
  
  reviewCard: {
    backgroundColor: Colors.primary100,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary800,
  },
  
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  reviewRatingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary700,
  },
  
  reviewText: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.primary600,
  },
  
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.primary600,
  },
  
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
  },
  
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary600,
    borderRadius: 8,
  },
  
  backButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
