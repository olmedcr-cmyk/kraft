/** Llego (KR4Arrive): Klein fuera, verde dentro. La palma marca la llegada. */
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraAccion } from '@/components/BarraAccion';
import { CheckIcon } from '@/components/icons';
import { KText } from '@/components/KText';
import { Palma } from '@/components/Palma';
import { Vacio } from '@/components/Vacio';
import { getSlot, hhmm } from '@/agenda/model';
import { arrive, useAgenda } from '@/agenda/store';
import { session } from '@/session/store';
import { alpha, cifra, color, layout, motion, space, texto, touch, transicionFondo, transicionPunto } from '@/theme';

/** Cuántos han llegado ya (de ejemplo, hasta tener backend). */
const ALREADY_IN = 7;

export function LlegoScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useAgenda();
  const slot = getSlot(id);
  const b = slot ? state.bookings[slot.id] : undefined;
  if (!slot || !b || b.status !== 'confirmed') return <Vacio title="Llego" note="No tienes reserva en esta clase" />;

  const inside = !!b.arrived;
  const bg = inside ? color.verde : color.klein;
  const seats = slot.cap || 12;
  const bring = slot.bring.filter((x) => !x.provided).map((x) => x.label.toLowerCase());

  return (
    <Animated.View style={{ ...transicionFondo, flex: 1, backgroundColor: bg, paddingTop: Math.max(insets.top, layout.pantallaArriba), paddingHorizontal: layout.pantallaLado, paddingBottom: space.s16 + insets.bottom, gap: space.s8 }}>
      <View style={{ paddingHorizontal: space.s8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ gap: space.s8, flexShrink: 1 }}>
          <KText size={texto.texto} tint={color.tarjeta}>{`${slot.name} · ${hhmm(slot.start)}`}</KText>
          <KText size={cifra.c89} weight={300} title tint={color.tarjeta} lineHeight={Math.round(cifra.c89 * 0.85)} accessibilityRole="header">
            {slot.room ? `Sala ${slot.room}` : 'Online'}
          </KText>
        </View>
        <View style={{ width: touch.dedo, height: touch.dedo, borderRadius: touch.dedo / 2, backgroundColor: color.tinta, alignItems: 'center', justifyContent: 'center' }}>
          <KText size={texto.lista} tint={color.tarjeta}>
            {session.coach.initial}
          </KText>
        </View>
      </View>

      <View
        accessibilityLabel={inside ? `${ALREADY_IN + 1} de ${seats} · tú dentro` : `${ALREADY_IN} de ${seats} dentro`}
        style={{ paddingVertical: space.s16, paddingHorizontal: space.s8, flexDirection: 'row', flexWrap: 'wrap', gap: space.s4 }}
      >
        {Array.from({ length: seats }, (_, i) => (
          <Animated.View
            key={i}
            style={{ ...transicionPunto, width: 20, height: 20, borderRadius: 10, backgroundColor: i < ALREADY_IN ? color.tarjeta : i === ALREADY_IN && inside ? color.naranja : alpha.sobreColor }}
          />
        ))}
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Palma bg={color.tarjeta} label={inside ? 'Dentro · toca para deshacer' : 'Estoy aquí'} onPress={() => arrive(slot)}>
          {inside && (
            <Animated.View entering={FadeIn.duration(motion.pantalla)} style={{ width: touch.tecla, height: touch.tecla, borderRadius: touch.tecla / 2, backgroundColor: color.verde, alignItems: 'center', justifyContent: 'center' }}>
              <CheckIcon size={32} tint={color.tarjeta} />
            </Animated.View>
          )}
          <KText size={texto.lista} tint={bg} caps>
            {inside ? 'Dentro' : 'Estoy aquí'}
          </KText>
        </Palma>
      </View>

      {inside ? (
        <BarraAccion label="Tu sesión" light onPress={() => router.replace('/')} />
      ) : (
        <View style={{ height: touch.accion, alignItems: 'center', justifyContent: 'center' }}>
          <KText size={texto.texto} tint={color.tarjeta}>
            {bring.join(' · ').replace(/^./, (c) => c.toUpperCase())}
          </KText>
        </View>
      )}
    </Animated.View>
  );
}
