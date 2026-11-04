import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { KText } from '@/components/KText';
import { alpha, color, texto } from '@/theme';

/** Dial de radio de Tabata: una marca por segundo; la aguja naranja es «ahora». */
const PX = 8;
const H = 96;
const BASE = 84 - 28; // línea base de las marcas dentro de la tira

type Props = { work: number; rest: number; rounds: number; /** segundo actual de la sesión */ e: number };

export function Radio({ work, rest, rounds, e }: Props) {
  const [w, setW] = useState(358);
  const cyc = work + rest;
  const T = rounds * cyc - rest;
  const past: string[] = [];
  const workD: string[] = [];
  const restD: string[] = [];
  for (let i = 0; i <= T; i++) {
    const inRound = i % cyc;
    const isWork = inRound < work || i === T;
    const h = inRound === 0 ? 56 : isWork ? (i % 5 === 0 ? 40 : 28) : 14;
    const x = i * PX + 1;
    const d = `M${x} ${12 + BASE}V${12 + BASE - h}`;
    (i < e ? past : isWork ? workD : restD).push(d);
  }
  const center = Math.round(w / 2);
  const tx = center - 1 - e * PX;

  return (
    <View
      onLayout={(ev) => setW(ev.nativeEvent.layout.width)}
      accessibilityRole="image"
      accessibilityLabel={`Segundo ${Math.floor(e)} de ${T}`}
      style={{ height: H, overflow: 'hidden' }}
    >
      <View style={{ position: 'absolute', left: 0, top: 0, height: H, width: (T + 1) * PX, transform: [{ translateX: tx }] }}>
        <Svg width={(T + 1) * PX} height={H}>
          <Path d={past.join('')} stroke={alpha.sobreClaro} strokeWidth={2} strokeLinecap="round" />
          <Path d={workD.join('')} stroke={color.tinta} strokeWidth={2} strokeLinecap="round" />
          <Path d={restD.join('')} stroke={color.texto2} strokeWidth={2} strokeLinecap="round" />
        </Svg>
        {Array.from({ length: rounds }, (_, k) => (
          <KText key={k} size={texto.etiqueta} tint={color.texto2} style={{ position: 'absolute', left: k * cyc * PX - 3, bottom: 0 }}>
            {String(k + 1)}
          </KText>
        ))}
      </View>
      <View style={{ position: 'absolute', left: center - 1, top: 8, width: 2, height: 64, backgroundColor: color.naranja }} />
      <View style={{ position: 'absolute', left: center - 6, top: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: color.naranja }} />
    </View>
  );
}
