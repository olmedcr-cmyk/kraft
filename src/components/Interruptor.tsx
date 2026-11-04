import Animated, { useReducedMotion } from 'react-native-reanimated';

import { color, motion, ms, radius, space, touch } from '@/theme';

/**
 * Interruptor (K1Components · H). El botón se desliza; el color funde.
 * Normal 64×40; `small` 56×32 para filas de ajustes (KT2–KT6).
 */
export function Interruptor({ on, small }: { on: boolean; small?: boolean }) {
  const reduced = useReducedMotion();
  const w = small ? 56 : touch.tecla;
  const h = small ? space.s32 : 40;
  const pad = space.s4;
  const knob = h - pad * 2;
  return (
    <Animated.View
      style={{
        width: w,
        height: h,
        borderRadius: radius.pill,
        backgroundColor: on ? color.klein : color.linea,
        transitionProperty: 'backgroundColor',
        transitionDuration: ms(motion.pantalla),
        transitionTimingFunction: motion.easing,
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: pad,
          left: pad,
          width: knob,
          height: knob,
          borderRadius: knob / 2,
          backgroundColor: color.tarjeta,
          transform: [{ translateX: on ? w - knob - pad * 2 : 0 }],
          transitionProperty: 'transform',
          transitionDuration: reduced ? '0ms' : ms(motion.pantalla),
          transitionTimingFunction: motion.mover,
        }}
      />
    </Animated.View>
  );
}
