import { Stack } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { color } from '@/theme';

/** R6: pagar y recibo. El recibo sustituye al pago fundiendo a verde. */
export default function PagoLayout() {
  const reduced = useReducedMotion();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.fondo }, animation: reduced ? 'fade' : 'default' }}>
      <Stack.Screen name="[mes]/recibo" options={{ animation: 'fade', contentStyle: { backgroundColor: color.verde } }} />
    </Stack>
  );
}
