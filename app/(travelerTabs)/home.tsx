import { TopBar } from '@/components/TopBar';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomButton, CustomTextInput, ThemedText } from '../../components';
import { Colors } from '../../constants/Colors';

export default function TravelerHomeScreen() {
  const [destination, setDestination] = useState('');
  const insets = useSafeAreaInsets(); // 👈 to handle status bar space

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <StatusBar style="light" translucent />

      <TopBar
        onProfilePress={() => {}}
        onNotificationsPress={() => {}}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.greetingContainer}>
          <ThemedText variant="title" style={styles.greeting}>Welcome Machan!</ThemedText>
          <ThemedText variant="caption" style={styles.caption}>Explore Sri Lanka With Us!</ThemedText>
        </View>

        <View style={styles.searchArea}>
          <CustomTextInput
            label=''
            value={destination}
            onChangeText={setDestination}
            placeholder="Where do you want to go ?"
            leftIcon="search"
            containerStyle={styles.searchInput}
          />
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
        {/* Add more sections... */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },

  scrollView: {
    flex: 1,
    zIndex: 1,
  },

  scrollContent: {
    paddingBottom: 40,
    paddingTop: 0,
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

  searchArea: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },

  searchInput: {
    alignSelf: 'stretch',
    borderRadius: 15,

    shadowColor: Colors.secondary500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,

    elevation: 25,

  },

  searchButton: {
    width: 200,
    backgroundColor: Colors.primary600,
  },

  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
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
  navArrowbg: {
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





