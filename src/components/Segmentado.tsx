import { Pressable, View } from 'react-native';

import { color, radius, space, texto, touch } from '@/theme';
import { KText } from './KText';

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

/** Selector en píldora (Series · Tabata · Míos, y emisoras de Tabata). */
export function Segmentado<T extends string>({
  options,
  value,
  onChange,
  track = color.hundido,
  selected = color.tarjeta,
  selectedText = color.tinta,
  label,
}: Props<T>) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={label}
      style={{ flexDirection: 'row', gap: space.s4, padding: space.s4, backgroundColor: track, borderRadius: radius.pill }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={{
              flex: 1,
              height: touch.dedo,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? selected : 'transparent',
            }}
          >
            <KText size={texto.texto} tint={on ? selectedText : color.tinta}>
              {o.label}
            </KText>
          </Pressable>
        );
      })}
    </View>
  );
}
