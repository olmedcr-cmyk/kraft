import { View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { KText } from '@/components/KText';
import { cifra, color, texto } from '@/theme';
import { Pulsable } from '@/components/Pulsable';

/**
 * Rueda de trabajo de KR5Time. Un solo regulador por pantalla: cada toque pasa a la siguiente opción.
 * Geometría de dibujo tomada del diseño (300 · esfera 180 · marcas a 120).
 */
export const DIAL_SIZE = 300;
const SIZE = DIAL_SIZE;
const C = SIZE / 2;
const FACE = 180;
const ANGLES = [-135, -45, 45, 135];

type Props = { options: readonly number[]; index: number; onNext: () => void };

export function Dial({ options, index, onNext }: Props) {
  const value = options[index];
  const a = (ANGLES[index] * Math.PI) / 180;
  const knob = 16;
  const knobR = 73;
  return (
    <Pulsable
      onPress={onNext}
      haptic="selection"
      scaleTo={0.98}
      accessibilityRole="adjustable"
      accessibilityLabel={`Trabajo: ${value} segundos. Toca para cambiar`}
      style={{ width: SIZE, height: SIZE }}
    >
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        {Array.from({ length: 48 }, (_, i) => {
          const major = i % 6 === 0;
          const t = (i * 7.5 * Math.PI) / 180;
          const r1 = 120;
          const r2 = major ? 108 : 114;
          return (
            <Line
              key={i}
              x1={C + r1 * Math.sin(t)}
              y1={C - r1 * Math.cos(t)}
              x2={C + r2 * Math.sin(t)}
              y2={C - r2 * Math.cos(t)}
              stroke={major ? color.texto2 : color.linea}
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
      {options.map((v, i) => {
        const b = (ANGLES[i] * Math.PI) / 180;
        return (
          <KText
            key={v}
            size={texto.texto}
            tint={i === index ? color.tinta : color.texto2}
            style={{ position: 'absolute', left: C + 136 * Math.sin(b) - 16, top: C - 136 * Math.cos(b) - 9, width: 32, textAlign: 'center' }}
          >
            {String(v)}
          </KText>
        );
      })}
      <View
        style={{
          position: 'absolute',
          left: C - FACE / 2,
          top: C - FACE / 2,
          width: FACE,
          height: FACE,
          borderRadius: FACE / 2,
          backgroundColor: color.tinta,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <KText size={cifra.c89} weight={300} tint={color.tarjeta} lineHeight={cifra.c89} tabular>
          {String(value)}
        </KText>
        <KText size={texto.etiqueta} tint={color.linea} caps>
          seg · toca
        </KText>
      </View>
      <View
        style={{
          position: 'absolute',
          left: C + knobR * Math.sin(a) - knob / 2,
          top: C - knobR * Math.cos(a) - knob / 2,
          width: knob,
          height: knob,
          borderRadius: knob / 2,
          backgroundColor: color.naranja,
        }}
      />
    </Pulsable>
  );
}
