import { Redirect, Tabs } from 'expo-router';

import { useAuthReady, useAuthSession } from '@/backend/auth';
import { hasBackend } from '@/backend/client';
import { Navegacion } from '@/components/Navegacion';
import { useSettings } from '@/state/settings';
import { color } from '@/theme';

export default function TabsLayout() {
  // Primera vez: el alta (R1) antes de Hoy.
  const { onboarded } = useSettings();
  const authReady = useAuthReady();
  const auth = useAuthSession();
  if (!onboarded) return <Redirect href="/alta" />;
  // Con servidor, sin sesión (salió o caducó): volver a entrar. Lo del móvil se queda.
  if (hasBackend && !authReady) return null;
  if (hasBackend && !auth) return <Redirect href="/alta/bienvenida" />;
  return (
    <Tabs
      tabBar={(props) => <Navegacion {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.fondo } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Hoy' }} />
      <Tabs.Screen name="tiempo" options={{ title: 'Tiempo' }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="diario" options={{ title: 'Diario' }} />
    </Tabs>
  );
}
