import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';

import { AuthService } from '../services/auth';

// Frontend role type for signup form
type FrontendRole = 'tourist' | 'guide';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (username: string, email: string, password: string, role: FrontendRole) => Promise<void>;
  login: (identifier: string, password: string) => Promise<{ success: boolean; status?: string; message?: string; }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  completeGuideRegistration: (data: GuideRegistrationData) => Promise<void>;
}

interface GuideRegistrationData {
  username: string;
  email: string;
  password: string;
  role: 'guide';
  guideDetails: {
    firstName: string;
    lastName: string;
    nicNumber: string;
    dateOfBirth: string;
    proofDocument: {
      uri: string;
      name: string;
      type: string;
    };
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const isAuth = await AuthService.isAuthenticated();
      
      if (isAuth) {
        const currentUser = await AuthService.getCurrentUser();
        
        // Check if user has pending, suspended, or rejected status
        if (currentUser && (currentUser.status === 'pending' || currentUser.status === 'suspended' || currentUser.status === 'rejected')) {
          // Clear auth for users with non-active status
          setIsAuthenticated(false);
          setUser(null);
          // Clear stored tokens
          await AuthService.logout();
        } else if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (username: string, email: string, password: string, role: FrontendRole) => {
    try {
      setIsLoading(true);
      const response = await AuthService.signUp({
        username,
        email,
        password,
        role, // This is 'tourist' or 'guide', backend will map 'tourist' to 'traveller'
      });

      if (response.success && response.data) {
        // Check if user has tokens (active users) or not (pending guides)
        if (response.data.accessToken && response.data.refreshToken) {
          // User is active and can be authenticated
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          // User is pending (guide waiting for approval)
          setUser(null);
          setIsAuthenticated(false);
          // Don't throw error for guides - this is expected behavior
          if (role === 'guide') {
            // Return success but indicate pending status
            return;
          }
        }
      } else {
        throw new Error(response.message || 'Sign up failed');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (identifier: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await AuthService.login({
        identifier,
        password,
      });

      console.log('📍 AuthContext login response:', JSON.stringify(response, null, 2));

      // Debug the conditions
      const hasSuccess = !!response.success;
      const hasDataUser = !!(response.data && response.data.user);
      const hasRootUser = !!((response as any).user && (response as any).accessToken);
      console.log('🔍 Condition check:', { hasSuccess, hasDataUser, hasRootUser });

      // Check for successful login - either explicit success flag or presence of user data with tokens
      if (hasSuccess || hasDataUser || hasRootUser) {
        // Handle successful login - check both possible response formats
        const userData = response.data?.user || (response as any).user;
        
        if (userData) {
          // Check if user has pending status
          if (userData.status === 'pending') {
            // Don't set as authenticated for pending users
            setUser(null);
            setIsAuthenticated(false);
            // Return status info instead of throwing error
            return { 
              success: false, 
              status: 'pending',
              message: 'Account pending approval. Your guide account is still under review. Please wait for admin approval.'
            };
          }
          
          // Check if user has suspended or rejected status
          if (userData.status === 'suspended') {
            setUser(null);
            setIsAuthenticated(false);
            throw new Error('Account suspended. Your account has been suspended. Please contact support.');
          }
          
          if (userData.status === 'rejected') {
            setUser(null);
            setIsAuthenticated(false);
            throw new Error('Account rejected. Your guide application has been rejected. Please contact support for more information.');
          }
          
          // User is active, proceed with login
          setUser(userData);
          setIsAuthenticated(true);
          console.log('✅ Login successful, user authenticated:', userData.username);
          return { success: true };
        } else {
          // Success but no user data - should not happen, but handle gracefully
          console.warn('Login successful but no user data received');
          return { success: true };
        }
      } else {
        // Handle different types of login failures
        const errorText = (response as any).error as string | undefined;
        const messageText = (response as any).message as string | undefined;
        // Prefer server-provided error first, then message
        const errorMessage = (errorText || messageText || 'Login failed');
        const combinedText = `${errorText || ''} ${messageText || ''}`.toLowerCase();

        console.log('🔍 AuthContext handling login failure:', { 
          success: (response as any).success, 
          errorMessage, 
          fullResponse: response 
        });
        
        // Check for account status issues (prefer checking combined server strings)
        if (combinedText.includes('pending approval') || 
            combinedText.includes('account pending') ||
            combinedText.includes('under review')) {
          setUser(null);
          setIsAuthenticated(false);
          // Return status info instead of throwing error
          return { 
            success: false, 
            status: 'pending',
            message: 'Account pending approval. Your guide account is still under review. Please wait for admin approval.' 
          };
        }
        
        if (combinedText.includes('account suspended') || 
            combinedText.includes('suspended')) {
          setUser(null);
          setIsAuthenticated(false);
          throw new Error('Account suspended. Your account has been suspended. Please contact support.');
        }
        
        if (combinedText.includes('account rejected') || 
            combinedText.includes('rejected')) {
          setUser(null);
          setIsAuthenticated(false);
          throw new Error('Account rejected. Your guide application has been rejected. Please contact support for more information.');
        }
        
        // Check if it's an invalid credentials error
        if (combinedText.includes('invalid credentials') || 
            combinedText.includes('invalid username') ||
            combinedText.includes('invalid password') ||
            combinedText.includes('user not found')) {
          throw new Error('Invalid username/email or password. Please check your credentials and try again.');
        }
        
        // Check if this is actually a success message being treated as error (should not happen)
    if (combinedText.includes('login successful') || 
      combinedText.includes('success')) {
          console.warn('🚨 Success message treated as error - checking for user data in response');
          
          // Check if we have user data despite the error path
          const userData = (response as any).user;
          if (userData) {
            console.log('✅ Found user data in error path, proceeding with login');
            setUser(userData);
            setIsAuthenticated(true);
            return { success: true };
          }
          
          return { success: true };
        }
        
        // For other errors, use the more specific server-provided message if available
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // If it's already our custom error, re-throw it
      if (error instanceof Error) {
        throw error;
      }
      
      // For unexpected errors, provide a generic message
      throw new Error('Login failed. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await AuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  // Network refresh feature removed; relying on static BASE_URL

  const completeGuideRegistration = async (data: GuideRegistrationData) => {
    try {
      setIsLoading(true);
      await AuthService.completeGuideRegistration(data);
    } catch (error) {
      console.error('Guide registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signUp,
    login,
    logout,
    refreshAuth,
    completeGuideRegistration,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
