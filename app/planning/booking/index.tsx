import { CustomButton, ThemedText } from '../../../components';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Colors } from '../../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BookingScreen() {
  const params = useLocalSearchParams();
  const { destination, startPoint, startDate, endDate } = params;

  const bookingOptions = [
    {
      id: 'accommodation',
      title: 'Accommodation',
      subtitle: 'Hotels, hostels, and vacation rentals',
      icon: 'bed-outline',
      comingSoon: true,
    },
    {
      id: 'guides',
      title: 'Tour Guides',
      subtitle: 'Local experts and cultural guides',
      icon: 'person-outline',
      comingSoon: true,
    },
    {
      id: 'transport',
      title: 'Transportation',
      subtitle: 'Cars, bikes, and public transport',
      icon: 'car-outline',
      comingSoon: true,
    },
  ];

  const handleBookingOption = (optionId: string) => {
    // TODO: Navigate to specific booking screens
    console.log('Booking option selected:', optionId);
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
          From {startPoint} • {startDate} to {endDate}
        </ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.sectionTitle}>Complete Your Booking</ThemedText>
        
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
            <ThemedText style={styles.infoTitle}>Booking Features</ThemedText>
            <ThemedText style={styles.infoText}>
              Accommodation, guide, and transportation booking features are currently in development. 
              You can use the existing route planning features to plan your perfect trip to Sri Lanka.
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
});
