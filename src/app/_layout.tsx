import { RobotoMono_300Light, RobotoMono_400Regular, RobotoMono_500Medium, useFonts } from '@expo-google-fonts/roboto-mono';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { listenReminderResponses, setupReminders } from '@/platform/reminders';
import { color } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded] = useFonts({ RobotoMono_300Light, RobotoMono_400Regular, RobotoMono_500Medium });
  const reduced = useReducedMotion();

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  // Recordatorios de clase: «Mover» y «Llego» abren su pantalla.
  useEffect(() => {
    setupReminders();
    return listenReminderResponses();
  }, []);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        {/* Transiciones nativas del sistema; con «reducir movimiento», fundido. */}
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.fondo }, animation: reduced ? 'fade' : 'default' }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
