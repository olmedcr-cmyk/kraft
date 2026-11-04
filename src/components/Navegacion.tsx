import { View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavHidden } from '@/state/chrome';
import { color, motion, ms, radius, space, texto } from '@/theme';
import { KText } from './KText';
import { Pulsable } from './Pulsable';

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

/** Ancho de cada pestaña y alto de la píldora: 4 × 72 + huecos ≈ 308, centrada. */
const ITEM = 72;
const ITEM_H = 56;

/**
 * 4 pestañas: Hoy, Tiempo, Agenda, Diario. Oculta en marcha.
 * Píldora centrada, no una losa a todo el ancho. La marca de la pestaña elegida se desliza (240 ms, ease-in-out);
 * el contenido de la pantalla no se anima: cambiar de pestaña es instantáneo.
 */
export function Navegacion({ state, navigateToTab }: Props) {
  const insets = useSafeAreaInsets();
  const hidden = useNavHidden();
  const reduced = useReducedMotion();
  if (hidden) return null;
  const current = state.routes[state.index]?.name;
  const idx = Math.max(0, TABS.findIndex((t) => t.name === current));
  const pad = space.s4;
  return (
    <View style={{ backgroundColor: color.fondo, alignItems: 'center', paddingTop: space.s8, paddingBottom: space.s16 + insets.bottom }}>
      <View
        accessibilityRole="tablist"
        accessibilityLabel="Secciones"
        style={{ flexDirection: 'row', gap: pad, padding: pad, backgroundColor: color.hundido, borderRadius: radius.pill }}
      >
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: pad,
            top: pad,
            width: ITEM,
            height: ITEM_H,
            borderRadius: radius.pill,
            backgroundColor: color.tinta,
            transform: [{ translateX: idx * (ITEM + pad) }],
            transitionProperty: 'transform',
            transitionDuration: reduced ? '0ms' : ms(motion.pantalla),
            transitionTimingFunction: motion.mover,
          }}
        />
        {TABS.map((t) => {
          const on = t.name === current;
          const route = state.routes.find((r) => r.name === t.name);
          const fg = on ? color.tarjeta : color.tinta;
          return (
            <Pulsable
              key={t.name}
              onPress={() => route && !on && navigateToTab(route.key)}
              haptic={on ? undefined : 'selection'}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t.label}
              style={{ width: ITEM, height: ITEM_H, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', gap: space.s4 }}
            >
              <Glyph name={t.name} tint={on && t.name === 'tiempo' ? color.naranja : fg} />
              <KText size={texto.etiqueta} weight={on ? 500 : 400} tint={fg}>
                {t.label}
              </KText>
            </Pulsable>
          );
        })}
      </View>
    </View>
  );
}
