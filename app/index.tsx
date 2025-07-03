import { useEffect } from 'react';
import { router } from 'expo-router';
import { ThemedText, ThemedView } from "../components";
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('./dashboard');
      } else {
        router.replace('./auth/login');
      }
    }
  }, [isAuthenticated, isLoading]);

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
