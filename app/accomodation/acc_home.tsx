import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomButton, CustomTextInput, ServicesTopBar, ThemedText } from '../../components';
import { ItemCard } from '../../components/ItemCard';
import { Colors } from '../../constants/Colors';

export default function AccomodationHomeScreen() {
  const insets = useSafeAreaInsets();
  // Modal and filter state
  const [filterVisible, setFilterVisible] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [location, setLocation] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const propertyTypeOptions = ['Hotel', 'Villa', 'Guest House', 'Hostel', 'Apartment'];

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

  const renderItemCard = (item: any, prefix: string, index: number) => (
  <ItemCard
    key={`${prefix}-${index}`}
    image={item.image || ''}
    title={item.title || ' '}
    city={item.city}
    price={item.price}
    rating={item.rating}
    type="accommodation"
    style={styles.carouselCard}
  />
  );

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
           {featuredData.map((item, i) => renderItemCard(item, 'featured', i))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Budget Friendly Stays</ThemedText>
          <ThemedText style={styles.seeMore}>See more →</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
          {featuredData.map((item, i) => (
            <ItemCard key={i} {...item} style={styles.carouselCard} type="accommodation" />
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Recent Searches</ThemedText>
          <ThemedText style={styles.seeMore}>See more →</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
          {recentData.map((item, i) => (
            <ItemCard key={i} {...item} style={styles.carouselCard} type="accommodation" />
          ))}
        </ScrollView>
      </ScrollView>

      {/* Filter Modal */}
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
                <ThemedText style={styles.modalLabel}>Price Range ($)</ThemedText>
                <View style={{ flexDirection: 'row'}}>
                  <CustomTextInput
                    label=""
                    placeholder="Min"
                    keyboardType="numeric"
                    value={minPrice}
                    onChangeText={setMinPrice}
                    containerStyle={[styles.modalInput, { flex: 1 }]}
                  />
                  <CustomTextInput
                    label=""
                    placeholder="Max"
                    keyboardType="numeric"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    containerStyle={[styles.modalInput, { flex: 1 }]}
                  />
                </View>
              </View>
              {/* Location */}
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalLabel}>Location</ThemedText>
                <CustomTextInput
                  label=""
                  placeholder="Enter location"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
              {/* Minimum Rating */}
              <View style={styles.modalSection}>
                <ThemedText style={[styles.modalLabel,{marginBottom : 20}]}>Minimum Rating</ThemedText>
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
              {/* Property Types */}
              <View style={styles.modalSection}>
                <ThemedText style={[styles.modalLabel,{marginBottom : 20}]}>Property Type</ThemedText>
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
            {/* Modal Actions */}
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
  }
  // dateInputs: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   gap: 5,
  // }

});

// Mock data
const featuredData = [
  {
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    title: 'Luxury Beach Resort',
    city: 'Galle',
    price: '$220/night',
    rating: 4.8,
  },
  {
    image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd',
    title: 'Mountain View Hotel',
    city: 'Kandy',
    price: '$180/night',
    rating: 4.7,
  },
];

const recentData = [
  {
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
    title: 'City Center Inn',
    city: 'Ella',
    price: '$120/night',
    rating: 4.5,
  },
];