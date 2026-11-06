/** Agenda (KR4Agenda): modalidad, día y clase. Un toque en «+» y reservado. */
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon } from '@/components/icons';
import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import {
  MODES,
  addDays,
  dayStart,
  hhmm,
  isClosed,
  isFull,
  isPast,
  slotsFor,
  takenWithMe,
  upcomingBookings,
  weekStart,
  weekday,
  type AgendaState,
  type Mode,
  type Slot,
} from '@/agenda/model';
import { book, useAgenda } from '@/agenda/store';
import { Fundido } from '@/components/Fundido';
import { cifra, color, fundido, inner, layout, radius, space, texto, touch, transicionPunto, arriba } from '@/theme';
import { CabeceraAgenda, Flecha, IconoModo, MODE_TINT, Mas, Ocupacion } from './piezas';

const LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function AgendaScreen() {
  const insets = useSafeAreaInsets();
  const state = useAgenda();
  const now = Date.now();
  const today = dayStart(now);
  const [mode, setMode] = useState<Mode>('grupo');
  // Por defecto, el día de tu próxima reserva (o hoy).
  const [day, setDay] = useState(() => {
    const next = upcomingBookings(state, now)[0];
    return next ? dayStart(next.slot.start) : isClosed(today) ? addDays(today, 1) : today;
  });

  // `state` también: con servidor, cuando llegan las clases se vuelve a pintar.
  const slots = useMemo(() => slotsFor(day, mode), [day, mode, state]);
  const next = upcomingBookings(state, now).find((x) => x.booking.status === 'confirmed');
  const mineHere = slots.find((s) => state.bookings[s.id]?.status === 'confirmed');

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: arriba(insets.top, layout.pantallaArriba), paddingHorizontal: layout.pantallaLado, gap: layout.entreTarjetas, paddingBottom: fundido }}>
        <CabeceraAgenda
          right={
            next ? (
              <Pulsable
                onPress={() => router.push({ pathname: '/reserva/[id]/cambiar', params: { id: next.slot.id } })}
                accessibilityRole="link"
                hitSlop={12}
              >
                <KText size={texto.texto} tint={color.texto2}>
                  Mover o cancelar →
                </KText>
              </Pulsable>
            ) : null
          }
        />

        <View style={{ padding: space.s8, gap: space.s8 }}>
          <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
            Reservar
          </KText>
          <KText size={texto.texto} tint={color.texto2}>
            ¿Cómo entrenas hoy?
          </KText>
        </View>

        <View accessibilityRole="radiogroup" accessibilityLabel="Modalidad" style={{ flexDirection: 'row', gap: space.s8 }}>
          {(Object.keys(MODES) as Mode[]).map((m) => {
            const on = m === mode;
            const t = MODE_TINT[m];
            return (
              <Pulsable
                key={m}
                onPress={() => setMode(m)}
                haptic={on ? undefined : 'selection'}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${MODES[m].label}, ${MODES[m].sub}`}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  borderRadius: radius.lg,
                  padding: space.s16,
                  backgroundColor: on ? t.bg : color.tarjeta,
                  justifyContent: 'space-between',
                }}
              >
                <IconoModo mode={m} tint={on ? (m === 'grupo' ? color.tinta : color.tarjeta) : t.bg} />
                <View style={{ gap: 2 }}>
                  <KText size={texto.lista} weight={500} tint={on ? t.fg : color.tinta}>
                    {MODES[m].label}
                  </KText>
                  <KText size={texto.etiqueta} tint={on ? t.fg : color.texto2} numberOfLines={2}>
                    {MODES[m].sub}
                  </KText>
                </View>
              </Pulsable>
            );
          })}
        </View>

        <Semana day={day} today={today} state={state} onPick={setDay} />

        {slots.length === 0 ? (
          <View style={{ height: touch.fila, borderRadius: radius.xl, borderWidth: 2, borderStyle: 'dashed', borderColor: color.linea, alignItems: 'center', justifyContent: 'center' }}>
            <KText size={texto.texto} tint={color.texto2}>
              Cerrado
            </KText>
          </View>
        ) : (
          slots.map((s) => <Fila key={s.id} slot={s} state={state} now={now} />)
        )}
      </ScrollView>
      <Fundido lado="arriba" alto={insets.top + fundido} />
      <Fundido lado="abajo" />
      </View>

      {mineHere && (
        <View style={{ paddingHorizontal: layout.pantallaLado, paddingBottom: space.s8 }}>
          <Pulsable
            onPress={() => router.push({ pathname: '/reserva/[id]', params: { id: mineHere.id } })}
            scaleTo={0.98}
            accessibilityRole="button"
            style={{ height: 56, borderRadius: radius.pill, backgroundColor: color.verde, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: space.s24, paddingRight: space.s8 }}
          >
            <KText size={texto.texto} tint={color.tarjeta}>{`Tu reserva · ${MODES[mode].label} · ${hhmm(mineHere.start)}`}</KText>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: color.tarjeta, alignItems: 'center', justifyContent: 'center' }}>
              <Flecha />
            </View>
          </Pulsable>
        </View>
      )}
    </View>
  );
}

function Semana({ day, today, state, onPick }: { day: number; today: number; state: AgendaState; onPick: (d: number) => void }) {
  const monday = weekStart(today);
  const pad = space.s8;
  return (
    <View accessibilityLabel="Día" style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, padding: pad, flexDirection: 'row', gap: space.s4 }}>
      {LETTERS.map((l, i) => {
        const d = addDays(monday, i);
        const on = d === day;
        const closed = isClosed(d);
        const past = d < today;
        const has = Object.keys(state.bookings).some((k) => k.includes(`-${isoOf(d)}-`));
        const mark = d === today ? color.naranja : has ? (on ? color.tarjeta : color.tinta) : 'transparent';
        const n = new Date(d).getDate();
        return (
          <Pulsable
            key={l}
            disabled={closed || past}
            onPress={() => onPick(d)}
            haptic={on ? undefined : 'selection'}
            accessibilityRole="button"
            accessibilityState={{ selected: on, disabled: closed || past }}
            accessibilityLabel={`${weekday(d)} ${n}${d === today ? ', hoy' : ''}${has ? ', con reserva' : ''}${closed ? ', cerrado' : ''}`}
            style={{
              flex: 1,
              height: 56,
              borderRadius: inner(radius.lg, pad),
              backgroundColor: on ? color.tinta : closed ? color.fondo : color.tarjeta,
              alignItems: 'center',
              justifyContent: 'center',
              gap: space.s4,
            }}
          >
            <KText size={texto.etiqueta} tint={on ? color.tarjeta : closed || past ? color.texto2 : color.tinta}>
              {l}
            </KText>
            <KText size={texto.lista} tint={on ? color.tarjeta : closed || past ? color.texto2 : color.tinta}>
              {String(n)}
            </KText>
            <Animated.View style={{ ...transicionPunto, position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: 2, backgroundColor: mark }} />
          </Pulsable>
        );
      })}
    </View>
  );
}

const isoOf = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function Fila({ slot, state, now }: { slot: Slot; state: AgendaState; now: number }) {
  const b = state.bookings[slot.id];
  const mine = b?.status === 'confirmed';
  const waiting = b?.status === 'waitlist';
  const full = isFull(slot) && !mine;
  const past = isPast(slot, now);
  const name = slot.mode === 'online' ? `${slot.name} · ${slot.minutes} min · ${takenWithMe(slot, state)} en línea` : `${slot.name} · ${slot.room ? `Sala ${slot.room}` : ''}`;

  const open = () => {
    if (mine) router.push({ pathname: '/reserva/[id]', params: { id: slot.id } });
    else if (full || waiting) router.push({ pathname: '/reserva/[id]/espera', params: { id: slot.id } });
  };
  const act = () => {
    if (mine || full || waiting) return open();
    book(slot);
  };

  const btnBg = mine ? color.verde : waiting ? color.naranja : full || past ? color.hundido : color.tarjeta;
  const btnBd = mine ? color.verde : waiting ? color.naranja : full || past ? color.hundido : color.tinta;

  return (
    <View style={{ height: touch.tecla, borderRadius: radius.pill, backgroundColor: color.tarjeta, flexDirection: 'row', alignItems: 'center', gap: space.s12, paddingVertical: space.s8, paddingRight: space.s8, paddingLeft: space.s24 }}>
      <Pulsable
        onPress={open}
        scaleTo={mine || full || waiting ? 0.99 : 1}
        accessibilityRole={mine || full || waiting ? 'button' : 'text'}
        accessibilityLabel={`${hhmm(slot.start)}, ${name}`}
        style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: space.s12 }}
      >
        <View style={{ flex: 1, minWidth: 0, gap: space.s4 }}>
          <KText size={texto.lista} weight={500} tint={past ? color.texto2 : color.tinta}>
            {hhmm(slot.start)}
          </KText>
          <KText size={texto.etiqueta} tint={color.texto2} numberOfLines={1}>
            {name}
          </KText>
        </View>
        <Ocupacion slot={slot} state={state} />
      </Pulsable>
      <Pulsable
        onPress={act}
        disabled={past}
        haptic={mine || full || waiting ? undefined : 'success'}
        accessibilityRole="button"
        accessibilityLabel={mine ? `Tu reserva de las ${hhmm(slot.start)}` : waiting ? 'En lista de espera' : full ? 'Llena · lista de espera' : `Reservar ${hhmm(slot.start)}`}
        hitSlop={8}
        style={{ width: touch.dedo, height: touch.dedo, borderRadius: touch.dedo / 2, borderWidth: 2, borderColor: btnBd, backgroundColor: btnBg, alignItems: 'center', justifyContent: 'center' }}
      >
        {mine ? (
          <CheckIcon size={20} tint={color.tarjeta} />
        ) : waiting ? (
          <KText size={texto.texto} weight={500}>{`${b.position}º`}</KText>
        ) : (
          <Mas tint={full || past ? color.texto2 : color.tinta} />
        )}
      </Pulsable>
    </View>
  );
}
