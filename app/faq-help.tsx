import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';

import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// Mock FAQ data
const MOCK_FAQ_DATA = [
  {
    id: 'faq1',
    category: 'Account',
    question: 'How do I create a WanderLanka account?',
    answer: 'You can create an account by downloading the app and selecting "Sign Up". Fill in your personal details, verify your email address, and you\'re ready to start exploring Sri Lanka!',
  },
  {
    id: 'faq2',
    category: 'Account',
    question: 'I forgot my password. How can I reset it?',
    answer: 'Go to the login screen and tap "Forgot Password". Enter your email address and we\'ll send you a link to reset your password. Check your spam folder if you don\'t see the email.',
  },
  {
    id: 'faq3',
    category: 'Booking',
    question: 'How do I book a trip through WanderLanka?',
    answer: 'Browse available trips on the home screen, select your preferred destination, choose dates, and follow the booking process. You can pay securely through our integrated payment system.',
  },
  {
    id: 'faq4',
    category: 'Booking',
    question: 'Can I cancel or modify my booking?',
    answer: 'Yes, you can cancel or modify bookings up to 24 hours before your trip start date. Go to "My Trips" in your profile to manage your bookings. Cancellation fees may apply.',
  },
  {
    id: 'faq5',
    category: 'Payment',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and local bank transfers. All payments are processed securely.',
  },
  {
    id: 'faq6',
    category: 'Payment',
    question: 'Is my payment information secure?',
    answer: 'Yes, we use industry-standard encryption and secure payment gateways. Your payment information is never stored on our servers and is processed by certified payment providers.',
  },
  {
    id: 'faq7',
    category: 'Trips',
    question: 'What should I bring on my trip?',
    answer: 'Each trip includes a detailed packing list. Generally, bring comfortable clothing, sunscreen, a hat, camera, and any personal medications. Specific requirements vary by destination.',
  },
  {
    id: 'faq8',
    category: 'Trips',
    question: 'Are meals included in the trip packages?',
    answer: 'This varies by package. Check the trip details for meal inclusions. Most packages include breakfast and some meals, while others may be meal-optional to give you flexibility.',
  },
  {
    id: 'faq9',
    category: 'App',
    question: 'How do I update my profile information?',
    answer: 'Go to your Profile tab, tap "Edit Profile", make your changes, and save. You can update your personal information, travel preferences, and emergency contacts.',
  },
  {
    id: 'faq10',
    category: 'App',
    question: 'How do I earn loyalty points?',
    answer: 'You earn points by completing trips, writing reviews, uploading photos, and referring friends. Points can be redeemed for discounts on future bookings.',
  },
];

// Mock contact information
const CONTACT_INFO = {
  phone: '+94 11 234 5678',
  email: 'support@wanderlanka.com',
  whatsapp: '+94 77 123 4567',
  address: 'WanderLanka Headquarters, Colombo 01, Sri Lanka',
  hours: 'Monday - Friday: 9:00 AM - 6:00 PM\nSaturday: 9:00 AM - 4:00 PM\nSunday: Closed',
};

interface FAQItemProps {
  faq: typeof MOCK_FAQ_DATA[0];
  isExpanded: boolean;
  onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ faq, isExpanded, onToggle }) => (
  <View style={styles.faqItem}>
    <TouchableOpacity style={styles.faqQuestion} onPress={onToggle}>
      <Text style={styles.questionText}>{faq.question}</Text>
      <Ionicons
        name={isExpanded ? 'chevron-up' : 'chevron-down'}
        size={20}
        color={Colors.primary600}
      />
    </TouchableOpacity>
    {isExpanded && (
      <View style={styles.faqAnswer}>
        <Text style={styles.answerText}>{faq.answer}</Text>
      </View>
    )}
  </View>
);

interface ContactItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  onPress: () => void;
}

const ContactItem: React.FC<ContactItemProps> = ({ icon, title, value, onPress }) => (
  <TouchableOpacity style={styles.contactItem} onPress={onPress}>
    <View style={styles.contactIcon}>
      <Ionicons name={icon} size={20} color={Colors.primary600} />
    </View>
    <View style={styles.contactInfo}>
      <Text style={styles.contactTitle}>{title}</Text>
      <Text style={styles.contactValue}>{value}</Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color={Colors.secondary400} />
  </TouchableOpacity>
);

export default function FAQHelpScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const categories = ['All', 'Account', 'Booking', 'Payment', 'Trips', 'App'];

  const filteredFAQs = MOCK_FAQ_DATA.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCall = () => {
    Linking.openURL(`tel:${CONTACT_INFO.phone}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${CONTACT_INFO.email}`);
  };

  const handleWhatsApp = () => {
    Linking.openURL(`whatsapp://send?phone=${CONTACT_INFO.whatsapp.replace(/\s/g, '')}`);
  };

  const handleAddress = () => {
    Alert.alert('Our Office', CONTACT_INFO.address);
  };

  const handleHours = () => {
    Alert.alert('Support Hours', CONTACT_INFO.hours);
  };

  const handleSubmitTicket = () => {
    Alert.alert('Submit Support Ticket', 'This will open the support ticket form');
  };

  const handleLiveChat = () => {
    Alert.alert('Live Chat', 'This will open the live chat window');
  };

  const handleUserGuide = () => {
    Alert.alert('User Guide', 'This will open the comprehensive user guide');
  };

  const handleVideoTutorials = () => {
    Alert.alert('Video Tutorials', 'This will open video tutorials');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ & Help</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color={Colors.primary600} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Help</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={handleLiveChat}>
              <Ionicons name="chatbubble-ellipses" size={24} color={Colors.primary600} />
              <Text style={styles.actionText}>Live Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={handleCall}>
              <Ionicons name="call" size={24} color={Colors.primary600} />
              <Text style={styles.actionText}>Call Us</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={handleSubmitTicket}>
              <Ionicons name="ticket" size={24} color={Colors.primary600} />
              <Text style={styles.actionText}>Submit Ticket</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={handleUserGuide}>
              <Ionicons name="book" size={24} color={Colors.primary600} />
              <Text style={styles.actionText}>User Guide</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search FAQ */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.secondary400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search FAQs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.secondary400}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={Colors.secondary400} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
          contentContainerStyle={styles.categoryFilterContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTab,
                selectedCategory === category && styles.activeCategoryTab
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryTabText,
                selectedCategory === category && styles.activeCategoryTabText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FAQ List */}
        <View style={styles.faqSection}>
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq) => (
              <FAQItem
                key={faq.id}
                faq={faq}
                isExpanded={expandedFAQ === faq.id}
                onToggle={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
              />
            ))
          ) : (
            <View style={styles.noResults}>
              <Ionicons name="search" size={48} color={Colors.secondary200} />
              <Text style={styles.noResultsText}>No FAQs found</Text>
              <Text style={styles.noResultsSubtext}>Try adjusting your search or category filter</Text>
            </View>
          )}
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <ContactItem
            icon="call-outline"
            title="Phone Support"
            value={CONTACT_INFO.phone}
            onPress={handleCall}
          />
          <ContactItem
            icon="mail-outline"
            title="Email Support"
            value={CONTACT_INFO.email}
            onPress={handleEmail}
          />
          <ContactItem
            icon="logo-whatsapp"
            title="WhatsApp"
            value={CONTACT_INFO.whatsapp}
            onPress={handleWhatsApp}
          />
          <ContactItem
            icon="location-outline"
            title="Our Office"
            value="Colombo 01, Sri Lanka"
            onPress={handleAddress}
          />
          <ContactItem
            icon="time-outline"
            title="Support Hours"
            value="Mon-Fri: 9AM-6PM"
            onPress={handleHours}
          />
        </View>

        {/* Additional Resources */}
        <View style={styles.resourcesSection}>
          <Text style={styles.sectionTitle}>Additional Resources</Text>
          <TouchableOpacity style={styles.resourceItem} onPress={handleVideoTutorials}>
            <Ionicons name="play-circle-outline" size={20} color={Colors.primary600} />
            <Text style={styles.resourceText}>Video Tutorials</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.secondary400} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.resourceItem} onPress={handleUserGuide}>
            <Ionicons name="document-text-outline" size={20} color={Colors.primary600} />
            <Text style={styles.resourceText}>User Guide</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.secondary400} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.resourceItem} onPress={() => Alert.alert('Community Forum', 'This will open the community forum')}>
            <Ionicons name="people-outline" size={20} color={Colors.primary600} />
            <Text style={styles.resourceText}>Community Forum</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.secondary400} />
          </TouchableOpacity>
        </View>

        {/* Still Need Help */}
        <View style={styles.helpCard}>
          <Text style={styles.helpCardTitle}>Still need help?</Text>
          <Text style={styles.helpCardText}>
            Can't find what you're looking for? Our support team is here to help you with any questions or issues.
          </Text>
          <TouchableOpacity style={styles.helpCardButton} onPress={handleSubmitTicket}>
            <Text style={styles.helpCardButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
  helpButton: {
    padding: 4,
  },
  quickActions: {
    backgroundColor: Colors.white,
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary600,
    marginTop: 8,
  },
  searchSection: {
    backgroundColor: Colors.white,
    padding: 20,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
    marginLeft: 8,
  },
  categoryFilter: {
    backgroundColor: Colors.white,
    marginBottom: 10,
  },
  categoryFilterContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: Colors.light100,
  },
  activeCategoryTab: {
    backgroundColor: Colors.primary600,
  },
  categoryTabText: {
    fontSize: 14,
    color: Colors.secondary600,
    fontWeight: '500',
  },
  activeCategoryTabText: {
    color: Colors.white,
  },
  faqSection: {
    backgroundColor: Colors.white,
    marginBottom: 10,
  },
  faqItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  answerText: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
  },
  noResults: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary500,
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: Colors.secondary400,
    marginTop: 4,
    textAlign: 'center',
  },
  contactSection: {
    backgroundColor: Colors.white,
    padding: 20,
    marginBottom: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  resourcesSection: {
    backgroundColor: Colors.white,
    padding: 20,
    marginBottom: 10,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  resourceText: {
    fontSize: 16,
    color: Colors.black,
    marginLeft: 12,
    flex: 1,
  },
  helpCard: {
    backgroundColor: Colors.primary600,
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  helpCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
  },
  helpCardText: {
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    opacity: 0.9,
  },
  helpCardButton: {
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  helpCardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
  },
});
