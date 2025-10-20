import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components';
import { Colors } from '@/constants/Colors';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 'AIzaSyBPAjLGZlFyzwIRo60j3HlhR7Qp0pmqQQ8';

interface Destination {
  title: string;
  desc: string;
  img: string;
  placeId: string;
  rating?: number;
}

export default function DestinationsListScreen() {
  const params = useLocalSearchParams();
  const category = params.category as string;
  const title = params.title as string;
  
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDestinations();
  }, [category]);

  const fetchDestinations = async () => {
    try {
      setIsLoading(true);
      console.log(`🔍 Fetching ${category} destinations...`);
      
      let searchQuery = '';
      
      switch (category) {
        case 'trending':
          searchQuery = 'popular tourist attractions Sri Lanka';
          break;
        case 'local':
          searchQuery = 'local restaurants markets Sri Lanka';
          break;
        case 'hidden':
          searchQuery = 'scenic spots viewpoints Sri Lanka';
          break;
        default:
          searchQuery = 'tourist attractions Sri Lanka';
      }
      
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_PLACES_API_KEY}`;
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results) {
        const places = data.results
          .filter((place: any) => place.rating && place.rating >= 4.0)
          .slice(0, 20) // Get top 20 results
          .map((place: any) => ({
            title: place.name,
            desc: place.types?.[0]?.replace(/_/g, ' ') || place.vicinity || 'Destination',
            img: place.photos?.[0]?.photo_reference 
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
              : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
            placeId: place.place_id,
            rating: place.rating,
          }));
        
        setDestinations(places);
        console.log(`✅ Loaded ${places.length} destinations`);
      }
      
    } catch (error: any) {
      console.error(`❌ Error fetching ${category} destinations:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDestinationPress = (destination: Destination) => {
    // Navigate to full-screen place details
    router.push({
      pathname: '/place-details/[placeId]' as any,
      params: { placeId: destination.placeId, placeName: destination.title }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary800} />
        </TouchableOpacity>
        <ThemedText variant="title" style={styles.headerTitle}>{title}</ThemedText>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary600} />
          <ThemedText style={styles.loadingText}>Loading destinations...</ThemedText>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {destinations.map((destination, index) => (
            <TouchableOpacity
              key={index}
              style={styles.destinationCard}
              onPress={() => handleDestinationPress(destination)}
              activeOpacity={0.7}
            >
              <Image 
                source={{ uri: destination.img }} 
                style={styles.destinationImage}
                resizeMode="cover"
              />
              <View style={styles.destinationInfo}>
                <View style={styles.destinationHeader}>
                  <ThemedText variant="subtitle" style={styles.destinationTitle} numberOfLines={1}>
                    {destination.title}
                  </ThemedText>
                  {destination.rating && (
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color={Colors.warning} />
                      <ThemedText style={styles.ratingText}>{destination.rating.toFixed(1)}</ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText style={styles.destinationDesc} numberOfLines={2}>
                  {destination.desc}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
          
          {destinations.length === 0 && !isLoading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color={Colors.primary300} />
              <ThemedText style={styles.emptyText}>No destinations found</ThemedText>
            </View>
          )}
        </ScrollView>
      )}
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
    borderBottomColor: Colors.primary100,
  },
  
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary800,
    flex: 1,
    textAlign: 'center',
  },
  
  placeholder: {
    width: 40,
  },
  
  scrollView: {
    flex: 1,
  },
  
  contentContainer: {
    padding: 20,
  },
  
  destinationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary800,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  
  destinationImage: {
    width: 120,
    height: 120,
  },
  
  destinationInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  
  destinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  
  destinationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary800,
    flex: 1,
    marginRight: 8,
  },
  
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary700,
  },
  
  destinationDesc: {
    fontSize: 13,
    color: Colors.primary600,
    lineHeight: 18,
  },
  
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.primary600,
  },
  
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.primary600,
  },
});
