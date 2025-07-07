import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CustomTextInput, ThemedText, CustomButton } from '../../components';
import * as React from 'react';
import { useState } from 'react';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function TravelerHomeScreen() {
  const [destination, setDestination] = useState('');

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
        <ThemedText variant="title" style={styles.greeting}>Hello Traveler !</ThemedText>
        <ThemedText variant="caption" style={styles.caption}>Explore Sri Lanka With Us!</ThemedText>
        
        <CustomTextInput
          label=''
          value={destination}
          onChangeText={setDestination}
          placeholder="Where do you want to go ?"
          leftIcon="search"
        />

        <View style = {styles.searchButtonArea}>
        <CustomButton
            variant='primary'
            size='small'
            title="Plan My Trip"
            style={styles.searchButton}
        />
        </View>

        <View style={styles.section}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>Popular Places</ThemedText>
          <View style={styles.placeholderBox}><Text>Popular places go here</Text></View>
        </View>

        <View style={styles.section}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>Best Deals</ThemedText>
          <View style={styles.placeholderBox}><Text>Best deals go here</Text></View>
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
    paddingTop: 20,
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
    height: 100,
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonArea:{
    alignItems: 'center',
    marginBottom: 30,
  },
  searchButton:{
    marginTop: 5,
    width: 300,
  }
});

