import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { space, touch } from '@/theme';

type Props = {
  bg: string;
  onPress: () => void;
  label: string;
  children: ReactNode;
};

/** Palma = el centro, el número. Bordes y cabecera no pausan. */
export function Palma({ bg, onPress, label, children }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: touch.palma,
        height: touch.palma,
        borderRadius: touch.palma / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <View style={{ alignItems: 'center', gap: space.s8 }}>{children}</View>
    </Pressable>
  );
}
