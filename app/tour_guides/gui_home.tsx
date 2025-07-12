import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomButton, CustomTextInput, ServicesTopBar, ThemedText } from '../../components';
import { ItemCard } from '../../components/ItemCard';
import { Colors } from '../../constants/Colors';

const featuredGuides = [
  {
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9',
    title: 'Samantha Perera',
    city: 'Colombo',
    price: '$25/hr',
    rating: 4.9,
    languages: ['English', 'Sinhala'],
    bio: 'Expert in Sri Lankan history and culture.',
    type: 'guide',
  },
  {
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e',
    title: 'Ravi Fernando',
    city: 'Kandy',
    price: '$30/hr',
    rating: 4.8,
    languages: ['English', 'Tamil'],
    bio: 'Nature and wildlife specialist.',
    type: 'guide',
  },
];

const allGuides = [
  ...featuredGuides,
  {
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
    title: 'Nadeesha Silva',
    city: 'Galle',
    price: '$28/hr',
    rating: 4.7,
    languages: ['English', 'French'],
    bio: 'Food and culinary tours expert.',
    type: 'guide',
  },
];

const languageOptions = ['English', 'Sinhala', 'Tamil', 'French', 'German', 'Spanish'];
const expertiseOptions = ['History', 'Nature', 'Food', 'Adventure', 'Culture'];

export default function TourGuidesHomeScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [location, setLocation] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  // Availability and other filters can be added as needed

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  };
  const toggleExpertise = (exp: string) => {
    setSelectedExpertise(prev => prev.includes(exp) ? prev.filter(e => e !== exp) : [...prev, exp]);
  };

  const handleApplyFilters = () => {
    setFilterVisible(false);
    // TODO: Connect to actual filtering logic
  };
  const handleCancelFilters = () => {
    setFilterVisible(false);
  };

  const filteredGuides = allGuides.filter(g =>
    (!search || g.title.toLowerCase().includes(search.toLowerCase()) || g.bio.toLowerCase().includes(search.toLowerCase())) &&
    (!location || g.bio.toLowerCase().includes(location.toLowerCase())) &&
    (!selectedLanguages.length || selectedLanguages.some(l => g.languages.includes(l))) &&
    (!selectedExpertise.length || selectedExpertise.some(e => g.bio.toLowerCase().includes(e.toLowerCase()))) &&
    (!minRating || g.rating >= minRating) &&
    (!minPrice || parseInt(g.price.replace(/\D/g, '')) >= parseInt(minPrice)) &&
    (!maxPrice || parseInt(g.price.replace(/\D/g, '')) <= parseInt(maxPrice))
  );

  const renderItemCard = (item: any, prefix: string, index: number) => (
    <ItemCard
      key={`${prefix}-${index}`}
      image={item.image}
      title={item.title}
      city={item.city}
      price={item.price}
      rating={item.rating}
      type="guide"
      style={styles.carouselCard}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <StatusBar style="light" translucent />
      <ServicesTopBar onProfilePress={() => {}} onNotificationsPress={() => {}} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.greetingContainer}>
          <ThemedText variant="title" style={styles.greeting}>Find a Guide</ThemedText>
          <ThemedText variant="caption" style={styles.caption}>Book a local expert for your journey.</ThemedText>
        </View>
        <View style={styles.searchArea}>
          <CustomTextInput
            label=""
            placeholder="Search guides by city, name, or keyword"
            leftIcon="search"
            value={search}
            onChangeText={setSearch}
            containerStyle={[styles.searchInput, { marginBottom: 0 }]}
          />
          <CustomButton
            variant="primary"
            size="small"
            title=""
            rightIcon={<Ionicons name="filter" size={22} color="white" />}
            style={styles.filterButton}
            onPress={() => setFilterVisible(true)}
          />
        </View>
        <View style={styles.sectionHeader}>
          <ThemedText variant="title" style={styles.sectionTitle}>Featured Guides</ThemedText>
          <ThemedText variant="caption" style={styles.seeMore}>See more →</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
          {featuredGuides.map((item, i) => renderItemCard(item, 'featured', i))}
        </ScrollView>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>All Guides</ThemedText>
          <ThemedText style={styles.seeMore}>See more →</ThemedText>
        </View>
        {filteredGuides.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText variant="caption" style={styles.emptyText}>
              No guides found for your criteria. Try adjusting your filters.
            </ThemedText>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
            {filteredGuides.map((item, i) => renderItemCard(item, 'all', i))}
          </ScrollView>
        )}
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
              {/* Languages */}
              <View style={styles.modalSection}>
                <ThemedText style={[styles.modalLabel,{marginBottom : 20}]}>Languages</ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {languageOptions.map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      style={[styles.typeChip, selectedLanguages.includes(lang) && styles.typeChipSelected]}
                      onPress={() => toggleLanguage(lang)}
                    >
                      <Text style={[styles.typeChipText, selectedLanguages.includes(lang) && styles.typeChipTextSelected]}>{lang}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {/* Expertise */}
              <View style={styles.modalSection}>
                <ThemedText style={[styles.modalLabel,{marginBottom : 20}]}>Expertise</ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {expertiseOptions.map((exp) => (
                    <TouchableOpacity
                      key={exp}
                      style={[styles.typeChip, selectedExpertise.includes(exp) && styles.typeChipSelected]}
                      onPress={() => toggleExpertise(exp)}
                    >
                      <Text style={[styles.typeChipText, selectedExpertise.includes(exp) && styles.typeChipTextSelected]}>{exp}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
              {/* Price Range */}
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalLabel}>Price Range ($/hr)</ThemedText>
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
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: Colors.primary600,
    fontSize: 16,
    textAlign: 'center',
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
    padding: 12,
    marginBottom: 0,
    fontSize: 15,
    minWidth: 80,
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
});
