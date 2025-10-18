import {
  Alert,
  Animated,
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
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { NetworkDetection } from '../../utils/serverDetection';

// Question categories
const QUESTION_CATEGORIES = [
  { id: 'travel-tips', name: 'Travel Tips', icon: 'map' },
  { id: 'safety', name: 'Safety', icon: 'shield-checkmark' },
  { id: 'transportation', name: 'Transportation', icon: 'car' },
  { id: 'food-dining', name: 'Food & Dining', icon: 'restaurant' },
  { id: 'accommodation', name: 'Accommodation', icon: 'bed' },
  { id: 'activities', name: 'Activities', icon: 'camera' },
  { id: 'culture', name: 'Culture', icon: 'library' },
  { id: 'budget', name: 'Budget', icon: 'wallet' },
];

interface ValidationErrors {
  title?: string;
  content?: string;
  category?: string;
  tags?: string;
}

export default function AskQuestionFormScreen() {
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionContent, setQuestionContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!questionTitle.trim()) {
      newErrors.title = 'Question title is required';
    } else if (questionTitle.trim().length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    } else if (questionTitle.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!questionContent.trim()) {
      newErrors.content = 'Question content is required';
    } else if (questionContent.trim().length < 20) {
      newErrors.content = 'Content must be at least 20 characters';
    } else if (questionContent.trim().length > 2000) {
      newErrors.content = 'Content must be less than 2000 characters';
    }

    if (!selectedCategory) {
      newErrors.category = 'Please select a category';
    }

    if (tags.trim() && tags.split(',').some(tag => tag.trim().length < 2)) {
      newErrors.tags = 'Tags must be at least 2 characters each';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get auth token
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Error', 'Please login to ask a question');
        setIsSubmitting(false);
        return;
      }

      // Get base URL
      const baseURL = await NetworkDetection.detectServer();

      // Prepare question data
      const questionData = {
        title: questionTitle.trim(),
        content: questionContent.trim(),
        category: selectedCategory,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        isAnonymous: isAnonymous,
      };

      console.log('📤 Submitting question:', questionData);

      // Make API call
      const response = await fetch(`${baseURL}/api/community/questions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });

      const data = await response.json();

      console.log('📥 Response:', data);

      if (response.ok && data.success) {
        Alert.alert(
          'Question Submitted!',
          'Your question has been posted to the community. You\'ll be notified when someone answers it.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to submit question. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error submitting question:', error);
      Alert.alert('Error', 'Failed to submit question. Please try again.');
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

  // Handle category selection with animation
  const handleCategoryPress = (categoryId: string) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setSelectedCategory(categoryId);
    clearError('category');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ask Question</Text>
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
          {/* Question Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Question Title *</Text>
            <Text style={styles.sectionHint}>
              Be specific and imagine you're asking a question to another person
            </Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="e.g., What's the best time to visit Sigiriya Rock?"
              placeholderTextColor={Colors.secondary400}
              value={questionTitle}
              onChangeText={(text) => {
                setQuestionTitle(text);
                clearError('title');
              }}
              maxLength={100}
            />
            <Text style={styles.characterCount}>{questionTitle.length}/100</Text>
            {errors.title && (
              <Text style={styles.errorText}>{errors.title}</Text>
            )}
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category *</Text>
            <Text style={styles.sectionHint}>
              Choose the category that best fits your question
            </Text>
            <View style={styles.categoryGrid}>
              {QUESTION_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category.id && styles.selectedCategory,
                    errors.category && !selectedCategory && styles.categoryError
                  ]}
                  onPress={() => handleCategoryPress(category.id)}
                >
                  <Animated.View 
                    style={[
                      styles.categoryContent,
                      { transform: [{ scale: scaleAnim }] }
                    ]}
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
                  </Animated.View>
                </TouchableOpacity>
              ))}
            </View>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
          </View>

          {/* Question Content */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Question Details *</Text>
            <Text style={styles.sectionHint}>
              Include all the information someone would need to answer your question
            </Text>
            <TextInput
              style={[styles.textArea, errors.content && styles.inputError]}
              placeholder="Provide more details about your question. What have you tried? What specific information are you looking for?"
              placeholderTextColor={Colors.secondary400}
              value={questionContent}
              onChangeText={(text) => {
                setQuestionContent(text);
                clearError('content');
              }}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.characterCount}>{questionContent.length}/2000</Text>
            {errors.content && (
              <Text style={styles.errorText}>{errors.content}</Text>
            )}
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags (Optional)</Text>
            <Text style={styles.sectionHint}>
              Add up to 5 tags to help others find your question (separate with commas)
            </Text>
            <TextInput
              style={[styles.input, errors.tags && styles.inputError]}
              placeholder="e.g., sigiriya, timing, crowds, budget"
              placeholderTextColor={Colors.secondary400}
              value={tags}
              onChangeText={(text) => {
                setTags(text);
                clearError('tags');
              }}
              maxLength={100}
            />
            <Text style={styles.characterCount}>{tags.length}/100</Text>
            {errors.tags && (
              <Text style={styles.errorText}>{errors.tags}</Text>
            )}
          </View>

          {/* Anonymous Toggle */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Ask Anonymously</Text>
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

          {/* Tips Section */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Tips for Getting Great Answers</Text>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.tipText}>Be specific and clear in your question</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.tipText}>Include relevant details and context</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.tipText}>Use appropriate tags to reach the right audience</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.tipText}>Be respectful and follow community guidelines</Text>
              </View>
            </View>
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
              {isSubmitting ? 'Posting Question...' : 'Post Question'}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: Colors.secondary500,
    marginBottom: 12,
    lineHeight: 16,
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
    minHeight: 160,
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
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.light200,
    overflow: 'hidden',
  },
  selectedCategory: {
    backgroundColor: Colors.primary600,
    borderColor: Colors.primary600,
  },
  categoryError: {
    borderColor: Colors.error,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  tipsSection: {
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary600,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary700,
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipText: {
    fontSize: 12,
    color: Colors.primary700,
    flex: 1,
    lineHeight: 16,
  },
  submitButton: {
    backgroundColor: Colors.primary600,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
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
