import * as SplashScreen from 'expo-splash-screen';

import { View } from 'react-native';
import useFontLoader from './hooks/useFontLoader';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const fontsLoaded = useFontLoader();

  // Server detection removed; rely on static BASE_URL

  if (!fontsLoaded) {
    return <View />; // Loading state
  }

  // Hide splash screen once fonts are loaded
  SplashScreen.hideAsync();
  
  return null; // Expo Router will handle the rest
}