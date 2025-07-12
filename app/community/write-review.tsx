import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useRef, useState } from 'react';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// Review categories with icons
const REVIEW_CATEGORIES = [
  { id: 'accommodation', name: 'Hotels & Stays', icon: 'bed' },
  { id: 'activity', name: 'Activities & Tours', icon: 'camera' },
  { id: 'transport', name: 'Transport', icon: 'car' },
  { id: 'guide', name: 'Tour Guides', icon: 'person' },
  { id: 'restaurant', name: 'Restaurants', icon: 'restaurant' },
  { id: 'attraction', name: 'Attractions', icon: 'location' },
];

interface ValidationErrors {
  businessName?: string;
  category?: string;
  rating?: string;
  title?: string;
  content?: string;
}

export default function WriteReviewScreen() {
  const [businessName, setBusinessName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!selectedCategory) {
      newErrors.category = 'Please select a category';
    }

    if (rating === 0) {
      newErrors.rating = 'Please provide a rating';
    }

    if (!reviewTitle.trim()) {
      newErrors.title = 'Review title is required';
    } else if (reviewTitle.trim().length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }

    if (!reviewContent.trim()) {
      newErrors.content = 'Review content is required';
    } else if (reviewContent.trim().length < 50) {
      newErrors.content = 'Review must be at least 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Star rating handler
  const handleStarPress = (selectedRating: number) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setRating(selectedRating);
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: undefined }));
    }
  };

  // Photo handling functions
  const handleAddPhoto = () => {
    if (photos.length >= 5) {
      Alert.alert('Photo Limit', 'You can upload a maximum of 5 photos');
      return;
    }

    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        {
          text: 'Camera',
          onPress: () => handleCameraPhoto(),
        },
        {
          text: 'Photo Library',
          onPress: () => handleLibraryPhoto(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleCameraPhoto = () => {
    // Simulate camera photo capture
    const newPhoto = `https://picsum.photos/400/300?random=${Date.now()}`;
    setPhotos(prev => [...prev, newPhoto]);
  };

  const handleLibraryPhoto = () => {
    // Simulate photo library selection
    const newPhoto = `https://picsum.photos/400/300?random=${Date.now()}`;
    setPhotos(prev => [...prev, newPhoto]);
  };

  const handleRemovePhoto = (index: number) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPhotos(prev => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  // Form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock submission data
      const reviewData = {
        businessName,
        category: selectedCategory,
        rating,
        title: reviewTitle,
        content: reviewContent,
        photos,
        anonymous: isAnonymous,
        timestamp: new Date().toISOString(),
      };

      console.log('Review submitted:', reviewData);

      Alert.alert(
        'Review Submitted!',
        'Thank you for sharing your experience. Your review will be published after moderation.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear error when user starts typing
  const clearError = (field: keyof ValidationErrors) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(star)}
            style={styles.starButton}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={32}
                color={star <= rating ? Colors.warning : Colors.secondary400}
              />
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write Review</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Business Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Name *</Text>
            <TextInput
              style={[styles.input, errors.businessName && styles.inputError]}
              placeholder="Enter business or service name"
              placeholderTextColor={Colors.secondary400}
              value={businessName}
              onChangeText={(text) => {
                setBusinessName(text);
                clearError('businessName');
              }}
            />
            {errors.businessName && (
              <Text style={styles.errorText}>{errors.businessName}</Text>
            )}
          </View>

          {/* Category Selection */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Category *</Text>
            <View style={styles.categoryGrid}>
              {REVIEW_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category.id && styles.selectedCategory,
                    errors.category && !selectedCategory && styles.categoryError
                  ]}
                  onPress={() => {
                    setSelectedCategory(category.id);
                    clearError('category');
                  }}
                >
                  <Ionicons
                    name={category.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={selectedCategory === category.id ? Colors.white : Colors.primary600}
                  />
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.selectedCategoryText
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
          </View>

          {/* Review Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="Summarize your experience in a few words"
              placeholderTextColor={Colors.secondary400}
              value={reviewTitle}
              onChangeText={(text) => {
                setReviewTitle(text);
                clearError('title');
              }}
              maxLength={100}
            />
            <Text style={styles.characterCount}>{reviewTitle.length}/100</Text>
            {errors.title && (
              <Text style={styles.errorText}>{errors.title}</Text>
            )}
          </View>

          {/* Review Content */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Review *</Text>
            <TextInput
              style={[styles.textArea, errors.content && styles.inputError]}
              placeholder="Share details about your experience. What did you like? What could be improved?"
              placeholderTextColor={Colors.secondary400}
              value={reviewContent}
              onChangeText={(text) => {
                setReviewContent(text);
                clearError('content');
              }}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.characterCount}>{reviewContent.length}/1000</Text>
            {errors.content && (
              <Text style={styles.errorText}>{errors.content}</Text>
            )}
          </View>

          {/* Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rating *</Text>
            {renderStars()}
            <Text style={styles.ratingText}>
              {rating === 0 
                ? 'Tap to rate your experience'
                : `${rating} star${rating !== 1 ? 's' : ''} - ${
                    rating === 1 ? 'Poor' :
                    rating === 2 ? 'Fair' :
                    rating === 3 ? 'Good' :
                    rating === 4 ? 'Very Good' : 'Excellent'
                  }`
              }
            </Text>
            {errors.rating && (
              <Text style={styles.errorText}>{errors.rating}</Text>
            )}
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos (Optional)</Text>
            
            {/* Photo Grid */}
            {photos.length > 0 && (
              <View style={styles.photoGrid}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <Image source={{ uri: photo }} style={styles.photoThumbnail} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => handleRemovePhoto(index)}
                    >
                      <Ionicons name="close-circle" size={20} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add Photo Button */}
            <TouchableOpacity 
              style={[
                styles.addPhotoButton,
                photos.length >= 5 && styles.addPhotoButtonDisabled
              ]} 
              onPress={handleAddPhoto}
              disabled={photos.length >= 5}
            >
              <Ionicons name="camera-outline" size={24} color={
                photos.length >= 5 ? Colors.secondary400 : Colors.primary600
              } />
              <Text style={[
                styles.addPhotoText,
                photos.length >= 5 && styles.addPhotoTextDisabled
              ]}>
                {photos.length === 0 ? 'Add Photos' : `Add More Photos (${photos.length}/5)`}
              </Text>
            </TouchableOpacity>
            <Text style={styles.photoHint}>
              Help others by sharing photos of your experience
            </Text>
          </View>

          {/* Anonymous Toggle */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Post Anonymously</Text>
                <Text style={styles.toggleSubtitle}>
                  Your name will be hidden from other users
                </Text>
              </View>
              <View
                style={[
                  styles.toggleSwitch,
                  isAnonymous && styles.toggleSwitchActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    isAnonymous && styles.toggleThumbActive,
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.black,
    backgroundColor: Colors.white,
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.secondary500,
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  // Category grid styles
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.light200,
  },
  selectedCategory: {
    backgroundColor: Colors.primary600,
    borderColor: Colors.primary600,
  },
  categoryError: {
    borderColor: Colors.error,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary600,
    marginLeft: 12,
    flex: 1,
  },
  selectedCategoryText: {
    color: Colors.white,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.light200,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary600,
    borderColor: Colors.primary600,
  },
  categoryButtonError: {
    borderColor: Colors.error,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary600,
    marginLeft: 8,
  },
  categoryButtonTextActive: {
    color: Colors.white,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starButton: {
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.secondary600,
    fontStyle: 'italic',
  },
  // Photo styles
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
    marginBottom: 12,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.light200,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.white,
    borderRadius: 10,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary600,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    backgroundColor: Colors.primary100,
    marginBottom: 8,
  },
  addPhotoButtonDisabled: {
    borderColor: Colors.secondary400,
    backgroundColor: Colors.light100,
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary600,
    marginLeft: 8,
  },
  addPhotoTextDisabled: {
    color: Colors.secondary400,
  },
  photoHint: {
    fontSize: 12,
    color: Colors.secondary500,
    fontStyle: 'italic',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.light200,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: Colors.primary600,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  submitButton: {
    backgroundColor: Colors.primary600,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.secondary400,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  bottomSpacing: {
    height: 40,
  },
});
