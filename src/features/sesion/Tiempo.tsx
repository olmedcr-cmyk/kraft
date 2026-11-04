/** Tramos con tiempo: minutos (J3Warmup) y mantener (J4Hold). Trabajo en Klein, descanso en verde. */
import { Pressable, View } from 'react-native';

import { KText } from '@/components/KText';
import { exercise } from '@/data/exercises';
import type { StepInfo } from '@/session/compile';
import { alpha, cifra, color, space, texto } from '@/theme';
import type { Snapshot } from '@/timer/engine';
import { BotonComo, CabeceraMarcha, CirculosMinuto, PildoraMarcha, PuntosSegundos, PuntosTramo, mmss } from './piezas';

type Props = { s: Snapshot; step: StepInfo; onPalm: () => void };

/** Largos (≥ 2'): un círculo por minuto y m:ss. */
export function Minutos({ s, step, onPalm }: Props) {
  return (
    <>
      <View style={{ paddingHorizontal: space.s24, gap: space.s16 }}>
        <KText size={texto.boton} tint={color.tarjeta} accessibilityRole="header">
          {step.label}
        </KText>
        <CirculosMinuto seconds={s.duration} elapsed={s.duration - s.n} />
      </View>
      <Pressable
        onPress={onPalm}
        accessibilityRole="button"
        accessibilityLabel="Palma · toca el centro para pausar"
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s24 }}
      >
        <PildoraMarcha label={s.phase === 'rest' ? 'Descanso' : 'Trabajo'} bg={alpha.sobreColor} fg={color.tarjeta} />
        <KText size={cifra.c144} weight={300} title tabular tint={color.tarjeta} lineHeight={cifra.c144}>
          {mmss(s.n)}
        </KText>
      </Pressable>
    </>
  );
}

/** Cortos: el número grande y un punto por segundo. */
export function Mantener({ s, step, onPalm }: Props) {
  const ex = exercise(step.exercise);
  return (
    <>
      <CabeceraMarcha
        title={step.label}
        fg={color.tarjeta}
        below={<PuntosTramo total={step.tramos} current={step.tramo} fg={color.tarjeta} />}
        right={ex ? <BotonComo exerciseId={ex.id} label={ex.name} bg={color.tarjeta} fg={color.klein} /> : null}
      />
      <Pressable
        onPress={onPalm}
        accessibilityRole="button"
        accessibilityLabel="Palma · toca el centro para pausar"
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s32 }}
      >
        <PildoraMarcha label={s.phase === 'rest' ? 'Descanso' : 'Trabajo'} bg={alpha.sobreColor} fg={color.tarjeta} />
        <KText size={cifra.c233} weight={300} title tabular tint={color.tarjeta} lineHeight={Math.round(cifra.c233 * 0.85)}>
          {String(s.n)}
        </KText>
        <PuntosSegundos total={s.duration} elapsed={s.duration - s.n} />
      </Pressable>
    </>
  );
}
