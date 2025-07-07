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
           containerStyle={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            borderRadius:15,
          }}
        />

        <View style = {styles.searchButtonArea}>
        <CustomButton
            variant='primary'
            size='small'
            title="Start Planning"
            style={styles.searchButton}
        />
        </View>

        <View style={styles.section}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>Popular Places</ThemedText>
          <View style={styles.placeholderBox}>
             <TouchableOpacity>
                <View style={styles.navArrowbg}>
                <Ionicons name="chevron-back-outline" size={20} color={Colors.primary700} />
                </View>
              </TouchableOpacity>
    
            <ThemedText>Popular places go here</ThemedText>

            <TouchableOpacity>
              <View style={styles.navArrowbg}>
              <Ionicons name="chevron-forward-outline" size={20} color={Colors.primary700} />
              </View>
            </TouchableOpacity> 
          </View>
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
  searchButtonArea:{
    alignItems: 'center',
    marginBottom: 30,
  },
  searchButton:{
    marginTop: 5,
    width: 200,
    backgroundColor: Colors.primary600,
  },
  
  navArrowbg:{
    backgroundColor: Colors.primary100,
    borderRadius: 20,
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary200,
    shadowOpacity: 0.3,
    shadowRadius: 2,
  }

});

