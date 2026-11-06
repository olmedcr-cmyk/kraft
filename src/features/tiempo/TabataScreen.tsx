import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KText } from '@/components/KText';
import { Mando } from '@/components/Mando';
import { PildoraFase } from '@/components/PildoraFase';
import { Segmentado } from '@/components/Segmentado';
import { useHideNav } from '@/state/chrome';
import { setCurrent } from '@/state/saved';
import { cifra, color, radius, space, texto, transicionFondo, transicionPunto, arriba } from '@/theme';
import { useSettings } from '@/state/settings';
import { tabataPlan, type Snapshot } from '@/timer/engine';
import { useTimer } from '@/timer/useTimer';
import { pad2 } from './Cabecera';
import { ModoTiempo } from './ModoTiempo';
import { Radio } from './Radio';
import Animated from 'react-native-reanimated';

/** Tabata: 20/10×8, 30/15×8, 40/20×6. */
export const MODES = [
  { work: 20, rest: 10, rounds: 8 },
  { work: 30, rest: 15, rounds: 8 },
  { work: 40, rest: 20, rounds: 6 },
] as const;

const RUN_TEXT = texto.bloque;

function look(s: Snapshot) {
  const running = s.phase === 'countdown' || s.phase === 'work' || s.phase === 'rest';
  if (s.paused && running) return { bg: color.tinta, fg: color.tarjeta };
  switch (s.phase) {
    case 'work':
      return { bg: color.naranja, fg: color.tinta };
    case 'rest':
    case 'done':
      return { bg: color.verde, fg: color.tarjeta };
    case 'countdown':
      return { bg: color.tinta, fg: color.tarjeta };
    default:
      return { bg: color.fondo, fg: color.tinta };
  }
}

function pill(s: Snapshot) {
  if (s.paused) return { label: 'En pausa', bg: color.tarjeta, fg: color.tinta };
  switch (s.phase) {
    case 'countdown':
      return { label: `Preparado · ${s.n}`, bg: color.naranja, fg: color.tinta };
    case 'work':
      return { label: 'Trabajo', bg: color.tinta, fg: color.tarjeta };
    case 'rest':
      return { label: 'Descanso', bg: color.tarjeta, fg: color.verde };
    case 'done':
      return { label: 'Hecho', bg: color.tinta, fg: color.tarjeta };
    default:
      return { label: 'Listo', bg: color.hundido, fg: color.tinta };
  }
}

export function TabataScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mi, setMi] = useState(() => Math.min(MODES.length - 1, Math.max(0, Number(params.mode) || 0)));
  useEffect(() => {
    if (params.mode !== undefined) setMi(Math.min(MODES.length - 1, Math.max(0, Number(params.mode) || 0)));
  }, [params.mode]);

  const cfg = MODES[mi];
  useEffect(() => setCurrent({ kind: 'tabata', ...cfg }), [cfg]);
  const { cuentaAtras } = useSettings();
  const plan = useMemo(() => tabataPlan({ ...cfg, countdown: cuentaAtras }), [cfg, cuentaAtras]);
  const t = useTimer(plan);
  const s = t.snap;

  const running = s.phase === 'countdown' || s.phase === 'work' || s.phase === 'rest';
  const idle = !running;
  useHideNav(running);

  const { bg, fg } = look(s);
  const muted = idle ? color.texto2 : fg;
  const round = Math.min(s.round, cfg.rounds);
  const cyc = cfg.work + cfg.rest;

  // Segundo de la sesión (continuo, para que el dial se deslice).
  let e = 0;
  if (s.phase === 'work') e = (s.round - 1) * cyc + s.progress * cfg.work;
  else if (s.phase === 'rest') e = (s.round - 1) * cyc + cfg.work + s.progress * cfg.rest;
  else if (s.phase === 'done') e = cfg.rounds * cyc - cfg.rest;

  const ss = s.phase === 'select' ? pad2(cfg.work) : s.phase === 'done' ? '00' : pad2(s.n);
  const p = pill(s);
  const KeepAwake = t.keepAwake;

  return (
    <Animated.View
      style={{
        ...transicionFondo,
        flex: 1,
        backgroundColor: bg,
        paddingTop: arriba(insets.top, space.s48),
        paddingHorizontal: space.s16,
        paddingBottom: idle ? space.s12 : 0,
        gap: space.s12,
      }}
    >
      {KeepAwake && <KeepAwake />}
      {idle && <ModoTiempo value="tabata" />}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.phase === 'work' && !s.paused ? color.tinta : color.naranja }} />
          <KText size={idle ? texto.texto : RUN_TEXT} tint={muted}>
            Tabata · radio
          </KText>
        </View>
        <KText size={idle ? texto.texto : RUN_TEXT} tint={muted} tabular>{`Ronda ${pad2(round)} / ${pad2(cfg.rounds)}`}</KText>
      </View>

      {idle && (
        <Segmentado
          label="Emisora"
          value={String(mi)}
          onChange={(v) => setMi(Number(v))}
          track={color.tarjeta}
          selected={color.tinta}
          selectedText={color.tarjeta}
          options={MODES.map((m, i) => ({ value: String(i), label: `${m.work}/${m.rest}` }))}
        />
      )}

      <View style={{ gap: space.s8 }}>
        <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <KText size={cifra.c89} weight={300} title tabular tint={fg} lineHeight={cifra.c89} style={{ opacity: 0.45 }}>
            {`${pad2(round)}.`}
          </KText>
          <KText size={cifra.c89} weight={300} title tabular tint={fg} lineHeight={cifra.c89}>
            {ss}
          </KText>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <KText size={idle ? texto.texto : RUN_TEXT} tint={muted}>
            Ronda · segundos
          </KText>
          <PildoraFase label={p.label} bg={p.bg} fg={p.fg} />
        </View>
      </View>

      <View style={{ backgroundColor: color.tinteNaranja, borderRadius: radius.lg, paddingVertical: space.s16, gap: space.s16, overflow: 'hidden' }}>
        <Radio work={cfg.work} rest={cfg.rest} rounds={cfg.rounds} e={e} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.s8 }} accessibilityElementsHidden>
          {Array.from({ length: cfg.rounds }, (_, k) => {
            const r = k + 1;
            const done = s.phase === 'done' || r < s.round;
            const now = running && r === s.round;
            return (
              <Animated.View
                key={k}
                style={{
                  ...transicionPunto,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: now ? color.naranja : color.tinta,
                  backgroundColor: done ? color.tinta : now ? color.naranja : 'transparent',
                }}
              />
            );
          })}
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <View style={running ? { marginHorizontal: -space.s16 } : undefined}>
        <Mando
          bleed={running}
          left={s.left === 'stop' && running ? 'stop' : 'prev'}
          central={running && !s.paused ? 'pause' : 'play'}
          onLeft={s.left === 'stop' && running ? t.stop : t.prev}
          onCentral={t.primary}
          onRight={t.next}
          rightLabel="Ronda siguiente"
          centralLabel={running ? undefined : s.phase === 'done' ? 'Empezar otra vez' : 'Empezar Tabata'}
        />
      </View>
    </Animated.View>
  );
}
