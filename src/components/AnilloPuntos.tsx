import { View } from 'react-native';

import { color } from '@/theme';

type Props = {
  /** Un punto = un segundo. */
  count: number;
  /** Puntos ya gastados. El siguiente es el actual (naranja). */
  elapsed: number;
  /** Lado del cuadro que contiene el anillo. */
  size: number;
  /** Radio del anillo (centro de los puntos). */
  ring: number;
  live: string;
  gone: string;
  /** Si false, no se marca el punto actual (3·2·1, espera, hecho). */
  showCurrent?: boolean;
  allGone?: boolean;
};

/** Anillo de puntos alrededor de la palma: 1 punto = 1 s. */
export function AnilloPuntos({ count, elapsed, size, ring, live, gone, showCurrent = true, allGone = false }: Props) {
  const dot = count > 45 ? 8 : count > 20 ? 12 : 16;
  const c = size / 2;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: size, height: size }}>
      {Array.from({ length: count }, (_, i) => {
        const a = (2 * Math.PI * i) / count;
        let bg = live;
        if (allGone || i < elapsed) bg = gone;
        else if (showCurrent && i === elapsed) bg = color.naranja;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: c + ring * Math.sin(a) - dot / 2,
              top: c - ring * Math.cos(a) - dot / 2,
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: bg,
            }}
          />
        );
      })}
    </View>
  );
}
