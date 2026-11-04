import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavHidden } from '@/state/chrome';
import { color, inner, radius, space, texto, touch } from '@/theme';
import { KText } from './KText';

export const TABS = [
  { name: 'index', label: 'Hoy' },
  { name: 'tiempo', label: 'Tiempo' },
  { name: 'agenda', label: 'Agenda' },
  { name: 'diario', label: 'Diario' },
] as const;
type TabName = (typeof TABS)[number]['name'];

function Glyph({ name, tint }: { name: TabName; tint: string }) {
  switch (name) {
    case 'index':
      return <View style={{ width: 12, height: 12, borderRadius: radius.xs, backgroundColor: tint }} />;
    case 'tiempo':
      return <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: tint }} />;
    case 'agenda':
      return <View style={{ width: 18, height: 8, borderRadius: radius.pill, borderWidth: 2, borderColor: tint }} />;
    case 'diario':
      return (
        <View style={{ width: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: tint }} />
          ))}
        </View>
      );
  }
}

type Props = {
  state: { index: number; routes: { name: string; key: string }[] };
  navigateToTab: (routeKey: string) => void;
};

/** 4 pestañas: Hoy, Tiempo, Agenda, Diario. Oculta en marcha. */
export function Navegacion({ state, navigateToTab }: Props) {
  const insets = useSafeAreaInsets();
  const hidden = useNavHidden();
  if (hidden) return null;
  const current = state.routes[state.index]?.name;
  const pad = space.s4;
  return (
    <View style={{ backgroundColor: color.fondo, paddingHorizontal: space.s16, paddingBottom: space.s16 + insets.bottom }}>
      <View
        accessibilityRole="tablist"
        accessibilityLabel="Secciones"
        style={{ flexDirection: 'row', gap: pad, padding: pad, backgroundColor: color.hundido, borderRadius: radius.lg }}
      >
        {TABS.map((t) => {
          const on = t.name === current;
          const route = state.routes.find((r) => r.name === t.name);
          const fg = on ? color.tarjeta : color.tinta;
          return (
            <Pressable
              key={t.name}
              onPress={() => route && navigateToTab(route.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t.label}
              style={{
                flex: 1,
                height: touch.tecla,
                borderRadius: inner(radius.lg, pad),
                backgroundColor: on ? color.tinta : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                gap: space.s4,
              }}
            >
              <Glyph name={t.name} tint={on && t.name === 'tiempo' ? color.naranja : fg} />
              <KText size={texto.etiqueta} tint={fg}>
                {t.label}
              </KText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
