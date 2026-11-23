import { RobotoMono_300Light, RobotoMono_400Regular, RobotoMono_500Medium, useFonts } from '@expo-google-fonts/roboto-mono';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { startData } from '@/backend/data';
import { startSync } from '@/backend/sync';
import { loadUnfinished } from '@/session/marcha';
import { listenReminderResponses, setupReminders } from '@/platform/reminders';
import { hydrateSettings, useHydrated } from '@/state/settings';
import { color } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded] = useFonts({ RobotoMono_300Light, RobotoMono_400Regular, RobotoMono_500Medium });
  const reduced = useReducedMotion();
  const hydrated = useHydrated();

  // Ajustes guardados (¿ya hizo el alta?) antes de pintar nada.
  useEffect(() => {
    hydrateSettings();
  }, []);

  useEffect(() => {
    if (loaded && hydrated) SplashScreen.hideAsync().catch(() => {});
    // Con los ajustes ya cargados: la cola de envíos al servidor (si lo hay).
    if (hydrated) {
      startData();
      // Después de cargar la cola: lo que se recupere (un entreno sin enviar) entra en ella sin pisarse.
      startSync().finally(loadUnfinished);
    }
  }, [loaded, hydrated]);

  // Recordatorios de clase: «Mover» y «Llego» abren su pantalla.
  useEffect(() => {
    setupReminders();
    return listenReminderResponses();
  }, []);

  if (!loaded || !hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        {/* Transiciones nativas del sistema; con «reducir movimiento», fundido. */}
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.fondo }, animation: reduced ? 'fade' : 'default' }}>
          {/* En marcha no se sale con el gesto de atrás: se pausa o se para con el mando. */}
          <Stack.Screen name="sesion" options={{ gestureEnabled: false }} />
          {/* Salud (KL2): hoja sobre tinta; el fondo funde y la hoja sube. */}
          <Stack.Screen name="legal/salud" options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
