import './global.css';

import * as SplashScreen from 'expo-splash-screen';

import { useEffect, useState } from 'react';

import { AuthProvider } from '../context/AuthContext';
import { BookingProvider } from '../context/BookingContext';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from "expo-router";
import { View } from 'react-native';
// Removed automatic server detection & network monitoring
import useFontLoader from '../hooks/useFontLoader';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fontsLoaded = useFontLoader();
  const [serverReady, setServerReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      if (fontsLoaded) {
  // Proceed without automatic server detection/monitoring
  console.log('🚀 WanderLanka app initialized');
        setServerReady(true);
        SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, [fontsLoaded]);

  if (!fontsLoaded || !serverReady) {
    return <View />; // Loading state
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <AuthProvider>
            <BookingProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </BookingProvider>
          </AuthProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
