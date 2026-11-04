/** Sesión en marcha (R2). Una pantalla por estado; abajo, siempre el mismo mando. */
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, Pressable, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { KText } from '@/components/KText';
import { Mando } from '@/components/Mando';
import { Palma } from '@/components/Palma';
import { exercise } from '@/data/exercises';
import { stepSeconds, upcoming, type StepInfo } from '@/session/compile';
import { compiled, session, useSession } from '@/session/store';
import { alpha, cifra, color, radius, space, touch } from '@/theme';
import type { Snapshot } from '@/timer/engine';
import { Escalera } from './Escalera';
import { CabeceraMarcha, Lienzo, PildoraMarcha, PuntosSegundos, PuntosTramo, RUN, mmss } from './piezas';
import { TabataMarcha } from './TabataMarcha';
import { Mantener, Minutos } from './Tiempo';

const LONG = 120;

function background(s: Snapshot, step?: StepInfo) {
  if (s.paused) return color.tinta;
  switch (s.phase) {
    case 'work':
      return step?.blockKind === 'tabata' ? color.naranja : color.klein;
    case 'rest':
    case 'done':
      return color.verde;
    case 'reps':
      return color.fondo;
    default:
      return color.tinta;
  }
}

export function MarchaScreen() {
  const t = useSession();
  const s = t.snap;
  const step = s.ref !== undefined ? compiled.steps[s.ref] : undefined;
  const KeepAwake = t.keepAwake;

  useEffect(() => {
    if (s.phase === 'done') router.replace('/sesion/hecho');
    if (s.phase === 'select') router.replace('/');
  }, [s.phase]);

  if (!step || s.phase === 'done' || s.phase === 'select') return <Lienzo bg={color.tinta}>{null}</Lienzo>;

  let body;
  if (s.paused) body = <Pausa s={s} step={step} onPalm={t.primary} />;
  else if (s.phase === 'countdown') body = <Preparado s={s} step={step} onPalm={t.primary} />;
  else if (s.phase === 'wait') body = <Espera s={s} step={step} onPalm={t.primary} />;
  else if (s.phase === 'reps') body = <Escalera step={step} refId={s.ref!} />;
  else if (step.blockKind === 'tabata') body = <TabataMarcha s={s} step={step} onPalm={t.primary} />;
  else if (s.duration >= LONG) body = <Minutos s={s} step={step} onPalm={t.primary} />;
  else body = <Mantener s={s} step={step} onPalm={t.primary} />;

  return (
    <Lienzo bg={background(s, step)}>
      {KeepAwake && <KeepAwake />}
      <View style={{ flex: 1 }}>{body}</View>
      <Mando
        left={s.left}
        central={s.central}
        onLeft={s.left === 'stop' ? t.stop : t.prev}
        onCentral={t.primary}
        onRight={t.next}
        centralLabel={s.phase === 'wait' ? 'Siguiente · empieza con 3, 2, 1' : undefined}
      />
    </Lienzo>
  );
}

/** Nombre y segundos del paso, para «a continuación». */
function nextLabel(info: StepInfo | undefined) {
  if (!info) return undefined;
  const block = session.blocks[info.block];
  const ref = compiled.steps.indexOf(info);
  const sec = stepSeconds(compiled, ref);
  if (info.tramo === 0 && block) return `${block.name} · ${block.minutes}'`;
  if (info.reps) return `${info.label} · ${info.reps}`;
  return sec ? `${info.label} · ${sec}"` : info.label;
}

function Siguiente({ info, fg = color.tarjeta, bg = color.texto2 }: { info?: StepInfo; fg?: string; bg?: string }) {
  if (!info) return null;
  const ex = exercise(info.exercise);
  return (
    <View
      accessibilityLabel={`A continuación: ${nextLabel(info)}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.s16, paddingVertical: space.s8, paddingLeft: space.s8, paddingRight: space.s24, borderRadius: radius.pill, backgroundColor: bg, alignSelf: 'center' }}
    >
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: color.tarjeta, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {ex ? <Image source={ex.phases[0]} style={{ width: 52, height: 52 }} resizeMode="contain" /> : <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: color.naranja }} />}
      </View>
      <KText size={RUN} tint={fg}>
        {nextLabel(info)}
      </KText>
    </View>
  );
}

/** 3·2·1: tinta con el número en naranja. */
function Preparado({ s, step, onPalm }: { s: Snapshot; step: StepInfo; onPalm: () => void }) {
  return (
    <>
      <CabeceraMarcha
        title={step.label}
        fg={color.tarjeta}
        below={
          step.blockKind === 'tabata' ? (
            <KText size={RUN} tint={color.linea}>{`Tabata ${step.set} de ${step.sets}`}</KText>
          ) : (
            <PuntosTramo total={step.tramos} current={step.tramo} fg={color.tarjeta} />
          )
        }
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s32 }}>
        <PildoraMarcha label="Preparado" bg={alpha.sobreColor} fg={color.tarjeta} />
        <Palma bg={color.naranja} onPress={onPalm} label={`Cuenta atrás ${s.n}`}>
          <KText size={cifra.c233} weight={300} tint={color.tinta} lineHeight={cifra.c233} tabular>
            {String(s.n)}
          </KText>
        </Palma>
        <KText size={RUN} tint={color.linea}>
          Deja el teléfono en el suelo
        </KText>
      </View>
    </>
  );
}

/** Espera manual entre tramos (J5Next): tú decides cuándo. */
function Espera({ s, step, onPalm }: { s: Snapshot; step: StepInfo; onPalm: () => void }) {
  const next = upcoming(compiled, s.index);
  const endOfBlock = next && next.block !== step.block;
  return (
    <>
      <CabeceraMarcha
        title={endOfBlock ? session.blocks[step.block].name : step.label}
        fg={color.tarjeta}
        below={<PuntosTramo total={step.tramos} current={step.tramo + 1} fg={color.tarjeta} done={color.verde} now={color.verde} />}
        right={
          <KText size={cifra.c34} weight={300} tint={color.tinteVerde} tabular accessibilityLabel={`Llevas ${s.waited} segundos descansando`}>
            {mmss(s.waited)}
          </KText>
        }
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s32 }}>
        <PildoraMarcha label="Espera · tú decides" bg={alpha.sobreColor} fg={color.tarjeta} />
        <Palma bg={color.verde} onPress={onPalm} label="Palma · siguiente, empieza con 3, 2, 1">
          <CheckIcon size={cifra.c89} tint={color.tarjeta} />
        </Palma>
        <Siguiente info={next} />
      </View>
    </>
  );
}

/** Pausa (KP1Paused): todo en tinta; parar ocupa el sitio de anterior y guarda lo hecho. */
function Pausa({ s, step, onPalm }: { s: Snapshot; step: StepInfo; onPalm: () => void }) {
  const timed = s.phase === 'work' || s.phase === 'rest';
  return (
    <>
      <CabeceraMarcha title={step.label} fg={color.tarjeta} right={<PildoraMarcha label="En pausa" bg={alpha.sobreColor} fg={color.tarjeta} />} />
      <Pressable onPress={onPalm} accessibilityRole="button" accessibilityLabel="Palma · seguir" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s32 }}>
        <View style={{ width: touch.palma, height: touch.palma, borderRadius: touch.palma / 2, backgroundColor: color.tarjeta, alignItems: 'center', justifyContent: 'center', gap: space.s8 }}>
          <KText size={cifra.c144} weight={300} tint={color.tinta} lineHeight={cifra.c144} tabular>
            {s.duration >= LONG ? mmss(s.n) : String(s.n)}
          </KText>
          <KText size={RUN} caps>
            Toca y sigue
          </KText>
        </View>
        {timed && s.duration < LONG && <PuntosSegundos total={s.duration} elapsed={s.duration - s.n} size={14} />}
      </Pressable>
      <KText size={RUN} tint={color.linea} style={{ textAlign: 'center', paddingHorizontal: space.s24, paddingBottom: space.s16 }}>
        Parar guarda lo que llevas
      </KText>
    </>
  );
}

