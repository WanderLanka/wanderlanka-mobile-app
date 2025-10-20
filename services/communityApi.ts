import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './config';

export interface BlogPost {
  _id: string;
  author: {
    userId: string;
    username: string;
    role: string;
    avatar?: string;
  };
  title: string;
  content: string;
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  tags: string[];
  images: Array<{
    url: string;
    thumbnailUrl: string;
    mediumUrl: string;
    largeUrl: string;
  }>;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  status: string;
  isLikedByUser?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostsResponse {
  success: boolean;
  data: {
    posts: BlogPost[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalPosts: number;
      hasMore: boolean;
    };
    algorithm?: 'personalized' | 'generic';
  };
}

/**
 * Fetch all posts (generic)
 */
export const fetchPosts = async (options: {
  page?: number;
  limit?: number;
  sort?: 'recent' | 'popular' | 'trending';
  tag?: string;
} = {}): Promise<PostsResponse> => {
  const { page = 1, limit = 20, sort = 'recent', tag } = options;
  
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const baseURL = API_CONFIG.BASE_URL;
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort,
      ...(tag && { tag })
    });
    
    const apiURL = `${baseURL}/api/community/posts?${params.toString()}`;
    
    console.log('📥 Fetching posts from:', apiURL);

    const response = await fetch(apiURL, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch posts');
    }

    console.log(`✅ Fetched ${data.data.posts.length} posts`);
    return data;
    
  } catch (error: any) {
    console.error('❌ Error fetching posts:', error);
    throw error;
  }
};

/**
 * Fetch recommended posts based on user's itineraries
 * This will use personalized recommendations if user has itineraries,
 * otherwise falls back to generic recommendations
 */
export const fetchRecommendedPosts = async (options: {
  page?: number;
  limit?: number;
} = {}): Promise<PostsResponse> => {
  const { page = 1, limit = 20 } = options;
  
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      console.warn('⚠️ No auth token, falling back to generic posts');
      return await fetchPosts({ page, limit, sort: 'popular' });
    }
    
    const baseURL = API_CONFIG.BASE_URL;
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    const apiURL = `${baseURL}/api/community/posts/recommended/for-you?${params.toString()}`;
    
    console.log('🎯 Fetching recommended posts from:', apiURL);

    const response = await fetch(apiURL, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn('⚠️ Recommendations endpoint failed, falling back to generic posts');
      return await fetchPosts({ page, limit, sort: 'popular' });
    }

    const algorithm = data.data.algorithm || 'unknown';
    console.log(`✅ Fetched ${data.data.posts.length} ${algorithm} recommended posts`);
    
    return data;
    
  } catch (error: any) {
    console.error('❌ Error fetching recommended posts:', error);
    console.warn('⚠️ Falling back to generic posts');
    return await fetchPosts({ page, limit, sort: 'popular' });
  }
};

/**
 * Like/Unlike a post
 */
export const togglePostLike = async (postId: string): Promise<{ success: boolean; liked: boolean; likesCount: number }> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const baseURL = API_CONFIG.BASE_URL;
    const apiURL = `${baseURL}/api/community/posts/${postId}/like`;
    
    console.log('❤️ Toggling like for post:', postId);

    const response = await fetch(apiURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to toggle like');
    }

    console.log(`✅ Post ${data.liked ? 'liked' : 'unliked'}`);
    return {
      success: true,
      liked: data.liked,
      likesCount: data.likesCount
    };
    
  } catch (error: any) {
    console.error('❌ Error toggling like:', error);
    throw error;
  }
};

/**
 * Hide/Unhide a post
 */
export const togglePostHide = async (postId: string): Promise<{ success: boolean; hidden: boolean }> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const baseURL = API_CONFIG.BASE_URL;
    const apiURL = `${baseURL}/api/community/posts/${postId}/hide`;
    
    console.log('👁️ Toggling hide for post:', postId);

    const response = await fetch(apiURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to toggle hide');
    }

    console.log(`✅ Post ${data.hidden ? 'hidden' : 'unhidden'}`);
    return {
      success: true,
      hidden: data.hidden
    };
    
  } catch (error: any) {
    console.error('❌ Error toggling hide:', error);
    throw error;
  }
};

export const communityApi = {
  fetchPosts,
  fetchRecommendedPosts,
  togglePostLike,
  togglePostHide
};
