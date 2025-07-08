import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';

import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

interface StarRatingProps {
  rating: number;
  onRatingPress: (rating: number) => void;
  size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingPress, size = 32 }) => {
  return (
    <View className="flex-row justify-center gap-2 py-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onRatingPress(star)}
          className="p-1"
        >
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? '#FFD700' : Colors.light400}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const RateAppScreen: React.FC = () => {
  const [rating, setRating] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const handleRatingPress = (selectedRating: number) => {
    setRating(selectedRating);
    
    if (selectedRating >= 4) {
      // High rating - redirect to app store
      setTimeout(() => {
        handleAppStoreRedirect();
      }, 500);
    } else if (selectedRating > 0) {
      // Lower rating - show feedback modal
      setTimeout(() => {
        setShowFeedbackModal(true);
      }, 500);
    }
  };

  const handleAppStoreRedirect = () => {
    Alert.alert(
      'Thank You! 🌟',
      'We\'re delighted you love WanderLanka! Would you like to leave a review on the App Store?',
      [
        {
          text: 'Later',
          style: 'cancel',
        },
        {
          text: 'Rate Now',
          onPress: () => {
            const appStoreUrl = Platform.select({
              ios: 'https://apps.apple.com/app/wanderlanka/id123456789',
              android: 'https://play.google.com/store/apps/details?id=com.wanderlanka.app',
            });
            
            if (appStoreUrl) {
              Linking.openURL(appStoreUrl).catch(() => {
                Alert.alert('Error', 'Unable to open App Store. Please try again later.');
              });
            }
          },
        },
      ]
    );
  };

  const handleFeedbackSubmit = () => {
    Alert.alert(
      'Thank You! 💝',
      'Your feedback is valuable to us. We\'ll work hard to improve your experience with WanderLanka.',
      [
        {
          text: 'OK',
          onPress: () => {
            setShowFeedbackModal(false);
            setFeedbackText('');
          },
        },
      ]
    );
  };

  const getRatingMessage = () => {
    if (rating === 0) return 'How would you rate WanderLanka?';
    if (rating === 1) return 'We\'re sorry to hear that 😔';
    if (rating === 2) return 'We can do better 🤔';
    if (rating === 3) return 'Thanks for the feedback 😊';
    if (rating === 4) return 'We\'re glad you like it! 😄';
    return 'Awesome! You made our day! 🎉';
  };

  const features = [
    { icon: 'map-outline', title: 'Discover Places', description: 'Find amazing destinations' },
    { icon: 'calendar-outline', title: 'Plan Trips', description: 'Organize your adventures' },
    { icon: 'camera-outline', title: 'Capture Memories', description: 'Save special moments' },
    { icon: 'people-outline', title: 'Connect', description: 'Meet fellow travelers' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-neutral-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.light500} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-neutral-800">Rate App</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* App Icon & Title */}
        <View className="items-center py-8">
          <View className="w-20 h-20 rounded-3xl items-center bg-primary-100 justify-center mb-1">
           <Image source={require('../assets/images/wander_logo.png')} className="w-full h-full rounded-2xl" /> 
          </View>
          <Text className="text-2xl font-bold text-neutral-800 mb-2">WanderLanka</Text>
          <Text className="text-neutral-600 text-center px-8">
            Your ultimate companion for exploring the beautiful island of Sri Lanka
          </Text>
        </View>

        {/* Rating Section */}
        <View className="px-6 py-4">
          <View className="bg-neutral-50 rounded-2xl p-6 mb-6">
            <Text className="text-xl font-semibold text-center text-neutral-800 mb-2">
              {getRatingMessage()}
            </Text>
            <Text className="text-neutral-600 text-center mb-4">
              Your feedback helps us improve WanderLanka for everyone
            </Text>
            <StarRating rating={rating} onRatingPress={handleRatingPress} />
          </View>

          {/* Features Highlight */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-neutral-800 mb-4">
              What makes WanderLanka special?
            </Text>
            {features.map((feature, index) => (
              <View key={index} className="flex-row items-center p-4 bg-white rounded-xl mb-3 shadow-sm">
                <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center mr-4">
                  <Ionicons name={feature.icon as any} size={20} color={Colors.primary500} />
                </View>
                <View className="flex-1">
                  <Text className="text-neutral-800 font-medium">{feature.title}</Text>
                  <Text className="text-neutral-600 text-sm">{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Alternative Actions */}
          <View className="space-y-3">
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Share WanderLanka',
                  'Help your friends discover Sri Lanka with WanderLanka!',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Share', onPress: () => console.log('Share app') },
                  ]
                );
              }}
              className="flex-row items-center justify-center p-4 bg-secondary-100 rounded-xl"
            >
              <Ionicons name="share-outline" size={20} color={Colors.secondary500} />
              <Text className="text-secondary-500 font-medium ml-2">Share with Friends</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Send Feedback',
                  'Have suggestions or found a bug? We\'d love to hear from you!',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Contact Support', onPress: () => router.push('/faq-help') },
                  ]
                );
              }}
              className="flex-row items-center justify-center p-4 bg-neutral-100 rounded-xl"
            >
              <Ionicons name="chatbubble-outline" size={20} color={Colors.light500} />
              <Text className="text-neutral-600 font-medium ml-2">Send Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between p-4 border-b border-neutral-200">
            <TouchableOpacity onPress={() => setShowFeedbackModal(false)}>
              <Text className="text-neutral-600">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-neutral-800">Your Feedback</Text>
            <TouchableOpacity onPress={handleFeedbackSubmit}>
              <Text className="text-primary-500 font-medium">Submit</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-1 p-6">
            <View className="items-center mb-6">
              <StarRating rating={rating} onRatingPress={() => {}} size={24} />
            </View>

            <Text className="text-lg font-medium text-neutral-800 mb-4">
              Help us improve WanderLanka
            </Text>
            <Text className="text-neutral-600 mb-4">
              Tell us what went wrong or what features you'd like to see:
            </Text>

            <View className="bg-neutral-50 rounded-xl p-4 min-h-[120px]">
              <Text className="text-neutral-500">
                Your feedback will help us make WanderLanka better for everyone. Thank you for taking the time to share your thoughts!
              </Text>
            </View>

            <View className="mt-6">
              <Text className="text-sm text-neutral-500 text-center">
                Your feedback is anonymous and helps us improve the app experience
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default RateAppScreen;
