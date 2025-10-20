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
import React, { useEffect, useState } from 'react';
import { UserProfile, getProfile } from '../../services/profileApi';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

// Utility function to format numbers professionally
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Hardcoded user data - easily replaceable with backend calls
const MOCK_USER_DATA = {
  id: 'user123',
  username: 'john_traveler',
  email: 'john@example.com',
  fullName: 'John Doe',
  phone: '+94 77 123 4567',
  avatar: null, // placeholder for profile image
  memberSince: '2023-01-15',
  verified: true,
  isActive: true,
  phoneVerified: true,
  passportNumber: 'N1234567',
  loyaltyPoints: 2450,
  tripsCompleted: 12,
  countriesVisited: 8,
  totalDistance: 15420, // in km
  achievements: ['Explorer', 'Adventure Seeker', 'Culture Enthusiast'],
  preferences: {
    budget: 'Mid-range',
    accommodation: 'Hotel',
    dietary: 'No restrictions',
    notifications: true,
    darkMode: false,
  }
};

const MOCK_RECENT_TRIPS = [
  {
    id: 'trip1',
    destination: 'Kandy Cultural Triangle',
    date: '2024-06-15',
    duration: '3 days',
    rating: 4.8,
    photos: 15,
  },
  {
    id: 'trip2',
    destination: 'Ella Hill Country',
    date: '2024-05-20',
    duration: '2 days',
    rating: 4.9,
    photos: 23,
  },
  {
    id: 'trip3',
    destination: 'Galle Fort Heritage',
    date: '2024-04-10',
    duration: '1 day',
    rating: 4.7,
    photos: 12,
  },
];

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
  
  // State for user profile data
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // UI preferences state
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch user profile data
  const fetchUserProfile = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      const profile = await getProfile();
      setUserData(profile);
    } catch (error: any) {
      console.error('❌ Error fetching profile:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to load profile data',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Refresh profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile(true);
    }, [])
  );

  // Pull to refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserProfile(true);
  };

  // Use fallback data if profile not loaded yet
  const displayData = userData || {
    id: '',
    username: 'Loading...',
    email: 'Loading...',
    fullName: 'Loading...',
    phone: null,
    avatar: null,
    role: 'traveler',
    status: 'active' as const,
    isActive: true,
    emailVerified: false,
    phoneVerified: false,
    platform: 'mobile' as const,
    memberSince: new Date().toISOString(),
    verified: false,
    bio: null,
    dateOfBirth: null,
    gender: null,
    nationality: null,
    passportNumber: null,
    emergencyContact: {
      name: null,
      phone: null,
      relationship: null,
    },
    preferences: {
      budget: null,
      accommodation: null,
      dietary: null,
      interests: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Mock data for features not yet in backend (stats only)
  const MOCK_USER_DATA = {
    loyaltyPoints: 2450,
    tripsCompleted: 12,
    countriesVisited: 8,
    totalDistance: 15420, // in km
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

  const handleAchievements = () => {
    router.push('/profile/achievements');
  };

  const handleLanguage = () => {
    Alert.alert(
      'Language Settings',
      'App is currently available in English only. More languages will be added in upcoming versions.',
      [{ text: 'OK' }]
    );
  };

  const handleLoyaltyPoints = () => {
    router.push('/profile/loyalty-points');
  };

  const handleDiscountCoupons = () => {
    router.push('/profile/discount-coupons');
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
      {loading && !userData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary600} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <ProfileAvatar
              imageUri={displayData.avatar}
              size={80}
              onEdit={handleEditProfile}
            />
            
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{displayData.fullName || displayData.username}</Text>
              <Text style={styles.userEmail}>{displayData.email}</Text>
              {displayData.emailVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
          </View>

        {/* Stats Cards */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statsScrollView}
          contentContainerStyle={styles.statsContainer}
        >
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="map-outline" size={24} color={Colors.primary600} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{MOCK_USER_DATA.tripsCompleted}</Text>
              <Text style={styles.statLabel}>Trips Completed</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="location-outline" size={24} color={Colors.primary600} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{MOCK_USER_DATA.countriesVisited}</Text>
              <Text style={styles.statLabel}>Places Visited</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="gift-outline" size={24} color={Colors.primary600} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>
                {formatNumber(MOCK_USER_DATA.loyaltyPoints)}
              </Text>
              <Text style={styles.statLabel}>Loyalty Points</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="speedometer-outline" size={24} color={Colors.primary600} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>
                {formatNumber(Math.round(MOCK_USER_DATA.totalDistance / 1000))}
              </Text>
              <Text style={styles.statLabel}>KM Traveled</Text>
            </View>
          </View>
        </ScrollView>

        {/* Personal Information */}
        <ProfileSection title="Personal Information">
          <ProfileItem
            icon="person-outline"
            label="Edit Profile"
            value="Update details"
            onPress={handleEditProfile}
          />
          {/* <ProfileItem
            icon="shield-checkmark-outline"
            label="Account Status"
            value={MOCK_USER_DATA.isActive ? "Active" : "Inactive"}
            showArrow={false}
            rightComponent={
              <View style={styles.verifiedBadge}>
                <Ionicons 
                  name={MOCK_USER_DATA.isActive ? "checkmark-circle" : "alert-circle"} 
                  size={16} 
                  color={MOCK_USER_DATA.isActive ? Colors.success : Colors.warning} 
                />
                <Text style={[styles.verifiedText, { color: MOCK_USER_DATA.isActive ? Colors.success : Colors.warning }]}>
                  {MOCK_USER_DATA.isActive ? "Active" : "Inactive"}
                </Text>
              </View>
            }
          /> */}
          <ProfileItem
            icon="call-outline"
            label="Phone Verification"
            value={displayData.phoneVerified ? "Verified" : "Not Verified"}
            showArrow={false}
            rightComponent={
              <View style={styles.verifiedBadge}>
                <Ionicons 
                  name={displayData.phoneVerified ? "checkmark-circle" : "alert-circle"} 
                  size={16} 
                  color={displayData.phoneVerified ? Colors.success : Colors.warning} 
                />
                <Text style={[styles.verifiedText, { color: displayData.phoneVerified ? Colors.success : Colors.warning }]}>
                  {displayData.phoneVerified ? "Verified" : "Not Verified"}
                </Text>
              </View>
            }
          />
          <ProfileItem
            icon="document-outline"
            label="Passport Number"
            value={displayData.passportNumber || "Not set"}
            onPress={handleEditProfile}
          />
          <ProfileItem
            icon="heart-outline"
            label="Travel Preferences"
            value={displayData.preferences?.budget || "Not set"}
            onPress={handleEditProfile}
          />
        </ProfileSection>

        {/* Travel History */}
        <ProfileSection title="Travel History">
          <ProfileItem
            icon="map-outline"
            label="Trip Timeline"
            value={`${MOCK_USER_DATA.tripsCompleted} completed`}
            onPress={handleTravelHistory}
          />
          <ProfileItem
            icon="images-outline"
            label="Trip Memories"
            value="Photos & Videos"
            onPress={handleTripMemories}
          />
          {/* <ProfileItem
            icon="trophy-outline"
            label="Achievements"
            value={`${MOCK_USER_DATA.achievements.length} badges`}
            onPress={handleTravelHistory}
          /> */}
        </ProfileSection>

        {/* Recent Trips Preview */}
        <ProfileSection title="Recent Trips">
          {MOCK_RECENT_TRIPS.slice(0, 2).map((trip) => (
            <TouchableOpacity key={trip.id} style={styles.tripItem}>
              <View style={styles.tripIcon}>
                <Ionicons name="location" size={20} color={Colors.primary600} />
              </View>
              <View style={styles.tripInfo}>
                <Text style={styles.tripDestination}>{trip.destination}</Text>
                <Text style={styles.tripDate}>{trip.date} • {trip.duration}</Text>
              </View>
              <View style={styles.tripRating}>
                <Ionicons name="star" size={14} color={Colors.warning} />
                <Text style={styles.tripRatingText}>{trip.rating}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <ProfileItem
            icon="list-outline"
            label="View All Trips"
            onPress={handleTravelHistory}
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

        {/* Loyalty & Rewards */}
        <ProfileSection title="Loyalty & Rewards">
          <ProfileItem
            icon="gift-outline"
            label="Loyalty Points"
            value={`${MOCK_USER_DATA.loyaltyPoints} points`}
            onPress={handleLoyaltyPoints}
          />
          <ProfileItem
            icon="ribbon-outline"
            label="Achievement Badges"
            value="View badges"
            onPress={handleAchievements}
          />
          <ProfileItem
            icon="pricetag-outline"
            label="Discount Coupons"
            value="3 available"
            onPress={handleDiscountCoupons}
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
            icon="shield-outline"
            label="Account Status"
            value={displayData.isActive ? "Active Account" : "Deactivated"}
            showArrow={false}
            rightComponent={
              <View style={styles.verifiedBadge}>
                <Ionicons 
                  name={displayData.isActive ? "shield-checkmark" : "shield-outline"} 
                  size={16} 
                  color={displayData.isActive ? Colors.success : Colors.warning} 
                />
                <Text style={[styles.verifiedText, { color: displayData.isActive ? Colors.success : Colors.warning }]}>
                  {displayData.isActive ? "Active" : "Inactive"}
                </Text>
              </View>
            }
          />
          {displayData.isActive && (
            <ProfileItem
              icon="trash-outline"
              label="Delete Account"
              value="Permanently delete"
              onPress={handleDeleteAccount}
            />
          )}
        </ProfileSection>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Member since {new Date(displayData.memberSince).getFullYear()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
    marginBottom: 10,
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
  userEmail: {
    fontSize: 14,
    color: Colors.secondary500,
    marginBottom: 8,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.secondary500,
  },
});