// Temporary development configuration
// This file bypasses authentication for testing purposes

export const DEV_CONFIG = {
  SKIP_AUTH: true, // Set to false when backend is running
  MOCK_USER: {
    id: 'dev-user-123',
    username: 'developer',
    email: 'dev@wanderlanka.com',
    role: 'traveller' as const,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

// Mock authentication functions for development
export const mockAuthService = {
  async isAuthenticated(): Promise<boolean> {
    return DEV_CONFIG.SKIP_AUTH;
  },

  async getCurrentUser() {
    return DEV_CONFIG.SKIP_AUTH ? DEV_CONFIG.MOCK_USER : null;
  },

  async login(): Promise<any> {
    if (DEV_CONFIG.SKIP_AUTH) {
      return {
        success: true,
        data: {
          user: DEV_CONFIG.MOCK_USER,
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh-token'
        }
      };
    }
    throw new Error('Backend server required');
  }
};
