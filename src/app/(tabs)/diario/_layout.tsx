import { Stack } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { color } from '@/theme';

/** Bitácora → Gráficas: se entra en profundidad, con la transición del sistema. */
export default function DiarioLayout() {
  const reduced = useReducedMotion();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.fondo }, animation: reduced ? 'fade' : 'default' }} />;
}
