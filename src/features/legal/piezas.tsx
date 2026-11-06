/** Piezas de legal (KL1–KL5): tarjeta con etiqueta, punto con explicación y aviso de color. */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';

import { KText } from '@/components/KText';
import { color, motion, radius, space, texto } from '@/theme';

/** Filas de KL1 (56) y de KL3/KL5 (64). */
export const FILA_CORTA = 56;

/** Tarjeta blanca con etiqueta en mayúsculas arriba. */
export function Tarjeta({ etiqueta, children, bg = color.tarjeta, tint = color.texto2 }: { etiqueta: string; children: ReactNode; bg?: string; tint?: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.lg, padding: space.s16, gap: space.s12 }}>
      <KText size={texto.etiqueta} caps tint={tint} accessibilityRole="header">
        {etiqueta}
      </KText>
      {children}
    </View>
  );
}

/** Un punto de color = quién o qué; texto y explicación al lado. El color nunca va solo. */
export function Punto({ dot, title, sub }: { dot: string; title: string; sub?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s12 }} accessible accessibilityLabel={sub ? `${title}: ${sub}` : title}>
      <View style={{ width: space.s12, height: space.s12, borderRadius: space.s12 / 2, backgroundColor: dot }} />
      <View style={{ flex: 1, gap: 2 }}>
        <KText size={texto.lista}>{title}</KText>
        {sub && (
          <KText size={texto.texto} tint={color.texto2}>
            {sub}
          </KText>
        )}
      </View>
    </View>
  );
}

/** Aviso con icono en círculo (pedido hecho, algo pendiente). Aparece fundiendo. */
export function Aviso({ bg, icon, children }: { bg: string; icon: ReactNode; children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.duration(motion.pantalla)}
      accessibilityLiveRegion="polite"
      style={{ backgroundColor: bg, borderRadius: radius.lg, padding: space.s16, flexDirection: 'row', alignItems: 'center', gap: space.s12 }}
    >
      {icon}
      <View style={{ flex: 1 }}>{children}</View>
    </Animated.View>
  );
}

/** Círculo del aviso. */
export function Circulo({ size, bg, children }: { size: number; bg: string; children: ReactNode }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>{children}</View>;
}
