import { Stack } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { color } from '@/theme';

/** R1: arranque → bienvenida → entrenador → permisos → palma → Hoy. */
export default function AltaLayout() {
  const reduced = useReducedMotion();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.fondo }, animation: reduced ? 'fade' : 'default' }}>
      <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: color.klein } }} />
      {/* Del arranque Klein a la bienvenida: fundido, sin «volver» al logo. */}
      <Stack.Screen name="bienvenida" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="palma" options={{ contentStyle: { backgroundColor: color.klein } }} />
    </Stack>
  );
}
