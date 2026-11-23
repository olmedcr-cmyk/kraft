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
  /** Alto de la fila: 88 por defecto; en pantallas bajas se encoge (mínimo 64) para que todo quepa sin desplazar. */
  height?: number;
  /** Borde de aviso (bloque que cambió el entrenador, KC2). */
  outline?: string;
  /** Lo que lee el lector de pantalla, si hay más que el nombre. */
  a11y?: string;
};

/** Fila de bloque 88 · radio 32. Interior = exterior − padding: cuadro de radio 16. */
export function FilaBloque({ title, tint, marks, onPress, play, aside, badge, height = touch.fila, outline, a11y }: Props) {
  // Compacta (Hoy con muchos bloques): radio 24 y padding 8 → cuadro de radio 16. Con radio 32 y
  // padding 12 salía 20 (fuera de escala) y el cuadro de 40 se veía redondo.
  const compact = height < touch.fila;
  const pad = compact ? space.s8 : space.s16;
  const outer = compact ? radius.lg : radius.xl;
  const square = height - pad * 2; // 88 − 2·16 = 56
  return (
    <Pulsable
      onPress={onPress}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={a11y ?? title}
      style={{
        height,
        borderRadius: outer,
        backgroundColor: color.tarjeta,
        padding: pad - (outline ? 2 : 0),
        borderWidth: outline ? 2 : 0,
        borderColor: outline,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.s16,
      }}
    >
      <View style={{ width: square, height: square, borderRadius: inner(outer, pad), backgroundColor: tint }} />
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
