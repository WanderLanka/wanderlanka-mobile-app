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
import React, { useCallback, useEffect, useRef, useState } from 'react';
  
  import { Colors } from '../../constants/Colors';
  import { Ionicons } from '@expo/vector-icons';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import { router } from 'expo-router';
import { GuideService } from '../../services/guide';
import * as ImagePicker from 'expo-image-picker';
import { toAbsoluteImageUrl } from '../../utils/imageUrl';
import { API_CONFIG } from '../../services/config';
import { StorageService } from '../../services/storage';
  
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
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [guideData, setGuideData] = useState<any>(null);
    
    const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      contactNumber: '',
      bio: '',
      languages: [] as string[],
    });
  
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fetchingRef = useRef(false);
    
    // Fetch profile data from listing-service (ONE request)
    const fetchProfileData = useCallback(async () => {
      // Prevent multiple simultaneous fetches using ref
      if (fetchingRef.current) {
        console.log('Already fetching data, skipping...');
        return;
      }

      try {
        fetchingRef.current = true;
        setLoading(true);
        
        // Get user data from storage to get userId
        const user = await StorageService.getUserData();
        
        if (!user) {
          throw new Error('User not logged in');
        }

        // Use userId (ObjectId) to fetch profile
        const userId = user.id || user._id;
        const username = user.username;
        
        if (!userId && !username) {
          throw new Error('User identifier not found');
        }

        // Fetch combined profile from listing-service with ONE request
        // Use userId as query param if available, otherwise use username in path
        const accessToken = await StorageService.getAccessToken();
        const endpoint = userId 
          ? `${API_CONFIG.BASE_URL}/api/listing/service/tourguide-listing/guide/me?userId=${encodeURIComponent(userId)}`
          : `${API_CONFIG.BASE_URL}/api/listing/service/tourguide-listing/guide/${encodeURIComponent(username)}`;
        
        const response = await fetch(endpoint, {
          headers: {
            'Accept': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          const guideInfo = result.data;
          setGuideData(guideInfo);
          const storedUser = await StorageService.getUserData();
          setUserData({
            email: guideInfo.email || storedUser?.email || '',
            emailVerified: typeof guideInfo.emailVerified === 'boolean' ? guideInfo.emailVerified : !!storedUser?.emailVerified,
            username: guideInfo.username || storedUser?.username,
          });
          
          // Populate form with actual data (fallback to stored email if missing)
          setFormData({
            firstName: guideInfo?.details?.firstName || '',
            lastName: guideInfo?.details?.lastName || '',
            username: guideInfo?.username || storedUser?.username || '',
            email: guideInfo?.email || storedUser?.email || '',
            contactNumber: guideInfo?.details?.contactNumber || '',
            bio: guideInfo?.details?.bio || '',
            languages: guideInfo?.details?.languages || [],
          });
          
          // Set avatar if available
          if (guideInfo?.details?.avatar) {
            setSelectedAvatar(toAbsoluteImageUrl(guideInfo.details.avatar));
          }
        } else {
          throw new Error('Failed to load profile data');
        }
      } catch (error: any) {
        console.error('Failed to fetch profile data:', error);
        
        // Handle rate limiting error specifically
        if (error?.status === 429 || error?.message?.includes('Too many requests')) {
          Alert.alert(
            'Too Many Requests',
            'Please wait a moment before trying again.',
            [
              {
                text: 'Go Back',
                onPress: () => router.back()
              }
            ]
          );
        } else if (error?.message?.includes('authentication') || error?.message?.includes('401')) {
          Alert.alert(
            'Authentication Error',
            'There was an issue with your session. Please try logging in again.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/auth/login')
              }
            ]
          );
        } else {
          Alert.alert('Error', 'Failed to load profile data', [
            {
              text: 'Go Back',
              onPress: () => router.back()
            }
          ]);
        }
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    }, []); // Empty dependencies - only create once
    
    useEffect(() => {
      fetchProfileData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependencies - run only once on mount
  
    const handleInputChange = (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };
  
    const validateForm = (): boolean => {
      const newErrors: Record<string, string> = {};
  
      // First name validation
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      } else if (formData.firstName.length < 2) {
        newErrors.firstName = 'First name must be at least 2 characters';
      }
  
      // Last name validation
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      } else if (formData.lastName.length < 2) {
        newErrors.lastName = 'Last name must be at least 2 characters';
      }
  
      // Username validation
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, and underscores';
      }
  
      // Contact number validation
      if (!formData.contactNumber.trim()) {
        newErrors.contactNumber = 'Contact number is required';
      }
  
      // Bio validation (optional but with max length)
      if (formData.bio && formData.bio.length > 500) {
        newErrors.bio = 'Bio must not exceed 500 characters';
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
        const guideId = guideData?._id || guideData?.username;
        if (!guideId) {
          Alert.alert('Error', 'Guide profile not found');
          return;
        }
  
        // Update guide profile in guide-service
        await GuideService.updateGuideProfile(guideId, {
          details: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            contactNumber: formData.contactNumber,
            bio: formData.bio,
            languages: formData.languages,
            avatar: guideData?.details?.avatar, // Keep existing avatar
          },
        });
        
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
        console.error('Failed to update profile:', error);
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
  
    const handleAvatarEdit = async () => {
      try {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Please allow access to your photos to upload an avatar.');
          return;
        }
  
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
  
        if (!result.canceled && result.assets[0]) {
          setUploading(true);
          const asset = result.assets[0];
          
          // Upload avatar
          const uploadResponse = await GuideService.uploadGuideAvatar(
            asset.uri,
            asset.fileName || 'avatar.jpg',
            asset.type || 'image/jpeg'
          );
  
          if (uploadResponse.success) {
            const newAvatar = toAbsoluteImageUrl(uploadResponse.url);
            setSelectedAvatar(newAvatar);
            
            // Update guide profile with new avatar
            const guideId = guideData?._id || guideData?.username;
            if (guideId) {
              await GuideService.updateGuideProfile(guideId, {
                details: {
                  ...guideData.details,
                  avatar: newAvatar,
                },
              });
              Alert.alert('Success', 'Profile picture updated successfully');
            }
          } else {
            throw new Error('Upload failed');
          }
        }
      } catch (error) {
        console.error('Failed to upload avatar:', error);
        Alert.alert('Error', 'Failed to upload profile picture');
      } finally {
        setUploading(false);
      }
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
  
    if (loading) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary600} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </SafeAreaView>
      );
    }
  
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
            <TouchableOpacity onPress={handleSaveProfile} style={styles.headerButton} disabled={isLoading}>
              <Text style={[styles.saveButtonText, isLoading && styles.saveButtonTextDisabled]}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
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
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color={Colors.white} />
                </View>
              )}
              <Text style={styles.avatarHint}>Tap to change profile photo</Text>
            </View>
  
            {/* Basic Information */}
            <EditSection title="Basic Information">
              <CustomTextInput
                label="First Name"
                value={formData.firstName}
                onChangeText={(value: string) => handleInputChange('firstName', value)}
                error={errors.firstName}
                placeholder="Enter your first name"
                leftIcon="person-outline"
              />
  
              <CustomTextInput
                label="Last Name"
                value={formData.lastName}
                onChangeText={(value: string) => handleInputChange('lastName', value)}
                error={errors.lastName}
                placeholder="Enter your last name"
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
                editable={false}
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
                editable={false}
              />
              
              <Text style={styles.fieldNote}>
                Username and email cannot be changed
              </Text>
            </EditSection>
  
            {/* Contact Information */}
            <EditSection title="Contact Information">
              <CustomTextInput
                label="Contact Number"
                value={formData.contactNumber}
                onChangeText={(value: string) => handleInputChange('contactNumber', value)}
                error={errors.contactNumber}
                placeholder="+94771234567"
                leftIcon="call-outline"
                keyboardType="phone-pad"
              />
            </EditSection>
  
            {/* About You */}
            <EditSection title="About You">
              <CustomTextInput
                label="Bio"
                value={formData.bio}
                onChangeText={(value: string) => handleInputChange('bio', value)}
                error={errors.bio}
                placeholder="Tell tourists about yourself and your experience as a guide..."
                leftIcon="document-text-outline"
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.charCounter}>
                {formData.bio.length}/500 characters
              </Text>
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      color: Colors.secondary500,
      marginTop: 12,
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
    saveButtonTextDisabled: {
      color: Colors.secondary400,
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
      position: 'relative',
    },
    uploadingOverlay: {
      position: 'absolute',
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      top: 30,
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
    fieldNote: {
      fontSize: 12,
      color: Colors.secondary400,
      fontStyle: 'italic',
      marginTop: 8,
      paddingHorizontal: 4,
    },
    charCounter: {
      fontSize: 12,
      color: Colors.secondary400,
      marginTop: 4,
      textAlign: 'right',
      paddingHorizontal: 4,
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
  