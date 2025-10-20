import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomButton, CustomTextInput, ServicesTopBar, ThemedText } from '../../components';
import { ItemCard } from '../../components/ItemCard';
import { Colors } from '../../constants/Colors';
import { TransportationApiService, Transportation, TransportationFilters } from '../../services/transportationApi';

// Mock data removed - now using real API data

const popularRoutes = [
  { from: 'Colombo', to: 'Kandy' },
  { from: 'Galle', to: 'Ella' },
  { from: 'Negombo', to: 'Sigiriya' },
  { from: 'Matara', to: 'Jaffna' },
];

export default function TransportationHomeScreen() {
  const insets = useSafeAreaInsets();
  
  // API data state
  const [transportation, setTransportation] = useState<Transportation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Form state
  const [destination, setDestination] = useState('');
  const [pickup, setPickup] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [passengerCount, setPassengerCount] = useState<number | null>(null);
  const [acPref, setAcPref] = useState<'AC' | 'Non-AC' | ''>('');
  const [maxPrice, setMaxPrice] = useState('');
  const [driverPref, setDriverPref] = useState<'With Driver' | 'Self Drive' | ''>('');
  const [destinationError, setDestinationError] = useState('');
  const [pickupError, setPickupError] = useState('');
  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');

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

  // Search transportation with filters
  const searchTransportation = async (filters: TransportationFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Searching transportation with filters:', filters);
      const response = await TransportationApiService.searchTransportation(filters);
      
      if (response.success && response.data) {
        setTransportation(response.data);
        console.log('✅ Search completed:', response.data.length);
      } else {
        throw new Error(response.message || 'Search failed');
      }
    } catch (err: any) {
      console.error('❌ Error searching transportation:', err);
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Load transportation on component mount
  useEffect(() => {
    fetchTransportation();
  }, []);

  // Autofill destination and pickup from route
  const handleRouteSelect = (route: { from: string; to: string }) => {
    setPickup(route.from);
    setDestination(route.to);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransportation();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    let valid = true;
    if (!destination) {
      setDestinationError('Destination is required.');
      valid = false;
    }
    if (!pickup) {
      setPickupError('Pickup location is required.');
      valid = false;
    }
    if (!startDate) {
      setStartDateError('Start date is required.');
      valid = false;
    }
    if (!endDate) {
      setEndDateError('End date is required.');
      valid = false;
    }
    
    if (valid) {
      const filters: TransportationFilters = {
        location: pickup,
        vehicleType: selectedType ? selectedType.toLowerCase() as 'car' | 'van' | 'bus' : undefined,
        minSeats: passengerCount || undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        ac: acPref === 'AC' ? true : acPref === 'Non-AC' ? false : undefined,
      };
      
      await searchTransportation(filters);
    }
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
          <ThemedText variant="caption" style={styles.caption}>Book Your Ride, Chase the Island Vibes</ThemedText>
        </View>
        {/* Booking Form */}
        <View style={styles.bookingForm}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <CustomTextInput
              label="Where are you going?"
              placeholder="Enter destination"
              value={destination}
              onChangeText={text => {
                setDestination(text);
                if (text) setDestinationError('');
              }}
              leftIcon="location-outline"
              containerStyle={[styles.formInput, { flex: 1}]}
              error={destinationError}
            />
          </View>
          <CustomTextInput
            label="Pickup Location"
            placeholder="Enter pickup location"
            value={pickup}
            onChangeText={text => {
              setPickup(text);
              if (text) setPickupError('');
            }}
            leftIcon="location-outline"
            containerStyle={styles.formInput}
            error={pickupError}
          />
          <View style={styles.dateRow}>
            <CustomTextInput
              label="Start Date"
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={text => {
                setStartDate(text);
                if (text) setStartDateError('');
              }}
              containerStyle={[styles.formInput, { flex: 1 }]}
              error={startDateError}
            />
            <CustomTextInput
              label="End Date"
              placeholder="YYYY-MM-DD"
              value={endDate}
              onChangeText={text => {
                setEndDate(text);
                if (text) setEndDateError('');
              }}
              containerStyle={[styles.formInput, { flex: 1 }]}
              error={endDateError}
            />
          </View>
          <View style={styles.filterRow}>
            {/* Selected filter chips - removable */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              {selectedType && (
                <TouchableOpacity style={styles.selectedChip} onPress={() => setSelectedType('')}>
                  <Text style={styles.selectedChipText}>{selectedType} ✕</Text>
                </TouchableOpacity>
              )}
              {passengerCount && (
                <TouchableOpacity style={styles.selectedChip} onPress={() => setPassengerCount(null)}>
                  <Text style={styles.selectedChipText}>{passengerCount} Pax ✕</Text>
                </TouchableOpacity>
              )}
              {acPref && (
                <TouchableOpacity style={styles.selectedChip} onPress={() => setAcPref('')}>
                  <Text style={styles.selectedChipText}>{acPref} ✕</Text>
                </TouchableOpacity>
              )}
              {maxPrice && (
                <TouchableOpacity style={styles.selectedChip} onPress={() => setMaxPrice('')}>
                  <Text style={styles.selectedChipText}>${maxPrice}/day ✕</Text>
                </TouchableOpacity>
              )}
              {driverPref && (
                <TouchableOpacity style={styles.selectedChip} onPress={() => setDriverPref('')}>
                  <Text style={styles.selectedChipText}>{driverPref} ✕</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
            <TouchableOpacity onPress={() => setFilterVisible(true)} style={styles.addFilterLink}>
              <Text style={styles.addFilterText}>+ Add more filters</Text>
            </TouchableOpacity>
          </View>
          <CustomButton
            title="Search Vehicles"
            variant="primary"
            style={styles.searchBtn}
            onPress={handleSearch}
          />
        </View>
        {/* Popular Routes */}
        <View style={styles.sectionHeader}>
          <ThemedText variant="title" style={styles.sectionTitle}>Popular Routes</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
          {popularRoutes.map((route, i) => (
            <TouchableOpacity
              key={i}
              style={styles.routeChip}
              onPress={() => handleRouteSelect(route)}
            >
              <Text style={styles.routeChipText}>{route.from} → {route.to}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary600} />
            <ThemedText variant="caption" style={styles.loadingText}>Loading vehicles...</ThemedText>
          </View>
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
  bookingForm: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    margin: 18,
    padding: 18,
    shadowColor: Colors.secondary500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  formInput: {
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  searchBtn: {
    marginTop: 10,
    borderRadius: 12,
  },
  addFilterLink: {
    marginTop: 8,
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  addFilterText: {
    color: Colors.primary600,
    fontWeight: '500',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingHorizontal: 20,
    marginTop: 10,
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
  routeChip: {
    backgroundColor: Colors.primary100,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 10,
    marginBottom: 6,
    shadowColor: Colors.secondary500,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  routeChipText: {
    color: Colors.primary700,
    fontWeight: '600',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
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
  typeChip: {
    backgroundColor: Colors.primary100,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    marginBottom: 10,
    shadowColor: Colors.secondary500,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  typeChipSelected: {
    backgroundColor: Colors.primary600,
  },
  typeChipText: {
    color: Colors.primary700,
    fontWeight: '500',
    fontSize: 14,
  },
  typeChipTextSelected: {
    color: Colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalActionBtn: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  selectedChip: {
    backgroundColor: Colors.primary100,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 2,
    alignSelf: 'center',
  },
  selectedChipText: {
    color: Colors.primary700,
    fontWeight: '500',
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.primary600,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    color: Colors.secondary600,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  errorSubtext: {
    color: Colors.secondary500,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    minWidth: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    color: Colors.secondary600,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  emptySubtext: {
    color: Colors.secondary500,
    textAlign: 'center',
  },
});
