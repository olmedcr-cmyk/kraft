import { radius, space, texto, transicionFondo } from '@/theme';
import { KText } from './KText';
import Animated from 'react-native-reanimated';

type Props = { label: string; bg: string; fg: string; size?: number };

/** Píldora de fase: ningún estado solo por color, siempre con palabra. */
export function PildoraFase({ label, bg, fg, size = texto.etiqueta }: Props) {
  return (
    <Animated.View
      accessibilityRole="text"
      accessibilityLabel={label}
      style={{
        ...transicionFondo,
        height: space.s32,
        paddingHorizontal: space.s12,
        borderRadius: radius.pill,
        backgroundColor: bg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.s8,
      }}
    >
      <KText size={size} tint={fg} caps>
        {label}
      </KText>
    </Animated.View>
  );
}
