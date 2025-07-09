import {
  FlatList,
  Image,
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

// Mock data - easily replaceable with backend API calls
const MOCK_TRAVEL_POSTS = [
  {
    id: 'post1',
    author: {
      id: 'user1',
      name: 'Sarah Johnson',
      avatar: null,
      verified: true,
    },
    content: 'Amazing sunset at Galle Fort! The view from the lighthouse is absolutely breathtaking. Perfect way to end our day exploring the historic ramparts.',
    images: [
      'https://example.com/galle-sunset.jpg',
    ],
    location: 'Galle Fort, Sri Lanka',
    timestamp: '2024-07-08T18:30:00Z',
    likes: 45,
    comments: 12,
    shares: 8,
    liked: false,
  },
  {
    id: 'post2',
    author: {
      id: 'user2',
      name: 'Mark Chen',
      avatar: null,
      verified: false,
    },
    content: 'Tea plantation tour in Ella was incredible! Met some amazing locals who taught us about the tea-making process. The train ride here was scenic too! 🚂',
    images: [],
    location: 'Ella, Sri Lanka',
    timestamp: '2024-07-08T14:15:00Z',
    likes: 32,
    comments: 7,
    shares: 5,
    liked: true,
  },
];

const MOCK_REVIEWS = [
  {
    id: 'review1',
    type: 'accommodation',
    businessName: 'Cinnamon Grand Colombo',
    rating: 4.5,
    reviewer: 'Jennifer Smith',
    reviewDate: '2024-07-07',
    content: 'Excellent service and great location. The breakfast buffet was outstanding!',
    helpful: 23,
  },
  {
    id: 'review2',
    type: 'activity',
    businessName: 'Elephant Orphanage Pinnawala',
    rating: 4.8,
    reviewer: 'David Williams',
    reviewDate: '2024-07-06',
    content: 'Incredible experience watching the elephants. Educational and heartwarming.',
    helpful: 18,
  },
];

const MOCK_QUESTIONS = [
  {
    id: 'q1',
    question: 'Best time to visit Sigiriya Rock?',
    askedBy: 'Tourist_2024',
    askedDate: '2024-07-08T10:00:00Z',
    answers: 5,
    category: 'Travel Tips',
    featured: true,
  },
  {
    id: 'q2',
    question: 'Safe areas to stay in Colombo for solo female travelers?',
    askedBy: 'SoloTraveler',
    askedDate: '2024-07-08T08:30:00Z',
    answers: 12,
    category: 'Safety',
    featured: false,
  },
];

interface CommunityTabProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
  onPress: () => void;
}

const CommunityTab: React.FC<CommunityTabProps> = ({ title, icon, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.tab, isActive && styles.activeTab]}
    onPress={onPress}
  >
    <Ionicons
      name={icon}
      size={20}
      color={isActive ? Colors.primary600 : Colors.secondary500}
    />
    <Text style={[styles.tabText, isActive && styles.activeTabText]}>
      {title}
    </Text>
  </TouchableOpacity>
);

interface PostCardProps {
  post: typeof MOCK_TRAVEL_POSTS[0];
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const timeAgo = new Date().getTime() - new Date(post.timestamp).getTime();
  const hoursAgo = Math.floor(timeAgo / (1000 * 60 * 60));

  return (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={Colors.secondary400} />
          </View>
          <View style={styles.authorDetails}>
            <View style={styles.authorName}>
              <Text style={styles.authorText}>{post.author.name}</Text>
              {post.author.verified && (
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary600} />
              )}
            </View>
            <Text style={styles.postTime}>{hoursAgo}h ago • {post.location}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.secondary400} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <Text style={styles.postContent}>{post.content}</Text>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons
            name={post.liked ? "heart" : "heart-outline"}
            size={20}
            color={post.liked ? Colors.error : Colors.secondary400}
          />
          <Text style={styles.actionText}>{post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.secondary400} />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color={Colors.secondary400} />
          <Text style={styles.actionText}>{post.shares}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState('blog');

  const tabs = [
    { id: 'blog', title: 'Travel Blog', icon: 'newspaper-outline' as const },
    { id: 'reviews', title: 'Reviews', icon: 'star-outline' as const },
    { id: 'discussions', title: 'Q&A', icon: 'chatbubbles-outline' as const },
    { id: 'map', title: 'Map Insights', icon: 'map-outline' as const },
    { id: 'social', title: 'Connect', icon: 'people-outline' as const },
  ];

  const renderBlogContent = () => (
    <View style={styles.contentContainer}>
      {/* Create Post Button */}
      <TouchableOpacity
        style={styles.createPostButton}
        onPress={() => {
          // TODO: Create create-post screen
          console.log('Navigate to create post');
        }}
      >
        <View style={styles.createPostContent}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color={Colors.secondary400} />
          </View>
          <Text style={styles.createPostText}>Share your travel experience...</Text>
        </View>
        <Ionicons name="camera-outline" size={20} color={Colors.primary600} />
      </TouchableOpacity>

      {/* Posts Feed */}
      <FlatList
        data={MOCK_TRAVEL_POSTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );

  const renderReviewsContent = () => (
    <View style={styles.contentContainer}>
      <TouchableOpacity
        style={styles.sectionButton}
        onPress={() => router.push('/community/reviews' as any)}
      >
        <View style={styles.sectionHeader}>
          <Ionicons name="star" size={20} color={Colors.warning} />
          <Text style={styles.sectionTitle}>Service Reviews</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.secondary400} />
      </TouchableOpacity>

      {MOCK_REVIEWS.map((review) => (
        <View key={review.id} style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.businessName}>{review.businessName}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={Colors.warning} />
              <Text style={styles.ratingText}>{review.rating}</Text>
            </View>
          </View>
          <Text style={styles.reviewContent}>{review.content}</Text>
          <View style={styles.reviewFooter}>
            <Text style={styles.reviewerName}>by {review.reviewer}</Text>
            <Text style={styles.helpfulText}>{review.helpful} found helpful</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderDiscussionsContent = () => (
    <View style={styles.contentContainer}>
      <TouchableOpacity
        style={styles.askQuestionButton}
        onPress={() => router.push('/community/ask-question' as any)}
      >
        <Ionicons name="add-circle" size={20} color={Colors.primary600} />
        <Text style={styles.askQuestionText}>Ask a Question</Text>
      </TouchableOpacity>

      {MOCK_QUESTIONS.map((question) => (
        <TouchableOpacity key={question.id} style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionText}>{question.question}</Text>
            {question.featured && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}
          </View>
          <View style={styles.questionFooter}>
            <Text style={styles.questionMeta}>
              by {question.askedBy} • {question.answers} answers
            </Text>
            <Text style={styles.categoryText}>{question.category}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMapContent = () => (
    <View style={styles.contentContainer}>
      <TouchableOpacity
        style={styles.mapButton}
        onPress={() => router.push('/community/crowdsource-map' as any)}
      >
        <View style={styles.mapButtonContent}>
          <Ionicons name="map" size={24} color={Colors.primary600} />
          <View style={styles.mapButtonText}>
            <Text style={styles.mapButtonTitle}>Crowdsourced Map Insights</Text>
            <Text style={styles.mapButtonSubtitle}>Add & discover hidden gems</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.secondary400} />
      </TouchableOpacity>

      <View style={styles.mapFeatures}>
        <TouchableOpacity style={styles.mapFeature}>
          <Ionicons name="location" size={20} color={Colors.primary600} />
          <Text style={styles.mapFeatureText}>Add Points of Interest</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapFeature}>
          <Ionicons name="business" size={20} color={Colors.primary600} />
          <Text style={styles.mapFeatureText}>Sanitary Facilities</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapFeature}>
          <Ionicons name="restaurant" size={20} color={Colors.primary600} />
          <Text style={styles.mapFeatureText}>Local Eateries</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapFeature}>
          <Ionicons name="wifi" size={20} color={Colors.primary600} />
          <Text style={styles.mapFeatureText}>WiFi Spots</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSocialContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.socialFeatures}>
        <TouchableOpacity style={styles.socialFeature}>
          <Ionicons name="people" size={24} color={Colors.primary600} />
          <Text style={styles.socialFeatureTitle}>Find Travel Buddies</Text>
          <Text style={styles.socialFeatureSubtitle}>Connect with fellow travelers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialFeature}>
          <Ionicons name="calendar" size={24} color={Colors.primary600} />
          <Text style={styles.socialFeatureTitle}>Local Events</Text>
          <Text style={styles.socialFeatureSubtitle}>Discover meetups & gatherings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialFeature}>
          <Ionicons name="trophy" size={24} color={Colors.primary600} />
          <Text style={styles.socialFeatureTitle}>Travel Challenges</Text>
          <Text style={styles.socialFeatureSubtitle}>Join contests & competitions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'blog':
        return renderBlogContent();
      case 'reviews':
        return renderReviewsContent();
      case 'discussions':
        return renderDiscussionsContent();
      case 'map':
        return renderMapContent();
      case 'social':
        return renderSocialContent();
      default:
        return renderBlogContent();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color={Colors.black} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <CommunityTab
            key={tab.id}
            title={tab.title}
            icon={tab.icon}
            isActive={activeTab === tab.id}
            onPress={() => setActiveTab(tab.id)}
          />
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
  },
  tabsContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  tabsContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: Colors.light100,
  },
  activeTab: {
    backgroundColor: Colors.primary100,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary500,
    marginLeft: 6,
  },
  activeTabText: {
    color: Colors.primary600,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  createPostContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  createPostText: {
    fontSize: 16,
    color: Colors.secondary400,
    marginLeft: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postCard: {
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
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginRight: 4,
  },
  postTime: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: 2,
  },
  postContent: {
    fontSize: 14,
    color: Colors.black,
    lineHeight: 20,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light200,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    fontSize: 12,
    color: Colors.secondary500,
    marginLeft: 4,
  },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginLeft: 8,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  businessName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.black,
    marginLeft: 2,
  },
  reviewContent: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 18,
    marginBottom: 8,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  helpfulText: {
    fontSize: 12,
    color: Colors.primary600,
  },
  askQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  askQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
    marginLeft: 8,
  },
  questionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
    flex: 1,
    lineHeight: 18,
  },
  featuredBadge: {
    backgroundColor: Colors.warning,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionMeta: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.primary600,
    fontWeight: '500',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  mapButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mapButtonText: {
    marginLeft: 16,
    flex: 1,
  },
  mapButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  mapButtonSubtitle: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  mapFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mapFeature: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  mapFeatureText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.black,
    textAlign: 'center',
    marginTop: 8,
  },
  socialFeatures: {
    gap: 16,
  },
  socialFeature: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  socialFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginTop: 8,
    marginBottom: 4,
  },
  socialFeatureSubtitle: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
  },
});