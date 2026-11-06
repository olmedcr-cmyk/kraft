/** Casillas de código y teclado numérico (K7Coach). Los usan el código del entrenador y el del email. */
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { color, radius, space, texto, transicionPunto, touch } from '@/theme';

/** Una casilla por cifra: vacía, con la cifra en Klein, o en naranja si el código no vale. */
export function Casillas({ value, length, wrong }: { value: string; length: number; wrong?: boolean }) {
  return (
    <View
      accessibilityLabel={`Código: ${value.split('').join(' ') || 'vacío'}${value.length < length ? `, faltan ${length - value.length}` : ''}`}
      style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, paddingVertical: space.s24, paddingHorizontal: space.s16, flexDirection: 'row', justifyContent: 'space-between' }}
    >
      {Array.from({ length }, (_, i) => {
        const d = value[i];
        const fill = d ? (wrong ? color.naranja : color.klein) : 'transparent';
        return (
          <Animated.View
            key={i}
            style={{ ...transicionPunto, width: touch.dedo, height: touch.dedo, borderRadius: touch.dedo / 2, borderWidth: 2, borderColor: d ? fill : color.linea, backgroundColor: fill, alignItems: 'center', justifyContent: 'center' }}
          >
            {d && (
              <KText size={texto.bloque} tint={wrong ? color.tinta : color.tarjeta}>
                {d}
              </KText>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

export const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'pegar', '0', 'borrar'] as const;
export type Tecla = (typeof TECLAS)[number];

/** Teclado de 12: cifras en tarjeta; pegar y borrar, sin fondo. */
export function Teclado({ onKey, disabled }: { onKey: (k: Tecla) => void; disabled?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s8, opacity: disabled ? 0.5 : 1 }} pointerEvents={disabled ? 'none' : 'auto'}>
      {TECLAS.map((k) => {
        const digit = k !== 'pegar' && k !== 'borrar';
        return (
          <Pulsable
            key={k}
            onPress={() => onKey(k)}
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel={k === 'pegar' ? 'Pegar código' : k === 'borrar' ? 'Borrar' : k}
            style={{ width: '31.5%', flexGrow: 1, height: 56, borderRadius: radius.md, backgroundColor: digit ? color.tarjeta : 'transparent', alignItems: 'center', justifyContent: 'center' }}
          >
            {k === 'pegar' ? (
              <KText size={texto.etiqueta} caps tint={color.texto2}>
                Pegar
              </KText>
            ) : (
              <KText size={k === 'borrar' ? texto.bloque : texto.boton} weight={k === 'borrar' ? 400 : 300}>
                {k === 'borrar' ? '‹' : k}
              </KText>
            )}
          </Pulsable>
        );
      })}
    </View>
  );
}
