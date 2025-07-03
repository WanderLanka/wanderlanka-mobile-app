import {
  Inter_400Regular,
} from '@expo-google-fonts/inter';
import {
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import {
  Poppins_400Regular,
} from '@expo-google-fonts/poppins';
import { useCallback } from 'react';
import { useFonts } from 'expo-font';

export default function useFontLoader() {
  const [fontsLoaded] = useFonts({
    Inter: Inter_400Regular,
    Poppins: Poppins_400Regular,
    Nunito: Nunito_400Regular,
  });

  return fontsLoaded;
}
