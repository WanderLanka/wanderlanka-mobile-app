import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CustomTextInput, ThemedText, CustomButton } from '../../components';
import * as React from 'react';
import { useState } from 'react';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { TopBar } from '@/components/TopBar';



export default function TravelerHomeScreen() {
  const [destination, setDestination] = useState('');

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

        <ThemedText variant="title" style={styles.greeting}>Welcome Machan!</ThemedText>
        <ThemedText variant="caption" style={styles.caption}>Explore Sri Lanka With Us!</ThemedText>
        <CustomTextInput
          label=''
          value={destination}
          onChangeText={setDestination}
          placeholder="Where do you want to go ?"
          leftIcon="search"
           containerStyle={{
            shadowColor: Colors.primary800,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            borderRadius:15,
            elevation: 20,
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
    
            <ThemedText>Recommended Places go here</ThemedText>

            <TouchableOpacity>
              <View style={styles.navArrowbg}>
              <Ionicons name="chevron-forward-outline" size={20} color={Colors.primary700} />
              </View>
            </TouchableOpacity> 
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>Best Deals</ThemedText>
            <View style={styles.placeholderBox}>
             <TouchableOpacity>
                <View style={styles.navArrowbg}>
                <Ionicons name="chevron-back-outline" size={20} color={Colors.primary700} />
                </View>
              </TouchableOpacity>
    
              <ThemedText>Re go here</ThemedText>

              <TouchableOpacity>
                <View style={styles.navArrowbg}>
                <Ionicons name="chevron-forward-outline" size={20} color={Colors.primary700} />
                </View>
              </TouchableOpacity> 
            </View>        
          </View>

          <View style={styles.section}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>Best Deals</ThemedText>
            <View style={styles.placeholderBox}>
             <TouchableOpacity>
                <View style={styles.navArrowbg}>
                <Ionicons name="chevron-back-outline" size={20} color={Colors.primary700} />
                </View>
              </TouchableOpacity>
    
              <ThemedText>Re go here</ThemedText>

              <TouchableOpacity>
                <View style={styles.navArrowbg}>
                <Ionicons name="chevron-forward-outline" size={20} color={Colors.primary700} />
                </View>
              </TouchableOpacity> 
            </View>        
          </View>

          <View style={styles.section}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>Best Deals</ThemedText>
            <View style={styles.placeholderBox}>
             <TouchableOpacity>
                <View style={styles.navArrowbg}>
                <Ionicons name="chevron-back-outline" size={20} color={Colors.primary700} />
                </View>
              </TouchableOpacity>
    
              <ThemedText>Re go here</ThemedText>

              <TouchableOpacity>
                <View style={styles.navArrowbg}>
                <Ionicons name="chevron-forward-outline" size={20} color={Colors.primary700} />
                </View>
              </TouchableOpacity> 
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
    marginBottom: 20,
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

