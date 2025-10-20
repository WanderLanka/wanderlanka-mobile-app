import {
  ActivityIndicator,
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
import React, { useEffect, useState } from 'react';
import { UpdateProfileData, UserProfile, getProfile, updateProfile } from '../../services/profileApi';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

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
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    bio: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    passportNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    budget: '',
    accommodation: '',
    dietary: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch user profile data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const profile = await getProfile();
      setUserData(profile);
      setSelectedAvatar(profile.avatar);
      
      // Populate form with existing data
      setFormData({
        fullName: profile.fullName || '',
        username: profile.username || '',
        email: profile.email || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        dateOfBirth: profile.dateOfBirth || '',
        gender: profile.gender || '',
        nationality: profile.nationality || '',
        passportNumber: profile.passportNumber || '',
        emergencyContactName: profile.emergencyContact?.name || '',
        emergencyContactPhone: profile.emergencyContact?.phone || '',
        emergencyContactRelationship: profile.emergencyContact?.relationship || '',
        budget: profile.preferences?.budget || '',
        accommodation: profile.preferences?.accommodation || '',
        dietary: profile.preferences?.dietary || '',
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Full name validation (REQUIRED)
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Username validation (REQUIRED)
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation (REQUIRED)
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (OPTIONAL - Basic validation for international numbers)
    if (formData.phone.trim() && formData.phone.length < 8) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Passport number validation (OPTIONAL - No validation if empty)
    // Only validate format if user enters a value
    if (formData.passportNumber.trim() && formData.passportNumber.length < 6) {
      newErrors.passportNumber = 'Passport number must be at least 6 characters';
    }

    // Emergency contact validation (OPTIONAL)
    // Only validate if user starts filling emergency contact
    if (formData.emergencyContactPhone.trim() && formData.emergencyContactPhone.length < 8) {
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
      // Prepare update data
      const updateData: UpdateProfileData = {
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        bio: formData.bio,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as 'Male' | 'Female' | 'Other' | undefined,
        nationality: formData.nationality,
        passportNumber: formData.passportNumber,
        emergencyContact: {
          name: formData.emergencyContactName || null,
          phone: formData.emergencyContactPhone || null,
          relationship: formData.emergencyContactRelationship || null,
        },
        preferences: {
          budget: formData.budget as any || null,
          accommodation: formData.accommodation as any || null,
          dietary: formData.dietary || null,
          interests: userData?.preferences?.interests || [],
        },
      };

      // Call API to update profile
      await updateProfile(updateData);
      
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
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
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
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary600} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
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

          {/* Required Fields Notice */}
          <View style={styles.noticeContainer}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary600} />
            <Text style={styles.noticeText}>
              Fields marked with * are required
            </Text>
          </View>

          {/* Basic Information */}
          <EditSection title="Basic Information">
            <CustomTextInput
              label="Full Name *"
              value={formData.fullName}
              onChangeText={(value: string) => handleInputChange('fullName', value)}
              error={errors.fullName}
              placeholder="Enter your full name"
              leftIcon="person-outline"
            />

            <CustomTextInput
              label="Username *"
              value={formData.username}
              onChangeText={(value: string) => handleInputChange('username', value)}
              error={errors.username}
              placeholder="Enter your username"
              leftIcon="at-outline"
              autoCapitalize="none"
            />

            <CustomTextInput
              label="Email *"
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
              placeholder="Enter your phone number (e.g., +1 234 567 8900)"
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
          <EditSection title="Personal Details (Optional)">
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
              placeholder="e.g., N1234567"
              leftIcon="document-outline"
              autoCapitalize="characters"
            />
          </EditSection>

          {/* Emergency Contact */}
          <EditSection title="Emergency Contact (Optional)">
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
              placeholder="Emergency contact phone"
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
          <EditSection title="Travel Preferences (Optional)">
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.secondary600,
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
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary600,
  },
  noticeText: {
    fontSize: 13,
    color: Colors.primary700,
    marginLeft: 8,
    flex: 1,
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
