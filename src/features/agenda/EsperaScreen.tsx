/** Llena · lista de espera (KR4Waitlist). */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraAccion } from '@/components/BarraAccion';
import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { Vacio } from '@/components/Vacio';
import { getSlot, hhmm, weekday } from '@/agenda/model';
import { cancel, joinWaitlist, setAutoJoin, useAgenda } from '@/agenda/store';
import { cifra, color, layout, motion, ms, radius, space, texto, touch } from '@/theme';

/** Volver si hay a dónde; si se llegó por enlace directo, a la agenda. */
const back = () => (router.canDismiss() ? router.dismiss() : router.replace('/agenda'));

export function EsperaScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useAgenda();
  const slot = getSlot(id);
  const b = slot ? state.bookings[slot.id] : undefined;
  const [auto, setAuto] = useState(b?.autoJoin ?? true);
  if (!slot) return <Vacio title="Llena" note="Esta clase ya no está" />;

  const joined = b?.status === 'waitlist';
  const position = joined ? b!.position! : slot.queue + 1;
  const toggle = () => {
    setAuto(!auto);
    if (joined) setAutoJoin(slot, !auto);
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo, paddingTop: Math.max(insets.top, layout.pantallaArriba), paddingHorizontal: layout.pantallaLado, paddingBottom: space.s16 + insets.bottom, gap: layout.entreTarjetas }}>
      <View style={{ paddingHorizontal: space.s8, paddingBottom: space.s16, gap: space.s8 }}>
        <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
          Llena
        </KText>
        <KText size={texto.texto} tint={color.texto2}>{`${slot.name} · ${weekday(slot.start)} ${hhmm(slot.start)}${slot.room ? ` · Sala ${slot.room}` : ''}`}</KText>
      </View>

      <View
        accessibilityLabel={`${slot.taken} de ${slot.cap}`}
        style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, paddingVertical: space.s24, paddingHorizontal: space.s16, flexDirection: 'row', flexWrap: 'wrap', rowGap: space.s12, justifyContent: 'space-between' }}
      >
        {Array.from({ length: slot.cap }, (_, i) => (
          <View key={i} style={{ width: '16.66%', alignItems: 'center' }}>
            <View style={{ width: space.s32, height: space.s32, borderRadius: space.s16, backgroundColor: color.tinta }} />
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, paddingVertical: space.s16, paddingHorizontal: space.s24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s16 }}>
        <View style={{ flex: 1, gap: space.s8 }}>
          <KText size={texto.etiqueta} caps tint={color.texto2}>
            {joined ? 'En espera' : 'Entrarías'}
          </KText>
          <KText size={texto.texto} tint={color.texto2}>
            Si alguien cancela, entras tú
          </KText>
        </View>
        <View style={{ width: touch.accion, height: touch.accion, borderRadius: touch.accion / 2, backgroundColor: joined ? color.naranja : color.hundido, alignItems: 'center', justifyContent: 'center' }}>
          <KText size={cifra.c34} weight={300} lineHeight={cifra.c34}>{`${position}º`}</KText>
        </View>
      </View>

      <Pulsable
        onPress={toggle}
        haptic="selection"
        scaleTo={0.99}
        accessibilityRole="switch"
        accessibilityState={{ checked: auto }}
        style={{ height: touch.fila, backgroundColor: color.tarjeta, borderRadius: radius.xl, paddingVertical: space.s16, paddingRight: space.s16, paddingLeft: space.s24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <KText size={texto.bloque}>Entrar sin preguntar</KText>
        <Interruptor on={auto} />
      </Pulsable>

      <View style={{ flex: 1 }} />

      {joined ? (
        <Pulsable
          onPress={() => {
            cancel(slot);
            back();
          }}
          haptic="medium"
          scaleTo={0.98}
          accessibilityRole="button"
          style={{ height: touch.accion, borderRadius: radius.lg, backgroundColor: color.tarjeta, alignItems: 'center', justifyContent: 'center' }}
        >
          <KText size={texto.boton}>Salir de la lista</KText>
        </Pulsable>
      ) : (
        <BarraAccion
          label="Apuntarme"
          onPress={() => joinWaitlist(slot, auto)}
        />
      )}
    </View>
  );
}

/** Interruptor 64×40 (K1Components · H). El botón se desliza; el color funde. */
function Interruptor({ on }: { on: boolean }) {
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
