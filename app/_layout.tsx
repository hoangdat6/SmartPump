import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { 
  Poppins_400Regular, 
  Poppins_500Medium, 
  Poppins_600SemiBold, 
  Poppins_700Bold 
} from '@expo-google-fonts/poppins';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Platform, SafeAreaView } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Define the extended theme type to include our custom colors
declare global {
  namespace ReactNavigation {
    interface Theme {
      colors: {
        accent: string;
        success: string;
        warning: string;
        error: string;
        highlight: string;
      } & typeof DefaultTheme["colors"];
    }
  }
}

// Export theme colors for use in other parts of the app
export const AppColors = {
  primary: '#0095ff',
  accent: '#00d2ff',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
  highlight: '#f0f9ff',
};

// Brighter, more modern theme with fresh blue accents
const ModernLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: AppColors.primary,     // Brighter blue for a more modern look
    background: '#ffffff',          // Pure white background for a clean look
    card: '#ffffff',
    text: '#1a1a1a',                // Almost black text for better contrast
    border: '#edf2f7',              // Very light gray border
    notification: AppColors.primary,
    // Additional colors for our modern UI
    accent: AppColors.accent,       // Secondary accent color
    success: AppColors.success,     // Bright green
    warning: AppColors.warning,     // Bright amber
    error: AppColors.error,         // Bright red
    highlight: AppColors.highlight, // Very light blue highlight background
  },
};

const ModernDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#38bdf8',      // Lighter blue for dark mode that pops
    background: '#111827',   // Dark blue-gray background
    card: '#1e293b',         // Slightly lighter than background
    text: '#f8fafc',         // Light text for dark mode
    border: '#334155',       // Dark blue-gray border
    notification: '#38bdf8',
    // Additional colors for our modern UI
    accent: '#0ea5e9',       // Secondary accent color
    success: '#4ade80',      // Bright green
    warning: '#fbbf24',      // Bright amber
    error: '#f87171',        // Bright red
    highlight: '#1e3a8a',    // Dark blue highlight background
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    PoppinsRegular: Poppins_400Regular,
    PoppinsMedium: Poppins_500Medium,
    PoppinsSemiBold: Poppins_600SemiBold,
    PoppinsBold: Poppins_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }
  
  // Use the modern light theme regardless of system preference for now
  // since user requested a bright, modern interface
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: ModernLightTheme.colors.background,
        paddingTop: Platform.OS === 'android' ? 10 : 0,
      }}
    >
      <ThemeProvider value={ModernLightTheme}>
        <Stack>
          <Stack.Screen  name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="notification-details" options={{ title: 'Chi Tiết Thông Báo' }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </SafeAreaView>
  );
}
