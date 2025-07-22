import * as Location from 'expo-location';

import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import React, { useState } from 'react';

import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface CreateEventForm {
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  locationName: string;
  locationAddress: string;
  coordinates: { lat: number; lng: number } | null;
  price: string;
  priceType: 'free' | 'paid' | 'donation';
  maxAttendees: string;
  tags: string[];
  contactInfo: string;
}

const categories = [
  { id: 'cultural', name: 'Cultural', icon: 'library', color: Colors.primary600 },
  { id: 'adventure', name: 'Adventure', icon: 'leaf', color: Colors.success },
  { id: 'food', name: 'Food & Drink', icon: 'restaurant', color: Colors.warning },
  { id: 'meetup', name: 'Meetups', icon: 'people', color: Colors.info },
  { id: 'festival', name: 'Festivals', icon: 'musical-notes', color: Colors.error },
  { id: 'workshop', name: 'Workshops', icon: 'build', color: Colors.secondary600 },
];

export default function CreateEventScreen() {
  const [form, setForm] = useState<CreateEventForm>({
    title: '',
    description: '',
    category: '',
    date: '',
    time: '',
    locationName: '',
    locationAddress: '',
    coordinates: null,
    price: '',
    priceType: 'free',
    maxAttendees: '',
    tags: [],
    contactInfo: '',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Partial<CreateEventForm>>({});
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedLocation, setSelectedLocation] = useState<{lat: number; lng: number} | null>(null);

  const totalSteps = 3;

  // Validation helper functions
  const validateDate = (dateString: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return date >= today && date.getFullYear() <= today.getFullYear() + 2;
  };

  const validateTime = (timeString: string): boolean => {
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
    return timeRegex.test(timeString);
  };

  const formatDateInput = (text: string): string => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as YYYY-MM-DD
    if (cleaned.length >= 8) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
    } else if (cleaned.length >= 6) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length >= 4) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    }
    return cleaned;
  };

  const formatTimeInput = (text: string): string => {
    // Remove all non-alphanumeric characters except colon and space
    const cleaned = text.replace(/[^0-9:APMap\s]/g, '').toUpperCase();
    
    // Basic time formatting
    if (cleaned.length <= 8) {
      return cleaned;
    }
    return cleaned.slice(0, 8);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<CreateEventForm> = {};

    if (step === 1) {
      if (!form.title.trim()) newErrors.title = 'Title is required';
      if (!form.description.trim()) newErrors.description = 'Description is required';
      if (!form.category) newErrors.category = 'Category is required';
    } else if (step === 2) {
      if (!form.date.trim()) {
        newErrors.date = 'Date is required';
      } else if (!validateDate(form.date)) {
        newErrors.date = 'Please enter a valid future date (YYYY-MM-DD)';
      }
      
      if (!form.time.trim()) {
        newErrors.time = 'Time is required';
      } else if (!validateTime(form.time)) {
        newErrors.time = 'Please enter a valid time (e.g., 2:30 PM)';
      }
      
      if (!form.locationName.trim()) newErrors.locationName = 'Location name is required';
      if (!form.locationAddress.trim()) newErrors.locationAddress = 'Location address is required';
    } else if (step === 3) {
      if (form.priceType === 'paid' && !form.price.trim()) {
        newErrors.price = 'Price is required for paid events';
      } else if (form.priceType === 'paid' && isNaN(Number(form.price))) {
        newErrors.price = 'Please enter a valid price amount';
      }
      
      if (!form.contactInfo.trim()) newErrors.contactInfo = 'Contact information is required';
      
      // Validate contact info format (basic email or phone validation)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
      if (form.contactInfo.trim() && !emailRegex.test(form.contactInfo) && !phoneRegex.test(form.contactInfo)) {
        newErrors.contactInfo = 'Please enter a valid email or phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    Alert.alert(
      'Event Created!',
      'Your event has been submitted for review and will be published soon.',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim()) && form.tags.length < 5) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleMapLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setForm(prev => ({
      ...prev,
      coordinates: { lat: location.lat, lng: location.lng },
      locationAddress: location.address,
    }));
    setSelectedLocation({ lat: location.lat, lng: location.lng });
    setShowMapModal(false);
  };

  const handleMapPress = async (coordinate: { lat: number; lng: number }) => {
    setSelectedLocation(coordinate);
    
    try {
      // Use reverse geocoding to get address
      const address = await Location.reverseGeocodeAsync({
        latitude: coordinate.lat,
        longitude: coordinate.lng,
      });

      const addressString = address[0] 
        ? `${address[0].street || ''} ${address[0].city || ''} ${address[0].region || ''} ${address[0].country || ''}`.trim()
        : `${coordinate.lat.toFixed(4)}, ${coordinate.lng.toFixed(4)}`;

      setForm(prev => ({
        ...prev,
        coordinates: coordinate,
        locationAddress: addressString,
      }));
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      // Fallback to coordinates if reverse geocoding fails
      const fallbackAddress = `${coordinate.lat.toFixed(4)}, ${coordinate.lng.toFixed(4)}, Sri Lanka`;
      setForm(prev => ({
        ...prev,
        coordinates: coordinate,
        locationAddress: fallbackAddress,
      }));
    }
  };

  const getCurrentLocation = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required to use your current location.');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      
      // Reverse geocode to get address
      const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const addressString = address[0] 
        ? `${address[0].street || ''} ${address[0].city || ''} ${address[0].region || ''} ${address[0].country || ''}`.trim()
        : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      // Update map region and select location
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      setSelectedLocation({ lat: latitude, lng: longitude });
      
      handleMapLocationSelect({
        lat: latitude,
        lng: longitude,
        address: addressString,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location. Please try again.');
    }
  };

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>
        Step {currentStep} of {totalSteps}
      </Text>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Event Details</Text>
      <Text style={styles.stepDescription}>
        Tell us about your event and what makes it special
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Event Title *</Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          placeholder="Enter event title"
          placeholderTextColor={Colors.secondary400}
          value={form.title}
          onChangeText={(text) => setForm(prev => ({ ...prev, title: text }))}
          maxLength={80}
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        <Text style={styles.characterCount}>{form.title.length}/80</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.textArea, errors.description && styles.inputError]}
          placeholder="Describe your event in detail..."
          placeholderTextColor={Colors.secondary400}
          value={form.description}
          onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        <Text style={styles.characterCount}>{form.description.length}/500</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Category *</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                form.category === category.id && styles.selectedCategoryCard,
              ]}
              onPress={() => setForm(prev => ({ ...prev, category: category.id }))}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
                <Ionicons
                  name={category.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={category.color}
                />
              </View>
              <Text style={[
                styles.categoryName,
                form.category === category.id && styles.selectedCategoryName,
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>When & Where</Text>
      <Text style={styles.stepDescription}>
        Set the date, time, and location for your event
      </Text>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Date *</Text>
          <TextInput
            style={[styles.input, errors.date && styles.inputError]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.secondary400}
            value={form.date}
            onChangeText={(text) => {
              const formattedDate = formatDateInput(text);
              setForm(prev => ({ ...prev, date: formattedDate }));
            }}
            keyboardType="numeric"
            maxLength={10}
          />
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
          <Text style={styles.helperText}>Enter future date only</Text>
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Time *</Text>
          <TextInput
            style={[styles.input, errors.time && styles.inputError]}
            placeholder="2:30 PM"
            placeholderTextColor={Colors.secondary400}
            value={form.time}
            onChangeText={(text) => {
              const formattedTime = formatTimeInput(text);
              setForm(prev => ({ ...prev, time: formattedTime }));
            }}
            maxLength={8}
          />
          {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
          <Text style={styles.helperText}>12-hour format</Text>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Location Name *</Text>
        <TextInput
          style={[styles.input, errors.locationName && styles.inputError]}
          placeholder="e.g., Galle Fort, Community Center"
          placeholderTextColor={Colors.secondary400}
          value={form.locationName}
          onChangeText={(text) => setForm(prev => ({ ...prev, locationName: text }))}
        />
        {errors.locationName && <Text style={styles.errorText}>{errors.locationName}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Address *</Text>
        <TextInput
          style={[styles.input, errors.locationAddress && styles.inputError]}
          placeholder="Street address, city, postal code"
          placeholderTextColor={Colors.secondary400}
          value={form.locationAddress}
          onChangeText={(text) => setForm(prev => ({ ...prev, locationAddress: text }))}
          multiline
          numberOfLines={2}
        />
        {errors.locationAddress && <Text style={styles.errorText}>{errors.locationAddress}</Text>}
      </View>

      <TouchableOpacity style={styles.mapButton} onPress={() => setShowMapModal(true)}>
        <Ionicons name="location" size={20} color={Colors.primary600} />
        <Text style={styles.mapButtonText}>
          {form.coordinates ? 'Update Location on Map' : 'Set Location on Map'}
        </Text>
      </TouchableOpacity>

      {form.coordinates && (
        <View style={styles.selectedLocationContainer}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.selectedLocationText}>
            Location set: {form.coordinates.lat.toFixed(4)}, {form.coordinates.lng.toFixed(4)}
          </Text>
        </View>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Final Details</Text>
      <Text style={styles.stepDescription}>
        Set pricing, capacity, and additional information
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pricing</Text>
        <View style={styles.priceTypeContainer}>
          {['free', 'paid', 'donation'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.priceTypeButton,
                form.priceType === type && styles.selectedPriceType,
              ]}
              onPress={() => setForm(prev => ({ ...prev, priceType: type as any }))}
            >
              <Text style={[
                styles.priceTypeText,
                form.priceType === type && styles.selectedPriceTypeText,
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {form.priceType === 'paid' && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price (LKR) *</Text>
          <TextInput
            style={[styles.input, errors.price && styles.inputError]}
            placeholder="Enter price amount (e.g., 1500)"
            placeholderTextColor={Colors.secondary400}
            value={form.price}
            onChangeText={(text) => {
              // Only allow numbers and decimal points
              const cleanedText = text.replace(/[^0-9.]/g, '');
              setForm(prev => ({ ...prev, price: cleanedText }));
            }}
            keyboardType="numeric"
          />
          {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
          <Text style={styles.helperText}>Enter amount in Sri Lankan Rupees (LKR)</Text>
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Max Attendees (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Leave empty for unlimited"
          placeholderTextColor={Colors.secondary400}
          value={form.maxAttendees}
          onChangeText={(text) => setForm(prev => ({ ...prev, maxAttendees: text }))}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tags (Optional)</Text>
        <View style={styles.tagInputContainer}>
          <TextInput
            style={styles.tagInput}
            placeholder="Add a tag"
            placeholderTextColor={Colors.secondary400}
            value={newTag}
            onChangeText={setNewTag}
            onSubmitEditing={addTag}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
            <Ionicons name="add" size={20} color={Colors.primary600} />
          </TouchableOpacity>
        </View>
        {form.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {form.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(tag)}>
                  <Ionicons name="close" size={12} color={Colors.primary600} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.helperText}>Add up to 5 tags to help people find your event</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contact Information *</Text>
        <TextInput
          style={[styles.input, errors.contactInfo && styles.inputError]}
          placeholder="Phone: +94 77 123 4567 or Email: hello@example.com"
          placeholderTextColor={Colors.secondary400}
          value={form.contactInfo}
          onChangeText={(text) => setForm(prev => ({ ...prev, contactInfo: text }))}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.contactInfo && <Text style={styles.errorText}>{errors.contactInfo}</Text>}
        <Text style={styles.helperText}>Provide either a phone number or email for attendees to contact you</Text>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Event</Text>
        <View style={styles.headerRight} />
      </View>

      {renderProgressIndicator()}

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderCurrentStep()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backActionButton} onPress={handleBack}>
              <Text style={styles.backActionButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentStep === totalSteps ? 'Create Event' : 'Next'}
            </Text>
            <Ionicons
              name={currentStep === totalSteps ? 'checkmark' : 'arrow-forward'}
              size={16}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Map Location Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMapModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowMapModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity onPress={getCurrentLocation}>
              <Text style={styles.modalDoneText}>Current Location</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              style={styles.mapView}
              provider={PROVIDER_GOOGLE}
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
              onPress={(event) => {
                const { latitude, longitude } = event.nativeEvent.coordinate;
                setSelectedLocation({ lat: latitude, lng: longitude });
                handleMapPress({ lat: latitude, lng: longitude });
              }}
              showsUserLocation={true}
              showsMyLocationButton={false}
              showsCompass={true}
              showsScale={true}
              toolbarEnabled={false}
            >
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.lat,
                    longitude: selectedLocation.lng,
                  }}
                  title="Event Location"
                  description="Selected location for your event"
                  pinColor={Colors.primary600}
                />
              )}
            </MapView>

            <View style={styles.mapControls}>
              <TouchableOpacity style={styles.mapControlButton} onPress={getCurrentLocation}>
                <Ionicons name="locate" size={20} color={Colors.primary600} />
                <Text style={styles.mapControlText}>Use Current Location</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mapControlButton}
                onPress={() => {
                  if (selectedLocation) {
                    const address = `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}, Sri Lanka`;
                    handleMapLocationSelect({
                      lat: selectedLocation.lat,
                      lng: selectedLocation.lng,
                      address,
                    });
                  } else {
                    Alert.alert('No Location Selected', 'Please tap on the map to select a location first.');
                  }
                }}
              >
                <Ionicons name="location" size={20} color={Colors.primary600} />
                <Text style={styles.mapControlText}>Confirm Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  headerRight: {
    width: 32,
  },
  progressContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.light200,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary600,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.secondary500,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.secondary500,
    lineHeight: 22,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.black,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.error,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.light200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.black,
    backgroundColor: Colors.white,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.secondary400,
    textAlign: 'right',
    marginTop: 4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  selectedCategoryCard: {
    borderColor: Colors.primary600,
    backgroundColor: Colors.primary100,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary600,
    textAlign: 'center',
  },
  selectedCategoryName: {
    color: Colors.primary600,
    fontWeight: '600',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary600,
  },
  priceTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priceTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.light100,
    alignItems: 'center',
  },
  selectedPriceType: {
    backgroundColor: Colors.primary600,
  },
  priceTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary600,
  },
  selectedPriceTypeText: {
    color: Colors.white,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.black,
    backgroundColor: Colors.white,
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary100,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    color: Colors.primary600,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: Colors.secondary400,
    marginTop: 4,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light200,
    gap: 12,
  },
  backActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.light100,
    alignItems: 'center',
  },
  backActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary600,
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary600,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '15',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    gap: 6,
  },
  selectedLocationText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  modalCancelText: {
    fontSize: 16,
    color: Colors.secondary600,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  modalDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  mapView: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light100,
    margin: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light200,
    borderStyle: 'dashed',
  },
  mapPlaceholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary600,
    marginTop: 16,
    marginBottom: 8,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  mapControls: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light200,
    gap: 12,
  },
  mapControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  mapControlText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
  },
});
