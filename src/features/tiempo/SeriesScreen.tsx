import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnilloPuntos } from '@/components/AnilloPuntos';
import { BarraAccion } from '@/components/BarraAccion';
import { CheckIcon, PlayIcon } from '@/components/icons';
import { KText } from '@/components/KText';
import { Mando } from '@/components/Mando';
import { Palma } from '@/components/Palma';
import { PildoraFase } from '@/components/PildoraFase';
import { useHideNav } from '@/state/chrome';
import { setCurrent } from '@/state/saved';
import { alpha, cifra, color, motion, ms, radius, space, texto, touch, transicionFondo } from '@/theme';
import { seriesPlan, type Snapshot } from '@/timer/engine';
import { useTimer } from '@/timer/useTimer';
import { Cabecera, pad2 } from './Cabecera';
import { Dial, DIAL_SIZE } from './Dial';
import { ModoTiempo } from './ModoTiempo';
import { Pulsable } from '@/components/Pulsable';
import Animated, { useReducedMotion } from 'react-native-reanimated';

/** Libre: trabajo 30/45/60/90 s, descanso manual/10/15/30 s. */
export const WORK = [30, 45, 60, 90] as const;
export const REST = [0, 10, 15, 30] as const;
const DEFAULT_ROUNDS = 4;

/** Índice de una opción recibida por parámetro, o el de por defecto. */
function pick(options: readonly number[], param: string | undefined, fallback: number) {
  const i = options.indexOf(Number(param));
  return i < 0 ? fallback : i;
}

/** En marcha, nada bajo 18. */
const RUN_TEXT = texto.bloque;

const RING_BOX = 358;
const RING_R = 168;

function background(s: Snapshot) {
  if (s.paused) return color.tinta;
  switch (s.phase) {
    case 'select':
      return color.fondo;
    case 'countdown':
    case 'wait':
    case 'reps':
      return color.tinta;
    case 'work':
      return color.klein;
    case 'rest':
    case 'done':
      return color.verde;
  }
}

function texts(s: Snapshot, rounds: number) {
  if (s.phase === 'select') return { title: 'Tiempo', unit: 'Un círculo = un segundo' };
  if (s.paused) return { title: 'En pausa', unit: 'Parar guarda lo que llevas' };
  switch (s.phase) {
    case 'countdown':
      return { title: 'Preparado', unit: 'Deja el teléfono en el suelo' };
    case 'work':
      return { title: 'Trabajo', unit: 'Palma = pausa' };
    case 'rest':
      return { title: 'Descanso', unit: 'Respira' };
    case 'wait':
    case 'reps':
      return { title: 'Hecho', unit: `Toca para la serie ${s.round + 1} de ${rounds}` };
    case 'done':
      return {
        title: 'Hecho',
        unit: s.stopped ? `${s.roundsDone} de ${rounds} series` : `${rounds} series completadas`,
      };
  }
}

const PHASE_WORD: Record<Snapshot['phase'], string> = {
  select: 'Listo',
  countdown: 'Preparado',
  work: 'Trabajo',
  rest: 'Descanso',
  wait: 'Espera',
  reps: 'Repeticiones',
  done: 'Hecho',
};

export function SeriesScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ work?: string; rest?: string; rounds?: string }>();
  const [wi, setWi] = useState(() => pick(WORK, params.work, 2));
  const [ri, setRi] = useState(() => pick(REST, params.rest, 0));
  const rounds = Number(params.rounds) || DEFAULT_ROUNDS;
  const work = WORK[wi];
  const rest = REST[ri];

  useEffect(() => {
    if (params.work) setWi(pick(WORK, params.work, 2));
    if (params.rest) setRi(pick(REST, params.rest, 0));
  }, [params.work, params.rest]);

  useEffect(() => setCurrent({ kind: 'series', work, rest, rounds }), [work, rest, rounds]);

  const plan = useMemo(() => seriesPlan({ work, rest, rounds }), [work, rest, rounds]);
  const t = useTimer(plan);
  const s = t.snap;
  const selecting = s.phase === 'select';
  useHideNav(!selecting);

  const bg = background(s);
  const fg = selecting ? color.tinta : color.tarjeta;
  const { title, unit } = texts(s, rounds);
  const KeepAwake = t.keepAwake;

  return (
    <Animated.View
      style={{
        ...transicionFondo,
        flex: 1,
        backgroundColor: bg,
        paddingTop: Math.max(insets.top, space.s48),
        paddingHorizontal: space.s16,
        paddingBottom: selecting ? space.s12 : 0,
        gap: space.s12,
      }}
    >
      {KeepAwake && <KeepAwake />}
      {selecting && <ModoTiempo value="series" />}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.s8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s8 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: selecting || s.phase === 'work' ? color.naranja : color.tarjeta,
            }}
          />
          <KText size={selecting ? texto.texto : RUN_TEXT} tint={fg}>
            Libre
          </KText>
        </View>
        {selecting ? (
          <KText size={texto.texto} tint={fg}>{`Serie 01 / ${pad2(rounds)}`}</KText>
        ) : (
          <PildoraFase
            label={s.paused ? 'En pausa' : `${PHASE_WORD[s.phase]} · ${pad2(Math.min(s.round, rounds))}/${pad2(rounds)}`}
            bg={alpha.sobreColor}
            fg={color.tarjeta}
          />
        )}
      </View>

      <Cabecera
        title={title}
        unit={unit}
        unitSize={selecting ? texto.texto : RUN_TEXT}
        fg={fg}
        corner={
          selecting ? null : s.phase === 'done' || s.phase === 'wait' ? (
            <CheckIcon size={cifra.c34} tint={color.tarjeta} />
          ) : (
            <KText size={cifra.c34} weight={300} tint={fg} lineHeight={cifra.c34} tabular>
              {pad2(s.n)}
            </KText>
          )
        }
      />

      {selecting ? (
        <Elegir
          wi={wi}
          ri={ri}
          rest={rest}
          rounds={rounds}
          onWork={() => setWi((i) => (i + 1) % WORK.length)}
          onRest={() => setRi((i) => (i + 1) % REST.length)}
          onStart={t.start}
        />
      ) : (
        <>
          <Progreso s={s} work={work} rest={rest} rounds={rounds} />
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: RING_BOX, height: RING_BOX, alignItems: 'center', justifyContent: 'center' }}>
              <AnilloPuntos
                count={s.phase === 'rest' ? rest : work}
                elapsed={s.phase === 'work' || s.phase === 'rest' ? s.elapsed : 0}
                size={RING_BOX}
                ring={RING_R}
                live={s.phase === 'countdown' ? color.tinta : color.tarjeta}
                gone={s.phase === 'countdown' ? alpha.sobreClaro : alpha.sobreColor}
                showCurrent={s.phase === 'work' || s.phase === 'rest'}
                allGone={s.phase === 'wait' || s.phase === 'done'}
              />
              <PalmaSerie s={s} bg={bg} onPress={t.primary} />
            </View>
          </View>
          <View style={{ flex: 1 }} />
          <View style={{ marginHorizontal: -space.s16 }}>
            <Mando
              left={s.left}
              central={s.central}
              onLeft={s.phase === 'done' ? t.reset : s.left === 'stop' ? t.stop : t.prev}
              onCentral={t.primary}
              onRight={t.next}
            />
          </View>
        </>
      )}
    </Animated.View>
  );
}

function Elegir({
  wi,
  ri,
  rest,
  rounds,
  onWork,
  onRest,
  onStart,
}: {
  wi: number;
  ri: number;
  rest: number;
  rounds: number;
  onWork: () => void;
  onRest: () => void;
  onStart: () => void;
}) {
  return (
    <View style={{ flex: 1, minHeight: 0, gap: space.s8 }}>
      <DialCard wi={wi} onWork={onWork} />
      <View style={{ flexDirection: 'row', gap: space.s8 }}>
        <Pulsable
          onPress={onRest}
          haptic="selection"
          accessibilityRole="button"
          accessibilityLabel={`Descanso: ${rest === 0 ? 'manual, tocas tú para seguir' : `${rest} segundos`}. Toca para cambiar`}
          style={cardStyle}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.verde }} />
            <KText size={texto.etiqueta} tint={color.texto2} caps>
              Descanso
            </KText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.s4 }}>
            <KText size={texto.boton} weight={300}>
              {rest === 0 ? 'Manual' : String(rest)}
            </KText>
            <KText size={texto.etiqueta} tint={color.texto2}>
              {rest === 0 ? 'tocas tú ›' : 's ›'}
            </KText>
          </View>
        </Pulsable>
        <Pulsable
          onPress={() => router.navigate('/')}
          accessibilityRole="link"
          accessibilityLabel={`${rounds} series, las fija tu sesión`}
          style={cardStyle}
        >
          <KText size={texto.etiqueta} tint={color.texto2} caps>
            Series · de tu sesión
          </KText>
          <View style={{ flexDirection: 'row', gap: space.s4, flexWrap: 'wrap' }}>
            {Array.from({ length: rounds }, (_, i) => (
              <View key={i} style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: color.tinta }} />
            ))}
          </View>
        </Pulsable>
      </View>
      <BarraAccion label="Empezar" onPress={onStart} />
    </View>
  );
}

/** La rueda ocupa el alto que quede y se encoge en pantallas bajas (nunca crece). */
function DialCard({ wi, onWork }: { wi: number; onWork: () => void }) {
  const [h, setH] = useState(DIAL_SIZE);
  const scale = Math.min(1, h / DIAL_SIZE);
  return (
    <View
      style={{ flex: 1, minHeight: 0, maxHeight: DIAL_SIZE + space.s32, overflow: 'hidden', backgroundColor: color.tarjeta, borderRadius: radius.lg, padding: space.s16, alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={{ flex: 1, minHeight: 0, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }} onLayout={(e) => setH(e.nativeEvent.layout.height)}>
        <View style={{ position: 'absolute', transform: [{ scale }] }}>
          <Dial options={WORK} index={wi} onNext={onWork} />
        </View>
      </View>
    </View>
  );
}

const cardStyle = {
  flex: 1,
  height: touch.fila,
  borderRadius: radius.xl,
  backgroundColor: color.tarjeta,
  padding: space.s16,
  justifyContent: 'space-between' as const,
};

/** Barra de la sesión: un tramo por serie y por descanso, proporcional a su duración. */
function Progreso({ s, work, rest, rounds }: { s: Snapshot; work: number; rest: number; rounds: number }) {
  const reduced = useReducedMotion();
  const cur = s.round - 1;
  const segs: { grow: number; pct: number; current: boolean }[] = [];
  for (let i = 0; i < rounds; i++) {
    let wp = 0;
    if (s.phase === 'done' || i < cur) wp = 1;
    else if (i === cur && s.phase === 'work') wp = s.progress;
    else if (i === cur && (s.phase === 'rest' || s.phase === 'wait')) wp = 1;
    segs.push({ grow: work, pct: wp, current: i === cur && s.phase === 'work' });
    if (i < rounds - 1 && rest > 0) {
      let rp = 0;
      if (s.phase === 'done' || i < cur) rp = 1;
      else if (i === cur && s.phase === 'rest') rp = s.progress;
      segs.push({ grow: rest, pct: rp, current: i === cur && s.phase === 'rest' });
    }
  }
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Progreso de la sesión"
      style={{ flexDirection: 'row', gap: space.s4, height: space.s8, paddingHorizontal: space.s8 }}
    >
      {segs.map((g, i) => (
        <View
          key={i}
          style={{ flexGrow: g.grow, flexBasis: 0, minWidth: space.s8, height: space.s8, borderRadius: radius.pill, backgroundColor: alpha.sobreColor, overflow: 'hidden' }}
        >
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: `${g.pct * 100}%`,
              height: space.s8,
              borderRadius: radius.pill,
              backgroundColor: g.current ? color.naranja : color.tarjeta,
              // Lineal y del mismo largo que un marco del reloj: avanza sin saltos.
              transitionProperty: 'width',
              transitionDuration: reduced || g.pct === 0 ? '0ms' : ms(motion.marco),
              transitionTimingFunction: 'linear',
            }}
          />
        </View>
      ))}
    </View>
  );
}

function PalmaSerie({ s, bg, onPress }: { s: Snapshot; bg: string; onPress: () => void }) {
  if (s.phase === 'countdown' && !s.paused) {
    return (
      <Palma bg={color.naranja} onPress={onPress} label={`Cuenta atrás ${s.n}`}>
        <KText size={cifra.c233} weight={300} lineHeight={cifra.c233} tint={color.tinta} tabular>
          {String(s.n)}
        </KText>
      </Palma>
    );
  }
  if (s.phase === 'wait') {
    const m = Math.floor(s.waited / 60);
    return (
      <Palma bg={color.tarjeta} onPress={onPress} label="Empezar la siguiente serie">
        <PlayIcon size={72} />
        <KText size={RUN_TEXT} caps>
          Siguiente serie
        </KText>
        <KText size={RUN_TEXT} tint={color.texto2} tabular>{`Descansas ${m}:${pad2(s.waited % 60)}`}</KText>
      </Palma>
    );
  }
  if (s.phase === 'done') {
    return (
      <Palma bg={color.tarjeta} onPress={onPress} label="Empezar otra vez">
        <CheckIcon size={cifra.c89} tint={color.verde} />
        <KText size={RUN_TEXT} tint={color.verde} caps>
          Otra vez
        </KText>
      </Palma>
    );
  }
  const ink = s.paused ? color.tinta : bg;
  return (
    <Palma bg={color.tarjeta} onPress={onPress} label={s.paused ? 'Seguir' : 'Pausar'}>
      <KText size={cifra.c144} weight={300} lineHeight={cifra.c144} tint={ink} tabular>
        {String(s.n)}
      </KText>
      <KText size={RUN_TEXT} tint={ink} caps>
        {s.paused ? 'Toca y sigue' : s.phase === 'rest' ? 'Descanso' : 'Palma · pausa'}
      </KText>
    </Palma>
  );
}
