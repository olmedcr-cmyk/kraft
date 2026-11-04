/** Bitácora (KR6Diary): el mes en círculos y lo que debes. */
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { Segmentado } from '@/components/Segmentado';
import { MODES, dayStart, getSlot, isoDay, type Mode } from '@/agenda/model';
import { useAgenda } from '@/agenda/store';
import {
  bill,
  dueDate,
  monthGrid,
  monthKey,
  monthName,
  monthStart,
  monthStatus,
  PRICES,
  shiftMonth,
  trained,
  trainedDays,
  type DayLog,
  type MonthStatus,
} from '@/diario/model';
import { useDiary } from '@/diario/store';
import { cifra, color, layout, radius, space, texto, transicionFondo, transicionPunto } from '@/theme';
import { CabeceraDiario, MODE_TINT, PuntoModo, modeLabel } from './piezas';

const LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const CELL = 32;
const MONTH_SHORT = (key: string) => monthName(key).slice(0, 3);

export function DiarioScreen() {
  const insets = useSafeAreaInsets();
  const diary = useDiary();
  const agenda = useAgenda();
  const now = Date.now();
  const current = monthKey(now);
  const previous = shiftMonth(current, -1);
  // Si el mes pasado está por pagar, se abre ahí.
  const [month, setMonth] = useState(() => (monthStatus(diary, previous, now) === 'a-pagar' ? previous : current));
  const [sel, setSel] = useState<number>(() => defaultDay(diary.days, month, now));

  const pick = (m: string) => {
    setMonth(m);
    setSel(defaultDay(diary.days, m, now));
  };

  // Reservas confirmadas del mes a las que aún no has llegado.
  const booked = useMemo(() => {
    const out: Record<string, Mode> = {};
    for (const b of Object.values(agenda.bookings)) {
      const s = getSlot(b.slotId);
      if (s && b.status === 'confirmed' && !b.arrived && monthKey(s.start) === month) out[isoDay(s.start)] = s.mode;
    }
    return out;
  }, [agenda, month]);

  const { offset, len } = monthGrid(month);
  const base = monthStart(month);
  const todayIso = isoDay(now);
  const days = trainedDays(diary, month);
  const selIso = isoDay(new Date(base).setDate(sel));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.fondo }}
      contentContainerStyle={{ paddingTop: Math.max(insets.top, layout.pantallaArriba), paddingHorizontal: layout.pantallaLado, gap: layout.entreTarjetas, paddingBottom: space.s8 }}
    >
      <View style={{ paddingHorizontal: space.s8 }}>
        <CabeceraDiario
          label="Diario"
          right={
            <Pulsable onPress={() => router.push('/diario/progreso')} accessibilityRole="link" hitSlop={12}>
              <KText size={texto.texto} tint={color.texto2}>
                Gráficas →
              </KText>
            </Pulsable>
          }
        />
      </View>

      <View style={{ padding: space.s8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View style={{ gap: space.s8 }}>
          <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
            Bitácora
          </KText>
          <KText size={texto.texto} tint={color.texto2}>
            {days === 1 ? '1 día entrenado' : `${days} días entrenados`}
          </KText>
        </View>
        <View style={{ width: 104 }}>
          <Segmentado
            label="Mes"
            options={[previous, current].map((k) => ({ value: k, label: MONTH_SHORT(k) }))}
            value={month}
            onChange={pick}
            track={color.tarjeta}
            selected={color.tinta}
            selectedText={color.tarjeta}
            itemHeight={40}
            caps
          />
        </View>
      </View>

      <View accessibilityLabel="Días del mes" style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, padding: space.s16, gap: space.s12 }}>
        <View style={{ flexDirection: 'row' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {LETTERS.map((l) => (
            <KText key={l} size={texto.etiqueta} tint={color.texto2} style={{ flex: 1, textAlign: 'center' }}>
              {l}
            </KText>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: space.s4 }}>
          {Array.from({ length: offset }, (_, i) => (
            <View key={`b${i}`} style={{ width: `${100 / 7}%`, height: CELL }} />
          ))}
          {Array.from({ length: len }, (_, i) => {
            const d = i + 1;
            const iso = isoDay(new Date(base).setDate(d));
            return (
              <Dia
                key={iso}
                n={d}
                log={diary.days[iso]}
                booked={booked[iso]}
                today={iso === todayIso}
                on={d === sel}
                monthLabel={monthName(month)}
                onPress={() => setSel(d)}
              />
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: color.fondo, paddingTop: space.s12, gap: space.s8 }}>
          <View style={{ flexDirection: 'row', gap: space.s12 }}>
            {(Object.keys(MODES) as Mode[]).map((m) => (
              <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: space.s4 }}>
                <PuntoModo mode={m} />
                <KText size={texto.etiqueta} tint={color.texto2}>
                  {modeLabel(m)}
                </KText>
              </View>
            ))}
          </View>
          <KText size={texto.etiqueta} numberOfLines={1} style={{ flexShrink: 1 }} accessibilityLiveRegion="polite">
            {detail(sel, MONTH_SHORT(month), diary.days[selIso], booked[selIso])}
          </KText>
        </View>
      </View>

      <Pago month={month} status={monthStatus(diary, month, now)} />
    </ScrollView>
  );
}

/** Mes en curso: hoy. Mes pasado: el último día entrenado. */
function defaultDay(days: Record<string, DayLog>, key: string, now: number) {
  if (key === monthKey(now)) return new Date(now).getDate();
  const last = Object.keys(days)
    .filter((d) => d.startsWith(key) && trained(days[d]))
    .sort()
    .pop();
  return last ? Number(last.slice(8, 10)) : 1;
}

function detail(d: number, mon: string, log: DayLog | undefined, booked: Mode | undefined) {
  const head = `${d} ${mon} · `;
  if (log?.class?.late) return `${head}Cancelada tarde · ${PRICES[log.class.mode]} €`;
  if (log?.class) return `${head}${modeLabel(log.class.mode)} · ${PRICES[log.class.mode]} €`;
  if (log?.own) return `${head}Por tu cuenta · ${log.own.minutes} min`;
  if (booked) return `${head}Reservado · ${modeLabel(booked)}`;
  return `${head}Sin entreno`;
}

function Dia({ n, log, booked, today, on, monthLabel, onPress }: { n: number; log?: DayLog; booked?: Mode; today: boolean; on: boolean; monthLabel: string; onPress: () => void }) {
  const k = log?.class?.mode;
  let bg = 'transparent';
  let fg = color.texto2;
  let bd = color.hundido;
  if (k) {
    bg = MODE_TINT[k].bg;
    fg = MODE_TINT[k].fg;
    bd = bg;
  } else if (log?.own) {
    bg = color.hundido;
    fg = color.tinta;
  } else if (booked) {
    bg = color.tarjeta;
    fg = color.tinta;
    bd = MODE_TINT[booked].bg;
  }
  if (today && !k) bd = color.naranja;
  const aria = `${n} de ${monthLabel}${k ? `, ${log?.class?.late ? 'cancelada tarde' : 'entrenado'} ${modeLabel(k)}` : log?.own ? ', por tu cuenta' : ''}${booked ? `, reservado ${modeLabel(booked)}` : ''}${today ? ', hoy' : ''}`;
  return (
    <Pulsable
      onPress={onPress}
      haptic={on ? undefined : 'selection'}
      accessibilityRole="button"
      accessibilityLabel={aria}
      accessibilityState={{ selected: on }}
      style={{ width: `${100 / 7}%`, height: CELL + space.s4, marginBottom: -space.s4, alignItems: 'center', justifyContent: 'flex-start' }}
    >
      <Animated.View style={{ ...transicionPunto, width: CELL, height: CELL, borderRadius: CELL / 2, borderWidth: 2, borderColor: bd, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <KText size={texto.etiqueta} tint={fg}>
          {String(n)}
        </KText>
      </Animated.View>
      {/* Elegido: anillo de tinta separado 2 px. */}
      <Animated.View
        pointerEvents="none"
        style={{ ...transicionPunto, position: 'absolute', top: -4, width: CELL + 8, height: CELL + 8, borderRadius: (CELL + 8) / 2, borderWidth: 2, borderColor: on ? color.tinta : 'transparent' }}
      />
    </Pulsable>
  );
}

const STYLE: Record<MonthStatus, { bg: string; fg: string; btnBg: string; btnFg: string; dot: string }> = {
  'a-pagar': { bg: color.tinta, fg: color.tarjeta, btnBg: color.naranja, btnFg: color.tinta, dot: color.tinta },
  'en-curso': { bg: color.tarjeta, fg: color.tinta, btnBg: color.fondo, btnFg: color.texto2, dot: color.linea },
  nada: { bg: color.tarjeta, fg: color.tinta, btnBg: color.fondo, btnFg: color.texto2, dot: color.linea },
  pagado: { bg: color.verde, fg: color.tarjeta, btnBg: color.tarjeta, btnFg: color.verde, dot: color.verde },
};

/** Pago del mes: por pagar (tinta, actuar en naranja), en curso (blanco) o pagado (verde). */
function Pago({ month, status }: { month: string; status: MonthStatus }) {
  const diary = useDiary();
  const b = bill(diary, month);
  const st = STYLE[status];
  const name = monthName(month);
  const lastDay = monthGrid(month).len;
  const due = new Date(dueDate(month));
  const head = {
    'a-pagar': [`A pagar · ${name}`, `Vence ${due.getDate()} ${MONTH_SHORT(shiftMonth(month, 1))}`],
    'en-curso': [`En curso · ${name}`, `Se cobra el ${lastDay}`],
    nada: [`Sin clases · ${name}`, ''],
    pagado: [`Pagado · ${name}`, 'Gracias'],
  }[status];
  const btn = {
    'a-pagar': `Pagar ${b.amount} €`,
    'en-curso': 'Se cobra a fin de mes',
    nada: 'Nada que pagar',
    pagado: 'Recibo enviado',
  }[status];
  const go =
    status === 'a-pagar'
      ? () => router.push({ pathname: '/pago/[mes]', params: { mes: month } })
      : status === 'pagado'
        ? () => router.push({ pathname: '/pago/[mes]/recibo', params: { mes: month } })
        : undefined;

  const btnStyle = { height: 56, borderRadius: radius.pill, backgroundColor: st.btnBg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.s12 } as const;
  const btnInner = (
    <>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: st.dot }} />
      <KText size={texto.texto} tint={st.btnFg}>
        {btn}
      </KText>
    </>
  );

  return (
    <Animated.View accessibilityLabel="Pago del mes" style={{ ...transicionFondo, backgroundColor: st.bg, borderRadius: radius.lg, padding: space.s16, gap: space.s12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', opacity: 0.75 }}>
        <KText size={texto.etiqueta} caps tint={st.fg}>
          {head[0]}
        </KText>
        <KText size={texto.etiqueta} tint={st.fg}>
          {head[1]}
        </KText>
      </View>
      <KText size={cifra.c55} weight={300} tint={st.fg} lineHeight={cifra.c55}>{`${b.amount} €`}</KText>
      {b.lines.length > 0 && (
        <View style={{ gap: space.s4 }}>
          {b.lines.map((l) => (
            <View key={l.mode} style={{ flexDirection: 'row', alignItems: 'center', gap: space.s8 }}>
              <PuntoModo mode={l.mode} on={st.bg} />
              <KText size={texto.texto} tint={st.fg} style={{ flex: 1 }}>{`${l.count} × ${modeLabel(l.mode)} · ${l.price} €`}</KText>
              <KText size={texto.texto} tint={st.fg}>{`${l.total} €`}</KText>
            </View>
          ))}
        </View>
      )}
      {go ? (
        <Pulsable onPress={go} haptic={status === 'a-pagar' ? 'light' : undefined} scaleTo={0.98} accessibilityRole="button" accessibilityLabel={btn} style={btnStyle}>
          {btnInner}
        </Pulsable>
      ) : (
        // Sin nada que hacer aún: es estado, no un botón apagado.
        <View accessibilityLabel={btn} style={btnStyle}>
          {btnInner}
        </View>
      )}
    </Animated.View>
  );
}
