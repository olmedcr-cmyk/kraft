/** Piezas de R6: cabecera pequeña, punto de modalidad, líneas de la cuenta. */
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { MODES, type Mode } from '@/agenda/model';
import { color, radius, space, texto } from '@/theme';
import { MODE_TINT } from '@/features/agenda/piezas';

export { MODE_TINT };

/** «● Diario» (o «● Datos», que vuelve) y a la derecha lo que toque. */
export function CabeceraDiario({ label, back, right }: { label: string; back?: boolean; right?: ReactNode }) {
  const mark = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s8 }}>
      {/* Marca de sección en tinta: el naranja es solo para actuar. */}
      <View style={{ width: space.s8, height: space.s8, borderRadius: radius.pill, backgroundColor: color.tinta }} />
      <KText size={texto.texto} tint={color.texto2}>
        {label}
      </KText>
    </View>
  );
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 24 }}>
      {back ? (
        <Pulsable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/diario'))}
          accessibilityRole="link"
          accessibilityLabel="Volver al diario"
          hitSlop={12}
        >
          {mark}
        </Pulsable>
      ) : (
        mark
      )}
      {right}
    </View>
  );
}

/** Punto de modalidad. Sobre un fondo de su mismo color lleva anillo para verse; `ring` lo fuerza. */
export function PuntoModo({ mode, size = 10, on, ring: force }: { mode: Mode; size?: number; on?: string; ring?: string }) {
  const c = MODE_TINT[mode].bg;
  const ring = force ?? (on && on === c ? (c === color.tinta ? color.texto2 : color.tarjeta) : undefined);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c,
        ...(ring && { borderWidth: force ? 2 : 1, borderColor: ring }),
      }}
    />
  );
}

export const modeLabel = (m: Mode) => MODES[m].label;
