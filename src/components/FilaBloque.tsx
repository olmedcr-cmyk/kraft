import type { ReactNode } from 'react';
import { View } from 'react-native';

import { color, inner, radius, space, texto, touch } from '@/theme';
import { PlayIcon } from './icons';
import { KText } from './KText';
import { Pulsable } from './Pulsable';

type Props = {
  title: string;
  /** Color del bloque: Klein serie, naranja Tabata. */
  tint: string;
  marks?: ReactNode;
  onPress: () => void;
  /** Acción a la derecha (play). Si no, `aside`. */
  play?: boolean;
  aside?: ReactNode;
  /** «?»: trae un ejercicio nuevo para ti. */
  badge?: boolean;
};

/** Fila de bloque 88 · radio 32. Interior = exterior − padding: cuadro de radio 16. */
export function FilaBloque({ title, tint, marks, onPress, play, aside, badge }: Props) {
  const pad = space.s16;
  const square = touch.fila - pad * 2; // 56
  return (
    <Pulsable
      onPress={onPress}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{
        height: touch.fila,
        borderRadius: radius.xl,
        backgroundColor: color.tarjeta,
        padding: pad,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.s16,
      }}
    >
      <View style={{ width: square, height: square, borderRadius: inner(radius.xl, pad), backgroundColor: tint }} />
      <View style={{ flex: 1, gap: space.s8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s8 }}>
          <KText size={texto.bloque}>{title}</KText>
          {badge && (
            <View
              accessibilityLabel="Ejercicio nuevo"
              style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: color.klein, alignItems: 'center', justifyContent: 'center' }}
            >
              <KText size={texto.texto} tint={color.tarjeta} lineHeight={texto.texto}>
                ?
              </KText>
            </View>
          )}
        </View>
        {marks}
      </View>
      {play ? (
        <View
          style={{
            width: touch.dedo,
            height: touch.dedo,
            borderRadius: touch.dedo / 2,
            backgroundColor: color.hundido,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PlayIcon size={20} />
        </View>
      ) : (
        aside
      )}
    </Pulsable>
  );
}

/** Marcas: círculo = serie · segundos, cuadrado = Tabata · ronda. */
export function Marcas({ count, tint, shape, size = 10 }: { count: number; tint: string; shape: 'circle' | 'square'; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: space.s4 }}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{ width: size, height: size, borderRadius: shape === 'circle' ? size / 2 : radius.xs, backgroundColor: tint }}
        />
      ))}
    </View>
  );
}
