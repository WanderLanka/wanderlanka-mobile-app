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
        <View style={styles.greetingContainer}>
          <ThemedText variant="title" style={styles.greeting}>Book Now !</ThemedText>
          <ThemedText variant="caption" style={styles.caption}>You&#39;re just moments away from booking.</ThemedText>
        </View>
        <View style={styles.buttonRow}>
          <CustomButton
            title="Accommodations"
            variant="primary"
            size="large"
            rightIcon={<Image source={accomodationIcon} style={styles.icon} />}
            style={styles.columnButton}
            onPress={() => router.push('/accomodation/acc_home')}
          />
          <CustomButton
            title="Transportation"
            variant="primary"
            size="large"
            rightIcon={<Image source={vehicleIcon} style={styles.icon} />}
            style={styles.columnButton}
            onPress={() => router.push('/transportation/tra_home')}
          />
          <CustomButton
            title="Tour Guides"
            variant="primary"
            size="large"
            rightIcon={<Image source={guideIcon} style={styles.icon} />}
            style={styles.columnButton}
            onPress={() => router.push('/tour_guides/gui_home')}
          />
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
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 0,
  },
  buttonRow: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 50,
    gap: 5,
    paddingHorizontal: 20,
  },
  columnButton: {
    width: '100%',
    minHeight: 120,
    marginVertical: 5,
    justifyContent: 'space-between',
    backgroundColor: Colors.primary800,
    borderTopLeftRadius: 100,
    borderBottomLeftRadius: 100,
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,
  },
  icon: {
    width: 100,
    height: 100,
    marginRight: -10,
    resizeMode: 'contain',
  },
});