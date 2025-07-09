import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CustomButton, CustomTextInput, ProfileAvatar } from '../../components';
import React, { useState } from 'react';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// Mock user data - in real app, this would come from the auth context or API
const MOCK_USER_DATA = {
  id: 'user123',
  username: 'john_traveler',
  email: 'john@example.com',
  fullName: 'John Doe',
  phone: '+94 77 123 4567',
  avatar: null,
  bio: 'Adventure enthusiast exploring the beautiful island of Sri Lanka',
  dateOfBirth: '1990-05-15',
  gender: 'Male',
  nationality: 'Sri Lankan',
  isActive: true,
  phoneVerified: true,
  passportNumber: 'N1234567',
  emergencyContact: {
    name: 'Jane Doe',
    phone: '+94 77 987 6543',
    relationship: 'Sister',
  },
  preferences: {
    budget: 'Mid-range',
    accommodation: 'Hotel',
    dietary: 'No restrictions',
    interests: ['Culture', 'Adventure', 'Photography', 'Food'],
  },
};

interface EditSectionProps {
  title: string;
  children: React.ReactNode;
}

const EditSection: React.FC<EditSectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

export default function EditProfileScreen() {
  const [formData, setFormData] = useState({
    fullName: MOCK_USER_DATA.fullName,
    username: MOCK_USER_DATA.username,
    email: MOCK_USER_DATA.email,
    phone: MOCK_USER_DATA.phone,
    bio: MOCK_USER_DATA.bio,
    dateOfBirth: MOCK_USER_DATA.dateOfBirth,
    gender: MOCK_USER_DATA.gender,
    nationality: MOCK_USER_DATA.nationality,
    passportNumber: MOCK_USER_DATA.passportNumber,
    emergencyContactName: MOCK_USER_DATA.emergencyContact.name,
    emergencyContactPhone: MOCK_USER_DATA.emergencyContact.phone,
    emergencyContactRelationship: MOCK_USER_DATA.emergencyContact.relationship,
    budget: MOCK_USER_DATA.preferences.budget,
    accommodation: MOCK_USER_DATA.preferences.accommodation,
    dietary: MOCK_USER_DATA.preferences.dietary,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(MOCK_USER_DATA.avatar);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+94\s\d{2}\s\d{3}\s\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid Sri Lankan phone number (+94 XX XXX XXXX)';
    }

    // Passport number validation
    if (!formData.passportNumber.trim()) {
      newErrors.passportNumber = 'Passport number is required';
    } else if (!/^[A-Z]\d{7}$/.test(formData.passportNumber)) {
      newErrors.passportNumber = 'Please enter a valid passport number (e.g., N1234567)';
    }

    // Emergency contact validation
    if (!formData.emergencyContactName.trim()) {
      newErrors.emergencyContactName = 'Emergency contact name is required';
    }

    if (!formData.emergencyContactPhone.trim()) {
      newErrors.emergencyContactPhone = 'Emergency contact phone is required';
    } else if (!/^\+94\s\d{2}\s\d{3}\s\d{4}$/.test(formData.emergencyContactPhone)) {
      newErrors.emergencyContactPhone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Profile Updated',
        'Your profile has been updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarEdit = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => console.log('Open Camera') },
        { text: 'Gallery', onPress: () => console.log('Open Gallery') },
        { text: 'Remove Photo', onPress: () => setSelectedAvatar(null), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Continue Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSaveProfile} style={styles.headerButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Photo Section */}
          <View style={styles.avatarSection}>
            <ProfileAvatar
              imageUri={selectedAvatar}
              size={100}
              onEdit={handleAvatarEdit}
            />
            <Text style={styles.avatarHint}>Tap to change profile photo</Text>
          </View>

          {/* Basic Information */}
          <EditSection title="Basic Information">
            <CustomTextInput
              label="Full Name"
              value={formData.fullName}
              onChangeText={(value: string) => handleInputChange('fullName', value)}
              error={errors.fullName}
              placeholder="Enter your full name"
              leftIcon="person-outline"
            />

            <CustomTextInput
              label="Username"
              value={formData.username}
              onChangeText={(value: string) => handleInputChange('username', value)}
              error={errors.username}
              placeholder="Enter your username"
              leftIcon="at-outline"
              autoCapitalize="none"
            />

            <CustomTextInput
              label="Email"
              value={formData.email}
              onChangeText={(value: string) => handleInputChange('email', value)}
              error={errors.email}
              placeholder="Enter your email"
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <CustomTextInput
              label="Phone Number"
              value={formData.phone}
              onChangeText={(value: string) => handleInputChange('phone', value)}
              error={errors.phone}
              placeholder="+94 XX XXX XXXX"
              leftIcon="call-outline"
              keyboardType="phone-pad"
            />

            <CustomTextInput
              label="Bio"
              value={formData.bio}
              onChangeText={(value: string) => handleInputChange('bio', value)}
              error={errors.bio}
              placeholder="Tell us about yourself"
              leftIcon="document-text-outline"
              multiline
              numberOfLines={3}
            />
          </EditSection>

          {/* Personal Details */}
          <EditSection title="Personal Details">
            <CustomTextInput
              label="Date of Birth"
              value={formData.dateOfBirth}
              onChangeText={(value: string) => handleInputChange('dateOfBirth', value)}
              error={errors.dateOfBirth}
              placeholder="YYYY-MM-DD"
              leftIcon="calendar-outline"
            />

            <CustomTextInput
              label="Gender"
              value={formData.gender}
              onChangeText={(value: string) => handleInputChange('gender', value)}
              error={errors.gender}
              placeholder="Gender"
              leftIcon="person-outline"
            />

            <CustomTextInput
              label="Nationality"
              value={formData.nationality}
              onChangeText={(value: string) => handleInputChange('nationality', value)}
              error={errors.nationality}
              placeholder="Your nationality"
              leftIcon="flag-outline"
            />

            <CustomTextInput
              label="Passport Number"
              value={formData.passportNumber}
              onChangeText={(value: string) => handleInputChange('passportNumber', value)}
              error={errors.passportNumber}
              placeholder="N1234567"
              leftIcon="document-outline"
              autoCapitalize="characters"
            />
          </EditSection>

          {/* Emergency Contact */}
          <EditSection title="Emergency Contact">
            <CustomTextInput
              label="Contact Name"
              value={formData.emergencyContactName}
              onChangeText={(value: string) => handleInputChange('emergencyContactName', value)}
              error={errors.emergencyContactName}
              placeholder="Emergency contact name"
              leftIcon="person-add-outline"
            />

            <CustomTextInput
              label="Contact Phone"
              value={formData.emergencyContactPhone}
              onChangeText={(value: string) => handleInputChange('emergencyContactPhone', value)}
              error={errors.emergencyContactPhone}
              placeholder="+94 XX XXX XXXX"
              leftIcon="call-outline"
              keyboardType="phone-pad"
            />

            <CustomTextInput
              label="Relationship"
              value={formData.emergencyContactRelationship}
              onChangeText={(value: string) => handleInputChange('emergencyContactRelationship', value)}
              error={errors.emergencyContactRelationship}
              placeholder="Relationship (e.g., Parent, Sibling)"
              leftIcon="heart-outline"
            />
          </EditSection>

          {/* Travel Preferences */}
          <EditSection title="Travel Preferences">
            <CustomTextInput
              label="Budget Range"
              value={formData.budget}
              onChangeText={(value: string) => handleInputChange('budget', value)}
              error={errors.budget}
              placeholder="Budget preference"
              leftIcon="wallet-outline"
            />

            <CustomTextInput
              label="Accommodation Type"
              value={formData.accommodation}
              onChangeText={(value: string) => handleInputChange('accommodation', value)}
              error={errors.accommodation}
              placeholder="Preferred accommodation"
              leftIcon="bed-outline"
            />

            <CustomTextInput
              label="Dietary Restrictions"
              value={formData.dietary}
              onChangeText={(value: string) => handleInputChange('dietary', value)}
              error={errors.dietary}
              placeholder="Any dietary restrictions"
              leftIcon="restaurant-outline"
            />
          </EditSection>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <CustomButton
              title="Save Changes"
              onPress={handleSaveProfile}
              loading={isLoading}
              style={styles.saveButton}
            />
            
            <CustomButton
              title="Cancel"
              onPress={handleCancel}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
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
  keyboardAvoidingView: {
    flex: 1,
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
  headerButton: {
    padding: 4,
    minWidth: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: Colors.white,
    marginBottom: 10,
  },
  avatarHint: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: 8,
  },
  section: {
    backgroundColor: Colors.white,
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 16,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  saveButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 20,
  },
});
