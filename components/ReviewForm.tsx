import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { ReviewService, CreateReviewRequest } from '../services/review';
import { StarRating } from './StarRating';

interface ReviewFormProps {
  guideId: string;
  travelerId: string;
  travelerName: string;
  travelerEmail: string;
  bookingId?: string;
  onReviewSubmitted: (review: any) => void;
  onCancel: () => void;
  existingReview?: any;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  guideId,
  travelerId,
  travelerName,
  travelerEmail,
  bookingId,
  onReviewSubmitted,
  onCancel,
  existingReview,
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentInputRef = useRef<TextInput>(null);

  // Auto-focus the comment input when the form opens
  useEffect(() => {
    const timer = setTimeout(() => {
      commentInputRef.current?.focus();
    }, 300); // Small delay to ensure modal is fully rendered

    return () => clearTimeout(timer);
  }, []);

  const getRatingText = () => {
    const ratingTexts = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent',
    };
    return ratingTexts[rating as keyof typeof ratingTexts] || 'Select Rating';
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating for this guide.');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Comment Required', 'Please write a comment about your experience.');
      return;
    }

    if (comment.length > 1000) {
      Alert.alert('Comment Too Long', 'Please keep your comment under 1000 characters.');
      return;
    }

    try {
      setIsSubmitting(true);

      let response;
      if (existingReview) {
        // Update existing review
        response = await ReviewService.updateReview(
          existingReview._id,
          { rating, comment },
          travelerId
        );
      } else {
        // Create new review
        const reviewData: CreateReviewRequest = {
          guideId,
          rating,
          comment: comment.trim(),
          bookingId,
        };
        response = await ReviewService.createReview(reviewData);
      }

      if (response.success) {
        onReviewSubmitted(response.data);
      } else {
        Alert.alert('Error', response.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {existingReview ? 'Edit Review' : 'Write a Review'}
          </Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.secondary600} />
          </TouchableOpacity>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rating *</Text>
          <View style={styles.starsContainer}>
            <StarRating
              rating={rating}
              size={32}
              interactive={true}
              onRatingChange={setRating}
              color={Colors.warning}
              emptyColor={Colors.secondary400}
            />
          </View>
          <Text style={styles.ratingText}>{getRatingText()}</Text>
        </View>

        {/* Comment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Review *</Text>
          <TouchableOpacity 
            style={styles.commentInputContainer}
            onPress={() => {
              // Focus the input when the container is tapped
              setTimeout(() => {
                commentInputRef.current?.focus();
              }, 100);
            }}
            activeOpacity={1}
          >
            <TextInput
              ref={commentInputRef}
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Share your experience with this guide..."
              multiline
              numberOfLines={6}
              maxLength={1000}
              placeholderTextColor={Colors.secondary400}
              textAlignVertical="top"
              autoFocus={false}
              keyboardType="default"
              returnKeyType="default"
              blurOnSubmit={false}
              editable={true}
              selectTextOnFocus={true}
            />
          </TouchableOpacity>
          <View style={styles.characterCount}>
            <Text style={styles.characterCountText}>
              {comment.length}/1000 characters
            </Text>
          </View>
        </View>

        {/* Guidelines */}
        <View style={styles.guidelines}>
          <Text style={styles.guidelinesTitle}>Review Guidelines</Text>
          <Text style={styles.guidelinesText}>
            • Be honest and constructive in your feedback{'\n'}
            • Focus on your experience with the guide{'\n'}
            • Avoid personal attacks or inappropriate language{'\n'}
            • Your review will be visible to other travelers
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (rating === 0 || !comment.trim() || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={rating === 0 || !comment.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>
              {existingReview ? 'Update Review' : 'Submit Review'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.secondary50,
  },
  section: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
    marginHorizontal: 2,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary600,
    textAlign: 'center',
  },
  commentInputContainer: {
    borderWidth: 1,
    borderColor: Colors.secondary200,
    borderRadius: 12,
    backgroundColor: Colors.white,
    minHeight: 120,
  },
  commentInput: {
    padding: 16,
    fontSize: 16,
    color: Colors.black,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  characterCountText: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  guidelines: {
    backgroundColor: Colors.secondary50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 13,
    color: Colors.secondary600,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary100,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary600,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary600,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.secondary300,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
