import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { CustomTextInput, ThemedText, CustomButton } from '../../components';
import { Ionicons } from '@expo/vector-icons';

export default function BookNowScreen() {

  return (
    <SafeAreaView style={styles.container}>
          <StatusBar style="light" />
          <View style={styles.darkTopBg} />
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} onPress={() => { /* open menu */ }}>
              <Ionicons name="menu" size={28} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => { /* open notifications */ }}>
              <Ionicons name="notifications-outline" size={26} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <ThemedText variant="title" style={styles.greeting}>Book Now !</ThemedText>
            <ThemedText variant="caption" style={styles.caption}>You&#39;re just moments away from booking.</ThemedText>
            <View style={styles.buttonRow}>
              <CustomButton
                title="Accommodations"
                variant="primary"
                style={styles.columnButton}
                onPress={() => { /* handle accommodations */ }}
              />
              <CustomButton
                title="Vehicles"
                variant="primary"
                style={styles.columnButton}
                onPress={() => { /* handle vehicles */ }}
              />
              <CustomButton
                title="Guides"
                variant="primary"
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

  darkTopBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 210, // enough to cover greeting, subtitle, and half the input
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
    zIndex: 2,
  },

  iconButton: {
    padding: 8,
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
  
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary700,
  },
  placeholderBox: {
    flexDirection: 'row',
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
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
    borderRadius: 35,
  },
});
