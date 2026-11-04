import type { ReactNode } from 'react';
import { View } from 'react-native';

import { KText } from '@/components/KText';
import { cifra, space } from '@/theme';

type Props = {
  title: string;
  unit: string;
  unitSize: number;
  fg: string;
  corner?: ReactNode;
};

/** Título 34 + línea de ayuda, y la cifra de esquina a la derecha. */
export function Cabecera({ title, unit, unitSize, fg, corner }: Props) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: space.s8 }}>
      <View style={{ gap: space.s8, flexShrink: 1 }}>
        <KText size={cifra.c34} weight={300} title tint={fg} lineHeight={cifra.c34} accessibilityRole="header">
          {title}
        </KText>
        <KText size={unitSize} tint={fg}>
          {unit}
        </KText>
      </View>
      {corner}
    </View>
  );
}

export const pad2 = (v: number) => String(v).padStart(2, '0');
