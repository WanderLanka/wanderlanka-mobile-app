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

export default function TransportBookingScreen() {
  const params = useLocalSearchParams();
  const { destination, startDate, endDate } = params;

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

  // Mock transport data - in real app, this would come from API
  const transports: Transport[] = [
    {
      id: '1',
      type: 'car',
      name: 'Toyota Corolla Hybrid',
      provider: 'Lanka Car Rentals',
      rating: 4.8,
      reviewCount: 89,
      pricePerDay: 35,
      capacity: '4 passengers',
      transmission: 'Automatic',
      fuel: 'Hybrid',
      features: ['AC', 'GPS', 'Insurance', 'Driver Available'],
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d',
      description: 'Comfortable and fuel-efficient car perfect for city tours and highway travel.',
      availability: true,
    },
    {
      id: '2',
      type: 'van',
      name: 'Toyota Hiace Van',
      provider: 'Ceylon Tours',
      rating: 4.7,
      reviewCount: 156,
      pricePerDay: 55,
      capacity: '8 passengers',
      transmission: 'Manual',
      fuel: 'Diesel',
      features: ['AC', 'Professional Driver', 'Tourism Guide', 'WiFi'],
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957',
      description: 'Spacious van with experienced driver, ideal for group tours and long distances.',
      availability: true,
    },
    {
      id: '3',
      type: 'tuk-tuk',
      name: 'Traditional Tuk Tuk',
      provider: 'Tuk Tuk Adventures',
      rating: 4.6,
      reviewCount: 234,
      pricePerDay: 25,
      capacity: '3 passengers',
      transmission: 'Manual',
      fuel: 'Petrol',
      features: ['Local Experience', 'City Tours', 'Flexible Routes'],
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
      description: 'Authentic Sri Lankan experience with local tuk tuk drivers for short trips.',
      availability: true,
    },
    {
      id: '4',
      type: 'bike',
      name: 'Royal Enfield 350',
      provider: 'Adventure Bikes LK',
      rating: 4.9,
      reviewCount: 67,
      pricePerDay: 30,
      capacity: '2 passengers',
      transmission: 'Manual',
      fuel: 'Petrol',
      features: ['Helmets', 'Insurance', 'Adventure Routes', 'Support Team'],
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13',
      description: 'Perfect for adventure seekers wanting to explore hill country and coastal roads.',
      availability: false,
    },
    {
      id: '5',
      type: 'bus',
      name: 'Luxury Tourist Bus',
      provider: 'Comfort Travel',
      rating: 4.5,
      reviewCount: 45,
      pricePerDay: 80,
      capacity: '25 passengers',
      transmission: 'Automatic',
      fuel: 'Diesel',
      features: ['Reclining Seats', 'AC', 'Entertainment', 'Refreshments'],
      image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e',
      description: 'Luxury bus service for large groups with premium comfort and amenities.',
      availability: true,
    },
  ];

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
            pathname: '/planning/booking/transport-details',
            params: {
              transportId: transport.id,
              destination,
              startDate,
              endDate,
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
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
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
  transportCard: {
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
  transportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
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
    padding: 16,
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
});
