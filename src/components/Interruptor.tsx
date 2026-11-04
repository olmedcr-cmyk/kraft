import Animated, { useReducedMotion } from 'react-native-reanimated';

import { color, motion, ms, radius, touch } from '@/theme';

/** Interruptor 64×40 (K1Components · H). El botón se desliza; el color funde. */
export function Interruptor({ on }: { on: boolean }) {
  const reduced = useReducedMotion();
  return (
    <Animated.View
      style={{
        width: touch.tecla,
        height: 40,
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
          top: 4,
          left: 4,
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: color.tarjeta,
          transform: [{ translateX: on ? touch.tecla - 40 : 0 }],
          transitionProperty: 'transform',
          transitionDuration: reduced ? '0ms' : ms(motion.pantalla),
          transitionTimingFunction: motion.mover,
        }}
      />
    </Animated.View>
  );
}
