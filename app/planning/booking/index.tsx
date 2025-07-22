import { router, useLocalSearchParams } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { CustomButton, ThemedText } from '../../../components';

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';

export default function BookingScreen() {
  const params = useLocalSearchParams();
  const { destination, startPoint, startDate, endDate, destinations, itinerary } = params;

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

  // Parse destinations from the trip planning data
  const selectedPlaces = destinations ? JSON.parse(destinations as string) : [destination];

  // Format dates for better display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString as string);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const bookingOptions = [
    {
      id: 'accommodation',
      title: 'Accommodation',
      subtitle: 'Hotels, hostels, and vacation rentals',
      icon: 'bed-outline',
      comingSoon: false,
    },
    {
      id: 'guides',
      title: 'Tour Guides',
      subtitle: 'Local experts and cultural guides',
      icon: 'person-outline',
      comingSoon: false,
    },
    {
      id: 'transport',
      title: 'Transportation',
      subtitle: 'Cars, bikes, and public transport',
      icon: 'car-outline',
      comingSoon: false,
    },
  ];

  const handleBookingOption = (optionId: string) => {
    // Navigate to specific booking screens with trip details
    const tripParams = {
      destination,
      startPoint,
      startDate,
      endDate,
      destinations,
      itinerary,
    };

    switch (optionId) {
      case 'accommodation':
        router.push({
          pathname: '/planning/booking/accommodation',
          params: tripParams,
        });
        break;
      case 'guides':
        router.push({
          pathname: '/planning/booking/guides',
          params: tripParams,
        });
        break;
      case 'transport':
        router.push({
          pathname: '/planning/booking/transport',
          params: tripParams,
        });
        break;
      default:
        console.log('Unknown booking option:', optionId);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.secondary700} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Book Your Trip</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tripSummary}>
        <ThemedText style={styles.tripTitle}>{destination}</ThemedText>
        <ThemedText style={styles.tripSubtitle}>
          {formatDate(startDate as string)} - {formatDate(endDate as string)} • {tripDuration} {tripDuration === 1 ? 'day' : 'days'} • From {startPoint}
        </ThemedText>
      </View>

      {/* Trip Details Section */}
      <View style={styles.tripDetailsContainer}>
        <View style={styles.tripDetailsHeader}>
          <Ionicons name="map" size={20} color={Colors.primary600} />
          <ThemedText style={styles.tripDetailsTitle}>Trip Overview</ThemedText>
        </View>
        
        <View style={styles.tripStatsRow}>
          <View style={styles.tripStat}>
            <Ionicons name="calendar-outline" size={16} color={Colors.secondary500} />
            <ThemedText style={styles.tripStatValue}>{tripDuration}</ThemedText>
            <ThemedText style={styles.tripStatLabel}>{tripDuration === 1 ? 'Day' : 'Days'}</ThemedText>
          </View>
          <View style={styles.tripStat}>
            <Ionicons name="location-outline" size={16} color={Colors.secondary500} />
            <ThemedText style={styles.tripStatValue}>{selectedPlaces.length}</ThemedText>
            <ThemedText style={styles.tripStatLabel}>{selectedPlaces.length === 1 ? 'Place' : 'Places'}</ThemedText>
          </View>
          <View style={styles.tripStat}>
            <Ionicons name="home-outline" size={16} color={Colors.secondary500} />
            <ThemedText style={styles.tripStatValue}>1</ThemedText>
            <ThemedText style={styles.tripStatLabel}>Start Point</ThemedText>
          </View>
        </View>

        {selectedPlaces.length > 1 && (
          <View style={styles.destinationsContainer}>
            <ThemedText style={styles.destinationsLabel}>Your Planned Destinations:</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.destinationsScroll}>
              {selectedPlaces.map((place: string, index: number) => (
                <View key={index} style={styles.destinationChip}>
                  <ThemedText style={styles.destinationChipText}>{place}</ThemedText>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.sectionTitle}>What would you like to book?</ThemedText>
        
        {bookingOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.bookingOption}
            onPress={() => handleBookingOption(option.id)}
            disabled={option.comingSoon}
          >
            <View style={styles.optionIcon}>
              <Ionicons 
                name={option.icon as any} 
                size={24} 
                color={option.comingSoon ? Colors.secondary400 : Colors.primary600} 
              />
            </View>
            <View style={styles.optionInfo}>
              <ThemedText style={[
                styles.optionTitle,
                option.comingSoon && styles.comingSoonText
              ]}>
                {option.title}
              </ThemedText>
              <ThemedText style={[
                styles.optionSubtitle,
                option.comingSoon && styles.comingSoonText
              ]}>
                {option.subtitle}
              </ThemedText>
            </View>
            {option.comingSoon ? (
              <View style={styles.comingSoonBadge}>
                <ThemedText style={styles.comingSoonBadgeText}>Coming Soon</ThemedText>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={20} color={Colors.secondary400} />
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={Colors.info} />
          <View style={styles.infoContent}>
            <ThemedText style={styles.infoTitle}>Book Your Perfect Trip</ThemedText>
            <ThemedText style={styles.infoText}>
              Select from accommodation, tour guides, or transportation options. 
              We&apos;ll show you the best available options near your planned destinations.
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <CustomButton
          title="Back to Home"
          onPress={() => router.push('/(travelerTabs)/home')}
          style={styles.backButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  tripSummary: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  tripTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  tripSubtitle: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.secondary700,
    marginTop: 24,
    marginBottom: 16,
  },
  bookingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginBottom: 12,
    borderRadius: 12,
    padding: 20,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  comingSoonText: {
    color: Colors.secondary400,
  },
  comingSoonBadge: {
    backgroundColor: Colors.secondary200,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  comingSoonBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.secondary500,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginTop: 24,
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.secondary500,
    lineHeight: 20,
  },
  bottomActions: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
  },
  backButton: {
    backgroundColor: Colors.secondary500,
    borderRadius: 12,
    paddingVertical: 16,
  },
  tripDetailsContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  tripDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  tripDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  tripStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  tripStat: {
    alignItems: 'center',
    gap: 4,
  },
  tripStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary600,
  },
  tripStatLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    fontWeight: '500',
  },
  destinationsContainer: {
    marginTop: 8,
  },
  destinationsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 8,
  },
  destinationsScroll: {
    marginBottom: 4,
  },
  destinationChip: {
    backgroundColor: Colors.primary100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  destinationChipText: {
    fontSize: 13,
    color: Colors.primary700,
    fontWeight: '500',
  },
});
