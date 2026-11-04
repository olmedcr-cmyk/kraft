import { Stack } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { color } from '@/theme';

/** R4: reserva, mover/cancelar (hoja), lista de espera y llegada. */
export default function ReservaLayout() {
  const reduced = useReducedMotion();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.fondo }, animation: reduced ? 'fade' : 'default' }}>
      {/* La hoja entra sola desde abajo; la pantalla solo funde el fondo tinta. */}
      <Stack.Screen name="[id]/cambiar" options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }} />
      <Stack.Screen name="[id]/llego" options={{ animation: reduced ? 'fade' : 'slide_from_bottom' }} />
    </Stack>
  );
}
