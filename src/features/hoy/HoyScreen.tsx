/** Hoy (J2Today): la sesión que mandó el entrenador, por bloques. Un toque y a entrenar. */
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraAccion } from '@/components/BarraAccion';
import { FilaBloque, Marcas } from '@/components/FilaBloque';
import { KText } from '@/components/KText';
import { compiled, session, sessionRunner, useSession, useToday } from '@/session/store';
import { hhmm, longDay, upcomingBookings } from '@/agenda/model';
import { useAgenda } from '@/agenda/store';
import { MODE_TINT } from '@/features/agenda/piezas';
import type { Block } from '@/session/types';
import { cifra, color, layout, motion, ms, radius, space, texto, touch } from '@/theme';
import { Pulsable } from '@/components/Pulsable';

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const USER_INITIAL = 'C';
/** En pantallas bajas las filas encogen hasta aquí antes de dejar desplazar. */
const ROW_MIN = touch.tecla;
const ENTRA = { from: { opacity: 0, transform: [{ translateY: 8 }] }, to: { opacity: 1, transform: [{ translateY: 0 }] } };

const tintOf = (b: Block) => color[b.tint];
const markTint = (b: Block) => (b.tint === 'tinteNaranja' ? color.naranja : color[b.tint]);

/** Marcas: píldora = tramo largo, círculo = serie/segundos, cuadrado = tabata/ronda. */
function marcas(b: Block) {
  const t = markTint(b);
  if (b.kind === 'tabata') return <Marcas count={b.sets} tint={t} shape="square" />;
  if (b.kind === 'ladder') return <Marcas count={b.steps.length} tint={t} shape="circle" />;
  if (b.tint === 'tinteNaranja') return <Marcas count={b.steps.length} tint={t} shape="square" />;
  return (
    <View style={{ flexDirection: 'row', gap: space.s4, alignItems: 'center' }}>
      {b.steps.map((st, i) =>
        st.seconds >= 120 ? (
          <View key={i} style={{ width: 28, height: 10, borderRadius: radius.pill, backgroundColor: t }} />
        ) : (
          <View key={i} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t }} />
        ),
      )}
    </View>
  );
}

export function HoyScreen() {
  const insets = useSafeAreaInsets();
  const t = useSession();
  const today = useToday();
  const running = t.running;
  // Sin sesión hoy, el día es hoy (no el de la última sesión).
  const day = WEEKDAYS[today === 'ready' ? new Date(session.date + 'T12:00:00').getDay() : new Date().getDay()];

  const go = (block = 0) => {
    if (!running) sessionRunner.startAt(compiled.blockStart[block]);
    router.push('/sesion');
  };

  // Alto disponible para los bloques: las filas se reparten el sitio (88 → 64) para que todo quepa quieto.
  const [listH, setListH] = useState(0);
  const reduced = useReducedMotion();
  const n = session.blocks.length;
  const gaps = layout.entreTarjetas * (n - 1);
  const rowH = listH ? Math.max(ROW_MIN, Math.min(touch.fila, Math.floor((listH - gaps) / n))) : touch.fila;
  const fits = !listH || n * rowH + gaps <= listH;

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo, paddingTop: Math.max(insets.top, layout.pantallaArriba) }}>
      <View style={{ paddingHorizontal: layout.pantallaLado + space.s8, paddingBottom: space.s16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View style={{ gap: space.s4 }}>
          <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
            {day}
          </KText>
          <KText size={texto.texto} tint={color.texto2}>
            {today === 'ready' ? `${session.minutes}' · de ${session.coach.name}` : today === 'none' ? 'Sin sesión' : ' '}
          </KText>
        </View>
        <Pulsable
          onPress={() => router.push('/tu')}
          accessibilityRole="button"
          accessibilityLabel="Tú"
          style={{ width: touch.dedo, height: touch.dedo, borderRadius: touch.dedo / 2, backgroundColor: color.tinta, alignItems: 'center', justifyContent: 'center' }}
        >
          <KText size={texto.lista} tint={color.tarjeta}>
            {USER_INITIAL}
          </KText>
        </Pulsable>
      </View>

      {today !== 'ready' ? (
        <Libre loading={today === 'loading'} coach={session.coach.name} />
      ) : (
      <>
      <View style={{ flex: 1 }} onLayout={(e) => setListH(Math.floor(e.nativeEvent.layout.height))}>
        {/* Solo se desplaza si ni encogidas caben, y nunca rebota. */}
        <ScrollView
          scrollEnabled={!fits}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: layout.pantallaLado, gap: layout.entreTarjetas }}
        >
          {session.blocks.map((b, i) => (
            <Animated.View
              key={b.id}
              style={
                reduced
                  ? undefined
                  : { animationName: ENTRA, animationDuration: ms(motion.pantalla), animationDelay: ms(i * 40), animationTimingFunction: motion.salida, animationFillMode: 'backwards' }
              }
            >
              <FilaBloque
                title={b.name}
                tint={tintOf(b)}
                onPress={() => go(i)}
                badge={b.isNew}
                height={rowH}
                marks={marcas(b)}
                aside={
                  <KText size={texto.texto} tint={color.texto2}>
                    {`${b.minutes}'`}
                  </KText>
                }
              />
            </Animated.View>
          ))}
        </ScrollView>
      </View>
      <View style={{ paddingHorizontal: layout.pantallaLado, paddingTop: space.s16 }}>
        <BarraAccion compacta label={running ? 'Seguir' : 'Empezar'} onPress={() => go(0)} />
      </View>
      </>
      )}
    </View>
  );
}

/** Hoy sin sesión (KC1Empty): el día libre, tu próxima clase y entrenar por tu cuenta. */
function Libre({ loading, coach }: { loading: boolean; coach: string }) {
  const agenda = useAgenda();
  const next = upcomingBookings(agenda, Date.now()).find((x) => x.booking.status === 'confirmed');
  return (
    <View style={{ flex: 1, paddingHorizontal: layout.pantallaLado, gap: layout.entreTarjetas }}>
      <View
        accessible
        accessibilityLabel={loading ? 'Cargando la sesión de hoy' : `Hoy, libre. ${coach} aún no ha enviado nada`}
        style={{ flex: 1, borderRadius: radius.lg, borderWidth: 2, borderStyle: 'dashed', borderColor: color.linea, alignItems: 'center', justifyContent: 'center', gap: space.s16 }}
      >
        <View style={{ width: touch.accion, height: touch.accion, borderRadius: touch.accion / 2, borderWidth: 2, borderColor: color.linea }} />
        {!loading && (
          <>
            <KText size={texto.bloque}>Hoy, libre</KText>
            <KText size={texto.texto} tint={color.texto2}>{`${coach} aún no ha enviado nada`}</KText>
          </>
        )}
      </View>
      {next && (
        <Pulsable
          onPress={() => router.push({ pathname: '/reserva/[id]', params: { id: next.slot.id } })}
          accessibilityRole="button"
          accessibilityLabel={`Tu próxima clase: ${longDay(next.slot.start)} a las ${hhmm(next.slot.start)}, ${next.slot.name}`}
          scaleTo={0.98}
          style={{ height: touch.fila, backgroundColor: color.tarjeta, borderRadius: radius.xl, padding: space.s16, flexDirection: 'row', alignItems: 'center', gap: space.s16 }}
        >
          <View style={{ width: 56, height: 56, borderRadius: radius.md, backgroundColor: MODE_TINT[next.slot.mode].soft, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: space.s16, height: space.s16, borderRadius: space.s8, backgroundColor: MODE_TINT[next.slot.mode].bg }} />
          </View>
          <View style={{ flex: 1, gap: space.s4 }}>
            <KText size={texto.bloque}>{`${longDay(next.slot.start).split(' ')[0]} ${hhmm(next.slot.start)}`}</KText>
            <KText size={texto.texto} tint={color.texto2}>
              {next.slot.room ? `${next.slot.name} · Sala ${next.slot.room}` : next.slot.name}
            </KText>
          </View>
          <KText size={texto.bloque} tint={color.texto2}>
            ›
          </KText>
        </Pulsable>
      )}
      <View style={{ paddingTop: space.s8 }}>
        <BarraAccion compacta label="Entrenar libre" onPress={() => router.push('/tiempo')} />
      </View>
    </View>
  );
}
