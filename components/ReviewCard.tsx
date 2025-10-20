import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StarRating } from './StarRating';
import { reviewApi, Review } from '../services/reviewApi';

const Colors = {
  white: '#FFFFFF',
  black: '#000000',
  primary600: '#2563EB',
  secondary100: '#F3F4F6',
  secondary200: '#E5E7EB',
  secondary400: '#9CA3AF',
  secondary500: '#6B7280',
  secondary600: '#4B5563',
  secondary800: '#1F2937',
  error: '#EF4444',
  warning: '#FFA500',
};

interface ReviewCardProps {
  review: Review;
  onReviewUpdated?: () => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, onReviewUpdated }) => {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [isHelpful, setIsHelpful] = useState(review.isHelpful);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleToggleHelpful = async () => {
    try {
      setLoading(true);
      const result = await reviewApi.toggleHelpful(review._id);
      setIsHelpful(result.data.isHelpful);
      setHelpfulCount(result.data.helpfulCount);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark as helpful');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await reviewApi.deleteReview(review._id);
              Alert.alert('Success', 'Review deleted successfully');
              if (onReviewUpdated) onReviewUpdated();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete review');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          {review.author.avatar ? (
            <Image source={{ uri: review.author.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={20} color={Colors.secondary400} />
            </View>
          )}
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{review.author.username}</Text>
            <View style={styles.ratingRow}>
              <StarRating rating={review.rating} size={16} />
              <Text style={styles.date}> • {formatDate(review.createdAt)}</Text>
            </View>
          </View>
        </View>
        
        {review.isAuthor && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Comment */}
      <Text style={styles.comment}>{review.comment}</Text>

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
          {review.images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image.thumbnailUrl || image.url }}
              style={styles.reviewImage}
            />
          ))}
        </ScrollView>
      )}

      {/* Visit Date */}
      {review.visitDate && (
        <Text style={styles.visitDate}>
          Visited on {formatDate(review.visitDate)}
        </Text>
      )}

      {/* Edited Badge */}
      {review.edited && (
        <Text style={styles.editedText}>
          Edited on {formatDate(review.editedAt!)}
        </Text>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.helpfulButton}
          onPress={handleToggleHelpful}
          disabled={loading}
        >
          <Ionicons
            name={isHelpful ? 'thumbs-up' : 'thumbs-up-outline'}
            size={18}
            color={isHelpful ? Colors.primary600 : Colors.secondary600}
          />
          <Text style={[styles.helpfulText, isHelpful && styles.helpfulTextActive]}>
            Helpful ({helpfulCount})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.secondary100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: Colors.secondary600,
  },
  deleteButton: {
    padding: 4,
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.secondary800,
    marginBottom: 12,
  },
  imagesContainer: {
    marginBottom: 12,
  },
  reviewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  visitDate: {
    fontSize: 12,
    color: Colors.secondary600,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  editedText: {
    fontSize: 11,
    color: Colors.secondary500,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  helpfulText: {
    fontSize: 14,
    color: Colors.secondary600,
    marginLeft: 6,
  },
  helpfulTextActive: {
    color: Colors.primary600,
    fontWeight: '600',
  },
});
