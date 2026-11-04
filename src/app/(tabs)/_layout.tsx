import { Tabs } from 'expo-router';

import { Navegacion } from '@/components/Navegacion';
import { color } from '@/theme';

export default function TabsLayout() {
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
