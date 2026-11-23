import { View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';

import { color, radius, space } from '@/theme';

/** Iconos redondeados, sin emoji. Trazos sacados de K1Components. */

const PLAY = 'M10 7.5C10 5.6 12.1 4.4 13.8 5.4L26.3 13.4C27.9 14.4 27.9 16.6 26.3 17.6L13.8 25.6C12.1 26.6 10 25.4 10 23.5Z';
const SKIP = 'M4 7.5C4 5.6 6.1 4.4 7.8 5.4L20.3 13.4C21.9 14.4 21.9 16.6 20.3 17.6L7.8 25.6C6.1 26.6 4 25.4 4 23.5Z';

type P = { size?: number; tint?: string };

export function PlayIcon({ size = 32, tint = color.tinta }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path d={PLAY} fill={tint} />
    </Svg>
  );
}

export function NextIcon({ tint = color.tarjeta }: P) {
  return (
    <Svg width={36} height={32} viewBox="0 0 36 32">
      <Path d={SKIP} fill={tint} />
      <Rect x={25} y={5} width={6} height={22} rx={3} fill={tint} />
    </Svg>
  );
}

export function PrevIcon({ tint = color.tarjeta }: P) {
  return (
    <Svg width={36} height={32} viewBox="0 0 36 32">
      <G transform="translate(36 0) scale(-1 1)">
        <Path d={SKIP} fill={tint} />
        <Rect x={25} y={5} width={6} height={22} rx={3} fill={tint} />
      </G>
    </Svg>
  );
}

export function PauseIcon({ tint = color.tinta }: P) {
  return (
    <View style={{ flexDirection: 'row', gap: space.s8 }}>
      <View style={{ width: 12, height: 36, borderRadius: 6, backgroundColor: tint }} />
      <View style={{ width: 12, height: 36, borderRadius: 6, backgroundColor: tint }} />
    </View>
  );
}

/** Parar (KP1Paused): cuadrado de 28, radio 8. */
export function StopIcon({ tint = color.tarjeta }: P) {
  return <View style={{ width: 28, height: 28, borderRadius: radius.sm, backgroundColor: tint }} />;
}

/** «Lleva a otra pantalla»: trazo redondeado, no el carácter › (cambia de forma según la fuente). */
export function ChevronIcon({ size = 20, tint = color.texto2 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M7 4l6 6-6 6" stroke={tint} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function CheckIcon({ size = 36, tint = color.tinta }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path d="M7 16.5l6 6L25 10" stroke={tint} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}
