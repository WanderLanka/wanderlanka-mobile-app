import './global.css';

import * as SplashScreen from 'expo-splash-screen';

import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Stack } from "expo-router";
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { BookingProvider } from '../context/BookingContext';
import useFontLoader from '../hooks/useFontLoader';
import { initializeServerConnection } from '../utils/serverDetection';
import { initializeNetworkMonitoring } from '../utils/networkMonitor';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fontsLoaded = useFontLoader();
  const [serverReady, setServerReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      if (fontsLoaded) {
        // Initialize server connection and network monitoring
        await initializeServerConnection();
        initializeNetworkMonitoring();
        
        console.log('🚀 WanderLanka app initialized with smart WiFi-adaptive networking');
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
        <AuthProvider>
          <BookingProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </BookingProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
