import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.41:3000';
const ACCESS_TOKEN_KEY = 'accessToken';

interface ReviewFormData {
  rating: number;
  comment: string;
  visitDate?: string;
  images?: any[]; // Files to upload
}

interface Review {
  _id: string;
  mapPointId: string;
  author: {
    userId: string;
    username: string;
    avatar?: string;
    role: string;
  };
  rating: number;
  comment: string;
  images: Array<{
    url: string;
    thumbnailUrl?: string;
  }>;
  visitDate?: string;
  helpfulCount: number;
  isHelpful: boolean;
  isAuthor: boolean;
  edited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export const reviewApi = {
  /**
   * Create a new review for a map point
   */
  createReview: async (mapPointId: string, data: ReviewFormData) => {
    try {
      console.log('📤 Creating review for map point:', mapPointId);
      
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('rating', data.rating.toString());
      formData.append('comment', data.comment);
      
      if (data.visitDate) {
        formData.append('visitDate', data.visitDate);
      }

      // Append images if provided
      if (data.images && data.images.length > 0) {
        data.images.forEach((image, index) => {
          formData.append('images', {
            uri: image.uri,
            type: image.type || 'image/jpeg',
            name: image.name || `review_image_${index}.jpg`,
          } as any);
        });
      }

      const response = await fetch(
        `${API_BASE_URL}/api/community/map-points/${mapPointId}/reviews`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || 'Failed to create review');
      }

      console.log('✅ Review created successfully');
      return result;
    } catch (error: any) {
      console.error('❌ Error creating review:', error);
      throw error;
    }
  },

  /**
   * Get reviews for a map point
   */
  getReviews: async (mapPointId: string, params?: {
    page?: number;
    limit?: number;
    sort?: 'recent' | 'helpful' | 'rating';
    minRating?: number;
  }) => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      
      // Build query string
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `${API_BASE_URL}/api/community/map-points/${mapPointId}/reviews?${queryParams.toString()}`;
      
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to fetch reviews');
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error fetching reviews:', error);
      throw error;
    }
  },

  /**
   * Update an existing review
   */
  updateReview: async (reviewId: string, data: Partial<ReviewFormData>) => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/community/reviews/${reviewId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || 'Failed to update review');
      }

      console.log('✅ Review updated successfully');
      return result;
    } catch (error: any) {
      console.error('❌ Error updating review:', error);
      throw error;
    }
  },

  /**
   * Delete a review
   */
  deleteReview: async (reviewId: string) => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/community/reviews/${reviewId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || 'Failed to delete review');
      }

      console.log('✅ Review deleted successfully');
      return result;
    } catch (error: any) {
      console.error('❌ Error deleting review:', error);
      throw error;
    }
  },

  /**
   * Toggle helpful status for a review
   */
  toggleHelpful: async (reviewId: string) => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/community/reviews/${reviewId}/helpful`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || 'Failed to toggle helpful status');
      }

      return result;
    } catch (error: any) {
      console.error('❌ Error toggling helpful:', error);
      throw error;
    }
  },
};

export type { Review, ReviewStats, ReviewFormData };
