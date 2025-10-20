import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StarRating } from './StarRating';
import { reviewApi } from '../services/reviewApi';

const Colors = {
  white: '#FFFFFF',
  black: '#000000',
  primary600: '#2563EB',
  secondary300: '#D1D5DB',
  secondary600: '#4B5563',
  error: '#EF4444',
};

interface AddReviewModalProps {
  visible: boolean;
  mapPointId: string;
  mapPointName: string;
  onClose: () => void;
  onReviewAdded?: () => void;
}

export const AddReviewModal: React.FC<AddReviewModalProps> = ({
  visible,
  mapPointId,
  mapPointName,
  onClose,
  onReviewAdded,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to add images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: Platform.OS === 'ios',
      quality: 0.8,
      selectionLimit: 5 - images.length,
    });

    if (!result.canceled && result.assets) {
      setImages([...images, ...result.assets.slice(0, 5 - images.length)]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Comment Too Short', 'Please write at least 10 characters');
      return;
    }

    try {
      setLoading(true);

      await reviewApi.createReview(mapPointId, {
        rating,
        comment: comment.trim(),
        images: images.map(img => ({
          uri: img.uri,
          type: 'image/jpeg',
          name: `review_${Date.now()}.jpg`,
        })),
      });

      Alert.alert('Success', 'Review submitted successfully!');
      
      // Reset form
      setRating(0);
      setComment('');
      setImages([]);
      
      if (onReviewAdded) onReviewAdded();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Write a Review</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={24} color={Colors.secondary600} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>{mapPointName}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Rating */}
            <View style={styles.section}>
              <Text style={styles.label}>Your Rating *</Text>
              <StarRating
                rating={rating}
                maxStars={5}
                size={32}
                interactive
                onRatingChange={setRating}
              />
            </View>

            {/* Comment */}
            <View style={styles.section}>
              <Text style={styles.label}>Your Review *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Share your experience... (minimum 10 characters)"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={6}
                maxLength={1000}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{comment.length}/1000</Text>
            </View>

            {/* Images */}
            <View style={styles.section}>
              <Text style={styles.label}>Add Photos (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {images.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri: image.uri }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {images.length < 5 && (
                  <TouchableOpacity style={styles.addImageButton} onPress={handlePickImage}>
                    <Ionicons name="camera" size={32} color={Colors.primary600} />
                    <Text style={styles.addImageText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Review</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.secondary600,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.secondary300,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: Colors.secondary600,
    textAlign: 'right',
    marginTop: 4,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary600,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 12,
    color: Colors.primary600,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: Colors.primary600,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
