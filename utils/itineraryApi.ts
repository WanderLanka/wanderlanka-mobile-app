import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API Gateway URL (all requests go through the gateway)
// Use environment variable if available, otherwise fallback to localhost/emulator addresses
const getApiGatewayUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
  if (envUrl) {
    console.log('🌐 Using API Gateway URL from env:', envUrl);
    return envUrl;
  }
  
  const fallbackUrl = Platform.select({
    ios: 'http://localhost:3000',
    android: 'http://10.0.2.2:3000', // Android emulator localhost
    default: 'http://192.168.1.41:3000' // Physical device - updated with current IP
  });
  
  console.log('🌐 Using fallback API Gateway URL:', fallbackUrl);
  return fallbackUrl;
};

const API_GATEWAY_URL = getApiGatewayUrl();
console.log('🚀 API Gateway configured:', API_GATEWAY_URL);

/**
 * Get authentication token
 */
async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('accessToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any,
  requiresAuth: boolean = true
): Promise<any> {
  try {
    console.log(`🌐 API Request: ${method} ${API_GATEWAY_URL}${endpoint}`);
    if (body) {
      console.log('📦 Request Body:', JSON.stringify(body, null, 2));
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      const token = await getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔐 Auth token added');
      } else {
        console.warn('⚠️ No auth token found');
      }
    }

    const config: RequestInit = {
      method,
      headers,
      // Add timeout to prevent hanging requests
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout (increased for slow queries)

    try {
      const response = await fetch(`${API_GATEWAY_URL}${endpoint}`, {
        ...config,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      console.log(`✅ Response Status: ${response.status}`);
      
      const data = await response.json();
      console.log('📥 Response Data:', JSON.stringify(data, null, 2).substring(0, 500));

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout - please check your network connection and API Gateway URL');
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error(`❌ API Error [${method} ${endpoint}]:`, error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 200),
    });
    throw error;
  }
}

/**
 * Itinerary Service API
 */
export const itineraryApi = {
  /**
   * Search for places (autocomplete)
   */
  searchPlaces: async (query: string, location?: { latitude: number; longitude: number }) => {
    const params = new URLSearchParams({ query });
    if (location) {
      params.append('latitude', location.latitude.toString());
      params.append('longitude', location.longitude.toString());
    }
    return apiRequest(`/api/itinerary/places/search?${params}`, 'GET', undefined, false);
  },

  /**
   * Get autocomplete suggestions
   */
  getAutocompleteSuggestions: async (input: string, location?: { latitude: number; longitude: number }) => {
    const params = new URLSearchParams({ input });
    if (location) {
      params.append('latitude', location.latitude.toString());
      params.append('longitude', location.longitude.toString());
    }
    return apiRequest(`/api/itinerary/places/autocomplete?${params}`, 'GET', undefined, false);
  },

  /**
   * Get place details
   */
  getPlaceDetails: async (placeId: string) => {
    return apiRequest(`/api/itinerary/places/${placeId}`, 'GET', undefined, false);
  },

  /**
   * Create new itinerary (empty day plans, user fills them in manually)
   */
  createItinerary: async (data: {
    tripName: string;
    startDate: string;
    endDate: string;
    startLocation: {
      name: string;
      placeId?: string;
      latitude: number;
      longitude: number;
    };
    endLocation: {
      name: string;
      placeId?: string;
      latitude: number;
      longitude: number;
    };
    destinations?: Array<{
      name: string;
      placeId?: string;
      latitude: number;
      longitude: number;
    }>;
    preferences?: {
      travelStyle?: 'relaxed' | 'moderate' | 'packed';
      interests?: string[];
      budget?: 'budget' | 'moderate' | 'luxury';
      accommodation?: 'hostel' | 'hotel' | 'resort' | 'guesthouse';
      transportation?: 'public' | 'private' | 'rental' | 'mixed';
    };
  }) => {
    return apiRequest('/api/itinerary/create', 'POST', data, true);
  },

  /**
   * Generate new itinerary (with AI-generated day plans and activities)
   */
  generateItinerary: async (data: {
    tripName: string;
    startDate: string;
    endDate: string;
    startLocation: {
      name: string;
      placeId?: string;
      latitude: number;
      longitude: number;
    };
    endLocation: {
      name: string;
      placeId?: string;
      latitude: number;
      longitude: number;
    };
    destinations?: Array<{
      name: string;
      placeId?: string;
      latitude: number;
      longitude: number;
    }>;
    preferences?: {
      travelStyle?: 'relaxed' | 'moderate' | 'packed';
      interests?: string[];
      budget?: 'budget' | 'moderate' | 'luxury';
      accommodation?: 'hostel' | 'hotel' | 'resort' | 'guesthouse';
      transportation?: 'public' | 'private' | 'rental' | 'mixed';
    };
  }) => {
    return apiRequest('/api/itinerary/generate', 'POST', data, true);
  },

  /**
   * Get itinerary by ID
   */
  getItinerary: async (itineraryId: string) => {
    return apiRequest(`/api/itinerary/${itineraryId}`, 'GET', undefined, true);
  },

  /**
   * Get user's itineraries
   */
  getUserItineraries: async (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return apiRequest(`/api/itinerary/user${params}`, 'GET', undefined, true);
  },

  /**
   * Update itinerary
   */
  updateItinerary: async (itineraryId: string, updates: any) => {
    return apiRequest(`/api/itinerary/${itineraryId}`, 'PUT', updates, true);
  },

  /**
   * Delete itinerary
   */
  deleteItinerary: async (itineraryId: string) => {
    return apiRequest(`/api/itinerary/${itineraryId}`, 'DELETE', undefined, true);
  },
};

/**
 * Route Service API
 */
export const routeApi = {
  /**
   * Calculate routes for an itinerary (all 3 types)
   */
  calculateRoutes: async (itineraryId: string) => {
    return apiRequest(`/api/routes/calculate/${itineraryId}`, 'POST', {}, true);
  },

  /**
   * Get all routes for an itinerary
   */
  getItineraryRoutes: async (itineraryId: string) => {
    return apiRequest(`/api/routes/itinerary/${itineraryId}`, 'GET', undefined, true);
  },

  /**
   * Get specific route by ID
   */
  getRoute: async (routeId: string) => {
    return apiRequest(`/api/routes/${routeId}`, 'GET', undefined, true);
  },

  /**
   * Compare all route types
   */
  compareRoutes: async (itineraryId: string) => {
    return apiRequest(`/api/routes/itinerary/${itineraryId}/compare`, 'GET', undefined, true);
  },
};

/**
 * My Trips API
 */
export const myTripsApi = {
  /**
   * Get all trips categorized (saved, unfinished, upcoming)
   */
  getMyTrips: async () => {
    return apiRequest('/api/my-trips/summary', 'GET', undefined, true);
  },

  /**
   * Get trips by specific category
   * @param category - 'saved', 'unfinished', or 'upcoming'
   */
  getTripsByCategory: async (category: 'saved' | 'unfinished' | 'upcoming') => {
    return apiRequest(`/api/my-trips/${category}`, 'GET', undefined, true);
  },

  /**
   * Get detailed information for a specific trip
   * @param tripId - The ID of the trip
   */
  getTripDetails: async (tripId: string) => {
    return apiRequest(`/api/my-trips/trip/${tripId}`, 'GET', undefined, true);
  },

  /**
   * Toggle checklist item completion status
   * @param tripId - The ID of the trip
   * @param itemId - The ID of the checklist item
   * @param completed - Optional: specify completed state (true/false), otherwise toggles
   */
  toggleChecklistItem: async (tripId: string, itemId: string, completed?: boolean) => {
    const body = completed !== undefined ? { completed } : {};
    return apiRequest(`/api/my-trips/trip/${tripId}/checklist/${itemId}`, 'PATCH', body, true);
  },
};

export default {
  itineraryApi,
  routeApi,
  myTripsApi,
};
