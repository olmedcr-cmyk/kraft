/** Piezas de R4: icono de modalidad, ocupación, cabecera pequeña. */
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { isFull, takenWithMe, type AgendaState, type Mode, type Slot } from '@/agenda/model';
import { color, radius, space, texto, transicionPunto } from '@/theme';

export const MODE_TINT: Record<Mode, { bg: string; fg: string; soft: string }> = {
  grupo: { bg: color.amarillo, fg: color.tinta, soft: color.tinteAmarillo },
  solo: { bg: color.tinta, fg: color.tarjeta, soft: color.hundido },
  online: { bg: color.klein, fg: color.tarjeta, soft: color.tinteKlein },
};

/** Grupo = tres círculos, solo = uno, online = pantalla con punto. */
export function IconoModo({ mode, tint }: { mode: Mode; tint: string }) {
  if (mode === 'grupo') {
    return (
      <View style={{ width: 40, height: 16 }}>
        {[0, 12, 24].map((x) => (
          <View key={x} style={{ position: 'absolute', left: x, width: 16, height: 16, borderRadius: 8, backgroundColor: tint }} />
        ))}
      </View>
    );
  }
  if (mode === 'solo') return <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: tint }} />;
  return (
    <View style={{ width: 40, height: 28, borderRadius: radius.sm, borderWidth: 2, borderColor: tint, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: tint }} />
    </View>
  );
}

/** Plazas: un punto por plaza; la mía en naranja. */
export function Ocupacion({ slot, state, size = 7, cols = 6 }: { slot: Slot; state: AgendaState; size?: number; cols?: number }) {
  const mine = state.bookings[slot.id]?.status === 'confirmed';
  if (slot.mode === 'online') {
    return <View accessibilityLabel={`${takenWithMe(slot, state)} conectados`} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color.klein }} />;
  }
  if (slot.mode === 'solo') {
    const full = isFull(slot) && !mine;
    return (
      <Animated.View
        accessibilityLabel={full ? 'Ocupado' : 'Libre'}
        style={{ ...transicionPunto, width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: mine ? color.naranja : color.tinta, backgroundColor: full ? color.tinta : mine ? color.naranja : 'transparent' }}
      />
    );
  }
  const used = Math.min(slot.cap, takenWithMe(slot, state));
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${used} de ${slot.cap} plazas`}
      style={{ width: cols * size + (cols - 1) * space.s4, flexDirection: 'row', flexWrap: 'wrap', gap: space.s4 }}
    >
      {Array.from({ length: slot.cap }, (_, j) => {
        const me = mine && j === used - 1;
        return <Animated.View key={j} style={{ ...transicionPunto, width: size, height: size, borderRadius: size / 2, backgroundColor: me ? color.naranja : j < used ? color.tinta : color.hundido }} />;
      })}
    </View>
  );
}

/** «● Agenda» que vuelve, y a la derecha lo que toque. */
export function CabeceraAgenda({ right, back = false }: { right?: ReactNode; back?: boolean }) {
  const label = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s8 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.naranja }} />
      <KText size={texto.texto} tint={color.texto2}>
        Agenda
      </KText>
    </View>
  );
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.s8, minHeight: 24 }}>
      {back ? (
        <Pulsable onPress={() => (router.canDismiss() ? router.dismiss() : router.replace('/agenda'))} accessibilityRole="link" accessibilityLabel="Volver a la agenda" hitSlop={12}>
          {label}
        </Pulsable>
      ) : (
        label
      )}
      {right}
    </View>
  );
}

export function Flecha({ tint = color.tinta, dir = 'right', size = 20 }: { tint?: string; dir?: 'right' | 'left' | 'up-right'; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d={dir === 'right' ? 'M7 4l6 6-6 6' : dir === 'left' ? 'M13 4l-6 6 6 6' : 'M6 14L14 6M7 6h7v7'} stroke={tint} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function Mas({ tint = color.tinta }: { tint?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path d="M10 3v14M3 10h14" stroke={tint} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function Cruz({ tint = color.tinta }: { tint?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path d="M4 4l10 10M14 4L4 14" stroke={tint} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}
