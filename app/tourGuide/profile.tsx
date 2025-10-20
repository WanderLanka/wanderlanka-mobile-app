import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DeleteAccountModal, ProfileAvatar } from '../../components';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { GuideService } from '../../services/guide';
import * as ImagePicker from 'expo-image-picker';
import { toAbsoluteImageUrl } from '../../utils/imageUrl';
import { API_CONFIG } from '../../services/config';
import { StorageService } from '../../services/storage';

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

interface ProfileItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
  danger?: boolean;
}

const ProfileItem: React.FC<ProfileItemProps> = ({ 
  icon, 
  label, 
  value, 
  onPress, 
  showArrow = true,
  rightComponent,
  danger = false
}) => (
  <TouchableOpacity 
    style={styles.profileItem} 
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.profileItemLeft}>
      <View style={[styles.iconContainer, danger && styles.iconContainerDanger]}>
        <Ionicons 
          name={icon} 
          size={20} 
          color={danger ? Colors.error : Colors.primary600} 
        />
      </View>
      <Text style={[styles.profileItemLabel, danger && styles.profileItemLabelDanger]}>
        {label}
      </Text>
    </View>
    <View style={styles.profileItemRight}>
      {rightComponent || (
        <>
          {value && <Text style={styles.profileItemValue}>{value}</Text>}
          {showArrow && onPress && (
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={Colors.secondary400} 
            />
          )}
        </>
      )}
    </View>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notifications, setNotifications] = useState(true);
  
  // Real data states
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [guideData, setGuideData] = useState<any>(null);
  const fetchingRef = useRef(false);
  
  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState<'contact' | 'languages' | 'bio' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [languagesList, setLanguagesList] = useState<string[]>([]);
  const [tempLanguage, setTempLanguage] = useState('');
  const [saving, setSaving] = useState(false);

  // Helper: get contact number from available sources
  const getContactNumber = useCallback((): string => {
    return (
      guideData?.details?.contactNumber ||
      guideData?.details?.phone ||
      guideData?.phone ||
      userData?.phone ||
      ''
    );
  }, [guideData, userData]);

  // Fetch user and guide data from listing-service (combines both services)
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
        const profileData = result.data;
        
        // Set combined data
        setGuideData(profileData);
        // Fallback to stored user email if missing from combined response
        const storedUser = await StorageService.getUserData();
        setUserData({
          email: profileData.email || storedUser?.email || '',
          emailVerified: typeof profileData.emailVerified === 'boolean' ? profileData.emailVerified : !!storedUser?.emailVerified,
          username: profileData.username || storedUser?.username,
          createdAt: profileData.createdAt || storedUser?.createdAt,
        });
      } else {
        throw new Error('Failed to load profile data');
      }
    } catch (error: any) {
      console.error('Failed to fetch profile data:', error);
      
      // Handle rate limiting error specifically
      if (error?.status === 429 || error?.message?.includes('Too many requests')) {
        Alert.alert(
          'Too Many Requests',
          'Please wait a moment before refreshing your profile.',
          [{ text: 'OK' }]
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
        // Only show error if we don't have cached data
        if (!guideData) {
          Alert.alert('Error', 'Failed to load profile. Please try again later.');
        }
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []); // Empty dependencies - only create once

  // Load data on mount only
  useEffect(() => {
    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependencies - run only once on mount

  const handleAvatarEdit = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload an avatar.');
        return;
      }

      // Pick image
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
          // Normalize URL to absolute (in case backend returns relative path)
          const newAvatar = toAbsoluteImageUrl(uploadResponse.url);
          // Update guide profile with new avatar URL
          await GuideService.updateGuideProfile(guideData?._id || guideData?.username, {
            details: {
              ...guideData.details,
              avatar: newAvatar,
            },
          });

          // Refresh profile data
          await fetchProfileData();
          Alert.alert('Success', 'Profile picture updated successfully');
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

  const handleEditProfile = () => {
    router.push('/guideProfile/edit-profile');
  };

  const handleEditField = (field: 'contact' | 'languages' | 'bio') => {
    setEditField(field);
    
    if (field === 'contact') {
      setEditValue(getContactNumber() || '');
    } else if (field === 'bio') {
      setEditValue(guideData?.details?.bio || '');
    } else if (field === 'languages') {
      setLanguagesList(guideData?.details?.languages || []);
      setTempLanguage('');
    }
    
    setEditModalVisible(true);
  };

  const handleSaveField = async () => {
    try {
      setSaving(true);
      
      const guideId = guideData?._id || guideData?.username;
      if (!guideId) {
        Alert.alert('Error', 'Guide profile not found');
        return;
      }

      let updateData: any = {};

      if (editField === 'contact') {
        if (!editValue.trim()) {
          Alert.alert('Error', 'Contact number cannot be empty');
          return;
        }
        updateData = {
          details: {
            ...guideData.details,
          contactNumber: editValue.trim(),
          phone: editValue.trim(),
          },
        };
      } else if (editField === 'bio') {
        updateData = {
          details: {
            ...guideData.details,
            bio: editValue.trim(),
          },
        };
      } else if (editField === 'languages') {
        if (languagesList.length === 0) {
          Alert.alert('Error', 'Please add at least one language');
          return;
        }
        updateData = {
          details: {
            ...guideData.details,
            languages: languagesList,
          },
        };
      }

      await GuideService.updateGuideProfile(guideId, updateData);
      
      // Refresh profile data
      await fetchProfileData();
      
      setEditModalVisible(false);
      setEditField(null);
      setEditValue('');
      setLanguagesList([]);
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddLanguage = () => {
    if (tempLanguage.trim() && !languagesList.includes(tempLanguage.trim())) {
      setLanguagesList([...languagesList, tempLanguage.trim()]);
      setTempLanguage('');
    }
  };

  const handleRemoveLanguage = (language: string) => {
    setLanguagesList(languagesList.filter(lang => lang !== language));
  };

  const handleSettings = () => {
    router.push('/profile/privacy-security');
  };

  const handleSupport = () => {
    Alert.alert(
      'Support',
      'For assistance, please email us at support@wanderlanka.com',
      [{ text: 'OK' }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation to login will be handled by the auth state change in the main index
              router.replace('/auth/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = () => {
    setShowDeleteModal(false);
    // Here you would call the delete account API
    Alert.alert(
      'Account Deletion Process Started',
      'Your account deletion request has been submitted. You will receive a confirmation email shortly.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to login or close app
            console.log('Account deletion confirmed');
          }
        }
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
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>Profile</Text>
            </View>
          </View>
            
          <View style={styles.profileCard}>
              <View style={styles.avatarSection}>
                <ProfileAvatar
                  imageUri={guideData?.details?.avatar ? toAbsoluteImageUrl(guideData.details.avatar) : null}
                  size={100}
                  onEdit={handleAvatarEdit}
                />
                
                {uploading && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color={Colors.white} />
                  </View>
                )}
              </View>
              
              <View style={styles.profileDetails}>
                <Text style={styles.userName}>
                  {(
                    (guideData?.details?.firstName || '') +
                    (guideData?.details?.lastName ? ` ${guideData.details.lastName}` : '')
                  ).trim() || userData?.username || 'Guide'}
                </Text>
                
                <View style={styles.emailContainer}>
                  <Ionicons name="mail-outline" size={16} color={Colors.secondary500} />
                  <Text style={styles.userEmail}>
                    {userData?.email || guideData?.email || 'No email'}
                  </Text>
                  {userData?.emailVerified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                    </View>
                  )}
                </View>
                
                {guideData?.username && (
                  <View style={styles.usernameContainer}>
                    <Ionicons name="at" size={16} color={Colors.secondary500} />
                    <Text style={styles.usernameText}>{guideData.username}</Text>
                  </View>
                )}
                
                {/* Status Badge */}
                <View style={styles.statusBadgeContainer}>
                  <View style={[
                    styles.statusBadge,
                    guideData?.status === 'active' && styles.statusBadgeActive,
                    guideData?.status === 'pending' && styles.statusBadgePending
                  ]}>
                    <Ionicons 
                      name={guideData?.status === 'active' ? "checkmark-circle" : "time-outline"} 
                      size={14} 
                      color={guideData?.status === 'active' ? Colors.success : Colors.warning} 
                    />
                    <Text style={[
                      styles.statusText,
                      guideData?.status === 'active' && styles.statusTextActive,
                      guideData?.status === 'pending' && styles.statusTextPending
                    ]}>
                      {guideData?.status === 'active' ? 'Active' : 
                       guideData?.status === 'pending' ? 'Pending Approval' : 
                       guideData?.status || 'Inactive'}
                    </Text>
                  </View>
                  {guideData?.featured && (
                    <View style={styles.featuredBadge}>
                      <Ionicons name="star" size={14} color={Colors.primary600} />
                      <Text style={styles.featuredText}>Featured</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.editProfileButton} 
                onPress={handleEditProfile}
              >
                <Ionicons name="create-outline" size={20} color={Colors.primary600} />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

          {/* Guide Information */}
          <ProfileSection title="Guide Information">
            <ProfileItem
              icon="call-outline"
              label="Contact Number"
              value={getContactNumber() || 'Add contact'}
              onPress={() => handleEditField('contact')}
            />
            <ProfileItem
              icon="globe-outline"
              label="Languages"
              value={Array.isArray(guideData?.details?.languages) && guideData.details.languages.length
                ? guideData.details.languages.join(', ')
                : 'Add languages'}
              onPress={() => handleEditField('languages')}
            />
            <ProfileItem
              icon="document-text-outline"
              label="Bio"
              value={guideData?.details?.bio 
                ? (guideData.details.bio.length > 40 
                  ? guideData.details.bio.substring(0, 40) + '...' 
                  : guideData.details.bio)
                : 'Add your bio'}
              onPress={() => handleEditField('bio')}
            />
          </ProfileSection>

          {/* Guide Stats (show zeros when data missing) */}
          <ProfileSection title="Statistics">
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Ionicons name="star" size={24} color={Colors.primary600} />
                <Text style={styles.statValue}>
                  {typeof guideData?.metrics?.rating === 'number' ? guideData.metrics.rating.toFixed(1) : '0.0'}
                </Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Ionicons name="briefcase" size={24} color={Colors.primary600} />
                <Text style={styles.statValue}>
                  {typeof guideData?.metrics?.totalBookings === 'number' ? guideData.metrics.totalBookings : 0}
                </Text>
                <Text style={styles.statLabel}>Bookings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Ionicons name="people" size={24} color={Colors.primary600} />
                <Text style={styles.statValue}>
                  {typeof guideData?.metrics?.totalReviews === 'number' ? guideData.metrics.totalReviews : 0}
                </Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </View>
            </View>
          </ProfileSection>

          {/* Settings */}
          <ProfileSection title="Settings">
            <ProfileItem
              icon="notifications-outline"
              label="Notifications"
              showArrow={false}
              rightComponent={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: Colors.secondary200, true: Colors.primary300 }}
                  thumbColor={notifications ? Colors.primary600 : Colors.secondary400}
                  ios_backgroundColor={Colors.secondary200}
                />
              }
            />
            <ProfileItem
              icon="shield-outline"
              label="Privacy & Security"
              onPress={handleSettings}
            />
            <ProfileItem
              icon="help-circle-outline"
              label="Help & Support"
              onPress={handleSupport}
            />
          </ProfileSection>

          {/* Account Actions */}
          <ProfileSection title="Account">
            <ProfileItem
              icon="log-out-outline"
              label="Logout"
              onPress={handleLogout}
              showArrow={false}
            />
            <ProfileItem
              icon="trash-outline"
              label="Delete Account"
              onPress={handleDeleteAccount}
              showArrow={false}
              danger
            />
          </ProfileSection>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Member since {userData?.createdAt ? new Date(userData.createdAt).getFullYear() : new Date().getFullYear()}
            </Text>
            <Text style={styles.versionText}>WanderLanka v1.0.0</Text>
          </View>
          </ScrollView>
      )}

      {/* Delete Account Modal */}
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteAccount}
      />

      {/* Edit Field Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editField === 'contact' ? 'Edit Contact Number' :
                 editField === 'languages' ? 'Edit Languages' :
                 editField === 'bio' ? 'Edit Bio' : ''}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.secondary600} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {editField === 'contact' && (
                <View>
                  <Text style={styles.modalLabel}>Contact Number</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editValue}
                    onChangeText={setEditValue}
                    placeholder="Enter contact number"
                    keyboardType="phone-pad"
                    placeholderTextColor={Colors.secondary400}
                  />
                  <Text style={styles.modalHint}>
                    Enter your phone number with country code (e.g., +94771234567)
                  </Text>
                </View>
              )}

              {editField === 'bio' && (
                <View>
                  <Text style={styles.modalLabel}>Bio</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalTextArea]}
                    value={editValue}
                    onChangeText={setEditValue}
                    placeholder="Tell tourists about yourself..."
                    multiline
                    numberOfLines={6}
                    maxLength={500}
                    placeholderTextColor={Colors.secondary400}
                  />
                  <Text style={styles.modalHint}>
                    {editValue.length}/500 characters
                  </Text>
                </View>
              )}

              {editField === 'languages' && (
                <View>
                  <Text style={styles.modalLabel}>Languages You Speak</Text>
                  
                  {/* Add Language Input */}
                  <View style={styles.addLanguageContainer}>
                    <TextInput
                      style={[styles.modalInput, styles.languageInput]}
                      value={tempLanguage}
                      onChangeText={setTempLanguage}
                      placeholder="Add a language"
                      placeholderTextColor={Colors.secondary400}
                      onSubmitEditing={handleAddLanguage}
                    />
                    <TouchableOpacity 
                      style={styles.addLanguageButton}
                      onPress={handleAddLanguage}
                    >
                      <Ionicons name="add" size={24} color={Colors.white} />
                    </TouchableOpacity>
                  </View>

                  {/* Languages List */}
                  <View style={styles.languagesList}>
                    {languagesList.map((language, index) => (
                      <View key={index} style={styles.languageChip}>
                        <Text style={styles.languageChipText}>{language}</Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveLanguage(language)}
                          style={styles.removeLanguageButton}
                        >
                          <Ionicons name="close-circle" size={20} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {languagesList.length === 0 && (
                      <Text style={styles.emptyLanguagesText}>
                        No languages added yet. Add at least one language.
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, saving && styles.modalSaveButtonDisabled]}
                onPress={handleSaveField}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    backgroundColor: Colors.white,
    paddingBottom: 20,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTop: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.black,
  },
  profileCard: {
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
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
  },
  profileDetails: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.secondary500,
    marginLeft: 6,
    marginRight: 6,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  usernameText: {
    fontSize: 14,
    color: Colors.secondary500,
    marginLeft: 4,
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.secondary100,
  },
  statusBadgeActive: {
    backgroundColor: Colors.success + '15',
  },
  statusBadgePending: {
    backgroundColor: Colors.warning + '15',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    color: Colors.secondary600,
  },
  statusTextActive: {
    color: Colors.success,
  },
  statusTextPending: {
    color: Colors.warning,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.primary100,
  },
  featuredText: {
    fontSize: 12,
    color: Colors.primary600,
    marginLeft: 4,
    fontWeight: '600',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary100,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary300,
  },
  editProfileText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary600,
    marginLeft: 8,
  },
  section: {
    backgroundColor: Colors.white,
    marginBottom: 12,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionContent: {
    gap: 0,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.secondary100,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerDanger: {
    backgroundColor: Colors.error + '10',
  },
  profileItemLabel: {
    fontSize: 15,
    color: Colors.black,
    marginLeft: 12,
    fontWeight: '500',
  },
  profileItemLabelDanger: {
    color: Colors.error,
  },
  profileItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileItemValue: {
    fontSize: 14,
    color: Colors.secondary500,
    marginRight: 8,
    maxWidth: 150,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.secondary200,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 13,
    color: Colors.secondary400,
    marginBottom: 4,
  },
  versionText: {
    fontSize: 11,
    color: Colors.secondary400,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.secondary200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.black,
    backgroundColor: Colors.white,
  },
  modalTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  modalHint: {
    fontSize: 13,
    color: Colors.secondary400,
    marginTop: 8,
  },
  addLanguageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  languageInput: {
    flex: 1,
  },
  addLanguageButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languagesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  languageChipText: {
    fontSize: 14,
    color: Colors.primary600,
    fontWeight: '500',
  },
  removeLanguageButton: {
    padding: 2,
  },
  emptyLanguagesText: {
    fontSize: 14,
    color: Colors.secondary400,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.secondary600,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary600,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
});