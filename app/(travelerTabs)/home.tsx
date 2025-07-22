import * as React from 'react';

import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const openSearchModal = () => {
    setIsSearchModalVisible(true);
    setSearchQuery(destination);
  };

  const closeSearchModal = () => {
    setIsSearchModalVisible(false);
  };

  const handleSearchConfirm = () => {
    setDestination(searchQuery);
    closeSearchModal();
    if (searchQuery.trim()) {
      router.push({
        pathname: '/planning/route-selection' as any,
        params: { destination: searchQuery.trim() }
      });
    }
  };

  // Mock search suggestions with different categories
  const searchSuggestions = [
    // Places
    { type: 'place', name: 'Galle Fort', category: 'Historic Site', icon: 'location' },
    { type: 'place', name: 'Kandy Temple', category: 'Religious Site', icon: 'location' },
    { type: 'place', name: 'Ella Rock', category: 'Hiking Spot', icon: 'location' },
    { type: 'place', name: 'Sigiriya Rock', category: 'Ancient Wonder', icon: 'location' },
    { type: 'place', name: 'Mirissa Beach', category: 'Beach', icon: 'location' },
    // Activities
    { type: 'activity', name: 'Whale Watching', category: 'Adventure', icon: 'boat' },
    { type: 'activity', name: 'Tea Plantation Tour', category: 'Cultural', icon: 'leaf' },
    { type: 'activity', name: 'Safari Experience', category: 'Wildlife', icon: 'paw' },
    // People/Guides
    { type: 'guide', name: 'Local Guide Nimal', category: 'Tour Guide', icon: 'person' },
    { type: 'guide', name: 'Cultural Expert Saman', category: 'Heritage Guide', icon: 'person' },
  ];

  const filteredSuggestions = searchSuggestions.filter(suggestion =>
    suggestion.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    suggestion.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        <View style={styles.searchContainer}>
          <View style={styles.searchCard}>
            <View style={styles.searchInputWrapper}>
              <Pressable onPress={openSearchModal} style={styles.searchInputPressable}>
                <View style={styles.searchInputDisplay}>
                  <Ionicons name="search" size={20} color={Colors.primary600} style={styles.searchIcon} />
                  <ThemedText style={[styles.searchPlaceholder, {color: destination ? Colors.primary700 : Colors.secondary400}]}>
                    {destination || "Search places, people, activities..."}
                  </ThemedText>
                </View>
              </Pressable>
            </View>
            
            <CustomButton
              variant='primary'
              size='medium'
              title="Start Planning"
              style={styles.searchButton}
              onPress={handleStartPlanning}
            />
          </View>
        </View>

        {/* Search Modal */}
        <Modal
          visible={isSearchModalVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={closeSearchModal}
          statusBarTranslucent={true}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeSearchModal} style={styles.closeButton}>
                <Ionicons name="arrow-back" size={24} color={Colors.primary700} />
              </TouchableOpacity>
              <ThemedText variant="subtitle" style={styles.modalTitle}>Search & Discover</ThemedText>
              <View style={styles.placeholder} />
            </View>
            
            <View style={styles.modalSearchArea}>
              <CustomTextInput
                label=""
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search places, people, activities..."
                leftIcon="search"
                containerStyle={styles.modalSearchInput}
                autoFocus
              />
              <CustomButton
                variant='primary'
                size='small'
                title="Search"
                style={styles.modalSearchButton}
                onPress={handleSearchConfirm}
              />
            </View>

            <ScrollView style={styles.modalContent}>
              {searchQuery.length > 0 && (
                <View style={styles.suggestionsSection}>
                  <ThemedText variant="subtitle" style={styles.suggestionsTitle}>
                    Search Results
                  </ThemedText>
                  {filteredSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setSearchQuery(suggestion.name);
                        setDestination(suggestion.name);
                        closeSearchModal();
                      }}
                    >
                      <Ionicons name={suggestion.icon as any} size={18} color={Colors.primary600} />
                      <View style={styles.suggestionTextContainer}>
                        <ThemedText style={styles.suggestionText}>{suggestion.name}</ThemedText>
                        <ThemedText style={styles.suggestionCategory}>{suggestion.category}</ThemedText>
                      </View>
                      <View style={styles.suggestionType}>
                        <ThemedText style={styles.suggestionTypeText}>
                          {suggestion.type === 'place' ? 'Place' : suggestion.type === 'activity' ? 'Activity' : 'Guide'}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <View style={styles.quickSearchSection}>
                <ThemedText variant="subtitle" style={styles.quickSearchTitle}>
                  Quick Search
                </ThemedText>
                
                <View style={styles.categorySection}>
                  <ThemedText style={styles.categoryTitle}>Popular Places</ThemedText>
                  <View style={styles.popularGrid}>
                    {['Galle', 'Kandy', 'Ella', 'Sigiriya', 'Mirissa', 'Yala'].map((place, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.popularItem}
                        onPress={() => {
                          setSearchQuery(place);
                          setDestination(place);
                          closeSearchModal();
                        }}
                      >
                        <ThemedText style={styles.popularItemText}>{place}</ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.categorySection}>
                  <ThemedText style={styles.categoryTitle}>Activities</ThemedText>
                  <View style={styles.popularGrid}>
                    {['Whale Watching', 'Safari', 'Tea Tours', 'Hiking', 'Surfing', 'Photography'].map((activity, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.popularItem, {backgroundColor: Colors.secondary100}]}
                        onPress={() => {
                          setSearchQuery(activity);
                          setDestination(activity);
                          closeSearchModal();
                        }}
                      >
                        <ThemedText style={styles.popularItemText}>{activity}</ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.categorySection}>
                  <ThemedText style={styles.categoryTitle}>Find People</ThemedText>
                  <View style={styles.popularGrid}>
                    {['Tour Guides', 'Local Experts', 'Travel Buddies', 'Photographers'].map((people, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.popularItem, {backgroundColor: Colors.warning}]}
                        onPress={() => {
                          setSearchQuery(people);
                          setDestination(people);
                          closeSearchModal();
                        }}
                      >
                        <ThemedText style={styles.popularItemText}>{people}</ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Destination Discovery Carousels */}
        <View style={styles.discoverSection}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>Trending Destinations</ThemedText>
            <TouchableOpacity style={styles.seeAllButton}>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary600} />
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.carouselContainer}
            style={styles.carousel}
          >
            {[{title:'Galle',desc:'Beach & Fort',img:'https://images.unsplash.com/photo-1506744038136-46273834b3fb'},{title:'Kandy',desc:'Hill Capital',img:'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd'},{title:'Ella',desc:'Nature & Views',img:'https://images.unsplash.com/photo-1465101046530-73398c7f28ca'}].map((item,i)=>(
              <DestinationCard key={i} title={item.title} desc={item.desc} img={item.img} />
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.discoverSection}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>Local Favorites</ThemedText>
            <TouchableOpacity style={styles.seeAllButton}>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary600} />
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.carouselContainer}
            style={styles.carousel}
          >
            {[{title:'Jaffna',desc:'Culture & Cuisine',img:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee'},{title:'Matara',desc:'Southern Beaches',img:'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd'},{title:'Sigiriya',desc:'Ancient Rock',img:'https://images.unsplash.com/photo-1465101046530-73398c7f28ca'}].map((item,i)=>(
              <DestinationCard key={i} title={item.title} desc={item.desc} img={item.img} />
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.discoverSection}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>Hidden Gems</ThemedText>
            <TouchableOpacity style={styles.seeAllButton}>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary600} />
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.carouselContainer}
            style={styles.carousel}
          >
            {[{title:'Knuckles',desc:'Mountain Range',img:'https://images.unsplash.com/photo-1465101046530-73398c7f28ca'},{title:'Kalpitiya',desc:'Dolphin Watching',img:'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd'},{title:'Haputale',desc:'Tea Country',img:'https://images.unsplash.com/photo-1506744038136-46273834b3fb'}].map((item,i)=>(
              <DestinationCard key={i} title={item.title} desc={item.desc} img={item.img} />
            ))}
          </ScrollView>
        </View>
        {/* Categorized Attractions Grid */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeaderWithDescription}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>Explore by Interest</ThemedText>
            <ThemedText style={styles.sectionDescription}>Find your perfect adventure</ThemedText>
          </View>
          <View style={styles.categoriesGrid}>
            {[
              {icon:'sunny',label:'Beaches',gradient:['#FFE066','#FF6B35']},
              {icon:'business',label:'History',gradient:['#667eea','#764ba2']},
              {icon:'leaf',label:'Nature',gradient:['#56ab2f','#a8e6cf']},
              {icon:'restaurant',label:'Food',gradient:['#f093fb','#f5576c']},
              {icon:'walk',label:'Hiking',gradient:['#4facfe','#00f2fe']},
              {icon:'color-palette',label:'Culture',gradient:['#a8edea','#fed6e3']}
            ].map((cat,i)=>(
              <TouchableOpacity key={i} style={styles.categoryCard}>
                <View style={[styles.categoryIconWrap, {backgroundColor: cat.gradient[0]}]}>
                  <Ionicons name={cat.icon as any} size={28} color={Colors.white} />
                </View>
                <ThemedText style={styles.categoryLabel}>{cat.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Trip Planning Tools */}
        <View style={styles.toolsSection}>
          <View style={styles.sectionHeaderWithDescription}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>Trip Planning Tools</ThemedText>
            <ThemedText style={styles.sectionDescription}>Everything you need for the perfect trip</ThemedText>
          </View>
          <View style={styles.toolsContainer}>
            {[{title:'Itineraries',desc:'Ready-made plans',icon:'map'},{title:'Seasonal Highlights',desc:'Best times to visit',icon:'calendar'},{title:'Transport Compare',desc:'Find best options',icon:'car'}].map((tool,i)=>(
              <TouchableOpacity key={i} style={styles.toolCard}>
                <View style={styles.toolIconContainer}>
                  <Ionicons name={tool.icon as any} size={28} color={Colors.primary600} />
                </View>
                <ThemedText style={styles.toolTitle}>{tool.title}</ThemedText>
                <ThemedText style={styles.toolDesc}>{tool.desc}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Personalized Elements (mocked as logged in) */}
        <View style={styles.personalSection}>
          <View style={styles.sectionHeaderWithDescription}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>My Trips</ThemedText>
            <ThemedText style={styles.sectionDescription}>Your travel memories and plans</ThemedText>
          </View>
          <View style={styles.personalContainer}>
            {[{title:'Saved Plans',desc:'3 itineraries',icon:'bookmark'},{title:'Unfinished',desc:'2 drafts',icon:'document'},{title:'Upcoming',desc:'1 trip',icon:'airplane'}].map((item,i)=>(
              <TouchableOpacity key={i} style={styles.personalCard}>
                <View style={styles.personalIconContainer}>
                  <Ionicons name={item.icon as any} size={28} color={Colors.primary600} />
                </View>
                <ThemedText style={styles.personalTitle}>{item.title}</ThemedText>
                <ThemedText style={styles.personalDesc}>{item.desc}</ThemedText>
              </TouchableOpacity>
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

  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginTop: -15,
    zIndex: 5,
  },

  searchCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
  },

  searchInputWrapper: {
    marginBottom: 16,
  },

  searchInputPressable: {
    alignSelf: 'stretch',
  },

  searchInputDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary50,
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },

  searchIcon: {
    marginRight: 12,
  },

  searchInput: {
    alignSelf: 'stretch',
    borderRadius: 15,
  },

  searchButton: {
    alignSelf: 'stretch',
    backgroundColor: Colors.primary600,
    borderRadius: 16,
  },

  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary700,
  },

  discoverSection: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionHeaderWithDescription: {
    marginBottom: 20,
  },

  sectionDescription: {
    fontSize: 14,
    color: Colors.primary600,
    marginTop: 4,
  },

  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  seeAllText: {
    fontSize: 14,
    color: Colors.primary600,
    fontWeight: '500',
    marginRight: 4,
  },

  carousel: {
    marginBottom: 8,
  },

  carouselContainer: {
    paddingRight: 20,
  },

  // Categories section
  categoriesSection: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },

  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },

  categoryCard: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    shadowColor: Colors.primary100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  categoryIconWrap: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },

  categoryLabel: {
    fontSize: 13,
    color: Colors.primary700,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Tools section
  toolsSection: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },

  toolsContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },

  toolIconContainer: {
    backgroundColor: Colors.primary100,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },

  toolCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    flex: 1,
    alignItems: 'center',
    shadowColor: Colors.primary100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  toolTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: Colors.primary800,
    marginBottom: 4,
    textAlign: 'center',
  },

  toolDesc: {
    fontSize: 12,
    color: Colors.primary700,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Personal section
  personalSection: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },

  personalContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },

  personalIconContainer: {
    backgroundColor: Colors.primary100,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },

  personalCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    flex: 1,
    alignItems: 'center',
    shadowColor: Colors.primary100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  personalTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: Colors.primary800,
    marginBottom: 4,
    textAlign: 'center',
  },

  personalDesc: {
    fontSize: 12,
    color: Colors.primary700,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },

  closeButton: {
    padding: 8,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary700,
  },

  placeholder: {
    width: 40,
  },

  modalSearchArea: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },

  modalSearchInput: {
    marginBottom: 16,
  },

  modalSearchButton: {
    alignSelf: 'stretch',
    backgroundColor: Colors.primary600,
  },

  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  suggestionsSection: {
    marginVertical: 20,
  },

  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary700,
    marginBottom: 12,
  },

  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: Colors.secondary200,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  suggestionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  suggestionText: {
    fontSize: 16,
    color: Colors.primary700,
  },

  suggestionCategory: {
    fontSize: 12,
    color: Colors.primary500,
    marginTop: 2,
  },

  suggestionType: {
    backgroundColor: Colors.primary100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  suggestionTypeText: {
    fontSize: 11,
    color: Colors.primary700,
    fontWeight: '600',
  },

  quickSearchSection: {
    marginVertical: 20,
  },

  quickSearchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary700,
    marginBottom: 20,
  },

  categorySection: {
    marginBottom: 24,
  },

  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary700,
    marginBottom: 12,
  },

  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  popularItem: {
    backgroundColor: Colors.primary100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 8,
  },

  popularItemText: {
    fontSize: 14,
    color: Colors.primary700,
    fontWeight: '500',
  },

  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
  },
});





