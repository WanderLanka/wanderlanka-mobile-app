import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomButton, CustomTextInput, ServicesTopBar, ThemedText } from '../../components';
import { ItemCard } from '../../components/ItemCard';
import { Colors } from '../../constants/Colors';
import { AccommodationApiService, Accommodation } from '../../services/accommodationApi';

export default function AccomodationHomeScreen() {
  const insets = useSafeAreaInsets();
  
  // API data state
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal and filter state
  const [filterVisible, setFilterVisible] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [location, setLocation] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const propertyTypeOptions = ['Hotel', 'Villa', 'Guest House', 'Hostel', 'Apartment'];

  // Fetch accommodations data
  const fetchAccommodations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏨 Fetching accommodations...');
      const response = await AccommodationApiService.getAllAccommodations();
      
      if (response.success && response.data) {
        setAccommodations(response.data);
        console.log('✅ Accommodations loaded:', response.data.length);
      } else {
        throw new Error(response.message || 'Failed to fetch accommodations');
      }
    } catch (err: any) {
      console.error('❌ Error fetching accommodations:', err);
      setError(err.message || 'Failed to load accommodations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccommodations();
  }, []);

  const togglePropertyType = (type: string) => {
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleApplyFilters = () => {
    // TODO: Connect to actual filtering logic
    setFilterVisible(false);
  };

  const handleCancelFilters = () => {
    setFilterVisible(false);
  };

  const renderItemCard = (item: Accommodation, prefix: string, index: number) => (
  <ItemCard
    key={`${prefix}-${index}`}
    id={item._id}
    image={item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/300x200/3b82f6/ffffff?text=Hotel+Image'}
    title={item.name || ' '}
    city={item.location}
    price={`$${item.price}/night`}
    rating={item.rating}
    type="accommodation"
    style={styles.carouselCard}
  />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.statusBarBackground, { height: insets.top }]} />
        <StatusBar style="light" translucent />
        <ServicesTopBar 
          onProfilePress={() => {}}
          onNotificationsPress={() => {}}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary600} />
          <ThemedText style={styles.loadingText}>Loading accommodations...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.statusBarBackground, { height: insets.top }]} />
        <StatusBar style="light" translucent />
        <ServicesTopBar 
          onProfilePress={() => {}}
          onNotificationsPress={() => {}}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <CustomButton
            title="Retry"
            variant="primary"
            size="small"
            onPress={fetchAccommodations}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Get top rated accommodations (rating >= 4.5)
  const topRatedAccommodations = accommodations
    .filter(acc => acc.rating >= 4.5)
    .slice(0, 5);

  // Get budget friendly accommodations (price <= 100)
  const budgetAccommodations = accommodations
    .filter(acc => acc.price <= 100)
    .slice(0, 5);

  // Get recent accommodations (last 5)
  const recentAccommodations = accommodations.slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <StatusBar style="light" translucent />
      <ServicesTopBar 
        onProfilePress={() => {}}
        onNotificationsPress={() => {}}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.greetingContainer}>
          <ThemedText variant="title" style={styles.greeting}>Accommodations</ThemedText>
          <ThemedText variant="caption" style={styles.caption}>Find and book your perfect stay.</ThemedText>
        </View>

          <View style={styles.searchArea}>
  
            <CustomTextInput
              label=''
              placeholder='Search Accomodations'
              leftIcon='location-outline'
              containerStyle={[styles.searchInput, { marginBottom: 0 }]}
              />
            <CustomButton
              variant='primary'
              size='small'
              title=""
              rightIcon={<Ionicons name="filter" size={22} color="white" />}
              style={styles.filterButton}
              onPress={() => setFilterVisible(true)}
            />
          </View>

        <View style={styles.sectionHeader}>
          <ThemedText variant = 'title' style={styles.sectionTitle}>Top Rated Stays</ThemedText>
          <ThemedText variant = 'caption' style={styles.seeMore}>See more →</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
          {topRatedAccommodations.map((item, i) => renderItemCard(item, 'top-rated', i))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <ThemedText variant = 'subtitle' style={styles.sectionTitle}>Budget Friendly Stays</ThemedText>
          <ThemedText variant = 'subtitle' style={styles.seeMore}>See more →</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
          {budgetAccommodations.map((item, i) => renderItemCard(item, 'budget', i))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <ThemedText  variant = 'subtitle' style={styles.sectionTitle}>Recent Searches</ThemedText>
          <ThemedText  variant = 'subtitle' style={styles.seeMore}>See more →</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
          {recentAccommodations.map((item, i) => renderItemCard(item, 'recent', i))}
        </ScrollView>
      </ScrollView>

      <Modal
        visible={filterVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelFilters}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <ThemedText variant="title" style={styles.modalTitle}>Set Your Preferences</ThemedText>
              {/* Price Range */}
              <View style={styles.modalSection}>
                <ThemedText variant = 'subtitle' style={styles.modalLabel}>Price Range ($)</ThemedText>
                <View style={{ flexDirection: 'row'}}>
                  <CustomTextInput
                    label=''
                    placeholder="Min"
                    keyboardType="numeric"
                    value={minPrice}
                    onChangeText={setMinPrice}
                    containerStyle={[styles.modalInput, { flex: 1 }]}
                  />
                  <CustomTextInput
                    label=''
                    placeholder="Max"
                    keyboardType="numeric"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    containerStyle={[styles.modalInput, { flex: 1 }]}
                  />
                </View>
              </View>

              <View style={styles.modalSection}>
                <ThemedText variant = 'subtitle' style={styles.modalLabel}>Location</ThemedText>
                <CustomTextInput
                  label=""
                  placeholder="Enter location"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              <View style={styles.modalSection}>
                <ThemedText variant = 'subtitle' style={[styles.modalLabel,{marginBottom : 20}]}>Minimum Rating</ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[1,2,3,4,5].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.typeChip, minRating === r && styles.typeChipSelected]}
                      onPress={() => setMinRating(r)}
                    >
                      <Text style={[styles.typeChipText, minRating === r && styles.typeChipTextSelected]}>{r} Star{r > 1 ? 's' : ''}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalSection}>
                <ThemedText variant = 'subtitle' style={[styles.modalLabel,{marginBottom : 20}]}>Property Type</ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {propertyTypeOptions.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeChip, propertyTypes.includes(type) && styles.typeChipSelected]}
                      onPress={() => togglePropertyType(type)}
                    >
                      <Text style={[styles.typeChipText, propertyTypes.includes(type) && styles.typeChipTextSelected]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                variant="secondary"
                style={styles.modalActionBtn}
                onPress={handleCancelFilters}
              />
              <CustomButton
                title="Apply Filters"
                variant="primary"
                style={styles.modalActionBtn}
                onPress={handleApplyFilters}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  searchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  
  searchInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
  },
  filterButton: {
    height: 48,
    aspectRatio: 1, // makes it square
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  toggleBtn: {
    minWidth: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
    color: Colors.primary800,
  },
  seeMore: {
    fontSize: 14,
    color: Colors.primary600,
    fontWeight: '500',
  },
  carousel: {
    paddingLeft: 20,
    marginBottom: 10,
  },
  carouselCard: {
    width: 220,
  },
  listCard: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.secondary500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  modalContent: {
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
    color: Colors.primary800,
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    color: Colors.primary700,
  },
  modalInput: {
    flex: 1,
    padding: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: 0,
    fontSize: 15,
    minWidth: 80,
  },
  ratingChip: {
    borderWidth: 1,
    borderColor: Colors.primary100,
    borderRadius: 8,
    padding: 6,
    marginRight: 4,
    backgroundColor: Colors.secondary50,
  },
  ratingChipSelected: {
    borderColor: Colors.primary600,
    backgroundColor: Colors.primary100,
  },
  typeChip: {
    borderWidth: 1,
    borderColor: Colors.primary100,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 6,
    backgroundColor: Colors.secondary50,
  },
  typeChipSelected: {
    borderColor: Colors.primary600,
    backgroundColor: Colors.primary100,
  },
  typeChipText: {
    color: Colors.primary700,
    fontWeight: '500',
  },
  typeChipTextSelected: {
    color: Colors.primary800,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  modalActionBtn: {
    flex: 1,
  },
  
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    color: Colors.primary600,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    color: Colors.error,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 120,
  }
  // dateInputs: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   gap: 5,
  // }

});
