import { useState } from 'react';
import { View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { color, motion, ms, radius, space, texto, touch } from '@/theme';
import { KText } from './KText';
import { Pulsable } from './Pulsable';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  /** Fondo del carril y de la opción elegida. */
  track?: string;
  selected?: string;
  selectedText?: string;
  label: string;
};

/**
 * Selector en píldora (Series · Tabata · Míos, emisoras de Tabata).
 * La píldora elegida se desliza a su sitio (ease-in-out, ritmo de pantalla); el texto cambia de color a la vez.
 */
export function Segmentado<T extends string>({
  options,
  value,
  onChange,
  track = color.hundido,
  selected = color.tarjeta,
  selectedText = color.tinta,
  label,
}: Props<T>) {
  const [w, setW] = useState(0);
  const reduced = useReducedMotion();
  const pad = space.s4;
  const gap = space.s4;
  const n = options.length;
  const i = Math.max(0, options.findIndex((o) => o.value === value));
  const itemW = w > 0 ? (w - pad * 2 - gap * (n - 1)) / n : 0;

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={label}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', gap, padding: pad, backgroundColor: track, borderRadius: radius.pill }}
    >
      {itemW > 0 && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: pad,
            top: pad,
            width: itemW,
            height: touch.dedo,
            borderRadius: radius.pill,
            backgroundColor: selected,
            transform: [{ translateX: i * (itemW + gap) }],
            transitionProperty: 'transform',
            transitionDuration: reduced ? '0ms' : ms(motion.pantalla),
            transitionTimingFunction: motion.mover,
          }}
        />
      )}
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pulsable
            key={o.value}
            onPress={() => !on && onChange(o.value)}
            haptic={on ? undefined : 'selection'}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={{
              flex: 1,
              height: touch.dedo,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              // Sin medir aún: la opción elegida se pinta sola, sin píldora móvil.
              backgroundColor: itemW > 0 || !on ? 'transparent' : selected,
            }}
          >
            <KText size={texto.texto} tint={on ? selectedText : color.tinta}>
              {o.label}
            </KText>
          </Pulsable>
        );
      })}
    </View>
  );
}
