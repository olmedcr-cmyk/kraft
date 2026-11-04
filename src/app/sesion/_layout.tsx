import { Stack } from 'expo-router';

import { color } from '@/theme';

/** Sesión en marcha: sin pestañas, sin gesto de atrás (no se sale sin querer). */
export default function SesionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.tinta }, animation: 'fade' }}>
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
      <Stack.Screen name="como" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="hecho" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
