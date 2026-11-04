import { Stack } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { color } from '@/theme';

/** Sesión en marcha: sin pestañas, sin gesto de atrás (no se sale sin querer). */
export default function SesionLayout() {
  const reduced = useReducedMotion();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.tinta }, animation: 'fade' }}>
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
      <Stack.Screen name="como" options={{ animation: reduced ? 'fade' : 'slide_from_bottom', animationMatchesGesture: true }} />
      <Stack.Screen name="hecho" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
