import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';

import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// Mock privacy settings data
const MOCK_PRIVACY_SETTINGS = {
  profileVisibility: 'public', // public, friends, private
  showTripHistory: true,
  showAchievements: true,
  showPhotos: true,
  allowMessages: true,
  shareLocation: false,
  twoFactorAuth: true,
  biometricAuth: false,
  dataSharing: false,
  marketingEmails: true,
  pushNotifications: true,
  locationTracking: false,
};

interface PrivacyItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  showArrow?: boolean;
}

const PrivacyItem: React.FC<PrivacyItemProps> = ({
  icon,
  title,
  description,
  value,
  onToggle,
  onPress,
  rightComponent,
  showArrow = true,
}) => (
  <TouchableOpacity 
    style={styles.privacyItem} 
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.privacyItemLeft}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={20} color={Colors.primary600} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemDescription}>{description}</Text>
      </View>
    </View>
    
    <View style={styles.privacyItemRight}>
      {rightComponent || (
        value !== undefined && onToggle ? (
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: Colors.secondary200, true: Colors.primary100 }}
            thumbColor={value ? Colors.primary600 : Colors.secondary400}
          />
        ) : (
          showArrow && onPress && (
            <Ionicons name="chevron-forward" size={16} color={Colors.secondary400} />
          )
        )
      )}
    </View>
  </TouchableOpacity>
);

interface PrivacySectionProps {
  title: string;
  children: React.ReactNode;
}

const PrivacySection: React.FC<PrivacySectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

export default function PrivacySecurityScreen() {
  const [settings, setSettings] = useState(MOCK_PRIVACY_SETTINGS);

  const updateSetting = (key: keyof typeof MOCK_PRIVACY_SETTINGS, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleProfileVisibility = () => {
    Alert.alert(
      'Profile Visibility',
      'Choose who can see your profile',
      [
        { text: 'Public', onPress: () => setSettings(prev => ({ ...prev, profileVisibility: 'public' })) },
        { text: 'Friends Only', onPress: () => setSettings(prev => ({ ...prev, profileVisibility: 'friends' })) },
        { text: 'Private', onPress: () => setSettings(prev => ({ ...prev, profileVisibility: 'private' })) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'This will open password change form');
  };

  const handleTwoFactorSetup = () => {
    if (!settings.twoFactorAuth) {
      Alert.alert(
        'Enable Two-Factor Authentication',
        'This will add an extra layer of security to your account. You will need to verify your identity with a code sent to your phone or email.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Enable', 
            onPress: () => updateSetting('twoFactorAuth', true)
          },
        ]
      );
    } else {
      Alert.alert(
        'Disable Two-Factor Authentication',
        'This will remove the extra security layer from your account.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Disable', 
            style: 'destructive',
            onPress: () => updateSetting('twoFactorAuth', false)
          },
        ]
      );
    }
  };

  const handleDataDownload = () => {
    Alert.alert(
      'Download Your Data',
      'We will prepare a copy of your data and send it to your email address within 7 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request Download', onPress: () => console.log('Data download requested') },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'This will open the privacy policy document');
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'This will open the terms of service document');
  };

  const handleReportIssue = () => {
    Alert.alert('Report Security Issue', 'This will open the security issue reporting form');
  };

  const getVisibilityText = () => {
    switch (settings.profileVisibility) {
      case 'public': return 'Everyone can see';
      case 'friends': return 'Friends only';
      case 'private': return 'Only you';
      default: return 'Public';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Privacy */}
        <PrivacySection title="Profile Privacy">
          <PrivacyItem
            icon="eye-outline"
            title="Profile Visibility"
            description="Who can see your profile and travel history"
            onPress={handleProfileVisibility}
            rightComponent={
              <View style={styles.visibilityIndicator}>
                <Text style={styles.visibilityText}>{getVisibilityText()}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.secondary400} />
              </View>
            }
          />
          
          <PrivacyItem
            icon="map-outline"
            title="Show Trip History"
            description="Allow others to see your completed trips"
            value={settings.showTripHistory}
            onToggle={(value) => updateSetting('showTripHistory', value)}
          />
          
          <PrivacyItem
            icon="trophy-outline"
            title="Show Achievements"
            description="Display your badges and achievements on profile"
            value={settings.showAchievements}
            onToggle={(value) => updateSetting('showAchievements', value)}
          />
          
          <PrivacyItem
            icon="images-outline"
            title="Show Photos"
            description="Allow others to see your travel photos"
            value={settings.showPhotos}
            onToggle={(value) => updateSetting('showPhotos', value)}
          />
        </PrivacySection>

        {/* Communication Privacy */}
        <PrivacySection title="Communication">
          <PrivacyItem
            icon="chatbubble-outline"
            title="Allow Messages"
            description="Let other travelers send you messages"
            value={settings.allowMessages}
            onToggle={(value) => updateSetting('allowMessages', value)}
          />
          
          <PrivacyItem
            icon="mail-outline"
            title="Marketing Emails"
            description="Receive promotional emails and travel tips"
            value={settings.marketingEmails}
            onToggle={(value) => updateSetting('marketingEmails', value)}
          />
          
          <PrivacyItem
            icon="notifications-outline"
            title="Push Notifications"
            description="Receive notifications on your device"
            value={settings.pushNotifications}
            onToggle={(value) => updateSetting('pushNotifications', value)}
          />
        </PrivacySection>

        {/* Location & Data */}
        <PrivacySection title="Location & Data">
          <PrivacyItem
            icon="location-outline"
            title="Share Location"
            description="Share your current location with friends"
            value={settings.shareLocation}
            onToggle={(value) => updateSetting('shareLocation', value)}
          />
          
          <PrivacyItem
            icon="analytics-outline"
            title="Location Tracking"
            description="Allow app to track your location for trip suggestions"
            value={settings.locationTracking}
            onToggle={(value) => updateSetting('locationTracking', value)}
          />
          
          <PrivacyItem
            icon="share-outline"
            title="Data Sharing"
            description="Share anonymized data to improve our services"
            value={settings.dataSharing}
            onToggle={(value) => updateSetting('dataSharing', value)}
          />
        </PrivacySection>

        {/* Account Security */}
        <PrivacySection title="Account Security">
          <PrivacyItem
            icon="lock-closed-outline"
            title="Change Password"
            description="Update your account password"
            onPress={handleChangePassword}
          />
          
          <PrivacyItem
            icon="shield-checkmark-outline"
            title="Two-Factor Authentication"
            description="Add extra security to your account"
            value={settings.twoFactorAuth}
            onToggle={handleTwoFactorSetup}
          />
          
          <PrivacyItem
            icon="finger-print-outline"
            title="Biometric Authentication"
            description="Use fingerprint or face ID to unlock app"
            value={settings.biometricAuth}
            onToggle={(value) => updateSetting('biometricAuth', value)}
          />
        </PrivacySection>

        {/* Data Management */}
        <PrivacySection title="Data Management">
          <PrivacyItem
            icon="download-outline"
            title="Download Your Data"
            description="Get a copy of all your data"
            onPress={handleDataDownload}
          />
          
          <PrivacyItem
            icon="document-text-outline"
            title="Privacy Policy"
            description="Read our privacy policy"
            onPress={handlePrivacyPolicy}
          />
          
          <PrivacyItem
            icon="document-outline"
            title="Terms of Service"
            description="View terms and conditions"
            onPress={handleTermsOfService}
          />
        </PrivacySection>

        {/* Security Issues */}
        <PrivacySection title="Security">
          <PrivacyItem
            icon="warning-outline"
            title="Report Security Issue"
            description="Report a security vulnerability or concern"
            onPress={handleReportIssue}
          />
        </PrivacySection>

        {/* Security Tips */}
        <View style={styles.securityTips}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={20} color={Colors.warning} />
            <Text style={styles.tipsTitle}>Security Tips</Text>
          </View>
          <Text style={styles.tipsText}>
            • Use a strong, unique password{'\n'}
            • Enable two-factor authentication{'\n'}
            • Regularly review your privacy settings{'\n'}
            • Be cautious when sharing personal information{'\n'}
            • Report suspicious activity immediately
          </Text>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  headerPlaceholder: {
    width: 32,
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
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  privacyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 13,
    color: Colors.secondary500,
    lineHeight: 18,
  },
  privacyItemRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibilityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visibilityText: {
    fontSize: 14,
    color: Colors.secondary500,
    marginRight: 4,
  },
  securityTips: {
    backgroundColor: Colors.white,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginLeft: 8,
  },
  tipsText: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
  },
});
