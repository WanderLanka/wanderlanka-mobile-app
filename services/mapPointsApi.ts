import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.42:3000';

// Storage key for access token (matches the one used in storage.ts)
const ACCESS_TOKEN_KEY = 'accessToken';

interface MapPointFormData {
  type: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
}

export const mapPointsApi = {
  /**
   * Create a new map point
   */
  createMapPoint: async (data: MapPointFormData) => {
    try {
      console.log('📤 Creating map point via API Gateway...');
      console.log('🌐 Using API Gateway URL:', `${API_BASE_URL}/api/community/map-points`);
      console.log('📋 Map point data:', data);

      // Get auth token using the correct key
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        console.error('❌ No token found in AsyncStorage with key:', ACCESS_TOKEN_KEY);
        throw new Error('No authentication token found. Please log in.');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('latitude', data.latitude.toString());
      formData.append('longitude', data.longitude.toString());
      formData.append('category', data.type); // Map 'type' to 'category'
      
      if (data.address) {
        formData.append('address', data.address);
      }

      console.log('🔐 Token found, making authenticated request...');

      const response = await fetch(
        `${API_BASE_URL}/api/community/map-points`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        console.error('📥 Server error response:', responseData);
        console.error('📊 Status code:', response.status);
        throw new Error(responseData?.message || 'Failed to create map point');
      }

      console.log('✅ Map point created successfully:', responseData);
      return responseData;
    } catch (error: any) {
      console.error('❌ Error creating map point:', error);
      
      if (error.message) {
        throw error;
      } else {
        throw new Error('Network error. Please check your connection.');
      }
    }
  },

  /**
   * Get all map points with optional filters
   */
  getMapPoints: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    latitude?: number;
    longitude?: number;
    maxDistance?: number;
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

      const url = `${API_BASE_URL}/api/community/map-points?${queryParams.toString()}`;
      
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
        throw new Error(data?.message || 'Failed to fetch map points');
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error fetching map points:', error);
      throw error;
    }
  },

  /**
   * Get a single map point by ID
   */
  getMapPointById: async (id: string) => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/community/map-points/${id}`,
        {
          method: 'GET',
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to fetch map point');
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error fetching map point:', error);
      throw error;
    }
  },

  /**
   * Like/unlike a map point
   */
  toggleLike: async (id: string) => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/community/map-points/${id}/like`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to toggle like');
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error toggling like:', error);
      throw error;
    }
  },

  /**
   * Save/unsave a map point
   */
  toggleSave: async (id: string) => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/community/map-points/${id}/save`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to toggle save');
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error toggling save:', error);
      throw error;
    }
  },

  /**
   * Get current user's map points
   */
  getMyMapPoints: async (params?: {
    page?: number;
    limit?: number;
    status?: 'published' | 'draft' | 'archived';
  }) => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        throw new Error('Authentication required');
      }

      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `${API_BASE_URL}/api/community/map-points/my-points?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to fetch your map points');
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error fetching my map points:', error);
      throw error;
    }
  },

  /**
   * Update a map point
   */
  updateMapPoint: async (id: string, data: Partial<MapPointFormData>) => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/community/map-points/${id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.message || 'Failed to update map point');
      }

      return responseData;
    } catch (error: any) {
      console.error('❌ Error updating map point:', error);
      throw error;
    }
  },

  /**
   * Delete a map point
   */
  deleteMapPoint: async (id: string) => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/community/map-points/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to delete map point');
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error deleting map point:', error);
      throw error;
    }
  },
};
