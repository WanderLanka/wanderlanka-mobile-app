import { ApiService } from './api';

export interface Review {
  _id: string;
  guideId: string;
  travelerId: string;
  travelerName: string;
  travelerEmail: string;
  rating: number;
  comment: string;
  bookingId?: string;
  isVerified: boolean;
  helpfulCount: number;
  images: Array<{
    url: string;
    thumbnailUrl?: string;
    caption?: string;
  }>;
  response?: {
    comment: string;
    respondedAt: string;
    respondedBy: string;
  };
  status: 'active' | 'hidden' | 'flagged';
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface ReviewListResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: ReviewStats;
}

export interface CreateReviewRequest {
  guideId: string;
  rating: number;
  comment: string;
  bookingId?: string;
  images?: Array<{
    url: string;
    thumbnailUrl?: string;
    caption?: string;
  }>;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
  images?: Array<{
    url: string;
    thumbnailUrl?: string;
    caption?: string;
  }>;
}

export class ReviewService {
  /**
   * Create a new review for a guide
   */
  static async createReview(reviewData: CreateReviewRequest): Promise<{ success: boolean; data?: Review; message?: string; error?: string }> {
    try {
      const response = await ApiService.post('/api/guide/reviews/create', reviewData);
      return {
        success: response.success || true,
        data: response.data,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      console.error('Error creating review:', error);
      return {
        success: false,
        error: error.message || 'Failed to create review'
      };
    }
  }

  /**
   * Get reviews for a guide
   */
  static async getGuideReviews(
    guideId: string, 
    options: {
      page?: number;
      limit?: number;
      sort?: 'recent' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful';
    } = {}
  ): Promise<{ success: boolean; data?: ReviewListResponse; error?: string }> {
    try {
      const params = new URLSearchParams({
        guideId,
        ...(options.page && { page: options.page.toString() }),
        ...(options.limit && { limit: options.limit.toString() }),
        ...(options.sort && { sort: options.sort })
      });

      const url = `/api/guide/reviews/list?${params}`;
      console.log('🌐 ReviewService.getGuideReviews: Making request to:', url);

      const response = await ApiService.get(url);
      console.log('📥 ReviewService.getGuideReviews: Raw response:', response);

      return {
        success: response.success || true,
        data: response.data,
        error: response.error
      };
    } catch (error: any) {
      console.error('❌ ReviewService.getGuideReviews: Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch reviews'
      };
    }
  }

  /**
   * Get reviews by a specific traveler
   */
  static async getTravelerReviews(
    travelerId: string,
    options: {
      page?: number;
      limit?: number;
      sort?: 'recent' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful';
    } = {}
  ): Promise<{ success: boolean; data?: ReviewListResponse; error?: string }> {
    try {
      const params = new URLSearchParams({
        travelerId,
        ...(options.page && { page: options.page.toString() }),
        ...(options.limit && { limit: options.limit.toString() }),
        ...(options.sort && { sort: options.sort })
      });

      const response = await ApiService.get(`/api/guide/reviews/list?${params}`);
      return {
        success: response.success || true,
        data: response.data,
        error: response.error
      };
    } catch (error: any) {
      console.error('Error fetching traveler reviews:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch reviews'
      };
    }
  }

  /**
   * Update a review
   */
  static async updateReview(
    reviewId: string,
    reviewData: UpdateReviewRequest,
    travelerId: string
  ): Promise<{ success: boolean; data?: Review; message?: string; error?: string }> {
    try {
      const response = await ApiService.put(`/api/guide/reviews/update/${reviewId}`, {
        ...reviewData,
        travelerId
      });
      return {
        success: response.success || true,
        data: response.data,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      console.error('Error updating review:', error);
      return {
        success: false,
        error: error.message || 'Failed to update review'
      };
    }
  }

  /**
   * Delete a review
   */
  static async deleteReview(
    reviewId: string,
    travelerId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await ApiService.delete(`/api/guide/reviews/delete/${reviewId}`);
      return {
        success: response.success || true,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      console.error('Error deleting review:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete review'
      };
    }
  }

  /**
   * Mark a review as helpful or unhelpful
   */
  static async markHelpful(
    reviewId: string,
    action: 'add' | 'remove' = 'add'
  ): Promise<{ success: boolean; data?: Review; message?: string; error?: string }> {
    try {
      const response = await ApiService.post(`/api/guide/reviews/helpful/${reviewId}`, {
        action
      });
      return {
        success: response.success || true,
        data: response.data,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      console.error('Error marking review as helpful:', error);
      return {
        success: false,
        error: error.message || 'Failed to mark review as helpful'
      };
    }
  }

  /**
   * Check if a traveler has already reviewed a guide
   */
  static async hasReviewedGuide(
    guideId: string,
    travelerId: string
  ): Promise<{ success: boolean; hasReviewed: boolean; review?: Review; error?: string }> {
    try {
      const response = await this.getTravelerReviews(travelerId, { limit: 100 });
      
      if (!response.success || !response.data) {
        return {
          success: false,
          hasReviewed: false,
          error: response.error
        };
      }

      const existingReview = response.data.reviews.find(review => review.guideId === guideId);
      
      return {
        success: true,
        hasReviewed: !!existingReview,
        review: existingReview
      };
    } catch (error: any) {
      console.error('Error checking if guide was reviewed:', error);
      return {
        success: false,
        hasReviewed: false,
        error: error.message || 'Failed to check review status'
      };
    }
  }
}
