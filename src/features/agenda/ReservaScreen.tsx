/** Tu reserva (KR4Booking): todo lo que necesitas para llegar. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraAccion } from '@/components/BarraAccion';
import { CheckIcon } from '@/components/icons';
import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { Vacio } from '@/components/Vacio';
import { MODES, cancelDeadline, getSlot, hhmm, isLate, longDay, relativeDay, takenWithMe } from '@/agenda/model';
import { useAgenda } from '@/agenda/store';
import { addToCalendar } from '@/platform/calendar';
import { session } from '@/session/store';
import { cifra, color, inner, layout, radius, space, texto, arriba } from '@/theme';
import { CabeceraAgenda, Cruz, Flecha, IconoModo, MODE_TINT, Ocupacion } from './piezas';

/** «Llego» aparece desde 1 h antes hasta que acaba la clase. */
const ARRIVE_WINDOW_MS = 3600_000;

export function ReservaScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useAgenda();
  const slot = getSlot(id);
  const b = slot ? state.bookings[slot.id] : undefined;
  const [added, setAdded] = useState(false);
  const now = Date.now();

  if (!slot || !b) return <Vacio title="Tu reserva" note="Esta reserva ya no está" />;

  const tint = MODE_TINT[slot.mode];
  const waiting = b.status === 'waitlist';
  const deadline = cancelDeadline(slot);
  const late = isLate(slot, now);
  const windowLeft = Math.max(0, Math.min(1, (deadline - now) / Math.max(1, deadline - b.bookedAt)));
  const canArrive = !waiting && slot.room && now > slot.start - ARRIVE_WINDOW_MS && now < slot.start + slot.minutes * 60_000;
  const bring = slot.bring;

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo, paddingTop: arriba(insets.top, layout.pantallaArriba), paddingBottom: space.s16 + insets.bottom }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: layout.pantallaLado, gap: layout.entreTarjetas, paddingBottom: space.s8 }}>
        <CabeceraAgenda
          back
          right={
            <KText size={texto.texto} tint={color.texto2}>
              {longDay(slot.start)}
            </KText>
          }
        />
        <View style={{ padding: space.s8, gap: space.s8 }}>
          <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
            {waiting ? 'En espera' : 'Tu reserva'}
          </KText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s8 }}>
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: waiting ? color.naranja : color.verde, alignItems: 'center', justifyContent: 'center' }}>
              {!waiting && <CheckIcon size={12} tint={color.tarjeta} />}
            </View>
            <KText size={texto.texto} tint={waiting ? color.naranja : color.verde}>
              {waiting ? `Eres el ${b.position}º · ${relativeDay(slot.start, now)}` : `Confirmada · ${relativeDay(slot.start, now)}`}
            </KText>
          </View>
        </View>

        <View accessibilityLabel="Clase" style={{ height: 152, backgroundColor: tint.soft, borderRadius: radius.lg, padding: space.s16, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s12 }}>
              <IconoModo mode={slot.mode} tint={slot.mode === 'online' ? color.klein : color.tinta} />
              <KText size={texto.etiqueta} caps>
                {MODES[slot.mode].label}
              </KText>
            </View>
            <View style={{ height: 28, paddingHorizontal: space.s12, borderRadius: radius.pill, backgroundColor: color.tinta, justifyContent: 'center' }}>
              <KText size={texto.etiqueta} tint={color.tarjeta}>{`${slot.minutes} min`}</KText>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <KText size={texto.boton} lineHeight={texto.boton}>
              {slot.name}
            </KText>
            <KText size={cifra.c55} weight={300} tabular lineHeight={Math.round(cifra.c55 * 0.9)}>
              {hhmm(slot.start)}
            </KText>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: space.s8 }}>
          {slot.room ? (
            <Celda title="Sala">
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: color.tinta, alignItems: 'center', justifyContent: 'center' }}>
                  <KText size={cifra.c34} weight={300} tint={color.tarjeta} lineHeight={cifra.c34}>
                    {String(slot.room)}
                  </KText>
                </View>
                <KText size={texto.etiqueta} tint={color.texto2}>{`Planta ${slot.floor}`}</KText>
              </View>
            </Celda>
          ) : (
            <Celda title="En directo">
              <KText size={texto.texto}>Se abre aquí 5 min antes</KText>
            </Celda>
          )}
          <Celda title={slot.mode === 'grupo' ? `Plazas · ${takenWithMe(slot, state)}/${slot.cap}` : slot.mode === 'solo' ? 'Con tu coach' : 'Conectados'}>
            {slot.mode === 'solo' ? (
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: color.tinta, alignItems: 'center', justifyContent: 'center' }}>
                <KText size={texto.lista} tint={color.tarjeta}>
                  {session.coach.initial}
                </KText>
              </View>
            ) : slot.mode === 'online' ? (
              <KText size={cifra.c34} weight={300} lineHeight={cifra.c34}>
                {String(takenWithMe(slot, state))}
              </KText>
            ) : (
              <Ocupacion slot={slot} state={state} size={14} />
            )}
          </Celda>
        </View>

        <View style={{ flexDirection: 'row', gap: space.s8 }}>
          {slot.directions && (
            <Celda title="Cómo llegar">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s12 }}>
                <View style={{ width: 40, height: 40, borderRadius: inner(radius.lg, space.s12), backgroundColor: color.fondo, alignItems: 'center', justifyContent: 'center' }}>
                  <Flecha dir="up-right" />
                </View>
                <KText size={texto.texto} style={{ flex: 1 }} lineHeight={18}>
                  {slot.directions}
                </KText>
              </View>
            </Celda>
          )}
          <Celda title={late ? 'Fuera de plazo' : 'Cancela hasta'}>
            <View style={{ gap: space.s8 }}>
              <KText size={texto.boton} weight={300} lineHeight={texto.boton} tint={late ? color.naranja : color.tinta}>
                {late ? 'Cuenta como clase' : hhmm(deadline)}
              </KText>
              <View style={{ height: space.s8, borderRadius: radius.pill, backgroundColor: color.hundido, overflow: 'hidden' }}>
                <View style={{ width: `${windowLeft * 100}%`, height: space.s8, borderRadius: radius.pill, backgroundColor: color.verde }} />
              </View>
            </View>
          </Celda>
        </View>

        <View accessibilityLabel="Qué llevar" style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, padding: space.s16, gap: space.s12 }}>
          <KText size={texto.etiqueta} caps tint={color.texto2}>
            Qué llevar
          </KText>
          <View style={{ flexDirection: 'row' }}>
            {bring.map((x) => (
              <View key={x.label} style={{ flex: 1, alignItems: 'center', gap: space.s8 }}>
                <View style={{ width: space.s32, height: space.s32, borderRadius: space.s16, backgroundColor: x.provided ? 'transparent' : color.tinta, borderWidth: x.provided ? 2 : 0, borderColor: color.tinta }} />
                <KText size={texto.etiqueta} tint={x.provided ? color.texto2 : color.tinta}>
                  {x.provided ? `${x.label}*` : x.label}
                </KText>
              </View>
            ))}
          </View>
          {bring.some((x) => x.provided) && (
            <KText size={texto.etiqueta} tint={color.texto2}>
              * La pone el centro
            </KText>
          )}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: layout.pantallaLado, gap: space.s8 }}>
        {canArrive && <BarraAccion label="Llego" onPress={() => router.push({ pathname: '/reserva/[id]/llego', params: { id: slot.id } })} />}
        <View style={{ flexDirection: 'row', gap: space.s8 }}>
          {!waiting && (
            <Pulsable
              onPress={async () => setAdded(await addToCalendar({ title: `${slot.name} · KRAFT`, start: slot.start, minutes: slot.minutes, location: slot.room ? `Sala ${slot.room}` : 'En directo', notes: slot.directions }))}
              haptic="light"
              scaleTo={0.98}
              accessibilityRole="button"
              style={{ flex: 1, height: 56, borderRadius: radius.pill, backgroundColor: added ? color.verde : color.tinta, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.s8 }}
            >
              {added && <CheckIcon size={18} tint={color.tarjeta} />}
              <KText size={texto.texto} tint={color.tarjeta}>
                {added ? 'En tu calendario' : 'Añadir a mi calendario'}
              </KText>
            </Pulsable>
          )}
          <Pulsable
            onPress={() => router.push({ pathname: waiting ? '/reserva/[id]/espera' : '/reserva/[id]/cambiar', params: { id: slot.id } })}
            accessibilityRole="button"
            accessibilityLabel={waiting ? 'Lista de espera' : 'Mover o cancelar'}
            style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: color.tarjeta, alignItems: 'center', justifyContent: 'center', ...(waiting && { flex: 1 }) }}
          >
            {waiting ? <KText size={texto.texto}>Lista de espera</KText> : <Cruz />}
          </Pulsable>
        </View>
      </View>
    </View>
  );
}

function Celda({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ flex: 1, height: 128, backgroundColor: color.tarjeta, borderRadius: radius.lg, padding: space.s16, justifyContent: 'space-between' }}>
      <KText size={texto.etiqueta} caps tint={color.texto2}>
        {title}
      </KText>
      {children}
    </View>
  );
}

