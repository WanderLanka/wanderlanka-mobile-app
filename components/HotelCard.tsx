import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { ThemedText } from './ThemedText';

export interface Hotel {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  location: string;
  distance: string;
  image: string;
  amenities: string[];
  description: string;
  availability: boolean;
}

interface HotelCardProps {
  hotel: Hotel;
  selectedDay?: {
    date: string;
    dayNumber: number;
    formattedDate: string;
  };
  destination?: string;
  startDate?: string;
  endDate?: string;
  onPress?: () => void;
  onBook?: () => void;
}

export const HotelCard: React.FC<HotelCardProps> = ({
  hotel,
  selectedDay,
  destination,
  startDate,
  endDate,
  onPress,
  onBook,
}) => {
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

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (hotel.availability && selectedDay) {
      router.push({
        pathname: '/planning/accommodation/[id]' as any,
        params: {
          id: hotel.id,
          destination,
          startDate,
          endDate,
          checkInDate: selectedDay.date,
          checkInDay: selectedDay.dayNumber,
        },
      });
    }
  };

  return (
    <TouchableOpacity
      style={[styles.hotelCard, !hotel.availability && styles.unavailableCard]}
      onPress={handlePress}
      disabled={!hotel.availability}
      activeOpacity={0.7}
    >
      <Image source={{ uri: hotel.image }} style={styles.hotelImage} />
      {!hotel.availability && (
        <View style={styles.unavailableOverlay}>
          <ThemedText style={styles.unavailableText}>Fully Booked</ThemedText>
        </View>
      )}
      
      <View style={styles.hotelInfo}>
        <View style={styles.hotelHeader}>
          <ThemedText style={styles.hotelName}>{hotel.name}</ThemedText>
          <View style={styles.priceContainer}>
            <ThemedText style={styles.price}>${hotel.pricePerNight}</ThemedText>
            <ThemedText style={styles.priceUnit}>/night</ThemedText>
            <ThemedText style={styles.totalPrice}>
              For 1 night stay
            </ThemedText>
          </View>
        </View>

        <View style={styles.ratingContainer}>
          <View style={styles.stars}>
            {renderStars(hotel.rating)}
          </View>
          <ThemedText style={styles.rating}>{hotel.rating}</ThemedText>
          <ThemedText style={styles.reviewCount}>({hotel.reviewCount} reviews)</ThemedText>
        </View>

        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color={Colors.secondary500} />
          <ThemedText style={styles.location}>{hotel.location}</ThemedText>
          <ThemedText style={styles.distance}>• {hotel.distance}</ThemedText>
        </View>

        <ThemedText style={styles.description} numberOfLines={2}>
          {hotel.description}
        </ThemedText>

        <View style={styles.amenitiesContainer}>
          {hotel.amenities.slice(0, 3).map((amenity, index) => (
            <View key={index} style={styles.amenityTag}>
              <ThemedText style={styles.amenityText}>{amenity}</ThemedText>
            </View>
          ))}
          {hotel.amenities.length > 3 && (
            <ThemedText style={styles.moreAmenities}>
              +{hotel.amenities.length - 3} more
            </ThemedText>
          )}
        </View>

        {hotel.availability && (
          <View style={styles.bookingHint}>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary600} />
            <ThemedText style={styles.bookingHintText}>Tap to view details & book</ThemedText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  hotelCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  unavailableCard: {
    opacity: 0.7,
  },
  hotelImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.secondary200,
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  unavailableText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  hotelInfo: {
    padding: 16,
  },
  hotelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary700,
    flex: 1,
    marginRight: 12,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
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
  ratingContainer: {
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
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  reviewCount: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: Colors.secondary600,
    fontWeight: '500',
  },
  distance: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  description: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
    marginBottom: 12,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  amenityTag: {
    backgroundColor: Colors.primary100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amenityText: {
    fontSize: 12,
    color: Colors.primary700,
    fontWeight: '500',
  },
  moreAmenities: {
    fontSize: 12,
    color: Colors.secondary500,
    fontStyle: 'italic',
  },
  bookingHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary100,
  },
  bookingHintText: {
    fontSize: 12,
    color: Colors.primary600,
    fontWeight: '500',
  },
});
