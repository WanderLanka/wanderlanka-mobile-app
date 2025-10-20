import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reviewApi, Review, ReviewStats } from '../services/reviewApi';
import { ReviewCard } from './ReviewCard';
import { StarRating } from './StarRating';

const Colors = {
  white: '#FFFFFF',
  black: '#000000',
  primary600: '#2563EB',
  secondary100: '#F3F4F6',
  secondary600: '#4B5563',
  secondary800: '#1F2937',
};

interface ReviewListProps {
  mapPointId: string;
  refreshTrigger?: number;
}

export const ReviewList: React.FC<ReviewListProps> = ({ mapPointId, refreshTrigger }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');

  const fetchReviews = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await reviewApi.getReviews(mapPointId, {
        page,
        limit: 10,
        sort: sortBy,
      });

      if (append) {
        setReviews(prev => [...prev, ...response.data.reviews]);
      } else {
        setReviews(response.data.reviews);
      }

      setStats(response.data.stats);
      setHasMore(response.data.pagination.page < response.data.pagination.pages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReviews(1, false);
  }, [mapPointId, sortBy, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReviews(1, false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchReviews(currentPage + 1, true);
    }
  };

  const renderHeader = () => {
    if (!stats) return null;

    return (
      <View style={styles.header}>
        {/* Overall Rating */}
        <View style={styles.statsContainer}>
          <View style={styles.ratingOverview}>
            <Text style={styles.ratingNumber}>{stats.averageRating.toFixed(1)}</Text>
            <StarRating rating={stats.averageRating} size={20} />
            <Text style={styles.reviewCount}>
              {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
            </Text>
          </View>

          {/* Rating Distribution */}
          <View style={styles.distribution}>
            {[5, 4, 3, 2, 1].map(star => {
              const count = stats.ratingDistribution[star as keyof typeof stats.ratingDistribution] || 0;
              const percentage = stats.totalReviews > 0 
                ? (count / stats.totalReviews) * 100 
                : 0;
              
              return (
                <View key={star} style={styles.distributionRow}>
                  <Text style={styles.starLabel}>{star}★</Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[styles.progressFill, { width: `${percentage}%` }]} 
                    />
                  </View>
                  <Text style={styles.countLabel}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'recent' && styles.sortButtonActive]}
            onPress={() => setSortBy('recent')}
          >
            <Text style={[styles.sortText, sortBy === 'recent' && styles.sortTextActive]}>
              Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'helpful' && styles.sortButtonActive]}
            onPress={() => setSortBy('helpful')}
          >
            <Text style={[styles.sortText, sortBy === 'helpful' && styles.sortTextActive]}>
              Most Helpful
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
            onPress={() => setSortBy('rating')}
          >
            <Text style={[styles.sortText, sortBy === 'rating' && styles.sortTextActive]}>
              Highest Rated
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="star-outline" size={64} color={Colors.secondary600} />
        <Text style={styles.emptyTitle}>No reviews yet</Text>
        <Text style={styles.emptySubtitle}>Be the first to share your experience!</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary600} />
      </View>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary600} />
      </View>
    );
  }

  return (
    <FlatList
      data={reviews}
      keyExtractor={item => item._id}
      renderItem={({ item }) => (
        <ReviewCard review={item} onReviewUpdated={() => fetchReviews(1, false)} />
      )}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  header: {
    marginBottom: 24,
  },
  statsContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingOverview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: Colors.secondary600,
    marginTop: 8,
  },
  distribution: {
    marginTop: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starLabel: {
    width: 30,
    fontSize: 14,
    color: Colors.secondary800,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.secondary100,
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFA500',
    borderRadius: 4,
  },
  countLabel: {
    width: 30,
    fontSize: 12,
    color: Colors.secondary600,
    textAlign: 'right',
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.secondary100,
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: Colors.primary600,
    borderColor: Colors.primary600,
  },
  sortText: {
    fontSize: 14,
    color: Colors.secondary800,
  },
  sortTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.secondary600,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
