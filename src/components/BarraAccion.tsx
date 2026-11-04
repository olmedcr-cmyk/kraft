import { View } from 'react-native';

import { color, inner, radius, space, texto, touch } from '@/theme';
import { PlayIcon } from './icons';
import { KText } from './KText';
import { Pulsable } from './Pulsable';

type Props = { label: string; onPress: () => void };

/** Barra de acción 104: frase a la izquierda, círculo naranja a la derecha. */
export function BarraAccion({ label, onPress }: Props) {
  const pad = space.s16;
  const knob = inner(touch.accion, pad * 2); // 104 − 2·16 = 72
  return (
    <Pulsable
      onPress={onPress}
      haptic="light"
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        height: touch.accion,
        borderRadius: radius.lg,
        backgroundColor: color.tinta,
        paddingLeft: space.s24,
        paddingRight: pad,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <KText size={texto.boton} tint={color.tarjeta}>
        {label}
      </KText>
      <View
        style={{
          width: knob,
          height: knob,
          borderRadius: knob / 2,
          backgroundColor: color.naranja,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PlayIcon />
      </View>
    </Pulsable>
  );
}
