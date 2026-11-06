/** Arranque (K5Splash): Klein, la marca y tres puntos. Sigue solo o al tocar. */
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Marca } from '@/components/Marca';
import { Pulsable } from '@/components/Pulsable';
import { alpha, cifra, color, layout, motion, ms, space, arriba } from '@/theme';

/** Lo justo para ver la marca; tocar adelanta. */
const HOLD_MS = 1400;

export function ArranqueScreen() {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const go = () => router.replace('/alta/bienvenida');

  useEffect(() => {
    const t = setTimeout(go, HOLD_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: color.klein, paddingTop: arriba(insets.top, layout.pantallaArriba), paddingBottom: space.s48 + insets.bottom, paddingHorizontal: layout.pantallaLado }}>
      <StatusBar style="light" />
      <Pulsable onPress={go} scaleTo={1} accessibilityRole="button" accessibilityLabel="Continuar" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Marca size={cifra.c55} />
      </Pulsable>
      {/* Tres puntos que se encienden por turnos: está cargando, no hace falta leer nada. */}
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ alignSelf: 'center', flexDirection: 'row', gap: space.s8 }}>
        {[color.tarjeta, alpha.mitadSobreColor, alpha.sobreColor].map((bg, i) => (
          <Animated.View
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: bg,
              ...(!reduced && {
                animationName: { '0%': { opacity: 1 }, '50%': { opacity: 0.4 }, '100%': { opacity: 1 } },
                animationDuration: ms(motion.punto * 3),
                animationDelay: ms(i * motion.punto),
                animationIterationCount: 'infinite',
                animationTimingFunction: motion.easing,
              }),
            }}
          />
        ))}
      </View>
    </View>
  );
}
