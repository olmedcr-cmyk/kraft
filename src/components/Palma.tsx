import type { ReactNode } from 'react';
import { View } from 'react-native';

import { space, touch } from '@/theme';
import { Pulsable } from './Pulsable';

type Props = {
  bg: string;
  onPress: () => void;
  label: string;
  children: ReactNode;
};

/** Palma = el centro, el número. Bordes y cabecera no pausan. */
export function Palma({ bg, onPress, label, children }: Props) {
  return (
    <Pulsable
      onPress={onPress}
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: touch.palma,
        height: touch.palma,
        borderRadius: touch.palma / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ alignItems: 'center', gap: space.s8 }}>{children}</View>
    </Pulsable>
  );
}
