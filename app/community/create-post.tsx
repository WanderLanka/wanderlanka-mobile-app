import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import {
  ActivityIndicator,
  Alert,
  // Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { getLocationIcon, getMockLocationSuggestions } from '../../utils/locationService';

// import { ApiService } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG } from '../../services/config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

// const { width } = Dimensions.get('window');

// Travel-specific post categories for WanderLanka
const POST_CATEGORIES = [
  { id: 'experience', name: 'Travel Experience', icon: 'airplane-outline', color: Colors.primary600 },
  { id: 'tips', name: 'Travel Tips', icon: 'bulb-outline', color: Colors.warning },
  { id: 'food', name: 'Food & Dining', icon: 'restaurant-outline', color: Colors.error },
  { id: 'accommodation', name: 'Accommodation', icon: 'bed-outline', color: Colors.info },
  { id: 'transport', name: 'Transportation', icon: 'car-outline', color: Colors.secondary600 },
  { id: 'culture', name: 'Culture & Heritage', icon: 'library-outline', color: Colors.success },
  { id: 'nature', name: 'Nature & Wildlife', icon: 'leaf-outline', color: Colors.primary700 },
  { id: 'budget', name: 'Budget Travel', icon: 'wallet-outline', color: Colors.secondary700 },
];

interface SelectedImage {
  uri: string;
  id: string;
  type?: string;
}

interface LocationSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  types: string[];
}

export default function CreatePostScreen() {
  const { user } = useAuth();
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [location, setLocation] = useState('');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('experience');
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationSearchTimeout, setLocationSearchTimeout] = useState<number | null>(null);
  const [suggestionJustSelected, setSuggestionJustSelected] = useState(false);
  const [postOptions, setPostOptions] = useState({
    allowComments: true,
    allowSharing: true,
    showExactLocation: false,
    featured: false,
  });

  const requestImagePermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload photos.');
        return false;
      }
    }
    return true;
  };

  const handleImagePicker = async () => {
    const hasPermission = await requestImagePermission();
    if (!hasPermission) return;

    Alert.alert(
      'Add Photos',
      'Choose how you want to add photos to your travel post',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: openCamera },
        { text: 'Photo Library', onPress: openImageLibrary },
      ]
    );
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImage: SelectedImage = {
          uri: result.assets[0].uri,
          id: Date.now().toString(),
          type: result.assets[0].type,
        };
        setSelectedImages(prev => [...prev, newImage]);
      }
    } catch {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const openImageLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });

      if (!result.canceled) {
        const newImages: SelectedImage[] = result.assets.map((asset: any) => ({
          uri: asset.uri,
          id: `${Date.now()}_${Math.random()}`,
          type: asset.type,
        }));
        setSelectedImages(prev => [...prev, ...newImages].slice(0, 10)); // Max 10 images
      }
    } catch {
      Alert.alert('Error', 'Failed to select photos. Please try again.');
    }
  };

  const getCurrentLocation = async () => {
    setIsLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed to add your current location.');
        setIsLocationLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (reverseGeocode[0]) {
        const address = reverseGeocode[0];
        const locationString = `${address.city || address.district || address.region}, ${address.country || 'Sri Lanka'}`;
        setLocation(locationString);
      }
    } catch {
      Alert.alert('Error', 'Could not get your current location. Please enter manually.');
    } finally {
      setIsLocationLoading(false);
    }
  };

  const removeImage = (imageId: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Google Places API integration for location autocomplete
  const searchLocationSuggestions = async (query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    try {
      // Use the locationService utility for mock data (or real API when ready)
      const suggestions = getMockLocationSuggestions(query);
      setLocationSuggestions(suggestions);
      setShowLocationSuggestions(true);

      // TODO: Replace with real Google Places API call using searchLocationSuggestions from locationService
      // import { searchLocationSuggestions } from '../../utils/locationService';
      // const suggestions = await searchLocationSuggestions(query);
      // setLocationSuggestions(suggestions);
      // setShowLocationSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Error searching locations:', error);
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }
  };

  const handleLocationInputChange = (text: string) => {
    setLocation(text);
    
    // Clear previous timeout
    if (locationSearchTimeout) {
      clearTimeout(locationSearchTimeout);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      searchLocationSuggestions(text);
    }, 200); // Reduced delay for more responsive searching

    setLocationSearchTimeout(timeout);
  };

  const selectLocationSuggestion = (suggestion: LocationSuggestion) => {
    // Mark that a suggestion was just selected
    setSuggestionJustSelected(true);
    
    // Update the location immediately
    setLocation(suggestion.description);
    
    // Hide suggestions immediately
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
    
    // Clear any pending search timeout
    if (locationSearchTimeout) {
      clearTimeout(locationSearchTimeout);
      setLocationSearchTimeout(null);
    }
    
    // Reset the flag after a short delay
    setTimeout(() => setSuggestionJustSelected(false), 100);
  };

  const handlePost = async () => {
    if (!postTitle.trim()) {
      Alert.alert('Missing Title', 'Please add a title for your travel post');
      return;
    }
    
    if (!postContent.trim()) {
      Alert.alert('Missing Content', 'Please write something about your travel experience');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Missing Location', 'Please add a location to help other travelers');
      return;
    }

    setIsPosting(true);

    try {
      // Get auth token
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        Alert.alert('Authentication Required', 'Please log in to create a post');
        setIsPosting(false);
        return;
      }

      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append('title', postTitle.trim());
      formData.append('content', postContent.trim());
      formData.append('locationName', location.trim());
      formData.append('tags', JSON.stringify([selectedCategory]));
      
      // Add post options
      formData.append('allowComments', postOptions.allowComments.toString());
      formData.append('allowSharing', postOptions.allowSharing.toString());

      // Add images if any
      if (selectedImages.length > 0) {
        selectedImages.forEach((image, index) => {
          const uriParts = image.uri.split('.');
          const fileType = uriParts[uriParts.length - 1];
          
          formData.append('images', {
            uri: image.uri,
            name: `photo_${index}.${fileType}`,
            type: `image/${fileType}`,
          } as any);
        });
      }

      console.log('📤 Posting to community service via API Gateway...');

  // Use configured BASE_URL directly
  const apiGatewayURL = `${API_CONFIG.BASE_URL}/api/community/posts`;

      console.log('🌐 Using API Gateway URL:', apiGatewayURL);

      // Make API request through API Gateway
      const response = await fetch(apiGatewayURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let fetch set it with boundary for FormData
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Post created successfully:', data.data);
        
        Alert.alert(
          'Post Created! 🎉',
          'Your travel story has been shared with the WanderLanka community.',
          [
            {
              text: 'Done',
              onPress: () => router.back(),
            },
          ]
        );

        // Reset form
        setPostTitle('');
        setPostContent('');
        setLocation('');
        setSelectedImages([]);
        setSelectedCategory('experience');
      } else {
        console.error('❌ Post creation failed:', data);
        Alert.alert('Error', data.message || 'Failed to create post. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Error creating post:', error);
      Alert.alert(
        'Network Error',
        'Could not connect to the server. Please check your connection and try again.'
      );
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={isPosting}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Travel Story</Text>
        <TouchableOpacity 
          onPress={handlePost}
          disabled={!postTitle.trim() || !postContent.trim() || !location.trim() || isPosting}
          style={[
            styles.postButton,
            (!postTitle.trim() || !postContent.trim() || !location.trim() || isPosting) && styles.postButtonDisabled
          ]}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color={Colors.secondary400} />
          ) : (
            <Text style={[
              styles.postText,
              (!postTitle.trim() || !postContent.trim() || !location.trim()) && styles.postTextDisabled
            ]}>
              Share
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={Colors.secondary400} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.username || 'Traveler'}</Text>
            <Text style={styles.postVisibility}>Sharing to WanderLanka community</Text>
          </View>
        </View>

        {/* Post Category Selection */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Post Category</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            {POST_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons
                  name={category.icon as keyof typeof Ionicons.glyphMap}
                  size={16}
                  color={selectedCategory === category.id ? Colors.white : category.color}
                />
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category.id && styles.categoryChipTextActive
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Post Title */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Title *</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Give your travel story a catchy title..."
            placeholderTextColor={Colors.secondary400}
            value={postTitle}
            onChangeText={setPostTitle}
            maxLength={100}
          />
          <Text style={styles.characterCount}>{postTitle.length}/100</Text>
        </View>

        {/* Content Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Your Travel Story *</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="Share your travel experience... What did you discover? Any tips for fellow travelers? What made this place special?"
            placeholderTextColor={Colors.secondary400}
            multiline
            numberOfLines={8}
            value={postContent}
            onChangeText={setPostContent}
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={styles.characterCount}>{postContent.length}/2000</Text>
        </View>

        {/* Location Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Location *</Text>
          <Text style={styles.inputHint}>Where did you travel? Search for places, attractions, or cities</Text>
          <View style={styles.locationContainer}>
            <View style={styles.locationInputContainer}>
              <Ionicons name="location-outline" size={20} color={Colors.primary600} />
              <TextInput
                style={styles.locationInput}
                placeholder="Type a destination (e.g., Sigiriya, Galle Fort, Ella...)"
                placeholderTextColor={Colors.secondary400}
                value={location}
                onChangeText={handleLocationInputChange}
                onFocus={() => {
                  if (location.length >= 2) {
                    searchLocationSuggestions(location);
                  } else {
                    setShowLocationSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Don't hide suggestions if a suggestion was just selected
                  if (suggestionJustSelected) {
                    return;
                  }
                  // Delay hiding suggestions to allow for selection
                  setTimeout(() => {
                    if (!suggestionJustSelected) {
                      setShowLocationSuggestions(false);
                    }
                  }, 300);
                }}
              />
              {location.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setLocation('');
                    setLocationSuggestions([]);
                    setShowLocationSuggestions(false);
                  }}
                  style={styles.clearLocationButton}
                >
                  <Ionicons name="close-circle" size={16} color={Colors.secondary400} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              style={styles.locationButton} 
              onPress={getCurrentLocation}
              disabled={isLocationLoading}
            >
              <Ionicons 
                name={isLocationLoading ? "hourglass-outline" : "locate-outline"} 
                size={16} 
                color={Colors.primary600} 
              />
              <Text style={styles.locationButtonText}>
                {isLocationLoading ? 'Getting...' : 'Current'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Location Suggestions */}
          {showLocationSuggestions && (
            <View style={styles.locationSuggestions}>
              <Text style={styles.suggestionsHeader}>Suggested Locations</Text>
              {locationSuggestions.length > 0 ? (
                <>
                  {locationSuggestions.slice(0, 5).map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion.place_id}
                      style={styles.suggestionItem}
                      onPress={() => selectLocationSuggestion(suggestion)}
                      onPressIn={() => setSuggestionJustSelected(true)}
                      activeOpacity={0.7}
                      delayPressIn={0}
                      delayLongPress={2000}
                    >
                      <Ionicons 
                        name={getLocationIcon(suggestion.types) as any} 
                        size={16} 
                        color={Colors.primary600} 
                      />
                      <View style={styles.suggestionTextContainer}>
                        <Text style={styles.suggestionMainText}>{suggestion.main_text}</Text>
                        <Text style={styles.suggestionSecondaryText}>{suggestion.secondary_text}</Text>
                      </View>
                      <Ionicons name="arrow-up-outline" size={14} color={Colors.secondary400} style={styles.suggestionArrow} />
                    </TouchableOpacity>
                  ))}
                  <View style={styles.suggestionsFooter}>
                    <Ionicons name="information-circle-outline" size={12} color={Colors.secondary400} />
                    <Text style={styles.suggestionsFooterText}>
                      Can&apos;t find your location? Just type it manually
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.noSuggestionsContainer}>
                  <Ionicons name="search-outline" size={20} color={Colors.secondary400} />
                  <Text style={styles.noSuggestionsText}>No matching locations found</Text>
                  <Text style={styles.noSuggestionsSubtext}>You can still type your location manually</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Photo Section */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Photos ({selectedImages.length}/10)</Text>
          <TouchableOpacity style={styles.photoSection} onPress={handleImagePicker}>
            <View style={styles.photoHeader}>
              <Ionicons name="camera-outline" size={20} color={Colors.primary600} />
              <Text style={styles.photoText}>Add Travel Photos</Text>
              <View style={styles.photoBadge}>
                <Text style={styles.photoBadgeText}>Optional</Text>
              </View>
            </View>
            
            {selectedImages.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesList}>
                {selectedImages.map((image) => (
                  <View key={image.id} style={styles.imageContainer}>
                    <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(image.id)}
                    >
                      <Ionicons name="close-circle" size={20} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addMoreButton} onPress={handleImagePicker}>
                  <Ionicons name="add" size={24} color={Colors.primary600} />
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="image-outline" size={32} color={Colors.secondary400} />
                <Text style={styles.photoPlaceholderText}>Tap to add photos</Text>
                <Text style={styles.photoPlaceholderSubtext}>Make your story more engaging</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Post Options */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Privacy & Settings</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.option} 
              onPress={() => setPostOptions(prev => ({ ...prev, allowComments: !prev.allowComments }))}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="chatbubbles-outline" size={20} color={Colors.primary600} />
                <Text style={styles.optionText}>Allow comments from travelers</Text>
              </View>
              <View style={[styles.toggle, postOptions.allowComments && styles.toggleActive]}>
                <View style={[styles.toggleKnob, postOptions.allowComments && styles.toggleKnobActive]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.option} 
              onPress={() => setPostOptions(prev => ({ ...prev, allowSharing: !prev.allowSharing }))}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="share-outline" size={20} color={Colors.primary600} />
                <Text style={styles.optionText}>Allow others to share this post</Text>
              </View>
              <View style={[styles.toggle, postOptions.allowSharing && styles.toggleActive]}>
                <View style={[styles.toggleKnob, postOptions.allowSharing && styles.toggleKnobActive]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.option} 
              onPress={() => setPostOptions(prev => ({ ...prev, showExactLocation: !prev.showExactLocation }))}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="location-outline" size={20} color={Colors.primary600} />
                <Text style={styles.optionText}>Show exact GPS location</Text>
              </View>
              <View style={[styles.toggle, postOptions.showExactLocation && styles.toggleActive]}>
                <View style={[styles.toggleKnob, postOptions.showExactLocation && styles.toggleKnobActive]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Tips for a great travel post</Text>
          <Text style={styles.tip}>• Share specific details about your experience</Text>
          <Text style={styles.tip}>• Include helpful tips for other travelers</Text>
          <Text style={styles.tip}>• Add photos to make your story more engaging</Text>
          <Text style={styles.tip}>• Mention costs, timings, or useful contacts</Text>
          <Text style={styles.tip}>• Be honest about both positives and challenges</Text>
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
  cancelText: {
    fontSize: 16,
    color: Colors.secondary600,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primary600,
  },
  postButtonDisabled: {
    backgroundColor: Colors.secondary200,
  },
  postText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  postTextDisabled: {
    color: Colors.secondary500,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  postVisibility: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  categorySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.light200,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary600,
    borderColor: Colors.primary600,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.secondary600,
    marginLeft: 6,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: Colors.secondary500,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  titleInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.black,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  contentInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.black,
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.secondary500,
    textAlign: 'right',
    marginTop: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
    marginLeft: 12,
  },
  clearLocationButton: {
    padding: 4,
    marginLeft: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  locationButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary600,
    marginLeft: 4,
  },
  locationSuggestions: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    maxHeight: 200,
  },
  suggestionsHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary600,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light100,
    backgroundColor: Colors.white,
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionMainText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
    marginBottom: 2,
  },
  suggestionSecondaryText: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  suggestionArrow: {
    transform: [{ rotate: '45deg' }],
    marginLeft: 8,
  },
  suggestionsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.secondary50,
  },
  suggestionsFooterText: {
    fontSize: 10,
    color: Colors.secondary400,
    marginLeft: 4,
  },
  noSuggestionsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  noSuggestionsText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary600,
    marginTop: 8,
  },
  noSuggestionsSubtext: {
    fontSize: 12,
    color: Colors.secondary400,
    marginTop: 4,
  },
  photoSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
    marginLeft: 8,
    flex: 1,
  },
  photoBadge: {
    backgroundColor: Colors.secondary200,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  photoBadgeText: {
    fontSize: 10,
    color: Colors.secondary600,
    fontWeight: '500',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderWidth: 2,
    borderColor: Colors.light200,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  photoPlaceholderText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary600,
    marginTop: 8,
  },
  photoPlaceholderSubtext: {
    fontSize: 12,
    color: Colors.secondary400,
    marginTop: 2,
  },
  imagesList: {
    marginTop: 8,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 8,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.white,
    borderRadius: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  addMoreButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.light100,
    borderWidth: 2,
    borderColor: Colors.light200,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light100,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: 14,
    color: Colors.black,
    marginLeft: 12,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light200,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: Colors.primary600,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  tipsSection: {
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary700,
    marginBottom: 8,
  },
  tip: {
    fontSize: 12,
    color: Colors.primary700,
    lineHeight: 16,
    marginBottom: 4,
  },
});
