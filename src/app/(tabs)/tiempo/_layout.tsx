import { Stack } from 'expo-router';

import { color } from '@/theme';

/** Series · Tabata · Míos: se cambian en el sitio, sin animación de pila. */
export default function TiempoLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: color.fondo } }} />;
}
