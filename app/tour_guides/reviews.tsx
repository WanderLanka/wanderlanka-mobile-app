import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { GuideReviewCard, ReviewForm, RatingBreakdown } from '../../components';
import { ReviewService, Review } from '../../services/review';
import { useAuth } from '../../context/AuthContext';

export default function GuideReviewsScreen() {
  const { guideId, guideName } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({ 
    averageRating: 0, 
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful'>('recent');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  const fetchReviews = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!guideId) {
      console.log('❌ fetchReviews: No guideId provided');
      return;
    }

    console.log('🔄 fetchReviews: Starting fetch for guideId:', guideId, 'page:', page);

    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await ReviewService.getGuideReviews(guideId as string, {
        page,
        limit: 10,
        sort: sortBy,
      });

      console.log('📥 fetchReviews: Response received:', response);

      if (response.success && response.data) {
        console.log('✅ fetchReviews: Success, reviews count:', response.data.reviews?.length || 0);
        if (append) {
          setReviews(prev => [...prev, ...response.data!.reviews]);
        } else {
          setReviews(response.data.reviews);
        }
        if (response.data.stats) {
          setStats({
            averageRating: response.data.stats.averageRating || 0,
            totalReviews: response.data.stats.totalReviews || 0,
            ratingDistribution: response.data.stats.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
          });
        }
        setHasMore(response.data.pagination.hasNextPage);
        setCurrentPage(page);
      } else {
        console.log('❌ fetchReviews: Error response:', response.error);
        Alert.alert('Error', response.error || 'Failed to load reviews');
      }
    } catch (error) {
      console.error('❌ fetchReviews: Exception:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [guideId, sortBy]);

  const checkUserReview = useCallback(async () => {
    if (!guideId || !user?.id) return;

    try {
      const response = await ReviewService.hasReviewedGuide(guideId as string, user.id);
      if (response.success) {
        setUserReview(response.review || null);
      }
    } catch (error) {
      console.error('Error checking user review:', error);
    }
  }, [guideId, user?.id]);

  useEffect(() => {
    fetchReviews(1, false);
    checkUserReview();
  }, [fetchReviews, checkUserReview]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReviews(1, false);
    checkUserReview();
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchReviews(currentPage + 1, true);
    }
  };

  const handleReviewSubmitted = (review: Review) => {
    setUserReview(review);
    setShowReviewForm(false);
    fetchReviews(1, false); // Refresh to update stats
  };

  const handleEditReview = () => {
    if (userReview) {
      setShowReviewForm(true);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    try {
      const response = await ReviewService.deleteReview(userReview._id, user?.id || '');
      if (response.success) {
        setUserReview(null);
        fetchReviews(1, false); // Refresh to update stats
        Alert.alert('Success', 'Review deleted successfully');
      } else {
        Alert.alert('Error', response.error || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      Alert.alert('Error', 'Failed to delete review');
    }
  };


  const renderSortOptions = () => {
    const sortOptions = [
      { key: 'recent', label: 'Most Recent' },
      { key: 'oldest', label: 'Oldest' },
      { key: 'rating_high', label: 'Highest Rating' },
      { key: 'rating_low', label: 'Lowest Rating' },
      { key: 'helpful', label: 'Most Helpful' },
    ];

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.sortButton,
              sortBy === option.key && styles.sortButtonActive
            ]}
            onPress={() => setSortBy(option.key as any)}
          >
            <Text style={[
              styles.sortButtonText,
              sortBy === option.key && styles.sortButtonTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary600} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {guideName ? `${guideName} Reviews` : 'Reviews'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          if (isCloseToBottom && hasMore && !loadingMore) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Rating Breakdown */}
        {stats.totalReviews > 0 && (
          <View style={styles.ratingBreakdownContainer}>
            <RatingBreakdown
              ratingDistribution={stats.ratingDistribution}
              totalReviews={stats.totalReviews}
              averageRating={stats.averageRating}
            />
          </View>
        )}

        {/* User Review Section */}
        {user && (
          <View style={styles.userReviewSection}>
            <Text style={styles.sectionTitle}>Your Review</Text>
            {userReview ? (
              <GuideReviewCard
                review={userReview}
                isAuthor={true}
                onEdit={handleEditReview}
                onDelete={handleDeleteReview}
                onReviewUpdated={() => fetchReviews(1, false)}
              />
            ) : (
              <TouchableOpacity
                style={styles.writeReviewButton}
                onPress={() => setShowReviewForm(true)}
              >
                <Ionicons name="create-outline" size={20} color={Colors.primary600} />
                <Text style={styles.writeReviewText}>Write a Review</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Sort Options */}
        <View style={styles.sortSection}>
          <Text style={styles.sectionTitle}>All Reviews</Text>
          {renderSortOptions()}
        </View>

        {/* Reviews List */}
        <View style={styles.reviewsList}>
          {reviews.map((review) => (
            <GuideReviewCard
              key={review._id}
              review={review}
              onReviewUpdated={() => fetchReviews(1, false)}
            />
          ))}
        </View>

        {/* Load More */}
        {loadingMore && (
          <View style={styles.loadMoreContainer}>
            <ActivityIndicator size="small" color={Colors.primary600} />
            <Text style={styles.loadMoreText}>Loading more reviews...</Text>
          </View>
        )}

        {!hasMore && reviews.length > 0 && (
          <View style={styles.endContainer}>
            <Text style={styles.endText}>No more reviews to show</Text>
          </View>
        )}

        {reviews.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.secondary400} />
            <Text style={styles.emptyTitle}>No Reviews Yet</Text>
            <Text style={styles.emptyText}>
              Be the first to review this guide and help other travelers!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Review Form Modal */}
      <Modal
        visible={showReviewForm && !!user}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReviewForm(false)}
      >
        <ReviewForm
          guideId={guideId as string}
          travelerId={user?.id || ''}
          travelerName={user?.username || 'Traveler'}
          travelerEmail={user?.email || ''}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={() => setShowReviewForm(false)}
          existingReview={userReview}
        />
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
    fontSize: 16,
    color: Colors.secondary500,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsRow: {
    alignItems: 'center',
  },
  ratingContainer: {
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  userReviewSection: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary300,
    borderStyle: 'dashed',
    backgroundColor: Colors.primary100,
  },
  writeReviewText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
    marginLeft: 8,
  },
  sortSection: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sortContainer: {
    marginTop: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.secondary100,
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary600,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary600,
  },
  sortButtonTextActive: {
    color: Colors.white,
  },
  reviewsList: {
    paddingHorizontal: 16,
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadMoreText: {
    fontSize: 14,
    color: Colors.secondary500,
    marginLeft: 8,
  },
  endContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  endText: {
    fontSize: 14,
    color: Colors.secondary400,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  ratingBreakdownContainer: {
    marginBottom: 20,
  },
});