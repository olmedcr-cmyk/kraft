/** Tabata dentro de la sesión (J6Tabata): naranja trabajando, verde descansando. */
import { Pressable, View } from 'react-native';

import { KText } from '@/components/KText';
import { exercise } from '@/data/exercises';
import type { StepInfo } from '@/session/compile';
import { compiled } from '@/session/store';
import { alpha, cifra, color, inner, radius, space, texto, touch } from '@/theme';
import type { Snapshot } from '@/timer/engine';
import { BotonComo, Ilustracion, PildoraMarcha, RUN } from './piezas';
import Svg, { Path } from 'react-native-svg';

type Props = { s: Snapshot; step: StepInfo; onPalm: () => void };

const kg = (w?: number | null) => (w == null ? '' : String(w).replace('.', ','));

export function TabataMarcha({ s, step, onPalm }: Props) {
  const work = s.phase === 'work';
  const fg = work ? color.tinta : color.tarjeta;
  const soft = work ? alpha.sobreClaro : alpha.sobreColor;
  const sets = step.sets ?? 1;
  const set = step.set ?? 1;
  const rounds = step.rounds ?? 1;
  const round = step.round ?? 1;

  // Ejercicios A y B del bloque (los dos primeros pasos del tabata).
  const block = compiled.steps.filter((x) => x.block === step.block);
  const a = block.find((x) => x.side === 'A') ?? step;
  const b = block.find((x) => x.side === 'B');
  // En descanso se enseña lo que viene.
  const nextSide = work ? step.side : step.side === 'A' && b ? 'B' : 'A';
  const restBetweenSets = !work && round === rounds;

  return (
    <>
      <View style={{ paddingHorizontal: space.s24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: space.s4 }} accessibilityLabel={`Tabata ${set} de ${sets}`}>
          {Array.from({ length: sets }, (_, i) => (
            <View
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: radius.xs,
                backgroundColor: i < set - 1 ? fg : i === set - 1 ? (work ? color.tarjeta : color.naranja) : 'transparent',
                borderWidth: i > set - 1 ? 2 : 0,
                borderColor: fg,
              }}
            />
          ))}
        </View>
        <KText size={RUN} tint={fg} tabular>{`r${round} / ${rounds}`}</KText>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', gap: space.s24, paddingHorizontal: space.s16 }}>
        <Pressable onPress={onPalm} accessibilityRole="button" accessibilityLabel="Palma · toca para pausar" style={{ alignSelf: 'center', alignItems: 'center', gap: space.s16 }}>
          <PildoraMarcha
            label={work ? `Trabajo · ${step.side ?? 'A'}` : restBetweenSets ? 'Descanso · cambia' : 'Descanso'}
            bg={soft}
            fg={fg}
          />
          <KText size={cifra.c233} weight={300} title tabular tint={fg} lineHeight={Math.round(cifra.c233 * 0.85)}>
            {String(s.n)}
          </KText>
        </Pressable>

        <View accessibilityRole="image" accessibilityLabel={`Ronda ${round} de ${rounds}`} style={{ flexDirection: 'row', gap: space.s4, paddingHorizontal: space.s8 }}>
          {Array.from({ length: rounds }, (_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 10,
                borderRadius: radius.pill,
                backgroundColor: i < round - 1 ? fg : i === round - 1 ? (work ? color.tarjeta : color.naranja) : soft,
              }}
            />
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: space.s8 }}>
          <Tarjeta info={a} on={nextSide === 'A'} fg={fg} />
          {b && <Tarjeta info={b} on={nextSide === 'B'} fg={fg} />}
        </View>

        <Gesto hold={!!(nextSide === 'B' ? b?.hold : a.hold)} fg={fg} soft={soft} />
      </View>
    </>
  );
}

/** Ejercicio A o B. El activo va en tinta y se mueve; el otro, en aro. */
function Tarjeta({ info, on, fg }: { info: StepInfo; on: boolean; fg: string }) {
  const ex = exercise(info.exercise);
  const pad = space.s12;
  return (
    <View
      style={{
        flex: 1,
        borderRadius: radius.lg,
        padding: pad,
        gap: space.s12,
        backgroundColor: on ? color.tinta : 'transparent',
        borderWidth: on ? 0 : 2,
        borderColor: fg,
      }}
    >
      <View
        style={{
          height: 96,
          borderRadius: inner(radius.lg, pad),
          backgroundColor: on ? color.tarjeta : alpha.sobreColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {ex && <Ilustracion phases={ex.phases} size={88} active={on} label={ex.alt} />}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.s4 }}>
        <KText size={RUN} tint={on ? color.tarjeta : fg} numberOfLines={2} style={{ flexShrink: 1 }}>
          {info.label}
        </KText>
        {info.weight != null && (
          <KText size={RUN} tint={on ? color.linea : fg}>
            {kg(info.weight)}
          </KText>
        )}
      </View>
      {on && ex && (
        <View style={{ position: 'absolute', top: space.s4, right: space.s4 }}>
          <BotonComo exerciseId={ex.id} size={touch.dedo} label={ex.name} />
        </View>
      )}
    </View>
  );
}

/** Qué toca hacer con el cuerpo: moverse · mantén · cambiar. */
function Gesto({ hold, fg, soft }: { hold: boolean; fg: string; soft: string }) {
  const pill = { flex: 1, height: touch.dedo, borderRadius: radius.pill, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <View accessibilityRole="image" accessibilityLabel={hold ? 'Ahora: mantener' : 'Ahora: moverse'} style={{ flexDirection: 'row', gap: space.s4 }}>
      <View style={[pill, { backgroundColor: hold ? soft : color.tinta }]}>
        {hold ? (
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: color.tinta }} />
        ) : (
          <KText size={RUN} tint={color.tarjeta}>
            Mueve
          </KText>
        )}
      </View>
      <View style={[pill, { backgroundColor: hold ? color.tinta : soft }]}>
        <KText size={hold ? RUN : texto.lista} tint={hold ? color.tarjeta : fg}>
          Mantén
        </KText>
      </View>
      <View style={[pill, { borderWidth: 2, borderColor: fg }]}>
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Path d="M4 12h15M13 6l6 6-6 6" stroke={fg} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      </View>
    </View>
  );
}

