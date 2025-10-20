import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Review } from '../services/review';
import { ReviewService } from '../services/review';

interface GuideReviewCardProps {
  review: Review;
  onReviewUpdated?: () => void;
  showHelpfulButton?: boolean;
  isAuthor?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const GuideReviewCard: React.FC<GuideReviewCardProps> = ({
  review,
  onReviewUpdated,
  showHelpfulButton = true,
  isAuthor = false,
  onEdit,
  onDelete,
}) => {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [isMarkingHelpful, setIsMarkingHelpful] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color={i <= rating ? Colors.warning : Colors.secondary300}
        />
      );
    }
    return stars;
  };

  const handleMarkHelpful = async () => {
    if (isMarkingHelpful) return;

    try {
      setIsMarkingHelpful(true);
      const action = helpfulCount > review.helpfulCount ? 'remove' : 'add';
      const response = await ReviewService.markHelpful(review._id, action);

      if (response.success && response.data) {
        setHelpfulCount(response.data.helpfulCount);
        onReviewUpdated?.();
      } else {
        Alert.alert('Error', response.error || 'Failed to update helpful status');
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      Alert.alert('Error', 'Failed to update helpful status');
    } finally {
      setIsMarkingHelpful(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={Colors.secondary400} />
          </View>
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{review.travelerName}</Text>
            <View style={styles.ratingRow}>
              <View style={styles.starsContainer}>
                {renderStars(review.rating)}
              </View>
              <Text style={styles.date}> • {formatDate(review.createdAt)}</Text>
            </View>
            {review.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>
        
        {isAuthor && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
                <Ionicons name="create-outline" size={18} color={Colors.primary600} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Comment */}
      <Text style={styles.comment}>{review.comment}</Text>

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <View style={styles.imagesContainer}>
          {review.images.slice(0, 3).map((image, index) => (
            <Image
              key={index}
              source={{ uri: image.thumbnailUrl || image.url }}
              style={styles.reviewImage}
            />
          ))}
          {review.images.length > 3 && (
            <View style={styles.moreImagesOverlay}>
              <Text style={styles.moreImagesText}>+{review.images.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {/* Guide Response */}
      {review.response && (
        <View style={styles.responseContainer}>
          <View style={styles.responseHeader}>
            <Ionicons name="chatbubble-outline" size={16} color={Colors.primary600} />
            <Text style={styles.responseLabel}>Guide Response</Text>
          </View>
          <Text style={styles.responseText}>{review.response.comment}</Text>
          <Text style={styles.responseDate}>
            {formatDate(review.response.respondedAt)}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        {showHelpfulButton && (
          <TouchableOpacity
            style={styles.helpfulButton}
            onPress={handleMarkHelpful}
            disabled={isMarkingHelpful}
          >
            <Ionicons 
              name="thumbs-up-outline" 
              size={16} 
              color={helpfulCount > review.helpfulCount ? Colors.primary600 : Colors.secondary400} 
            />
            <Text style={[
              styles.helpfulText,
              helpfulCount > review.helpfulCount && styles.helpfulTextActive
            ]}>
              Helpful ({helpfulCount})
            </Text>
          </TouchableOpacity>
        )}
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
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  date: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.success,
    marginLeft: 4,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.secondary50,
  },
  comment: {
    fontSize: 15,
    color: Colors.black,
    lineHeight: 22,
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.secondary100,
  },
  moreImagesOverlay: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreImagesText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  responseContainer: {
    backgroundColor: Colors.primary50,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary700,
    marginLeft: 6,
  },
  responseText: {
    fontSize: 14,
    color: Colors.primary700,
    lineHeight: 20,
    marginBottom: 4,
  },
  responseDate: {
    fontSize: 12,
    color: Colors.primary600,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.secondary50,
  },
  helpfulText: {
    fontSize: 14,
    color: Colors.secondary500,
    marginLeft: 6,
    fontWeight: '500',
  },
  helpfulTextActive: {
    color: Colors.primary600,
  },
});
