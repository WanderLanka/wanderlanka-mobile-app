import { ThemedText, ThemedView } from "../components";

import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function Index() {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      console.log('Index: Auth check complete');
      console.log('Index: isAuthenticated:', isAuthenticated);
      console.log('Index: user:', user);
      
      if (isAuthenticated && user) {
        // Role-based navigation
        console.log('Index: User authenticated with role:', user.role);
        console.log('Index: User data:', JSON.stringify(user, null, 2));
        
        if (user.role === 'guide') {
          console.log('Index: Redirecting guide to tourGuide interface');
          console.log('Index: About to navigate to /tourGuide/home');
          router.replace('/tourGuide/home');
        } else if (user.role === 'traveller' || user.role === 'traveler') {
          console.log('Index: Redirecting traveller to traveler interface');
          console.log('Index: About to navigate to /(travelerTabs)/home');
          router.replace('/(travelerTabs)/home');
        } else {
          console.log('Index: Unknown role, redirecting to traveler interface as fallback:', user.role);
          console.log('Index: About to navigate to /(travelerTabs)/home as fallback');
          router.replace('/(travelerTabs)/home');
        }
      } else {
        console.log('Index: User not authenticated, redirecting to login');
        router.replace('/auth/login');
      }
    } else {
      console.log('Index: Still loading...');
    }
  }, [isAuthenticated, isLoading, user]);

  // Show loading screen while checking auth
  return (
    <ThemedView className="flex-1 items-center justify-center" backgroundColor="secondary50">
      <ThemedText 
        variant="title" 
        color="primary600" 
        className="text-center mb-4"
      >
        WanderLanka
      </ThemedText>
      <ThemedText 
        variant="default" 
        color="secondary600" 
        className="text-center"
      >
        Loading...
      </ThemedText>
    </ThemedView>
  );
}
