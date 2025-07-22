import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  CustomButton,
  ThemedText,
  ThemedView
} from '../../components';
import { Colors } from '../../constants/Colors';

export default function PendingApprovalScreen() {
  
  const handleBackToLogin = () => {
    router.push('./login');
  };

  const handleContactSupport = () => {
    // In a real app, this would open email or contact form
    console.log('Contact support pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        <ThemedView style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={60} color={Colors.warning} />
          </View>
          
          <Image
            source={require('../../assets/images/wander_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          
          <ThemedText variant="title" style={styles.title}>
            Account Pending Approval
          </ThemedText>
          
          <ThemedText variant="default" style={styles.subtitle}>
            Your tour guide application is currently under review by our admin team.
          </ThemedText>
        </ThemedView>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            <Text style={styles.infoText}>Application submitted successfully</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="document-text" size={24} color={Colors.info} />
            <Text style={styles.infoText}>Documents under review</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="mail" size={24} color={Colors.secondary500} />
            <Text style={styles.infoText}>Email notification will be sent upon approval</Text>
          </View>
        </View>

        <View style={styles.timelineContainer}>
          <Text style={styles.timelineTitle}>What happens next?</Text>
          
          <View style={styles.timelineItem}>
            <View style={[styles.timelineIcon, styles.timelineIconCompleted]}>
              <Ionicons name="checkmark" size={16} color={Colors.white} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineItemTitle}>Application Submitted</Text>
              <Text style={styles.timelineItemSubtitle}>Your application has been received</Text>
            </View>
          </View>
          
          <View style={styles.timelineItem}>
            <View style={[styles.timelineIcon, styles.timelineIconActive]}>
              <Ionicons name="document-text" size={16} color={Colors.white} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineItemTitle}>Document Review</Text>
              <Text style={styles.timelineItemSubtitle}>Admin reviewing your credentials</Text>
            </View>
          </View>
          
          <View style={styles.timelineItem}>
            <View style={[styles.timelineIcon, styles.timelineIconPending]}>
              <Ionicons name="mail" size={16} color={Colors.secondary400} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineItemTitle, styles.timelineItemTitlePending]}>
                Approval Notification
              </Text>
              <Text style={styles.timelineItemSubtitle}>
                You&apos;ll receive an email once approved
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.estimateContainer}>
          <Ionicons name="time" size={20} color={Colors.primary600} />
          <Text style={styles.estimateText}>
            <Text style={styles.estimateBold}>Estimated review time:</Text> 1-3 business days
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <CustomButton
          title="Back to Login"
          onPress={handleBackToLogin}
          style={styles.loginButton}
        />
        
        <TouchableOpacity 
          style={styles.supportButton} 
          onPress={handleContactSupport}
        >
          <Text style={styles.supportButtonText}>
            Need help? Contact Support
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary700,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  infoSection: {
    marginBottom: 32,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    color: Colors.secondary700,
    fontFamily: 'Inter',
  },
  timelineContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timelineIconCompleted: {
    backgroundColor: Colors.success,
  },
  timelineIconActive: {
    backgroundColor: Colors.warning,
  },
  timelineIconPending: {
    backgroundColor: Colors.secondary200,
  },
  timelineContent: {
    flex: 1,
  },
  timelineItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  timelineItemTitlePending: {
    color: Colors.secondary400,
  },
  timelineItemSubtitle: {
    fontSize: 14,
    color: Colors.secondary500,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  estimateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  estimateText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.primary700,
    fontFamily: 'Inter',
  },
  estimateBold: {
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loginButton: {
    marginBottom: 16,
  },
  supportButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  supportButtonText: {
    fontSize: 16,
    color: Colors.primary600,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
});
