import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// Mock reviews data - easily replaceable with backend API
const MOCK_REVIEWS = [
  {
    id: 'review1',
    type: 'accommodation',
    businessName: 'Cinnamon Grand Colombo',
    businessImage: null,
    rating: 4.5,
    reviewer: {
      name: 'Jennifer Smith',
      avatar: null,
      totalReviews: 23,
    },
    reviewDate: '2024-07-07',
    content: 'Excellent service and great location in the heart of Colombo. The breakfast buffet was outstanding with a wide variety of local and international options. Staff were incredibly helpful with recommendations for local attractions.',
    helpful: 23,
    notHelpful: 2,
    photos: 3,
    verified: true,
    businessResponse: 'Thank you for your wonderful review! We\'re delighted you enjoyed your stay.',
  },
  {
    id: 'review2',
    type: 'activity',
    businessName: 'Elephant Orphanage Pinnawala',
    businessImage: null,
    rating: 4.8,
    reviewer: {
      name: 'David Williams',
      avatar: null,
      totalReviews: 15,
    },
    reviewDate: '2024-07-06',
    content: 'Incredible experience watching the elephants in their natural habitat. Educational and heartwarming. The feeding time was particularly fascinating. Highly recommend booking the early morning slot for the best experience.',
    helpful: 18,
    notHelpful: 1,
    photos: 5,
    verified: true,
    businessResponse: null,
  },
  {
    id: 'review3',
    type: 'transport',
    businessName: 'Blue Line Tours - Airport Transfer',
    businessImage: null,
    rating: 3.8,
    reviewer: {
      name: 'Maria Garcia',
      avatar: null,
      totalReviews: 8,
    },
    reviewDate: '2024-07-05',
    content: 'Decent service but the vehicle was a bit old. Driver was friendly and knew the routes well. Arrived on time for pickup but took longer than expected due to traffic.',
    helpful: 12,
    notHelpful: 3,
    photos: 0,
    verified: false,
    businessResponse: 'We appreciate your feedback and are working on updating our fleet.',
  },
  {
    id: 'review4',
    type: 'guide',
    businessName: 'Sigiriya Rock Fortress Guide - Pradeep',
    businessImage: null,
    rating: 5.0,
    reviewer: {
      name: 'Alex Thompson',
      avatar: null,
      totalReviews: 31,
    },
    reviewDate: '2024-07-04',
    content: 'Pradeep was an exceptional guide! His knowledge of the history and architecture of Sigiriya was impressive. He made the climb enjoyable with interesting stories and helped us get the best photos. Worth every penny!',
    helpful: 27,
    notHelpful: 0,
    photos: 8,
    verified: true,
    businessResponse: 'Thank you Alex! It was my pleasure to share our beautiful heritage with you.',
  },
];

const REVIEW_CATEGORIES = [
  { id: 'all', name: 'All Reviews', icon: 'list-outline' },
  { id: 'accommodation', name: 'Hotels', icon: 'bed-outline' },
  { id: 'activity', name: 'Activities', icon: 'camera-outline' },
  { id: 'transport', name: 'Transport', icon: 'car-outline' },
  { id: 'guide', name: 'Guides', icon: 'person-outline' },
  { id: 'restaurant', name: 'Restaurants', icon: 'restaurant-outline' },
];

interface ReviewCardProps {
  review: typeof MOCK_REVIEWS[0];
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const [helpful, setHelpful] = useState(review.helpful);
  const [notHelpful, setNotHelpful] = useState(review.notHelpful);
  const [userVote, setUserVote] = useState<'helpful' | 'not-helpful' | null>(null);

  const handleHelpfulVote = (vote: 'helpful' | 'not-helpful') => {
    if (userVote === vote) {
      // Remove vote
      if (vote === 'helpful') {
        setHelpful(helpful - 1);
      } else {
        setNotHelpful(notHelpful - 1);
      }
      setUserVote(null);
    } else {
      // Add or change vote
      if (userVote === 'helpful') {
        setHelpful(helpful - 1);
      } else if (userVote === 'not-helpful') {
        setNotHelpful(notHelpful - 1);
      }

      if (vote === 'helpful') {
        setHelpful(helpful + 1);
      } else {
        setNotHelpful(notHelpful + 1);
      }
      setUserVote(vote);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color={Colors.warning}
        />
      );
    }
    return stars;
  };

  return (
    <View style={styles.reviewCard}>
      {/* Business Header */}
      <View style={styles.businessHeader}>
        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>{review.businessName}</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(review.rating)}
            </View>
            <Text style={styles.ratingText}>{review.rating}</Text>
          </View>
        </View>
        <View style={styles.reviewType}>
          <Text style={styles.reviewTypeText}>
            {REVIEW_CATEGORIES.find(cat => cat.id === review.type)?.name}
          </Text>
        </View>
      </View>

      {/* Reviewer Info */}
      <View style={styles.reviewerInfo}>
        <View style={styles.reviewerAvatar}>
          <Ionicons name="person" size={16} color={Colors.secondary400} />
        </View>
        <View style={styles.reviewerDetails}>
          <View style={styles.reviewerName}>
            <Text style={styles.reviewerNameText}>{review.reviewer.name}</Text>
            {review.verified && (
              <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
            )}
          </View>
          <Text style={styles.reviewerMeta}>
            {review.reviewer.totalReviews} reviews • {review.reviewDate}
          </Text>
        </View>
      </View>

      {/* Review Content */}
      <Text style={styles.reviewContent}>{review.content}</Text>

      {/* Photos indicator */}
      {review.photos > 0 && (
        <View style={styles.photosIndicator}>
          <Ionicons name="images-outline" size={16} color={Colors.primary600} />
          <Text style={styles.photosText}>{review.photos} photos</Text>
        </View>
      )}

      {/* Business Response */}
      {review.businessResponse && (
        <View style={styles.businessResponse}>
          <View style={styles.responseHeader}>
            <Ionicons name="business-outline" size={14} color={Colors.primary600} />
            <Text style={styles.responseLabel}>Business Response</Text>
          </View>
          <Text style={styles.responseText}>{review.businessResponse}</Text>
        </View>
      )}

      {/* Review Actions */}
      <View style={styles.reviewActions}>
        <TouchableOpacity
          style={[styles.helpfulButton, userVote === 'helpful' && styles.helpfulButtonActive]}
          onPress={() => handleHelpfulVote('helpful')}
        >
          <Ionicons
            name="thumbs-up-outline"
            size={16}
            color={userVote === 'helpful' ? Colors.white : Colors.secondary500}
          />
          <Text style={[
            styles.helpfulText,
            userVote === 'helpful' && styles.helpfulTextActive
          ]}>
            Helpful ({helpful})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.helpfulButton, userVote === 'not-helpful' && styles.notHelpfulButtonActive]}
          onPress={() => handleHelpfulVote('not-helpful')}
        >
          <Ionicons
            name="thumbs-down-outline"
            size={16}
            color={userVote === 'not-helpful' ? Colors.white : Colors.secondary500}
          />
          <Text style={[
            styles.helpfulText,
            userVote === 'not-helpful' && styles.notHelpfulTextActive
          ]}>
            Not Helpful ({notHelpful})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ReviewsScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredReviews = selectedCategory === 'all'
    ? MOCK_REVIEWS
    : MOCK_REVIEWS.filter(review => review.type === selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews & Ratings</Text>
        <TouchableOpacity>
          <Ionicons name="search-outline" size={24} color={Colors.black} />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
      >
        {REVIEW_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              selectedCategory === category.id && styles.activeCategoryTab
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon as keyof typeof Ionicons.glyphMap}
              size={16}
              color={selectedCategory === category.id ? Colors.white : Colors.secondary500}
            />
            <Text style={[
              styles.categoryTabText,
              selectedCategory === category.id && styles.activeCategoryTabText
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Write Review Button */}
      <View style={styles.writeReviewContainer}>
        <TouchableOpacity
          style={styles.writeReviewButton}
          onPress={() => router.push('/community/write-review')}
        >
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary600} />
          <Text style={styles.writeReviewText}>Write a Review</Text>
        </TouchableOpacity>
      </View>

      {/* Reviews List */}
      <FlatList
        data={filteredReviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReviewCard review={item} />}
        contentContainerStyle={styles.reviewsList}
        showsVerticalScrollIndicator={false}
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
  categoryFilter: {
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
    maxHeight: 60,
    height: 'auto', 
  },
  categoryFilterContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 44,
    alignItems: 'center',
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: Colors.light100,
    height: 36,
  },
  activeCategoryTab: {
    backgroundColor: Colors.primary600,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.secondary500,
    marginLeft: 4,
  },
  activeCategoryTabText: {
    color: Colors.white,
  },
  writeReviewContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary100,
    borderRadius: 8,
    paddingVertical: 12,
  },
  writeReviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary600,
    marginLeft: 6,
  },
  reviewsList: {
    padding: 20,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
  },
  reviewType: {
    backgroundColor: Colors.light100,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reviewTypeText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.secondary600,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerNameText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
    marginRight: 4,
  },
  reviewerMeta: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: 2,
  },
  reviewContent: {
    fontSize: 14,
    color: Colors.black,
    lineHeight: 20,
    marginBottom: 12,
  },
  photosIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  photosText: {
    fontSize: 12,
    color: Colors.primary600,
    marginLeft: 4,
  },
  businessResponse: {
    backgroundColor: Colors.primary100,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary600,
    marginLeft: 4,
  },
  responseText: {
    fontSize: 12,
    color: Colors.primary700,
    lineHeight: 16,
  },
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light200,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light100,
    marginRight: 8,
  },
  helpfulButtonActive: {
    backgroundColor: Colors.primary600,
  },
  notHelpfulButtonActive: {
    backgroundColor: Colors.error,
  },
  helpfulText: {
    fontSize: 12,
    color: Colors.secondary500,
    marginLeft: 4,
  },
  helpfulTextActive: {
    color: Colors.white,
  },
  notHelpfulTextActive: {
    color: Colors.white,
  },
});
