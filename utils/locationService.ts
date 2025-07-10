/**
 * Google Places API Integration Helper
 * 
 * This file contains the helper functions for integrating with Google Places API
 * for location autocomplete in the WanderLanka create post screen.
 */

interface LocationSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  types: string[];
}

interface PlacesApiResponse {
  predictions: Array<{
    place_id: string;
    description: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
    types: string[];
  }>;
  status: string;
}

/**
 * Configuration for Google Places API
 */
const PLACES_API_CONFIG = {
  // Add your Google Places API key here
  API_KEY: process.env.GOOGLE_PLACES_API_KEY || 'YOUR_GOOGLE_PLACES_API_KEY',
  BASE_URL: 'https://maps.googleapis.com/maps/api/place',
  // Focus on Sri Lanka for travel app
  COUNTRY_RESTRICTION: 'country:lk',
  // Types of places relevant for travel
  PLACE_TYPES: 'establishment|geocode|tourist_attraction',
};

/**
 * Search for location suggestions using Google Places API
 */
export const searchLocationSuggestions = async (query: string): Promise<LocationSuggestion[]> => {
  if (query.length < 3) {
    return [];
  }

  try {
    const url = `${PLACES_API_CONFIG.BASE_URL}/autocomplete/json?` +
      `input=${encodeURIComponent(query)}` +
      `&types=${PLACES_API_CONFIG.PLACE_TYPES}` +
      `&components=${PLACES_API_CONFIG.COUNTRY_RESTRICTION}` +
      `&key=${PLACES_API_CONFIG.API_KEY}`;

    const response = await fetch(url);
    const data: PlacesApiResponse = await response.json();

    if (data.status === 'OK' && data.predictions) {
      return data.predictions.map(prediction => ({
        place_id: prediction.place_id,
        description: prediction.description,
        main_text: prediction.structured_formatting.main_text,
        secondary_text: prediction.structured_formatting.secondary_text,
        types: prediction.types,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    return [];
  }
};

/**
 * Get mock location suggestions for development/testing
 */
export const getMockLocationSuggestions = (query: string): LocationSuggestion[] => {
  const mockSuggestions: LocationSuggestion[] = [
    {
      place_id: '1',
      description: 'Galle Fort, Galle, Sri Lanka',
      main_text: 'Galle Fort',
      secondary_text: 'Galle, Sri Lanka',
      types: ['tourist_attraction', 'establishment']
    },
    {
      place_id: '2',
      description: 'Sigiriya Rock Fortress, Dambulla, Sri Lanka',
      main_text: 'Sigiriya Rock Fortress',
      secondary_text: 'Dambulla, Sri Lanka',
      types: ['tourist_attraction', 'establishment']
    },
    {
      place_id: '3',
      description: 'Temple of the Sacred Tooth Relic, Kandy, Sri Lanka',
      main_text: 'Temple of the Sacred Tooth Relic',
      secondary_text: 'Kandy, Sri Lanka',
      types: ['place_of_worship', 'tourist_attraction']
    },
    {
      place_id: '4',
      description: 'Ella Rock, Ella, Sri Lanka',
      main_text: 'Ella Rock',
      secondary_text: 'Ella, Sri Lanka',
      types: ['natural_feature', 'tourist_attraction']
    },
    {
      place_id: '5',
      description: 'Yala National Park, Tissamaharama, Sri Lanka',
      main_text: 'Yala National Park',
      secondary_text: 'Tissamaharama, Sri Lanka',
      types: ['park', 'tourist_attraction']
    },
    {
      place_id: '6',
      description: 'Pinnawala Elephant Orphanage, Kegalle, Sri Lanka',
      main_text: 'Pinnawala Elephant Orphanage',
      secondary_text: 'Kegalle, Sri Lanka',
      types: ['tourist_attraction', 'establishment']
    },
    {
      place_id: '7',
      description: 'Nuwara Eliya, Central Province, Sri Lanka',
      main_text: 'Nuwara Eliya',
      secondary_text: 'Central Province, Sri Lanka',
      types: ['locality', 'political']
    },
    {
      place_id: '8',
      description: 'Mirissa Beach, Mirissa, Sri Lanka',
      main_text: 'Mirissa Beach',
      secondary_text: 'Mirissa, Sri Lanka',
      types: ['natural_feature', 'establishment']
    },
    {
      place_id: '9',
      description: 'Adam\'s Peak, Ratnapura, Sri Lanka',
      main_text: 'Adam\'s Peak',
      secondary_text: 'Ratnapura, Sri Lanka',
      types: ['natural_feature', 'establishment']
    },
    {
      place_id: '10',
      description: 'Colombo National Museum, Colombo, Sri Lanka',
      main_text: 'Colombo National Museum',
      secondary_text: 'Colombo, Sri Lanka',
      types: ['museum', 'tourist_attraction']
    },
    {
      place_id: '11',
      description: 'Bentota Beach, Bentota, Sri Lanka',
      main_text: 'Bentota Beach',
      secondary_text: 'Bentota, Sri Lanka',
      types: ['natural_feature', 'establishment']
    },
    {
      place_id: '12',
      description: 'Polonnaruwa Ancient City, Polonnaruwa, Sri Lanka',
      main_text: 'Polonnaruwa Ancient City',
      secondary_text: 'Polonnaruwa, Sri Lanka',
      types: ['tourist_attraction', 'establishment']
    },
  ];

  // Filter suggestions based on query
  return mockSuggestions.filter(suggestion =>
    suggestion.description.toLowerCase().includes(query.toLowerCase()) ||
    suggestion.main_text.toLowerCase().includes(query.toLowerCase())
  );
};

/**
 * Get icon for location type
 */
export const getLocationIcon = (types: string[]): string => {
  if (types.includes('tourist_attraction')) return 'camera-outline';
  if (types.includes('establishment')) return 'business-outline';
  if (types.includes('natural_feature')) return 'leaf-outline';
  if (types.includes('place_of_worship')) return 'library-outline';
  if (types.includes('park')) return 'tree-outline';
  if (types.includes('museum')) return 'library-outline';
  if (types.includes('locality')) return 'location-outline';
  return 'location-outline';
};

/**
 * Usage Instructions for create-post.tsx:
 * 
 * 1. Get Google Places API Key:
 *    - Go to Google Cloud Console (https://console.cloud.google.com/)
 *    - Enable Places API (New)
 *    - Create credentials (API Key)
 *    - Restrict the key to Places API for security
 * 
 * 2. Add API key to environment:
 *    - Add GOOGLE_PLACES_API_KEY to your .env file
 *    - Update app.json with the key if needed for Expo
 * 
 * 3. Replace mock data in create-post.tsx:
 *    - Change import from getMockLocationSuggestions to searchLocationSuggestions
 *    - Update the function call in searchLocationSuggestions function:
 *      
 *      // Replace this line:
 *      const suggestions = getMockLocationSuggestions(query);
 *      
 *      // With this:
 *      const suggestions = await searchLocationSuggestions(query);
 * 
 * 4. Test the integration:
 *    - Try typing location names like "Galle", "Sigiriya", "Ella"
 *    - Verify suggestions appear as you type
 *    - Check selection works properly
 *    - Test both current location and search functionality
 * 
 * 5. For enhanced user experience:
 *    - Consider adding location caching for frequently searched places
 *    - Add user location history/favorites
 *    - Implement map preview for selected locations
 */
