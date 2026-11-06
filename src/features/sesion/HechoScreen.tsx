/** Hecho (J8Finish): resumen, semana, esfuerzo y enviar al entrenador. */
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon } from '@/components/icons';
import { KText } from '@/components/KText';
import { weekDays } from '@/diario/model';
import { queueWorkout } from '@/backend/sync';
import { logOwn, useDiary } from '@/diario/store';
import { compiled, markSent, resetExtra, resetSession, session, sessionRunner, setRpe, useSession, useSessionExtra } from '@/session/store';
import { alpha, cifra, color, layout, motion, radius, space, texto, touch } from '@/theme';
import { Pulsable } from '@/components/Pulsable';

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEK_GOAL = 4;

function resumen() {
  const st = sessionRunner.getState();
  const doneUpTo = st.status === 'done' && !st.stopped ? st.plan.length : st.index;
  let tabatas = 0;
  let series = 0;
  const seenSets = new Set<string>();
  for (let i = 0; i < doneUpTo; i++) {
    const p = st.plan[i];
    if (p.ref === undefined || (p.kind !== 'work' && p.kind !== 'reps')) continue;
    const info = compiled.steps[p.ref];
    if (info.blockKind === 'tabata') {
      if (info.round === info.rounds) seenSets.add(`${info.block}-${info.set}`);
    } else series++;
  }
  tabatas = seenSets.size;
  const ms = (sessionRunner.endedAt ?? Date.now()) - (sessionRunner.startedAt ?? Date.now());
  return { minutes: Math.max(1, Math.round(ms / 60000)), tabatas, series };
}

export function HechoScreen() {
  const insets = useSafeAreaInsets();
  useSession();
  const extra = useSessionExtra();
  const r = resumen();
  const diary = useDiary();
  const today = (new Date().getDay() + 6) % 7;
  // Círculos de 10 min por día (como en Progreso); hoy suma lo que acabas de hacer.
  const week = weekDays(diary, Date.now()).map((m, i) => Math.min(5, Math.ceil((i === today ? m + r.minutes : m) / 10)));
  const days = week.filter((v) => v > 0).length;
  const rpe = extra.rpe ?? 4;

  const close = () => {
    const now = Date.now();
    logOwn(now, r.minutes, r.tabatas);
    // Al servidor (si lo hay); el esfuerzo solo si lo enviaste al entrenador.
    queueWorkout({ at: now, minutes: r.minutes, tabatas: r.tabatas, sessionId: session.id, effort: extra.sent ? rpe : null });
    resetSession();
    resetExtra();
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.verde, paddingTop: Math.max(insets.top, layout.pantallaArriba) }}>
      <View style={{ paddingHorizontal: space.s24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <KText size={cifra.c34} weight={300} title tint={color.tarjeta} accessibilityRole="header">
          Hecho
        </KText>
        <Pulsable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Cerrar y volver a hoy"
          style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: color.tarjeta, alignItems: 'center', justifyContent: 'center' }}
        >
          <CheckIcon size={28} tint={color.verde} />
        </Pulsable>
      </View>

      <View style={{ paddingTop: space.s24, paddingHorizontal: space.s16, flexDirection: 'row', gap: space.s8 }}>
        <Dato i={0} label={`${r.minutes} minutos`} value={`${r.minutes}'`} mark={<View style={{ width: 32, height: 12, borderRadius: 6, backgroundColor: color.tarjeta }} />} />
        <Dato i={1} label={`${r.tabatas} tabatas`} value={String(r.tabatas)} mark={<View style={{ width: 14, height: 14, borderRadius: radius.xs, backgroundColor: color.tarjeta }} />} />
        <Dato i={2} label={`${r.series} series`} value={String(r.series)} mark={<View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: color.tarjeta }} />} />
      </View>

      <View
        accessibilityLabel={`Esta semana: ${days} de ${WEEK_GOAL} días`}
        style={{ marginTop: space.s8, marginHorizontal: space.s16, borderRadius: radius.lg, backgroundColor: alpha.tarjetaSobreColor, padding: space.s16, flexDirection: 'row', alignItems: 'flex-end', gap: space.s16 }}
      >
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 96 }}>
          {week.map((v, i) => (
            <View key={i} style={{ alignItems: 'center', gap: space.s4 }}>
              {v === 0 ? (
                <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: alpha.sobreColor }} />
              ) : (
                Array.from({ length: v }, (_, k) => (
                  <View key={k} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: i === today ? color.naranja : color.tarjeta }} />
                ))
              )}
              <KText size={texto.etiqueta} tint={color.tarjeta}>
                {DAYS[i]}
              </KText>
            </View>
          ))}
        </View>
        <View style={{ alignItems: 'flex-end', gap: space.s4 }}>
          <KText size={cifra.c34} weight={300} tint={color.tarjeta} lineHeight={cifra.c34}>{`${days}/${WEEK_GOAL}`}</KText>
          <KText size={texto.etiqueta} tint={color.tarjeta}>
            días
          </KText>
        </View>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', gap: space.s16, paddingHorizontal: space.s24 }}>
        <KText size={texto.texto} tint={color.tarjeta}>
          Esfuerzo
        </KText>
        <View accessibilityRole="radiogroup" accessibilityLabel="Esfuerzo de 1 a 5" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {[1, 2, 3, 4, 5].map((n) => {
            const d = 28 + n * 10;
            const on = n === rpe;
            return (
              <Pulsable
                key={n}
                onPress={() => setRpe(n)}
                haptic="selection"
                accessibilityRole="radio"
                accessibilityLabel={`${n} de 5`}
                accessibilityState={{ checked: on }}
                hitSlop={Math.max(0, (touch.dedo - d) / 2)}
                style={{ width: d, height: d, borderRadius: d / 2, borderWidth: 2, borderColor: color.tarjeta, backgroundColor: n <= rpe ? (on ? color.naranja : color.tarjeta) : 'transparent' }}
              />
            );
          })}
        </View>
      </View>

      <Pulsable
        onPress={markSent}
        haptic="success"
        accessibilityRole="button"
        accessibilityLabel={extra.sent ? `Enviado a ${session.coach.name}` : `Enviar a ${session.coach.name}`}
        style={{ height: touch.mando + insets.bottom, paddingBottom: insets.bottom, backgroundColor: extra.sent ? color.verde : color.tinta, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.s16, borderTopWidth: extra.sent ? 2 : 0, borderTopColor: alpha.sobreColor }}
      >
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: color.tarjeta, alignItems: 'center', justifyContent: 'center' }}>
          <KText size={texto.bloque}>{session.coach.initial}</KText>
        </View>
        {extra.sent ? (
          <>
            <CheckIcon size={32} tint={color.tarjeta} />
            <KText size={texto.bloque} tint={color.tarjeta}>
              Enviado
            </KText>
          </>
        ) : (
          <Svg width={32} height={32} viewBox="0 0 32 32">
            <Path d="M16 27V6M8 14l8-8 8 8" stroke={color.tarjeta} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        )}
      </Pulsable>
    </View>
  );
}

/** Cifras del resumen: entran una tras otra (pantalla rara, aquí sí cabe un detalle). Con «reducir movimiento», sin entrada. */
function Dato({ value, mark, label, i }: { value: string; mark: ReactNode; label: string; i: number }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(motion.pantalla).delay(i * 60)}
      accessibilityLabel={label} style={{ flex: 1, aspectRatio: 1, borderRadius: radius.lg, backgroundColor: alpha.tarjetaSobreColor, padding: space.s16, justifyContent: 'space-between' }}>
      {mark}
      <KText size={cifra.c34} weight={300} tint={color.tarjeta} lineHeight={cifra.c34}>
        {value}
      </KText>
    </Animated.View>
  );
}
