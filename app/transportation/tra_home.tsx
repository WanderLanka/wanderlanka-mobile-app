import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomButton, CustomTextInput, ServicesTopBar, ThemedText } from '../../components';
import { ItemCard } from '../../components/ItemCard';
import { Colors } from '../../constants/Colors';

const vehicleData = [
  {
    image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Luxury Sedan',
    city: 'Colombo',
    price: '$60/day',
    capacity: 4,
    ac: true,
  },
  {
    image: 'https://images.unsplash.com/photo-1461435218581-ff0972867e90?q=80&w=1174&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Family Van',
    city: 'Kandy',
    price: '$80/day',
    capacity: 7,
    ac: true,
  },
  {
    image: 'https://images.unsplash.com/photo-1622893288761-823ba60f17a6?q=80&w=2128&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'SUV',
    city: 'Nuwara Eliya',
    price: '$90/day',
    capacity: 6,
    ac: true,
  },
  {
    image: 'https://images.unsplash.com/photo-1617479625255-43666e3a3509?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Tourist Bus',
    city: 'Jaffna',
    price: '$150/day',
    capacity: 30,
    ac: true,
  },
  {
    image: 'https://images.unsplash.com/photo-1655286692463-ab43ef87988f?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Hatchback',
    city: 'Matara',
    price: '$40/day',
    capacity: 4,
    ac: false,
  },
  {
    image: 'https://images.unsplash.com/photo-1554223789-df81106a45ed?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Scooter',
    city: 'Ella',
    price: '$18/day',
    capacity: 2,
    ac: false,
  },
  {
    image: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3c8b?auto=format&fit=crop&w=800&q=https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80',
    title: 'Budget Car',
    city: 'Galle',
    price: '$35/day',
    capacity: 4,
    ac: false,
  },
];

const popularRoutes = [
  { from: 'Colombo', to: 'Kandy' },
  { from: 'Galle', to: 'Ella' },
  { from: 'Negombo', to: 'Sigiriya' },
  { from: 'Matara', to: 'Jaffna' },
];

export default function TransportationHomeScreen() {
  const insets = useSafeAreaInsets();
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

  // Autofill destination and pickup from route
  const handleRouteSelect = (route: { from: string; to: string }) => {
    setPickup(route.from);
    setDestination(route.to);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <StatusBar style="light" translucent />
      <ServicesTopBar onProfilePress={() => {}} onNotificationsPress={() => {}} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
            onPress={() => {
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
                // Proceed with search logic
              }
            }}
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
        {/* Carousels */}
        <View style={styles.sectionHeader}>
          <ThemedText variant="title" style={styles.sectionTitle}>Popular Now</ThemedText>
          <ThemedText variant="caption" style={styles.seeMore}>See more →</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
          {vehicleData.map((item, i) => (
            <ItemCard key={i} {...item} style={styles.carouselCard} type="vehicle" />
          ))}
        </ScrollView>
        <View style={styles.sectionHeader}>
          <ThemedText variant="title" style={styles.sectionTitle}>For Families</ThemedText>
          <ThemedText variant="caption" style={styles.seeMore}>See more →</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
          {vehicleData.filter(v => v.capacity >= 4).map((item, i) => (
            <ItemCard key={i} {...item} style={styles.carouselCard} type="vehicle" />
          ))}
        </ScrollView>
        <View style={styles.sectionHeader}>
          <ThemedText variant="title" style={styles.sectionTitle}>Best Deals</ThemedText>
          <ThemedText variant="caption" style={styles.seeMore}>See more →</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
          {vehicleData.filter(v => v.price && parseInt(v.price.replace(/[^0-9]/g, '')) <= 40).map((item, i) => (
            <ItemCard key={i} {...item} style={styles.carouselCard} type="vehicle" />
          ))}
        </ScrollView>
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
});
