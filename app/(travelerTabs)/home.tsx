import * as React from 'react';

import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomButton, CustomTextInput, ThemedText } from '../../components';
import { DestinationCard } from '../../components/DestinationCard';

import { TopBar } from '@/components/TopBar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Colors } from '../../constants/Colors';

export default function TravelerHomeScreen() {
  const [destination, setDestination] = useState('');
  const insets = useSafeAreaInsets(); // 👈 to handle status bar space

  const handleStartPlanning = () => {
    if (destination.trim()) {
      router.push({
        pathname: '/planning/route-selection' as any,
        params: { destination: destination.trim() }
      });
    } else {
      router.push('/planning/route-selection' as any);
    }
  };

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
            onPress={handleStartPlanning}
          />
        </View>

        {/* Destination Discovery Carousels */}
        <View style={styles.section}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>Trending Destinations</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {[{title:'Galle',desc:'Beach & Fort',img:'https://images.unsplash.com/photo-1506744038136-46273834b3fb'},{title:'Kandy',desc:'Hill Capital',img:'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd'},{title:'Ella',desc:'Nature & Views',img:'https://images.unsplash.com/photo-1465101046530-73398c7f28ca'}].map((item,i)=>(
              <DestinationCard key={i} title={item.title} desc={item.desc} img={item.img} />
            ))}
          </ScrollView>
        </View>
        <View style={styles.section}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>Local Favorites</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {[{title:'Jaffna',desc:'Culture & Cuisine',img:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee'},{title:'Matara',desc:'Southern Beaches',img:'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd'},{title:'Sigiriya',desc:'Ancient Rock',img:'https://images.unsplash.com/photo-1465101046530-73398c7f28ca'}].map((item,i)=>(
              <DestinationCard key={i} title={item.title} desc={item.desc} img={item.img} />
            ))}
          </ScrollView>
        </View>
        <View style={styles.section}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>Hidden Gems</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {[{title:'Knuckles',desc:'Mountain Range',img:'https://images.unsplash.com/photo-1465101046530-73398c7f28ca'},{title:'Kalpitiya',desc:'Dolphin Watching',img:'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd'},{title:'Haputale',desc:'Tea Country',img:'https://images.unsplash.com/photo-1506744038136-46273834b3fb'}].map((item,i)=>(
              <DestinationCard key={i} title={item.title} desc={item.desc} img={item.img} />
            ))}
          </ScrollView>
        </View>
        {/* Categorized Attractions Grid */}
        <View style={styles.section}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>Explore by Interest</ThemedText>
          <View style={styles.gridRow}>
            {[{icon:'sunny',label:'Beaches'},{icon:'business',label:'History'},{icon:'leaf',label:'Nature'},{icon:'restaurant',label:'Food'},{icon:'walk',label:'Hiking'},{icon:'color-palette',label:'Culture'}].map((cat,i)=>(
              <View key={i} style={styles.gridItem}>
                <TouchableOpacity style={styles.gridIconWrap}>
                  <Ionicons name={cat.icon as any} size={28} color={Colors.primary600} />
                </TouchableOpacity>
                <ThemedText style={styles.gridLabel}>{cat.label}</ThemedText>
              </View>
            ))}
          </View>
        </View>
        {/* Trip Planning Tools */}
        <View style={styles.section}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>Trip Planning Tools</ThemedText>
          <View style={styles.toolsRow}>
            {[{title:'Itineraries',desc:'Ready-made plans',icon:'map'},{title:'Seasonal Highlights',desc:'Best times to visit',icon:'calendar'},{title:'Transport Compare',desc:'Find best options',icon:'car'}].map((tool,i)=>(
              <View key={i} style={styles.toolCard}>
                <TouchableOpacity style={styles.toolIconWrap}>
                  <Ionicons name={tool.icon as any} size={28} color={Colors.primary600} />
                </TouchableOpacity>
                <ThemedText style={styles.toolTitle}>{tool.title}</ThemedText>
                <ThemedText style={styles.toolDesc}>{tool.desc}</ThemedText>
              </View>
            ))}
          </View>
        </View>
        {/* Personalized Elements (mocked as logged in) */}
        <View style={styles.section}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>My Trips</ThemedText>
          <View style={styles.personalRow}>
            {[{title:'Saved Plans',desc:'3 itineraries',icon:'bookmark'},{title:'Unfinished',desc:'2 drafts',icon:'document'},{title:'Upcoming',desc:'1 trip',icon:'airplane'}].map((item,i)=>(
              <View key={i} style={styles.personalCard}>
                <TouchableOpacity style={styles.personalIconWrap}>
                  <Ionicons name={item.icon as any} size={28} color={Colors.primary600} />
                </TouchableOpacity>
                <ThemedText style={styles.personalTitle}>{item.title}</ThemedText>
                <ThemedText style={styles.personalDesc}>{item.desc}</ThemedText>
              </View>
            ))}
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
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  },
  carouselCard: {
    marginRight: 16,
    width: 120,
    alignItems: 'center',
  },
  carouselImageWrap: {
    marginBottom: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.secondary200,
  },
  carouselTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: Colors.primary800,
    marginBottom: 2,
    textAlign: 'center',
  },
  carouselDesc: {
    fontSize: 13,
    color: Colors.primary600,
    textAlign: 'center',
    marginBottom: 2,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gridItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  gridIconWrap: {
    backgroundColor: Colors.primary100,
    borderRadius: 16,
    padding: 12,
    marginBottom: 6,
  },
  gridLabel: {
    fontSize: 13,
    color: Colors.primary700,
    textAlign: 'center',
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toolCard: {
    backgroundColor: Colors.primary100,
    borderRadius: 14,
    padding: 14,
    width: 110,
    alignItems: 'center',
  },
  toolIconWrap: {
    borderRadius: 16,
    padding: 8,
    marginBottom: 6,
  },
  toolTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: Colors.primary800,
    marginBottom: 2,
    textAlign: 'center',
  },
  toolDesc: {
    fontSize: 12,
    color: Colors.primary700,
    textAlign: 'center',
    marginBottom: 2,
  },
  personalRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  personalCard: {
    backgroundColor: Colors.primary100,
    borderRadius: 14,
    padding: 14,
    width: 110,
    alignItems: 'center',
  },
  personalIconWrap: {
    borderRadius: 16,
    padding: 8,
    marginBottom: 6,
  },
  personalTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: Colors.primary800,
    marginBottom: 2,
    textAlign: 'center',
  },
  personalDesc: {
    fontSize: 12,
    color: Colors.primary700,
    textAlign: 'center',
    marginBottom: 2,
  },
});





