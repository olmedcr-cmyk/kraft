/** Hoy (J2Today): la sesión que mandó el entrenador, por bloques. Un toque y a entrenar. */
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraAccion } from '@/components/BarraAccion';
import { FilaBloque, Marcas } from '@/components/FilaBloque';
import { KText } from '@/components/KText';
import { compiled, session, sessionRunner, useSession, useToday } from '@/session/store';
import { useUnfinished } from '@/session/marcha';
import { acknowledgeChanges, useChanges } from '@/session/vista';
import { changeText, type SessionChanges } from '@/session/cambios';
import { hasBackend } from '@/backend/client';
import { useOnline } from '@/backend/red';
import { usePending } from '@/backend/sync';
import { CheckIcon } from '@/components/icons';
import { hhmm, longDay, upcomingBookings } from '@/agenda/model';
import { useAgenda } from '@/agenda/store';
import { MODE_TINT } from '@/features/agenda/piezas';
import type { Block } from '@/session/types';
import { cifra, color, layout, motion, ms, radius, space, texto, touch, arriba } from '@/theme';
import { Pulsable } from '@/components/Pulsable';

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const USER_INITIAL = 'C';
/** En pantallas bajas las filas encogen hasta aquí antes de dejar desplazar. */
const ROW_MIN = touch.tecla;
const ENTRA = { from: { opacity: 0, transform: [{ translateY: 8 }] }, to: { opacity: 1, transform: [{ translateY: 0 }] } };

const tintOf = (b: Block) => color[b.tint];
const markTint = (b: Block) => (b.tint === 'tinteNaranja' ? color.naranja : color[b.tint]);

/** Marcas que quitó el entrenador (KC2): huecas, detrás de las que quedan. */
function Quitadas({ count }: { count: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: space.s4 }}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: color.linea }} accessibilityElementsHidden />
      ))}
    </View>
  );
}

/** Marcas: píldora = tramo largo, círculo = serie/segundos, cuadrado = tabata/ronda. */
function marcas(b: Block, removed = 0) {
  const t = markTint(b);
  if (removed > 0) {
    return (
      <View style={{ flexDirection: 'row', gap: space.s4 }}>
        {marcas(b)}
        <Quitadas count={removed} />
      </View>
    );
  }
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
  const unfinished = useUnfinished();
  const changes = useChanges();
  const online = useOnline();
  const pending = usePending();
  const offline = hasBackend && !online;
  // Bloques ya hechos de la sesión en marcha (KC4): verdes y con ✓.
  const st = sessionRunner.getState();
  const isDone = (i: number) => st.status === 'running' && st.index >= (compiled.blockStart[i + 1] ?? st.plan.length);
  const notePending = offline && pending.length > 0;
  // Sin sesión hoy, el día es hoy (no el de la última sesión).
  const day = WEEKDAYS[today === 'ready' ? new Date(session.date + 'T12:00:00').getDay() : new Date().getDay()];

  const go = (block = 0) => {
    if (!running) sessionRunner.startAt(compiled.blockStart[block]);
    router.push('/sesion');
  };

  // Alto disponible para los bloques: las filas se reparten el sitio (88 → 64) para que todo quepa quieto.
  const [listH, setListH] = useState(0);
  const reduced = useReducedMotion();
  const n = session.blocks.length + (notePending ? 1 : 0);
  const gaps = layout.entreTarjetas * (n - 1);
  const rowH = listH ? Math.max(ROW_MIN, Math.min(touch.fila, Math.floor((listH - gaps) / n))) : touch.fila;
  const fits = !listH || n * rowH + gaps <= listH;

  // Se cerró la app con una sesión en marcha (KC3): antes de nada, qué hacer con ella.
  if (unfinished && !running) return <Redirect href="/sesion/retomar" />;

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo, paddingTop: arriba(insets.top, layout.pantallaArriba) }}>
      {offline && <SinConexion />}
      <View style={{ paddingHorizontal: layout.pantallaLado + space.s8, paddingBottom: space.s16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View style={{ gap: space.s4 }}>
          <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
            {day}
          </KText>
          <KText size={texto.texto} tint={color.texto2}>
            {today === 'ready'
              ? changes && changes.oldMinutes !== session.minutes
                ? `${changes.oldMinutes}' → ${session.minutes}'`
                : `${session.minutes}' · de ${session.coach.name}`
              : today === 'none'
                ? 'Sin sesión'
                : ' '}
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
      {changes && <Cambio changes={changes} />}
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
              <Fila b={b} done={isDone(i)} change={changes?.blocks[b.id]} height={rowH} onPress={() => go(i)} />
            </Animated.View>
          ))}
          {notePending && <SaleAlVolver note={pending.some((j) => j.kind === 'workout')} coach={session.coach.name} />}
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

/** Fila de bloque con su estado: hecho (KC4), cambiado por el entrenador (KC2) o normal. */
function Fila({ b, done, change, height, onPress }: { b: Block; done: boolean; change?: SessionChanges['blocks'][string]; height: number; onPress: () => void }) {
  const removed = change && !change.added ? Math.max(0, change.oldCount - change.newCount) : 0;
  const moved = change && !change.added && change.oldMinutes !== b.minutes;
  return (
    <FilaBloque
      title={b.name}
      tint={done ? color.verde : tintOf(b)}
      onPress={onPress}
      badge={b.isNew && !done}
      height={height}
      outline={change && !done ? color.naranja : undefined}
      a11y={done ? `${b.name}, hecho` : change ? `${b.name}, cambiado${moved ? `: de ${change.oldMinutes} a ${b.minutes} minutos` : ''}` : b.name}
      marks={done ? <CheckIcon size={16} tint={color.verde} /> : marcas(b, removed)}
      aside={
        done ? (
          <KText size={texto.texto} tint={color.texto2}>
            ✓
          </KText>
        ) : (
          <View style={{ flexDirection: 'row', gap: space.s8 }}>
            {moved && (
              <KText size={texto.texto} tint={color.texto2} style={{ textDecorationLine: 'line-through' }}>
                {`${change!.oldMinutes}'`}
              </KText>
            )}
            <KText size={texto.texto} tint={color.texto2}>
              {`${b.minutes}'`}
            </KText>
          </View>
        )
      }
    />
  );
}

/** El entrenador cambió la sesión (KC2): quién, qué, y «Vale». */
function Cambio({ changes }: { changes: SessionChanges }) {
  const coach = session.coach.name;
  return (
    <View style={{ paddingHorizontal: layout.pantallaLado, paddingBottom: layout.entreTarjetas }}>
      <View accessibilityLiveRegion="polite" style={{ height: touch.tecla, borderRadius: radius.pill, backgroundColor: color.tinta, padding: space.s8, flexDirection: 'row', alignItems: 'center', gap: space.s12 }}>
        <View style={{ width: touch.dedo, height: touch.dedo, borderRadius: touch.dedo / 2, backgroundColor: color.tarjeta, alignItems: 'center', justifyContent: 'center' }}>
          <KText size={texto.lista}>{coach[0].toUpperCase()}</KText>
        </View>
        <KText size={texto.texto} tint={color.tarjeta} style={{ flex: 1 }} numberOfLines={1}>
          {changeText(changes, session, coach)}
        </KText>
        <Pulsable
          onPress={acknowledgeChanges}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel="Vale, visto"
          style={{ height: touch.dedo, paddingHorizontal: space.s16, borderRadius: radius.pill, backgroundColor: color.naranja, alignItems: 'center', justifyContent: 'center' }}
        >
          <KText size={texto.texto}>Vale</KText>
        </Pulsable>
      </View>
    </View>
  );
}

/** Sin conexión (KC4): la sesión sigue, todo queda guardado. */
function SinConexion() {
  return (
    <View style={{ paddingHorizontal: layout.pantallaLado, paddingBottom: space.s24, marginTop: -space.s16 }}>
      <View accessibilityLiveRegion="polite" style={{ height: touch.dedo, borderRadius: radius.pill, backgroundColor: color.hundido, paddingHorizontal: space.s16, flexDirection: 'row', alignItems: 'center', gap: space.s12 }}>
        <View style={{ width: space.s12, height: space.s12, borderRadius: space.s12 / 2, borderWidth: 2, borderColor: color.tinta }} />
        <KText size={texto.texto} numberOfLines={1} style={{ flex: 1 }}>
          Sin conexión · tu sesión está guardada
        </KText>
      </View>
    </View>
  );
}

/** Lo que espera a la red (KC4): la nota al entrenador o tus cambios. */
function SaleAlVolver({ note, coach }: { note: boolean; coach: string }) {
  return (
    <View style={{ height: touch.dedo, borderRadius: radius.pill, backgroundColor: color.tarjeta, paddingHorizontal: space.s16, flexDirection: 'row', alignItems: 'center', gap: space.s16 }}>
      <View style={{ flexDirection: 'row', gap: space.s4 }} accessibilityElementsHidden>
        {[color.tinta, color.hundido, color.hundido].map((c, i) => (
          <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
        ))}
      </View>
      <KText size={texto.texto} tint={color.texto2}>
        {note ? `Tu nota a ${coach} sale al volver` : 'Tus cambios salen al volver'}
      </KText>
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
