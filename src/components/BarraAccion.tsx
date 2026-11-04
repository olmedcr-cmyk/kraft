import type { ReactNode } from 'react';
import { View } from 'react-native';

import { color, inner, radius, space, texto, touch } from '@/theme';
import { PlayIcon } from './icons';
import { KText } from './KText';
import { Pulsable } from './Pulsable';

type Props = {
  label: string;
  onPress: () => void;
  /** Sobre fondo de color: barra blanca y texto en tinta. */
  light?: boolean;
  /** Círculo: naranja (actuar) por defecto; verde con ✓ al cerrar algo hecho. */
  knob?: string;
  /** Barra naranja (actuar sobre tinta): fondo y texto propios. */
  bg?: string;
  fg?: string;
  icon?: ReactNode;
  disabled?: boolean;
  /** Fuera de marcha (Hoy): píldora de 88 en vez de bloque de 104. Más ligera, mismo gesto. */
  compacta?: boolean;
};

/** Barra de acción 104: frase a la izquierda, círculo naranja a la derecha. */
export function BarraAccion({ label, onPress, light, knob: knobColor = color.naranja, icon, disabled, bg, fg, compacta }: Props) {
  const h = compacta ? touch.fila : touch.accion;
  const pad = compacta ? space.s12 : space.s16;
  const knob = inner(h, pad * 2); // 104 − 2·16 = 72 · 88 − 2·12 = 64
  return (
    <Pulsable
      onPress={onPress}
      disabled={disabled}
      haptic="light"
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        height: h,
        borderRadius: compacta ? radius.pill : radius.lg,
        backgroundColor: bg ?? (light ? color.tarjeta : color.tinta),
        paddingLeft: compacta ? space.s32 : space.s24,
        paddingRight: pad,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <KText size={texto.boton} tint={fg ?? (light ? color.tinta : color.tarjeta)}>
        {label}
      </KText>
      <View
        style={{
          width: knob,
          height: knob,
          borderRadius: knob / 2,
          backgroundColor: knobColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon ?? <PlayIcon />}
      </View>
    </Pulsable>
  );
}
