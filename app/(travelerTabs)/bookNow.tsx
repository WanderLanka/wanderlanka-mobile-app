import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import vehicleIcon from '../../assets/images/car.png';
import guideIcon from '../../assets/images/guide.png';
import accomodationIcon from '../../assets/images/hotel.png';
import { CustomButton, ThemedText, TopBar } from '../../components';
import { Colors } from '../../constants/Colors';


export default function BookNowScreen() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <StatusBar style="light" translucent />
      <TopBar
        onProfilePress={() => { /* handle profile/account */ }}
        onNotificationsPress={() => { /* handle notifications */ }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.greetingContainer}>
          <ThemedText variant="title" style={styles.greeting}>Book Now !</ThemedText>
          <ThemedText variant="caption" style={styles.caption}>You&#39;re just moments away from booking.</ThemedText>
        </View>

        {/* Book Services Section */}
        <View style={styles.servicesSection}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>What do you want to book?</ThemedText>
          <View style={styles.buttonRow}>
            <View style={styles.buttonContainer}>
              <View style={styles.serviceButton}>
                <Image source={accomodationIcon} style={styles.buttonIcon} />
                <ThemedText style={styles.buttonText}>Accommodations</ThemedText>
                <CustomButton
                  title=""
                  variant="primary"
                  style={styles.invisibleButton}
                  onPress={() => router.push('/accomodation/acc_home')}
                />
              </View>
            </View>
            <View style={styles.buttonContainer}>
              <View style={styles.serviceButton}>
                <Image source={vehicleIcon} style={styles.buttonIcon} />
                <ThemedText style={styles.buttonText}>Transportation</ThemedText>
                <CustomButton
                  title=""
                  variant="primary"
                  style={styles.invisibleButton}
                  onPress={() => router.push('/transportation/tra_home')}
                />
              </View>
            </View>
            <View style={styles.buttonContainer}>
              <View style={styles.serviceButton}>
                <Image source={guideIcon} style={styles.buttonIcon} />
                <ThemedText style={styles.buttonText}>Tour Guides</ThemedText>
                <CustomButton
                  title=""
                  variant="primary"
                  style={styles.invisibleButton}
                  onPress={() => router.push('/tour_guides/gui_home')}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Section Separator */}
        <View style={styles.sectionSeparator} />

        {/* Upcoming Bookings Section */}
        <View style={styles.upcomingSection}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>Upcoming Bookings</ThemedText>
            <CustomButton
              title="See More"
              variant="outline"
              size="small"
              style={styles.seeMoreButton}
              onPress={() => router.push('/bookings')}
            />
          </View>
          
          <View style={styles.bookingsList}>
            {/* Booking Item 1 */}
            <View style={styles.bookingItem}>
              <View style={styles.bookingDot} />
              <View style={styles.bookingDetails}>
                <ThemedText style={styles.bookingTitle}>Galle Face Hotel</ThemedText>
                <ThemedText style={styles.bookingDate}>Check-in: Dec 25, 2024 • Confirmed</ThemedText>
              </View>
              <View style={styles.bookingImage}>
                <Image source={accomodationIcon} style={styles.bookingIcon} />
              </View>
            </View>

            {/* Booking Item 2 */}
            <View style={styles.bookingItem}>
              <View style={styles.bookingDot} />
              <View style={styles.bookingDetails}>
                <ThemedText style={styles.bookingTitle}>Airport Transfer</ThemedText>
                <ThemedText style={styles.bookingDate}>Pickup: Dec 24, 2024 • Pending</ThemedText>
              </View>
              <View style={styles.bookingImage}>
                <Image source={vehicleIcon} style={styles.bookingIcon} />
              </View>
            </View>

            {/* Booking Item 3 */}
            <View style={styles.bookingItem}>
              <View style={styles.bookingDot} />
              <View style={styles.bookingDetails}>
                <ThemedText style={styles.bookingTitle}>City Tour Guide</ThemedText>
                <ThemedText style={styles.bookingDate}>Tour: Dec 26, 2024 • Confirmed</ThemedText>
              </View>
              <View style={styles.bookingImage}>
                <Image source={guideIcon} style={styles.bookingIcon} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary800,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 0,
  },

  
  // Section Separator
  sectionSeparator: {
    height: 1,
    backgroundColor: Colors.secondary200,
    marginVertical: 20,
    marginHorizontal: 20,
  },
  
  // Header Section
  greetingContainer: {
    backgroundColor: Colors.primary800,
    alignSelf: 'stretch',
    width: '100%',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 24,
    fontWeight: '400',
    color: Colors.white,
    zIndex: 2,
  },
  caption: {
    color: Colors.primary100,
    marginBottom: 20,
    zIndex: 2,
  },

  // Services Section
  servicesSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
    paddingHorizontal: 0,
  },
  buttonContainer: {
    width: '32%',
    alignItems: 'center',
    marginHorizontal: '0.67%',
  },
  serviceButton: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.primary800,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    position: 'relative',
  },
  buttonIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 14,
  },
  invisibleButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },

  // Upcoming Bookings Section
  upcomingSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  seeMoreButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bookingsList: {
    gap: 0,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },
  bookingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary600,
    marginRight: 12,
  },
  bookingDetails: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  bookingImage: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
});