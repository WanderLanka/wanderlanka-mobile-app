import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomButton, CustomTextInput, ServicesTopBar, ThemedText } from '../../components';
import { ItemCard } from '../../components/ItemCard';
import { Colors } from '../../constants/Colors';
import { TransportationApiService, Transportation, TransportationFilters } from '../../services/transportationApi';

// Mock data removed - now using real API data

export default function TransportationHomeScreen() {
  const insets = useSafeAreaInsets();
  
  // API data state
  const [transportation, setTransportation] = useState<Transportation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [passengerCount, setPassengerCount] = useState<number | null>(null);
  const [acPref, setAcPref] = useState<'AC' | 'Non-AC' | ''>('');
  const [maxPrice, setMaxPrice] = useState('');
  const [driverPref, setDriverPref] = useState<'With Driver' | 'Self Drive' | ''>('');

  // Fetch transportation from API
  const fetchTransportation = async (filters?: TransportationFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚗 Fetching transportation...');
      const response = await TransportationApiService.getAllTransportation();
      
      if (response.success && response.data) {
        setTransportation(response.data);
        console.log('✅ Transportation loaded:', response.data.length);
      } else {
        throw new Error(response.message || 'Failed to fetch transportation');
      }
    } catch (err: any) {
      console.error('❌ Error fetching transportation:', err);
      setError(err.message || 'Failed to load transportation');
    } finally {
      setLoading(false);
    }
  };


  // Load transportation on component mount
  useEffect(() => {
    fetchTransportation();
  }, []);


  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransportation();
    setRefreshing(false);
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <StatusBar style="light" translucent />
      <ServicesTopBar onProfilePress={() => {}} onNotificationsPress={() => {}} />
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary600}
          />
        }
      >
        <View style={styles.greetingContainer}>
          <ThemedText variant="title" style={styles.greeting}>Transportation</ThemedText>
          <ThemedText variant="caption" style={styles.caption}>Find and book your perfect ride.</ThemedText>
        </View>
        <View style={styles.searchArea}>
          <CustomTextInput
            label=''
            placeholder='Search Transportation'
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
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary600} />
            <ThemedText variant="caption" style={styles.loadingText}>Loading vehicles...</ThemedText>
          </View>
        )}

        {/* Transportation Sections */}
        {!loading && transportation.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText variant="title" style={styles.sectionTitle}>Top Rated Vehicles</ThemedText>
              <ThemedText variant="caption" style={styles.seeMore}>See more →</ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
              {transportation
                .filter(vehicle => vehicle.rating >= 4.5)
                .slice(0, 5)
                .map((item, i) => (
                  <ItemCard
                    key={i}
                    id={item._id}
                    image={item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/300x200/3b82f6/ffffff?text=Vehicle+Image'}
                    title={item.brand && item.model ? `${item.brand} ${item.model}` : item.brand || 'Vehicle'}
                    city={item.location || 'Location not specified'}
                    price={`LKR ${item.pricingPerKm}/km`}
                    rating={item.rating}
                    type="vehicle"
                    style={styles.carouselCard}
                  />
                ))}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <ThemedText variant="subtitle" style={styles.sectionTitle}>Budget Friendly Options</ThemedText>
              <ThemedText variant="subtitle" style={styles.seeMore}>See more →</ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
              {transportation
                .filter(vehicle => vehicle.pricingPerKm <= 100)
                .slice(0, 5)
                .map((item, i) => (
                  <ItemCard
                    key={i}
                    id={item._id}
                    image={item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/300x200/3b82f6/ffffff?text=Vehicle+Image'}
                    title={item.brand && item.model ? `${item.brand} ${item.model}` : item.brand || 'Vehicle'}
                    city={item.location || 'Location not specified'}
                    price={`LKR ${item.pricingPerKm}/km`}
                    rating={item.rating}
                    type="vehicle"
                    style={styles.carouselCard}
                  />
                ))}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <ThemedText variant="subtitle" style={styles.sectionTitle}>Recent Additions</ThemedText>
              <ThemedText variant="subtitle" style={styles.seeMore}>See more →</ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
              {transportation.slice(0, 5).map((item, i) => (
                <ItemCard
                  key={i}
                  id={item._id}
                  image={item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/300x200/3b82f6/ffffff?text=Vehicle+Image'}
                  title={item.brand && item.model ? `${item.brand} ${item.model}` : item.brand || 'Vehicle'}
                  city={item.location || 'Location not specified'}
                  price={`LKR ${item.pricingPerKm}/km`}
                  rating={item.rating}
                  type="vehicle"
                  style={styles.carouselCard}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.secondary400} style={styles.errorIcon} />
            <ThemedText variant="subtitle" style={styles.errorText}>{error}</ThemedText>
            <ThemedText variant="caption" style={styles.errorSubtext}>Please check again later</ThemedText>
            <CustomButton
              title="Retry"
              variant="primary"
              size="small"
              onPress={() => fetchTransportation()}
              style={styles.retryButton}
            />
          </View>
        )}

        {/* Content */}
        {!loading && !error && transportation.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText variant="title" style={styles.sectionTitle}>Available Vehicles</ThemedText>
              <ThemedText variant="caption" style={styles.seeMore}>{transportation.length} vehicles</ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
              {transportation.slice(0, 5).map((item, i) => (
                <ItemCard 
                  key={i} 
                  image={item.images && item.images.length > 0 ? item.images[0] : '/placeholder-vehicle.jpg'}
                  title={`${item.brand} ${item.model}`}
                  city={item.location}
                  price={`$${item.pricingPerKm}/km`}
                  capacity={item.seats}
                  ac={item.ac}
                  style={styles.carouselCard} 
                  type="vehicle"
                  id={item._id}
                />
              ))}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <ThemedText variant="title" style={styles.sectionTitle}>For Families</ThemedText>
              <ThemedText variant="caption" style={styles.seeMore}>See more →</ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
              {transportation.filter(v => v.seats >= 4).map((item, i) => (
                <ItemCard 
                  key={i} 
                  image={item.images && item.images.length > 0 ? item.images[0] : '/placeholder-vehicle.jpg'}
                  title={`${item.brand} ${item.model}`}
                  city={item.location}
                  price={`$${item.pricingPerKm}/km`}
                  capacity={item.seats}
                  ac={item.ac}
                  style={styles.carouselCard} 
                  type="vehicle"
                  id={item._id}
                />
              ))}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <ThemedText variant="title" style={styles.sectionTitle}>Best Deals</ThemedText>
              <ThemedText variant="caption" style={styles.seeMore}>See more →</ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
              {transportation.filter(v => v.pricingPerKm <= 50).map((item, i) => (
                <ItemCard 
                  key={i} 
                  image={item.images && item.images.length > 0 ? item.images[0] : '/placeholder-vehicle.jpg'}
                  title={`${item.brand} ${item.model}`}
                  city={item.location}
                  price={`$${item.pricingPerKm}/km`}
                  capacity={item.seats}
                  ac={item.ac}
                  style={styles.carouselCard} 
                  type="vehicle"
                  id={item._id}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Empty State */}
        {!loading && !error && transportation.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={48} color={Colors.secondary400} style={styles.emptyIcon} />
            <ThemedText variant="subtitle" style={styles.emptyText}>No vehicles found</ThemedText>
            <ThemedText variant="caption" style={styles.emptySubtext}>Try adjusting your search criteria</ThemedText>
          </View>
        )}
      </ScrollView>
      {/* Filter Modal rendered outside ScrollView */}
      {filterVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <ThemedText variant="title" style={styles.modalTitle}>Set Your Preferences</ThemedText>
              {/* Vehicle Type */}
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalLabel}>Vehicle Type</ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {['Car','Van','SUV','Bus','Bike','Tuk-tuk'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeChip, selectedType === type && styles.typeChipSelected]}
                      onPress={() => setSelectedType(type)}
                    >
                      <Text style={[styles.typeChipText, selectedType === type && styles.typeChipTextSelected]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {/* Passenger Count */}
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalLabel}>Passenger Count</ThemedText>
                <CustomTextInput
                  label=""
                  placeholder="e.g. 4"
                  value={String(passengerCount || '')}
                  onChangeText={v => setPassengerCount(Number(v))}
                  keyboardType="numeric"
                />
              </View>
              {/* AC/Non-AC */}
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalLabel}>AC/Non-AC</ThemedText>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={[styles.typeChip, acPref === 'AC' && styles.typeChipSelected]}
                    onPress={() => setAcPref('AC')}
                  >
                    <Text style={[styles.typeChipText, acPref === 'AC' && styles.typeChipTextSelected]}>AC</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeChip, acPref === 'Non-AC' && styles.typeChipSelected]}
                    onPress={() => setAcPref('Non-AC')}
                  >
                    <Text style={[styles.typeChipText, acPref === 'Non-AC' && styles.typeChipTextSelected]}>Non-AC</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/* With/Without Driver */}
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalLabel}>Driver Preference</ThemedText>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={[styles.typeChip, driverPref === 'With Driver' && styles.typeChipSelected]}
                    onPress={() => setDriverPref('With Driver')}
                  >
                    <Text style={[styles.typeChipText, driverPref === 'With Driver' && styles.typeChipTextSelected]}>With Driver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeChip, driverPref === 'Self Drive' && styles.typeChipSelected]}
                    onPress={() => setDriverPref('Self Drive')}
                  >
                    <Text style={[styles.typeChipText, driverPref === 'Self Drive' && styles.typeChipTextSelected]}>Self Drive</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/* Price Range */}
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalLabel}>Max Price ($/day)</ThemedText>
                <CustomTextInput
                  label=""
                  placeholder="e.g. 50"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>
            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                variant="secondary"
                style={styles.modalActionBtn}
                onPress={() => {
                  setFilterVisible(false);
                }}
              />
              <CustomButton
                title="Apply Filters"
                variant="primary"
                style={styles.modalActionBtn}
                onPress={() => {
                  setFilterVisible(false);
                }}
              />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Status Bar
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary800,
    zIndex: 10,
  },
  
  // Header Section
  greetingContainer: {
    backgroundColor: Colors.primary800,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: Colors.primary800,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  titleSection: {
    flex: 1,
  },
  headerIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  caption: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary100,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary100,
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Scroll View
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  
  // Search Area
  searchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
  },
  filterButton: {
    minWidth: 56,
    height: 56,
  },
  
  // Content Sections
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
  },
  seeMore: {
    fontSize: 14,
    color: Colors.primary600,
    fontWeight: '600',
  },
  
  // Carousels
  carousel: {
    paddingLeft: 24,
    marginBottom: 24,
  },
  carouselCard: {
    width: 280,
    marginRight: 16,
  },
  
  // Booking Form
  bookingForm: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  bookingFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  bookingFormIcon: {
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  bookingFormTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  formInput: {
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchBtn: {
    marginTop: 24,
    borderRadius: 16,
    minHeight: 56,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  // Filter Section
  addFilterLink: {
    marginTop: 12,
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  addFilterText: {
    color: Colors.primary600,
    fontWeight: '600',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  selectedChip: {
    backgroundColor: Colors.primary100,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.primary600,
  },
  selectedChipText: {
    color: Colors.primary700,
    fontWeight: '600',
    fontSize: 13,
  },
  
  
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  modalContent: {
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    color: '#1e293b',
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  typeChip: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  typeChipSelected: {
    backgroundColor: Colors.primary600,
    borderColor: Colors.primary600,
  },
  typeChipText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  typeChipTextSelected: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  modalActionBtn: {
    flex: 1,
    borderRadius: 16,
    minHeight: 48,
  },
  
  // Loading States
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
  
  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 16,
  },
  errorSubtext: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 14,
  },
  retryButton: {
    minWidth: 120,
    borderRadius: 16,
  },
  
  // Empty States
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 16,
  },
  emptySubtext: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 14,
  },
});
