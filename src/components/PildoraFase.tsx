import { radius, space, texto, touch, transicionFondo } from '@/theme';
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
        // En marcha (texto de 18) mide un dedo; la etiqueta pequeña, 32. Mínimo, no fijo: crece con el texto grande del sistema.
        minHeight: size > texto.etiqueta ? touch.dedo : space.s32,
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
