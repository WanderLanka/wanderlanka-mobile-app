import * as SplashScreen from 'expo-splash-screen';

import { View } from 'react-native';
import useFontLoader from './hooks/useFontLoader';
import { initializeServerConnection } from './utils/serverDetection';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const fontsLoaded = useFontLoader();

  // Initialize server connection when app starts
  if (fontsLoaded) {
    initializeServerConnection();
  }

  if (!fontsLoaded) {
    return <View />; // Loading state
  }

  // Hide splash screen once fonts are loaded
  SplashScreen.hideAsync();
  
  return null; // Expo Router will handle the rest
}