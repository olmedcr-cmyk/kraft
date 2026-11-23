/** Hecho (J8Finish): resumen, semana, esfuerzo y enviar al entrenador. */
import { StatusBar } from 'expo-status-bar';
import { Redirect, router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon } from '@/components/icons';
import { KText } from '@/components/KText';
import { weekDays } from '@/diario/model';
import { useDiary } from '@/diario/store';
import { finishSummary, recordFinish, sendFinish, updateFinish } from '@/session/cierre';
import { markSent, resetExtra, resetSession, session, setRpe, useSession, useSessionExtra } from '@/session/store';
import { alpha, cifra, color, layout, motion, radius, space, texto, touch, arriba, pieza } from '@/theme';
import { Pulsable } from '@/components/Pulsable';

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEK_GOAL = 4;

export function HechoScreen() {
  const insets = useSafeAreaInsets();
  const t = useSession();
  const extra = useSessionExtra();
  // Ya apuntado al acabar la marcha (session/marcha.ts); aquí solo se lee. Si faltara, se apunta al entrar.
  useEffect(() => {
    recordFinish();
  }, []);
  const r = finishSummary();
  const diary = useDiary();
  const today = (new Date().getDay() + 6) % 7;
  // Círculos de 10 min por día (como en Progreso); el diario ya incluye lo que acabas de hacer.
  const week = weekDays(diary, Date.now()).map((m) => Math.min(5, Math.ceil(m / 10)));
  const days = week.filter((v) => v > 0).length;
  const rpe = extra.rpe ?? 4;

  // Sin una marcha acabada (p. ej. al recargar la web aquí) no hay resumen: a Hoy.
  if (t.snap.phase !== 'done') return <Redirect href="/" />;

  const close = () => {
    // Al servidor (si lo hay); el esfuerzo solo si lo enviaste al entrenador.
    sendFinish();
    resetSession();
    resetExtra();
    router.replace('/');
  };
  const send = () => {
    markSent();
    updateFinish();
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.verde, paddingTop: arriba(insets.top, layout.pantallaArriba) }}>
      <StatusBar style="light" />
      <View style={{ paddingHorizontal: space.s24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <KText size={cifra.c34} weight={300} title tint={color.tarjeta} accessibilityRole="header">
          Hecho
        </KText>
        <Pulsable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Cerrar y volver a hoy"
          style={{ width: pieza.icono, height: pieza.icono, borderRadius: pieza.icono / 2, backgroundColor: color.tarjeta, alignItems: 'center', justifyContent: 'center' }}
        >
          <CheckIcon size={28} tint={color.verde} />
        </Pulsable>
      </View>

      <View style={{ paddingTop: space.s24, paddingHorizontal: space.s16, flexDirection: 'row', gap: space.s8 }}>
        <Dato i={0} label={`${r.minutes} ${r.minutes === 1 ? 'minuto' : 'minutos'}`} value={`${r.minutes}'`} mark={<View style={{ width: 32, height: 12, borderRadius: 6, backgroundColor: color.tarjeta }} />} />
        <Dato i={1} label={`${r.tabatas} ${r.tabatas === 1 ? 'tabata' : 'tabatas'}`} value={String(r.tabatas)} mark={<View style={{ width: pieza.puntoMarcha, height: pieza.puntoMarcha, borderRadius: radius.xs, backgroundColor: color.tarjeta }} />} />
        <Dato i={2} label={`${r.series} ${r.series === 1 ? 'serie' : 'series'}`} value={String(r.series)} mark={<View style={{ width: pieza.puntoMarcha, height: pieza.puntoMarcha, borderRadius: pieza.puntoMarcha / 2, backgroundColor: color.tarjeta }} />} />
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
                onPress={() => {
                  setRpe(n);
                  updateFinish();
                }}
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
        onPress={send}
        haptic="success"
        accessibilityRole="button"
        accessibilityLabel={extra.sent ? `Enviado a ${session.coach.name}` : `Enviar a ${session.coach.name}`}
        style={{ height: touch.mando + insets.bottom, paddingBottom: insets.bottom, backgroundColor: extra.sent ? color.verde : color.tinta, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.s16, borderTopWidth: extra.sent ? 2 : 0, borderTopColor: alpha.sobreColor }}
      >
        <View style={{ width: pieza.icono, height: pieza.icono, borderRadius: pieza.icono / 2, backgroundColor: color.tarjeta, alignItems: 'center', justifyContent: 'center' }}>
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
