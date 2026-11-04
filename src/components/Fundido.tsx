import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { color, fundido } from '@/theme';

type Props = {
  /** Borde donde el contenido se desvanece. */
  lado: 'arriba' | 'abajo';
  /** Alto del fundido (24 por defecto; arriba suele sumar la zona segura). */
  alto?: number;
  /** Color al que funde: el del fondo de la pantalla. */
  tint?: string;
};

/**
 * Fundido sobre el borde de una zona que se desplaza: el contenido se desvanece en vez de cortarse en seco.
 * No recibe toques.
 */
export function Fundido({ lado, alto = fundido, tint = color.fondo }: Props) {
  const id = `fundido-${useId().replace(/:/g, '')}`;
  const arriba = lado === 'arriba';
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, height: alto, ...(arriba ? { top: 0 } : { bottom: 0 }) }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={tint} stopOpacity={arriba ? 1 : 0} />
            <Stop offset="1" stopColor={tint} stopOpacity={arriba ? 0 : 1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
