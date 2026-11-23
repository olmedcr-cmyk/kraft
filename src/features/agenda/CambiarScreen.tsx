/** Mover o cancelar (KR4Change): hoja inferior sobre tinta. Tocar arriba cierra. */
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import Animated, { Easing, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StopIcon } from '@/components/icons';
import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { Vacio } from '@/components/Vacio';
import { FREE_CANCEL_H, cancelDeadline, dayStart, getSlot, hhmm, isLate, moveOptions, shortDay, weekdayShort } from '@/agenda/model';
import { cancel, move, useAgenda } from '@/agenda/store';
import { PRICES } from '@/diario/model';
import { useConfirmar } from '@/features/tu/piezas';
import { cifra, color, inner, radius, space, texto, touch, transicionPunto } from '@/theme';

/** «miércoles 5» → «Miércoles 5» al empezar la línea. */
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Curva de hoja de iOS; sin rebote (tokens: rebote false). */
const SHEET = SlideInDown.duration(300).easing(Easing.bezier(0.32, 0.72, 0, 1));

/** Cerrar la hoja; si se abrió por enlace directo (aviso «Mover»), a la agenda. */
const close = () => (router.canDismiss() ? router.dismiss() : router.replace('/agenda'));

export function CambiarScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useAgenda();
  const slot = getSlot(id);
  const b = slot ? state.bookings[slot.id] : undefined;
  // Cancelar no se deshace (la plaza pasa a otro): dos toques, como borrar.
  const confirm = useConfirmar(4000);
  const now = Date.now();
  if (!slot || !b) return <Vacio title="Mover o cancelar" note="Esta reserva ya no está" />;
  const late = isLate(slot, now);
  // Tarde y con plaza confirmada se cobra como clase; salir de la lista de espera nunca cuesta.
  const charge = late && b.status === 'confirmed' ? PRICES[slot.mode] : 0;
  const what = b.status === 'waitlist' ? 'Salir de la lista' : 'Cancelar clase';
  const options = moveOptions(slot, now);
  const sameDay = (t: number) => dayStart(t) === dayStart(slot.start);
  const where = slot.room ? ` · Sala ${slot.room}` : '';

  return (
    <View style={{ flex: 1, backgroundColor: color.tinta, justifyContent: 'flex-end' }}>
      <Pulsable onPress={close} scaleTo={1} accessibilityRole="button" accessibilityLabel="Cerrar" style={{ flex: 1 }} />
      <Animated.View
        entering={SHEET}
        style={{ backgroundColor: color.fondo, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: space.s8, paddingHorizontal: space.s16, paddingBottom: space.s16 + insets.bottom, gap: space.s8 }}
      >
        <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: radius.pill, backgroundColor: color.linea, marginBottom: space.s16 }} />
        <View style={{ paddingHorizontal: space.s8, paddingBottom: space.s16, gap: space.s8 }}>
          <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
            {slot.name}
          </KText>
          <KText size={texto.texto} tint={color.texto2}>{`${cap(shortDay(slot.start))} · ${hhmm(slot.start)}${where}`}</KText>
        </View>

        {options.length > 0 && (
          <View style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, padding: space.s16, gap: space.s12 }}>
            <KText size={texto.etiqueta} caps tint={color.texto2}>
              Mover a
            </KText>
            <View style={{ flexDirection: 'row', gap: space.s8 }}>
              {options.map((o) => {
                const label = sameDay(o.start) ? hhmm(o.start) : `${weekdayShort(o.start)} ${hhmm(o.start).replace(/^0/, '')}`;
                const free = o.cap > 0 ? Math.round(((o.cap - o.taken) / o.cap) * 6) : 6;
                return (
                  <Pulsable
                    key={o.id}
                    onPress={() => {
                      const r = move(slot, o);
                      if (r.ok) router.replace({ pathname: '/reserva/[id]', params: { id: o.id } });
                    }}
                    haptic="success"
                    accessibilityRole="button"
                    accessibilityLabel={`Mover a ${label}`}
                    style={{ flex: 1, height: touch.fila, borderRadius: inner(radius.lg, space.s8), backgroundColor: color.fondo, padding: space.s12, justifyContent: 'space-between' }}
                  >
                    <KText size={texto.bloque} lineHeight={22}>
                      {label}
                    </KText>
                    <View style={{ flexDirection: 'row', gap: space.s4 }} accessibilityLabel={`${o.cap - o.taken} plazas libres`}>
                      {Array.from({ length: 6 }, (_, i) => (
                        <Animated.View key={i} style={{ ...transicionPunto, width: 8, height: 8, borderRadius: 4, backgroundColor: i < 6 - free ? color.tinta : color.linea }} />
                      ))}
                    </View>
                  </Pulsable>
                );
              })}
            </View>
          </View>
        )}

        {late ? (
          <View style={{ backgroundColor: color.tinteNaranja, borderRadius: radius.lg, padding: space.s16, flexDirection: 'row', alignItems: 'center', gap: space.s16 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: color.naranja, alignItems: 'center', justifyContent: 'center' }}>
              <KText size={texto.bloque}>!</KText>
            </View>
            <KText size={texto.texto} lineHeight={20} style={{ flex: 1 }}>
              {charge ? `Faltan menos de ${FREE_CANCEL_H} h.\nCancelar cuenta como clase: ${charge} €.` : `Faltan menos de ${FREE_CANCEL_H} h.\nSalir de la lista no cuesta nada.`}
            </KText>
          </View>
        ) : (
          <KText size={texto.texto} tint={color.texto2} style={{ paddingHorizontal: space.s8, paddingVertical: space.s8 }}>
            {`Cancelar es gratis hasta las ${hhmm(cancelDeadline(slot))}.`}
          </KText>
        )}

        <Pulsable
          onPress={() =>
            confirm.press(() => {
              const r = cancel(slot);
              if (r.ok) router.replace('/agenda');
            })
          }
          haptic={confirm.armed ? 'medium' : 'light'}
          scaleTo={0.98}
          accessibilityRole="button"
          accessibilityLabel={confirm.armed ? `Confirmar: ${what.toLowerCase()}${charge ? `, se cobran ${charge} euros` : ''}` : what}
          // Armado, naranja (actuar) con texto en tinta, como en Borrar cuenta.
          style={{ height: touch.fila, borderRadius: radius.xl, backgroundColor: confirm.armed ? color.naranja : color.tinta, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.s16 }}
        >
          {!confirm.armed && <StopIcon />}
          <KText size={texto.bloque} tint={confirm.armed ? color.tinta : color.tarjeta}>
            {confirm.armed ? (charge ? `Toca otra vez · ${charge} €` : 'Toca otra vez') : what}
          </KText>
        </Pulsable>
      </Animated.View>
    </View>
  );
}
