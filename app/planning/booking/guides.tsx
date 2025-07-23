import { router, useLocalSearchParams } from 'expo-router';
import {
    FlatList,
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from '../../../components';

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Colors } from '../../../constants/Colors';

interface Guide {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  pricePerDay: number;
  location: string;
  specialties: string[];
  languages: string[];
  experience: string;
  avatar: string;
  description: string;
  verified: boolean;
  availability: boolean;
}

export default function GuidesBookingScreen() {
  const params = useLocalSearchParams();
  const { destination, startDate, endDate, destinations, startPoint } = params;

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

  // Mock guides data - in real app, this would come from API based on planned destinations
  const guides: Guide[] = [
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
    },
  ];

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

  const renderGuideCard = ({ item: guide }: { item: Guide }) => (
    <TouchableOpacity
      style={[styles.guideCard, !guide.availability && styles.unavailableCard]}
      onPress={() => {
        if (guide.availability) {
          router.push({
            pathname: '/planning/guides/[id]',
            params: {
              id: guide.id,
              destination,
              startDate,
              endDate,
              destinations,
              startPoint,
            },
          });
        }
      }}
      disabled={!guide.availability}
    >
      <View style={styles.guideHeader}>
        <Image source={{ uri: guide.avatar }} style={styles.guideAvatar} />
        {!guide.availability && (
          <View style={styles.unavailableOverlay}>
            <ThemedText style={styles.unavailableText}>Unavailable</ThemedText>
          </View>
        )}
        
        <View style={styles.guideInfo}>
          <View style={styles.guideNameContainer}>
            <ThemedText style={styles.guideName}>{guide.name}</ThemedText>
            {guide.verified && (
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            )}
          </View>
          
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {renderStars(guide.rating)}
            </View>
            <ThemedText style={styles.rating}>{guide.rating}</ThemedText>
            <ThemedText style={styles.reviewCount}>({guide.reviewCount})</ThemedText>
          </View>

          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color={Colors.secondary500} />
            <ThemedText style={styles.location}>{guide.location}</ThemedText>
          </View>

          <View style={styles.experienceContainer}>
            <Ionicons name="time-outline" size={14} color={Colors.secondary500} />
            <ThemedText style={styles.experience}>{guide.experience} experience</ThemedText>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <ThemedText style={styles.price}>${guide.pricePerDay}</ThemedText>
          <ThemedText style={styles.priceUnit}>/day</ThemedText>
          <ThemedText style={styles.totalPrice}>
            ${guide.pricePerDay * tripDuration} total
          </ThemedText>
        </View>
      </View>

      <ThemedText style={styles.description} numberOfLines={2}>
        {guide.description}
      </ThemedText>

      <View style={styles.specialtiesContainer}>
        <ThemedText style={styles.specialtiesLabel}>Specialties:</ThemedText>
        <View style={styles.specialtiesList}>
          {guide.specialties.map((specialty, index) => (
            <View key={index} style={styles.specialtyTag}>
              <ThemedText style={styles.specialtyText}>{specialty}</ThemedText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.languagesContainer}>
        <Ionicons name="language-outline" size={16} color={Colors.secondary500} />
        <ThemedText style={styles.languagesText}>
          {guide.languages.join(', ')}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={guides}
        renderItem={renderGuideCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <ThemedText style={styles.resultsCount}>
              {guides.filter(g => g.availability).length} guides available
            </ThemedText>
            <ThemedText style={styles.resultsSubtitle}>
              Expert local guides for your destinations
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  listContent: {
    padding: 20,
    paddingTop: 16,
  },
  listHeader: {
    marginBottom: 20,
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
  guideCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  unavailableCard: {
    opacity: 0.7,
  },
  guideHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  guideAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.secondary200,
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  unavailableText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  guideInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  guideNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  guideName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  location: {
    fontSize: 13,
    color: Colors.secondary600,
  },
  experienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  experience: {
    fontSize: 13,
    color: Colors.secondary600,
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
  specialtiesContainer: {
    marginBottom: 12,
  },
  specialtiesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 6,
  },
  specialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specialtyTag: {
    backgroundColor: Colors.primary100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  specialtyText: {
    fontSize: 12,
    color: Colors.primary700,
    fontWeight: '500',
  },
  languagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  languagesText: {
    fontSize: 13,
    color: Colors.secondary600,
    fontWeight: '500',
  },
});
