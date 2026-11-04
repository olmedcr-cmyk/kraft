import { View } from 'react-native';

import { color, space } from '@/theme';
import { KText } from './KText';

/** Marca (K0Brand): «KRAFT» en 500 y el punto naranja. */
export function Marca({ size, tint = color.tarjeta }: { size: number; tint?: string }) {
  const dot = Math.round(size / 4);
  return (
    <View accessibilityRole="header" accessibilityLabel="KRAFT" style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s4 }}>
      <KText size={size} weight={500} tint={tint} lineHeight={Math.round(size * 0.9)} style={{ letterSpacing: size * -0.02 }}>
        KRAFT
      </KText>
      <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color.naranja, marginBottom: Math.round(size * 0.12) }} />
    </View>
  );
}
