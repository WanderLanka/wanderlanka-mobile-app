
import {
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useRef, useState } from 'react';
import { formatTimeAgo, formatTimeShort, getTimestampAgo } from '../../utils/timeFormat';

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
    timestamp: getTimestampAgo(2, 'hours'),
    likes: 45,
    comments: 12,
    shares: 8,
    liked: false,
    category: 'experience',
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
    timestamp: getTimestampAgo(1, 'days'),
    likes: 32,
    comments: 7,
    shares: 5,
    liked: true,
    category: 'tips',
  },
];

const MOCK_COMMENTS = {
  post1: [
    {
      id: 'comment1',
      author: {
        id: 'user3',
        name: 'Emma Wilson',
        avatar: null,
      },
      content: 'Absolutely stunning! I was there last month and the sunset was incredible. Did you try the local seafood nearby?',
      timestamp: getTimestampAgo(45, 'minutes'),
      likes: 8,
      liked: false,
    },
    {
      id: 'comment2',
      author: {
        id: 'user4',
        name: 'James Rodriguez',
        avatar: null,
      },
      content: 'Great shot! The lighthouse tour is definitely worth it. How crowded was it when you visited?',
      timestamp: getTimestampAgo(1, 'hours'),
      likes: 5,
      liked: true,
    },
    {
      id: 'comment3',
      author: {
        id: 'user5',
        name: 'Lisa Park',
        avatar: null,
      },
      content: 'Added this to my bucket list! Any tips for the best time to visit?',
      timestamp: getTimestampAgo(3, 'hours'),
      likes: 3,
      liked: false,
    },
  ],
  post2: [
    {
      id: 'comment4',
      author: {
        id: 'user6',
        name: 'David Kumar',
        avatar: null,
      },
      content: 'The train journey to Ella is magical! Did you book in advance or get tickets on the day?',
      timestamp: getTimestampAgo(2, 'days'),
      likes: 4,
      liked: false,
    },
    {
      id: 'comment5',
      author: {
        id: 'user7',
        name: 'Sophie Anderson',
        avatar: null,
      },
      content: 'Love the tea plantations there! The locals are so friendly and knowledgeable.',
      timestamp: getTimestampAgo(3, 'days'),
      likes: 6,
      liked: true,
    },
  ],
};

const MOCK_REVIEWS = [
  {
    id: 'review1',
    type: 'accommodation',
    businessName: 'Cinnamon Grand Colombo',
    rating: 4.5,
    reviewer: 'Jennifer Smith',
    reviewDate: getTimestampAgo(3, 'days'),
    content: 'Excellent service and great location. The breakfast buffet was outstanding!',
    helpful: 23,
  },
  {
    id: 'review2',
    type: 'activity',
    businessName: 'Elephant Orphanage Pinnawala',
    rating: 4.8,
    reviewer: 'David Williams',
    reviewDate: getTimestampAgo(1, 'weeks'),
    content: 'Incredible experience watching the elephants. Educational and heartwarming.',
    helpful: 18,
  },
];

const MOCK_QUESTIONS = [
  {
    id: 'q1',
    question: 'Best time to visit Sigiriya Rock?',
    askedBy: 'Tourist_2024',
    askedDate: getTimestampAgo(30, 'minutes'),
    answers: 5,
    category: 'Travel Tips',
    featured: true,
  },
  {
    id: 'q2',
    question: 'Safe areas to stay in Colombo for solo female travelers?',
    askedBy: 'SoloTraveler',
    askedDate: getTimestampAgo(5, 'hours'),
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
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onPostOptions: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onComment, onShare, onPostOptions }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLikePress = () => {
    // Animation for like button
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    onLike(post.id);
  };

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
            <Text style={styles.postTime}>{formatTimeShort(post.timestamp)} • {post.location}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => onPostOptions(post.id)} style={styles.optionsButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.secondary400} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <Text style={styles.postContent}>{post.content}</Text>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLikePress}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons
              name={post.liked ? "heart" : "heart-outline"}
              size={20}
              color={post.liked ? Colors.error : Colors.secondary400}
            />
          </Animated.View>
          <Text style={[styles.actionText, post.liked && styles.likedText]}>{post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onComment(post.id)}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.secondary400} />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onShare(post.id)}>
          <Ionicons name="share-outline" size={20} color={Colors.secondary400} />
          <Text style={styles.actionText}>{post.shares}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={20} color={Colors.secondary400} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState('blog');
  const [posts, setPosts] = useState(MOCK_TRAVEL_POSTS);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [currentComments, setCurrentComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  const tabs = [
    { id: 'blog', title: 'Travel Blog', icon: 'newspaper-outline' as const },
    { id: 'reviews', title: 'Reviews', icon: 'star-outline' as const },
    { id: 'discussions', title: 'Q&A', icon: 'chatbubbles-outline' as const },
    { id: 'map', title: 'Map Insights', icon: 'map-outline' as const },
    { id: 'social', title: 'Connect', icon: 'people-outline' as const },
  ];

  // Post action handlers
  const handleLike = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              liked: !post.liked, 
              likes: post.liked ? post.likes - 1 : post.likes + 1 
            }
          : post
      )
    );
  };

  const handleComment = (postId: string) => {
    const comments = MOCK_COMMENTS[postId as keyof typeof MOCK_COMMENTS] || [];
    setCurrentComments(comments);
    setSelectedPostId(postId);
    setShowComments(true);
  };

  const handleCloseComments = () => {
    console.log('Closing comments modal');
    setShowComments(false);
    setSelectedPostId(null);
    setCurrentComments([]);
  };

  const handleShare = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      try {
        await Share.share({
          message: `Check out this travel experience: "${post.content}" - Shared from WanderLanka`,
          url: `https://wanderlanka.com/post/${postId}`, // Replace with actual URL
        });
        
        // Update share count
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === postId ? { ...p, shares: p.shares + 1 } : p
          )
        );
      } catch (error) {
        Alert.alert('Error', 'Could not share the post');
      }
    }
  };

  const handlePostOptions = (postId: string) => {
    setSelectedPostId(postId);
    setShowPostOptions(true);
  };

  const handlePostOption = (option: string) => {
    const post = posts.find(p => p.id === selectedPostId);
    setShowPostOptions(false);

    switch (option) {
      case 'save':
        Alert.alert('Saved', 'Post saved to your collection');
        break;
      case 'report':
        Alert.alert('Report', 'Thank you for reporting. We will review this post.');
        break;
      case 'hide':
        Alert.alert('Hidden', 'Post hidden from your feed');
        break;
      case 'follow':
        Alert.alert('Following', `You are now following ${post?.author.name}`);
        break;
      case 'copy':
        // Copy post link functionality
        Alert.alert('Copied', 'Post link copied to clipboard');
        break;
      default:
        break;
    }
    setSelectedPostId(null);
  };

  const handleAddComment = () => {
    if (newComment.trim() && selectedPostId) {
      const comment = {
        id: `comment_${Date.now()}`,
        author: {
          id: 'current_user',
          name: 'You',
          avatar: null,
        },
        content: newComment.trim(),
        timestamp: new Date().toISOString(),
        likes: 0,
        liked: false,
      };

      setCurrentComments(prev => [...prev, comment]);
      
      // Update comment count in posts
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === selectedPostId 
            ? { ...post, comments: post.comments + 1 }
            : post
        )
      );
      
      setNewComment('');
    }
  };

  const handleCommentLike = (commentId: string) => {
    setCurrentComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              liked: !comment.liked, 
              likes: comment.liked ? comment.likes - 1 : comment.likes + 1 
            }
          : comment
      )
    );
  };

  const renderBlogContent = () => (
    <View style={styles.contentContainer}>
      {/* Create Post Button */}
      <TouchableOpacity
        style={styles.createPostButton}
        onPress={() => router.push('/community/create-post' as any)}
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
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard 
            post={item} 
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onPostOptions={handlePostOptions}
          />
        )}
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
            <Text style={styles.reviewerName}>by {review.reviewer} • {formatTimeShort(review.reviewDate)}</Text>
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
              by {question.askedBy} • {question.answers} answers • {formatTimeShort(question.askedDate)}
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
        <TouchableOpacity 
          style={styles.mapFeature}
          onPress={() => router.push('/community/my-map-points' as any)}
        >
          <Ionicons name="person" size={20} color={Colors.info} />
          <Text style={[styles.mapFeatureText, { color: Colors.info }]}>My Map Points</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.mapFeature}
          onPress={() => router.push('/community/crowdsource-map?filter=poi' as any)}
        >
          <Ionicons name="location" size={20} color={Colors.primary600} />
          <Text style={styles.mapFeatureText}>Add Points of Interest</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.mapFeature}
          onPress={() => router.push('/community/crowdsource-map?filter=washroom' as any)}
        >
          <Ionicons name="business" size={20} color={Colors.primary600} />
          <Text style={styles.mapFeatureText}>Sanitary Facilities</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.mapFeature}
          onPress={() => router.push('/community/crowdsource-map?filter=restaurant' as any)}
        >
          <Ionicons name="restaurant" size={20} color={Colors.primary600} />
          <Text style={styles.mapFeatureText}>Local Eateries</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.mapFeature}
          onPress={() => router.push('/community/crowdsource-map?filter=wifi' as any)}
        >
          <Ionicons name="wifi" size={20} color={Colors.primary600} />
          <Text style={styles.mapFeatureText}>WiFi Spots</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSocialContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.connectionHeader}>
        <Text style={styles.connectionTitle}>Connect & Explore</Text>
        <Text style={styles.connectionSubtitle}>Build meaningful connections and discover new experiences</Text>
      </View>

      <View style={styles.socialFeatures}>
        <TouchableOpacity 
          style={styles.socialFeature}
          onPress={() => router.push('/community/travel-buddies' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.socialFeatureHeader}>
            <View style={styles.socialFeatureIcon}>
              <Ionicons name="people" size={24} color={Colors.primary600} />
            </View>
            <View style={styles.socialFeatureStats}>
              <Text style={styles.socialFeatureNumber}>1,247</Text>
              <Text style={styles.socialFeatureLabel}>Active</Text>
            </View>
          </View>
          <Text style={styles.socialFeatureTitle}>Travel Buddies</Text>
          <Text style={styles.socialFeatureSubtitle}>Connect with fellow travelers and find your perfect travel companion</Text>
          <View style={styles.socialFeatureFooter}>
            <Text style={styles.socialFeatureAction}>Find Buddies</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary600} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.socialFeature}
          onPress={() => router.push('/community/local-events' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.socialFeatureHeader}>
            <View style={styles.socialFeatureIcon}>
              <Ionicons name="calendar" size={24} color={Colors.success} />
            </View>
            <View style={styles.socialFeatureStats}>
              <Text style={styles.socialFeatureNumber}>89</Text>
              <Text style={styles.socialFeatureLabel}>This Week</Text>
            </View>
          </View>
          <Text style={styles.socialFeatureTitle}>Local Events</Text>
          <Text style={styles.socialFeatureSubtitle}>Discover meetups, cultural events, and local gatherings</Text>
          <View style={styles.socialFeatureFooter}>
            <Text style={styles.socialFeatureAction}>Browse Events</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.success} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.socialFeature}
          onPress={() => router.push('/community/travel-challenges' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.socialFeatureHeader}>
            <View style={styles.socialFeatureIcon}>
              <Ionicons name="trophy" size={24} color={Colors.warning} />
            </View>
            <View style={styles.socialFeatureStats}>
              <Text style={styles.socialFeatureNumber}>12</Text>
              <Text style={styles.socialFeatureLabel}>Active</Text>
            </View>
          </View>
          <Text style={styles.socialFeatureTitle}>Travel Challenges</Text>
          <Text style={styles.socialFeatureSubtitle}>Join contests, competitions, and achievement challenges</Text>
          <View style={styles.socialFeatureFooter}>
            <Text style={styles.socialFeatureAction}>Join Challenge</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.warning} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="chatbubble-ellipses" size={20} color={Colors.primary600} />
          <Text style={styles.quickActionText}>Community Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="camera" size={20} color={Colors.primary600} />
          <Text style={styles.quickActionText}>Share Moment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="compass" size={20} color={Colors.primary600} />
          <Text style={styles.quickActionText}>Discover</Text>
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

      {/* Post Options Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPostOptions}
        onRequestClose={() => setShowPostOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.optionsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post Options</Text>
              <TouchableOpacity onPress={() => setShowPostOptions(false)}>
                <Ionicons name="close" size={24} color={Colors.secondary400} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.optionItem} 
              onPress={() => handlePostOption('save')}
            >
              <Ionicons name="bookmark-outline" size={20} color={Colors.secondary600} />
              <Text style={styles.optionText}>Save Post</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionItem} 
              onPress={() => handlePostOption('follow')}
            >
              <Ionicons name="person-add-outline" size={20} color={Colors.secondary600} />
              <Text style={styles.optionText}>Follow Author</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionItem} 
              onPress={() => handlePostOption('copy')}
            >
              <Ionicons name="link-outline" size={20} color={Colors.secondary600} />
              <Text style={styles.optionText}>Copy Link</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionItem} 
              onPress={() => handlePostOption('hide')}
            >
              <Ionicons name="eye-off-outline" size={20} color={Colors.secondary600} />
              <Text style={styles.optionText}>Hide Post</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionItem, styles.reportOption]} 
              onPress={() => handlePostOption('report')}
            >
              <Ionicons name="flag-outline" size={20} color={Colors.error} />
              <Text style={[styles.optionText, styles.reportText]}>Report Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showComments}
        onRequestClose={handleCloseComments}
        supportedOrientations={['portrait']}
        statusBarTranslucent={false}
      >
        <SafeAreaView style={styles.commentsHeaderSafeArea}>
          <View style={styles.commentsHeader}>
            <TouchableOpacity 
              onPress={handleCloseComments}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Close comments"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color={Colors.black} />
            </TouchableOpacity>
            <Text style={styles.commentsTitle}>Comments</Text>
            <View style={{ width: 24 }} />
          </View>
        </SafeAreaView>
        
        <KeyboardAvoidingView 
          style={styles.commentsModal}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={styles.commentsList}>
            {currentComments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <Ionicons name="person" size={16} color={Colors.secondary400} />
                </View>
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{comment.author.name}</Text>
                    <Text style={styles.commentTime}>
                      {formatTimeShort(comment.timestamp)}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{comment.content}</Text>
                  <TouchableOpacity 
                    style={styles.commentLikeButton}
                    onPress={() => handleCommentLike(comment.id)}
                  >
                    <Ionicons 
                      name={comment.liked ? "heart" : "heart-outline"} 
                      size={14} 
                      color={comment.liked ? Colors.error : Colors.secondary400} 
                    />
                    <Text style={styles.commentLikes}>{comment.likes}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.commentInput}>
            <View style={styles.commentInputAvatar}>
              <Ionicons name="person" size={16} color={Colors.secondary400} />
            </View>
            <TextInput
              style={styles.commentInputField}
              placeholder="Add a comment..."
              placeholderTextColor={Colors.secondary400}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity 
              style={[styles.commentSendButton, !newComment.trim() && styles.commentSendButtonDisabled]}
              onPress={handleAddComment}
              disabled={!newComment.trim()}
            >
              <Ionicons 
                name="send" 
                size={16} 
                color={newComment.trim() ? Colors.primary600 : Colors.secondary400} 
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    maxHeight: 60,
    height: 'auto',
  },
  tabsContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: 'center',
    minHeight: 44,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: Colors.light100,
    height: 36,
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
  likedText: {
    color: Colors.error,
    fontWeight: '600',
  },
  optionsButton: {
    padding: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  optionText: {
    fontSize: 16,
    color: Colors.black,
    marginLeft: 12,
  },
  reportOption: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light200,
    marginTop: 8,
  },
  reportText: {
    color: Colors.error,
  },
  // Comments Modal Styles
  commentsHeaderSafeArea: {
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.light100,
  },
  commentsModal: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light100,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  commentText: {
    fontSize: 14,
    color: Colors.black,
    lineHeight: 18,
    marginBottom: 8,
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentLikes: {
    fontSize: 12,
    color: Colors.secondary500,
    marginLeft: 4,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light200,
    backgroundColor: Colors.white,
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  commentInputField: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light200,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.black,
    maxHeight: 100,
  },
  commentSendButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary100,
  },
  commentSendButtonDisabled: {
    backgroundColor: Colors.light100,
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
  connectionHeader: {
    marginBottom: 24,
  },
  connectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 6,
  },
  connectionSubtitle: {
    fontSize: 16,
    color: Colors.secondary500,
    lineHeight: 22,
  },
  socialFeatures: {
    gap: 16,
  },
  socialFeature: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  socialFeatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  socialFeatureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialFeatureStats: {
    alignItems: 'flex-end',
  },
  socialFeatureNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
  },
  socialFeatureLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: 2,
  },
  socialFeatureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 6,
  },
  socialFeatureSubtitle: {
    fontSize: 14,
    color: Colors.secondary500,
    lineHeight: 20,
    marginBottom: 16,
  },
  socialFeatureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light200,
  },
  socialFeatureAction: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary600,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light200,
  },
  quickAction: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
    flex: 1,
    marginHorizontal: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary600,
    marginTop: 6,
  },
});