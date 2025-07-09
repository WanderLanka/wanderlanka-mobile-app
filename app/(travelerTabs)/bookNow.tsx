import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomButton, ThemedText, TopBar } from '../../components';
import { Colors } from '../../constants/Colors';

import vehicleIcon from '../../assets/images/car.png';
import guideIcon from '../../assets/images/guide.png';
import accomodationIcon from '../../assets/images/hotel.png';


export default function BookNowScreen() {

  return (
    <SafeAreaView style={styles.container}>
          <StatusBar style="light" />
          <View style={styles.darkTopBg1} />
          
          <TopBar
                  onProfilePress={() => { /* handle profile/account */ }}
                  onNotificationsPress={() => { /* handle notifications */ }}
                  // profileImage={require('../../assets/images/profile.jpg')} // Example usage
                />
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.darkTopBg2} />

            <ThemedText variant="title" style={styles.greeting}>Book Now !</ThemedText>
            <ThemedText variant="caption" style={styles.caption}>You&#39;re just moments away from booking.</ThemedText>
            <View style={styles.buttonRow}>
                <CustomButton
                  title="Accommodations"
                  variant="primary"
                  size="large"
                  rightIcon={<Image source={accomodationIcon} style={styles.icon} />}
                  style={styles.columnButton}
                  onPress={() => { /* handle accommodations */ }}
                />
                <CustomButton
                  title="Transportation"
                  variant="primary"
                  size="large"
                  rightIcon={<Image source={vehicleIcon} style={styles.icon} />}
                  style={styles.columnButton}
                  onPress={() => { /* handle vehicles */ }}
                />
              <CustomButton
                title="Tour Guides"
                variant="primary"
                size="large"
                rightIcon={<Image source={guideIcon} style={styles.icon} />}
                style={styles.columnButton}
                onPress={() => { /* handle guides */ }}
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
    position: 'relative',
  },

    darkTopBg1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40, // enough to cover greeting, subtitle, and half the input
    backgroundColor: Colors.primary800,
    zIndex: 0,
  },

  darkTopBg2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 130, // enough to cover greeting, subtitle, and half the input
    backgroundColor: Colors.primary800,
    zIndex: 0,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 30,
    paddingBottom: 10,
    zIndex: 5,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 0,
  },

  greeting: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 24,
    fontWeight: '300',
    color: Colors.white,
    zIndex: 2,
  },
  caption: {
    color: Colors.primary100,
    marginBottom: 30,
    zIndex: 2,
  },
  
  buttonRow: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 50,
    gap: 5,
  },

  columnButton: {
    width: '100%',
    minHeight: 120,
    marginVertical: 5,
    justifyContent: "space-between",
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