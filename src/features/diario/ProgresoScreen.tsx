/** Progreso (KR6Data): 8 semanas en círculos, esta semana en barras y tres cifras. */
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { CIRCLE_MIN, COL_ROWS, streakWeeks, totals, trend, weekColumns, weekDays, weeksMinutes } from '@/diario/model';
import { useDiary } from '@/diario/store';
import { Fundido } from '@/components/Fundido';
import { alpha, cifra, color, fundido, layout, motion, ms, radius, space, texto, transicionPunto } from '@/theme';
import { CabeceraDiario } from './piezas';

const LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const BAR_MAX = 120;
const BAR_MIN = 32;
/** Una barra llena = 60 minutos. */
const BAR_FULL_MIN = 60;
const STREAK_DOTS = 6;

export function ProgresoScreen() {
  const insets = useSafeAreaInsets();
  const diary = useDiary();
  const now = Date.now();
  const weeks = weeksMinutes(diary, now);
  const pct = trend(weeks);
  const days = weekDays(diary, now);
  const today = (new Date(now).getDay() + 6) % 7;
  const [day, setDay] = useState(today);
  const streak = streakWeeks(diary, now);
  const { sessions, tabatas } = totals(diary, now);
  const circles = (m: number) => Math.round(m / CIRCLE_MIN);
  const dots = Math.min(STREAK_DOTS, Math.max(1, streak));

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: Math.max(insets.top, layout.pantallaArriba), paddingHorizontal: layout.pantallaLado, paddingBottom: fundido, gap: space.s16 }}
    >
      <CabeceraDiario
        label="Datos"
        back
        right={
          <KText size={texto.texto} tint={color.texto2}>
            Últimas 8 semanas
          </KText>
        }
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View style={{ gap: space.s8 }}>
          <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
            Progreso
          </KText>
          <KText size={texto.texto} tint={color.texto2}>{`Un círculo = ${CIRCLE_MIN} minutos`}</KText>
        </View>
        <KText size={cifra.c34} weight={300} lineHeight={cifra.c34} accessibilityLabel={`${pct >= 0 ? 'Sube' : 'Baja'} un ${Math.abs(pct)} % frente a las 4 semanas anteriores`}>
          {`${pct > 0 ? '+' : pct < 0 ? '−' : ''}${Math.abs(pct)}%`}
        </KText>
      </View>

      <View accessibilityLabel="Minutos por semana" style={{ backgroundColor: color.tinta, borderRadius: radius.lg, padding: space.s16, gap: space.s16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <KText size={texto.etiqueta} caps tint={color.linea}>
            Minutos entrenados
          </KText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.naranja }} />
            <KText size={texto.etiqueta} tint={color.linea}>
              esta semana
            </KText>
          </View>
        </View>
        <View
          accessibilityRole="image"
          accessibilityLabel={`Minutos por semana, de la más antigua a esta: ${weeks.join(', ')}`}
          style={{ flexDirection: 'row', gap: space.s4, alignItems: 'flex-end' }}
        >
          {weeks.flatMap((m, w) =>
            weekColumns(m).map((h, c) => {
              const current = w === weeks.length - 1;
              return (
                <View key={`${w}-${c}`} style={{ flex: 1, gap: space.s4 }}>
                  {Array.from({ length: COL_ROWS }, (_, r) => {
                    const fromBottom = COL_ROWS - 1 - r;
                    const bg = fromBottom < h ? (current && fromBottom === h - 1 ? color.naranja : color.tarjeta) : fromBottom === h ? alpha.sobreColor : alpha.tarjetaSobreColor;
                    return <Animated.View key={r} style={{ ...transicionPunto, aspectRatio: 1, borderRadius: radius.pill, backgroundColor: bg }} />;
                  })}
                </View>
              );
            }),
          )}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {['S1', 'S4', 'S8'].map((l) => (
            <KText key={l} size={texto.etiqueta} tint={color.linea}>
              {l}
            </KText>
          ))}
        </View>
      </View>

      <View accessibilityLabel="Esta semana" style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, padding: space.s16, gap: space.s16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.s8 }}>
          <KText size={texto.etiqueta} caps tint={color.texto2}>
            Esta semana
          </KText>
          <KText size={texto.texto} numberOfLines={1} style={{ flexShrink: 1 }} accessibilityLiveRegion="polite">
            {`${NAMES[day]} · ${days[day]} min${days[day] ? ` · ${circles(days[day])} ${circles(days[day]) === 1 ? 'círculo' : 'círculos'}` : ''}`}
          </KText>
        </View>
        <View style={{ height: BAR_MAX, flexDirection: 'row', gap: space.s8, alignItems: 'flex-end' }}>
          {days.map((m, i) => {
            const on = i === day;
            const future = i > today;
            const h = m === 0 ? BAR_MIN : Math.max(BAR_MIN, Math.min(BAR_MAX, Math.round((m / BAR_FULL_MIN) * BAR_MAX)));
            const fill = on ? (i === today ? color.naranja : color.tinta) : m === 0 ? 'transparent' : color.hundido;
            const edge = on ? fill : m === 0 ? (future ? color.hundido : color.tinta) : color.hundido;
            return (
              <Pulsable
                key={i}
                onPress={() => setDay(i)}
                haptic={on ? undefined : 'selection'}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${NAMES[i]}: ${m} minutos`}
                style={{ flex: 1, height: BAR_MAX, justifyContent: 'flex-end' }}
              >
                <Animated.View
                  style={{
                    height: h,
                    borderRadius: radius.pill,
                    borderWidth: 2,
                    borderColor: edge,
                    backgroundColor: fill,
                    transitionProperty: ['backgroundColor', 'borderColor'],
                    transitionDuration: ms(motion.punto),
                    transitionTimingFunction: motion.easing,
                  }}
                />
              </Pulsable>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: space.s8 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {LETTERS.map((l) => (
            <KText key={l} size={texto.etiqueta} tint={color.texto2} style={{ flex: 1, textAlign: 'center' }}>
              {l}
            </KText>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: space.s8 }}>
        <Cifra value={streak} label={streak === 1 ? 'Semana seguida' : 'Semanas seguidas'}>
          <View style={{ flexDirection: 'row', gap: space.s4 }}>
            {Array.from({ length: dots }, (_, i) => (
              <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: streak === 0 ? color.hundido : i === dots - 1 ? color.naranja : color.tinta }} />
            ))}
          </View>
        </Cifra>
        <Cifra value={sessions} label="Sesiones">
          <View style={{ width: 16, height: 16, borderRadius: 6, backgroundColor: color.tinta }} />
        </Cifra>
        <Cifra value={tabatas} label="Tabatas" dark onPress={() => router.push('/tiempo/tabata')}>
          <View style={{ width: 32, height: 16, borderRadius: radius.pill, backgroundColor: color.naranja }} />
        </Cifra>
      </View>
    </ScrollView>
    <Fundido lado="arriba" alto={insets.top + fundido} />
    <Fundido lado="abajo" />
    </View>
  );
}

/** Cifra cuadrada; la de Tabatas lleva al temporizador. */
function Cifra({ value, label, dark, onPress, children }: { value: number; label: string; dark?: boolean; onPress?: () => void; children: React.ReactNode }) {
  const body = (
    <>
      {children}
      <View style={{ gap: space.s4 }}>
        <KText size={cifra.c34} weight={300} lineHeight={cifra.c34} tint={dark ? color.tarjeta : color.tinta}>
          {String(value)}
        </KText>
        <KText size={texto.etiqueta} caps tint={dark ? color.linea : color.texto2} numberOfLines={2}>
          {label}
        </KText>
      </View>
    </>
  );
  const style = { flex: 1, aspectRatio: 1, borderRadius: radius.lg, backgroundColor: dark ? color.tinta : color.tarjeta, padding: space.s16, justifyContent: 'space-between' } as const;
  return onPress ? (
    <Pulsable onPress={onPress} accessibilityRole="link" accessibilityLabel={`${value} ${label.toLowerCase()}, abrir Tabata`} style={style}>
      {body}
    </Pulsable>
  ) : (
    <View accessibilityLabel={`${value} ${label.toLowerCase()}`} style={style}>
      {body}
    </View>
  );
}
