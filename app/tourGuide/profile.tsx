import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DeleteAccountModal, ProfileAvatar } from '../../components';
import React, { useCallback, useEffect, useState } from 'react';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { GuideService } from '../../services/guide';
import { AuthService } from '../../services/auth';
import * as ImagePicker from 'expo-image-picker';
import { toAbsoluteImageUrl } from '../../utils/imageUrl';

// Hardcoded user data - easily replaceable with backend calls
// REMOVED: Mock data replaced with real API calls

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

interface ProfileItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
}

const ProfileItem: React.FC<ProfileItemProps> = ({ 
  icon, 
  label, 
  value, 
  onPress, 
  showArrow = true,
  rightComponent 
}) => (
  <TouchableOpacity 
    style={styles.profileItem} 
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.profileItemLeft}>
      <Ionicons name={icon} size={20} color={Colors.primary600} />
      <Text style={styles.profileItemLabel}>{label}</Text>
    </View>
    <View style={styles.profileItemRight}>
      {rightComponent || (
        <>
          {value && <Text style={styles.profileItemValue}>{value}</Text>}
          {showArrow && onPress && (
            <Ionicons name="chevron-forward" size={16} color={Colors.secondary400} />
          )}
        </>
      )}
    </View>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Real data states
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [guideData, setGuideData] = useState<any>(null);

  // Fetch user and guide data
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch user data (for email verification status)
  const userResponse = await AuthService.getProfile();
  setUserData(userResponse);
      
      // Fetch guide data (for profile details)
  const guideResponse = await GuideService.getGuideProfile();
  // Service returns { success, data }; map to data for simpler usage
  setGuideData(guideResponse?.data ?? guideResponse ?? null);
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when screen is focused
  useEffect(() => {
    fetchProfileData();
  }, []);

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
    router.push('/profile/edit-profile');
  };

  const handleTravelHistory = () => {
    router.push('/profile/trip-timeline');
  };

  const handleTripMemories = () => {
    router.push('/profile/trip-memories');
  };

  const handleSettings = () => {
    router.push('/profile/privacy-security');
  };

  const handleSupport = () => {
    router.push('/profile/faq-help');
  };

  const handleRateApp = () => {
    router.push('/profile/rate-app');
  };

  const handleLanguage = () => {
    Alert.alert(
      'Language Settings',
      'App is currently available in English only. More languages will be added in upcoming versions.',
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
          {/* Header */}
          <View style={styles.header}>
            <ProfileAvatar
              imageUri={guideData?.details?.avatar ? toAbsoluteImageUrl(guideData.details.avatar) : null}
              size={80}
              onEdit={handleAvatarEdit}
            />
            
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color={Colors.primary600} />
              </View>
            )}
            
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {(
                  (guideData?.details?.firstName || '') +
                  (guideData?.details?.lastName ? ` ${guideData.details.lastName}` : '')
                ).trim() || userData?.username || 'Guide'}
              </Text>
              <View style={styles.emailRow}>
                <Text style={styles.userEmail}>{userData?.email || 'N/A'}</Text>
                {!userData?.emailVerified && (
                  <View style={styles.unverifiedBadge}>
                    <Ionicons name="alert-circle" size={14} color={Colors.warning} />
                    <Text style={styles.unverifiedText}>Not Verified</Text>
                  </View>
                )}
              </View>
              {userData?.emailVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.verifiedText}>Email Verified</Text>
                </View>
              )}
            </View>
          </View>

          {/* Personal Information */}
          <ProfileSection title="Personal Information">
            <ProfileItem
              icon="person-outline"
              label="Username"
              value={guideData?.username || 'N/A'}
              onPress={handleEditProfile}
            />
            <ProfileItem
              icon="call-outline"
              label="Contact Number"
              value={(guideData?.details?.contactNumber || userData?.phone || userData?.contactNumber || '').toString() || 'Not set'}
              onPress={handleEditProfile}
            />
            <ProfileItem
              icon="globe-outline"
              label="Languages"
              value={Array.isArray(guideData?.details?.languages) && guideData.details.languages.length
                ? guideData.details.languages.join(', ')
                : 'Not set'}
              onPress={handleEditProfile}
            />
            <ProfileItem
              icon="document-text-outline"
              label="Bio"
              value={guideData?.details?.bio ? 'View bio' : 'Add bio'}
              onPress={handleEditProfile}
            />
          </ProfileSection>

          {/* Guide Status */}
          <ProfileSection title="Guide Status">
            <ProfileItem
              icon="shield-checkmark-outline"
              label="Account Status"
              value={guideData?.status || 'N/A'}
              showArrow={false}
              rightComponent={
                <View style={styles.verifiedBadge}>
                  <Ionicons 
                    name={guideData?.status === 'approved' ? "checkmark-circle" : "time-outline"} 
                    size={16} 
                    color={guideData?.status === 'approved' ? Colors.success : Colors.warning} 
                  />
                  <Text style={[styles.verifiedText, { 
                    color: guideData?.status === 'approved' ? Colors.success : Colors.warning 
                  }]}>
                    {guideData?.status || 'Pending'}
                  </Text>
                </View>
              }
            />
            {guideData?.featured && (
              <ProfileItem
                icon="star"
                label="Featured Guide"
                showArrow={false}
                rightComponent={
                  <View style={styles.featuredBadge}>
                    <Ionicons name="star" size={16} color={Colors.primary600} />
                    <Text style={styles.featuredText}>Featured</Text>
                  </View>
                }
              />
            )}
          </ProfileSection>

          {/* Travel History */}
          <ProfileSection title="Travel History">
            <ProfileItem
              icon="map-outline"
              label="Trip Timeline"
              value="View history"
              onPress={handleTravelHistory}
            />
            <ProfileItem
              icon="images-outline"
              label="Trip Memories"
              value="Photos & Videos"
              onPress={handleTripMemories}
            />
          </ProfileSection>

          {/* App Settings */}
          <ProfileSection title="Preferences & Settings">
            <ProfileItem
              icon="notifications-outline"
              label="Notifications"
              showArrow={false}
              rightComponent={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: Colors.secondary200, true: Colors.primary100 }}
                  thumbColor={notifications ? Colors.primary600 : Colors.secondary400}
                />
              }
            />
            <ProfileItem
              icon="moon-outline"
              label="Dark Mode"
              showArrow={false}
              rightComponent={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: Colors.secondary200, true: Colors.primary100 }}
                  thumbColor={darkMode ? Colors.primary600 : Colors.secondary400}
                />
              }
            />
            <ProfileItem
              icon="language-outline"
              label="Language"
              value="English"
              onPress={handleLanguage}
            />
            <ProfileItem
              icon="shield-outline"
              label="Privacy & Security"
              onPress={handleSettings}
            />
          </ProfileSection>

          {/* Support & Help */}
          <ProfileSection title="Support & Help">
            <ProfileItem
              icon="chatbubble-outline"
              label="Customer Support"
              onPress={handleSupport}
            />
            <ProfileItem
              icon="help-circle-outline"
              label="FAQ & Help"
              onPress={handleSupport}
            />
            <ProfileItem
              icon="star-outline"
              label="Rate App"
              onPress={handleRateApp}
            />
          </ProfileSection>

          {/* Account Management */}
          <ProfileSection title="Account Management">
            <ProfileItem
              icon="trash-outline"
              label="Delete Account"
              value="Permanently delete"
              onPress={handleDeleteAccount}
            />
          </ProfileSection>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Member since {userData?.createdAt ? new Date(userData.createdAt).getFullYear() : 'N/A'}
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
    marginBottom: 10,
  },
  uploadingOverlay: {
    position: 'absolute',
    left: 20,
    top: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.secondary500,
    marginRight: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.success,
    marginLeft: 4,
    fontWeight: '500',
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unverifiedText: {
    fontSize: 10,
    color: Colors.warning,
    marginLeft: 2,
    fontWeight: '500',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredText: {
    fontSize: 12,
    color: Colors.primary600,
    marginLeft: 4,
    fontWeight: '500',
  },
  statsScrollView: {
    marginBottom: 10,
  },
  statsContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: 120,
    marginRight: 12,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary600,
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '500',
  },
  section: {
    backgroundColor: Colors.white,
    marginBottom: 10,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemLabel: {
    fontSize: 14,
    color: Colors.black,
    marginLeft: 12,
  },
  profileItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileItemValue: {
    fontSize: 14,
    color: Colors.secondary500,
    marginRight: 8,
  },
  tripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  tripIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripDestination: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
    marginBottom: 2,
  },
  tripDate: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  tripRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripRatingText: {
    fontSize: 12,
    color: Colors.secondary600,
    marginLeft: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: Colors.secondary400,
    marginBottom: 4,
  },
  versionText: {
    fontSize: 10,
    color: Colors.secondary400,
  },
});