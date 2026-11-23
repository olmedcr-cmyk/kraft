/** Escalera por repeticiones (J7Ladder). Sin reloj: el atleta marca cada serie con ✓. */
import { ScrollView, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { KText } from '@/components/KText';
import { exercise } from '@/data/exercises';
import type { StepInfo } from '@/session/compile';
import { router } from 'expo-router';

import { compiled, sessionRunner, setWeight, useSessionExtra } from '@/session/store';
import { useSettings } from '@/state/settings';
import { cifra, color, inner, radius, space, texto, touch, transicionPunto } from '@/theme';
import { BotonComo, RUN } from './piezas';
import { Pulsable } from '@/components/Pulsable';
import Animated from 'react-native-reanimated';

export const STEP_KG = 2.5;
const LB_PER_KG = 2.20462;
type Unidad = 'kg' | 'lb';
/** Se guarda siempre en kg; se enseña en la unidad de Tú · Entreno (lb, redondeado a media libra). */
export const kgLabel = (w: number | null, u: Unidad = 'kg') =>
  w == null ? 'barra' : String(u === 'lb' ? Math.round(w * LB_PER_KG * 2) / 2 : w).replace('.', ',');
const unitName = (u: Unidad) => (u === 'lb' ? 'libras' : 'kilos');

export function Escalera({ step, refId }: { step: StepInfo; refId: number }) {
  const extra = useSessionExtra();
  const { peso } = useSettings();
  const block = compiled.steps.map((x, i) => ({ ...x, ref: i })).filter((x) => x.block === step.block);
  const ladder = block.filter((x) => x.ladder !== undefined);
  const after = block.filter((x) => x.after !== undefined);
  const inLadder = step.ladder !== undefined;
  const ex = exercise(ladder[0]?.exercise);
  const weightOf = (ref: number, base: number | null | undefined) => (ref in extra.weights ? extra.weights[ref] : (base ?? null));
  const w = weightOf(refId, step.weight);
  // Hecho = ya pasó en la marcha (el orden puede cambiar si se adelantó otro ejercicio, KC8).
  const st = sessionRunner.getState();
  const posOf = (ref: number) => st.plan.findIndex((p) => p.ref === ref);
  const isDone = (ref: number) => posOf(ref) < st.index;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: space.s16, gap: space.s8, paddingBottom: space.s16 }}>
      <View style={{ paddingHorizontal: space.s8, paddingBottom: space.s8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <KText size={cifra.c34} title tint={color.tinta} lineHeight={cifra.c34} accessibilityRole="header" style={{ flexShrink: 1 }}>
          {ladder[0]?.label ?? step.label}
        </KText>
        {ex && <BotonComo exerciseId={ex.id} size={56} label={ex.name} />}
      </View>

      <View
        accessibilityLabel={`Escalera: ${ladder.map((l) => `${l.reps}`).join(', ')}`}
        style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, paddingVertical: space.s24, paddingHorizontal: space.s16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' }}
      >
        {ladder.map((l) => {
          const done = isDone(l.ref);
          const now = l.ref === refId;
          const d = 40 + 2 * (l.reps ?? 0);
          return (
            <View key={l.ref} style={{ alignItems: 'center', gap: space.s8 }}>
              <Animated.View
                style={{
                  ...transicionPunto,
                  width: d,
                  height: d,
                  borderRadius: d / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: done ? color.tinta : now ? color.naranja : 'transparent',
                  borderWidth: done || now ? 0 : 2,
                  borderColor: color.tinta,
                }}
              >
                <KText size={d > 60 ? texto.boton : RUN} weight={300} tint={done ? color.tarjeta : color.tinta}>
                  {String(l.reps)}
                </KText>
              </Animated.View>
              <KText size={RUN} tint={now ? color.tinta : color.texto2}>
                {kgLabel(weightOf(l.ref, l.weight), peso)}
              </KText>
            </View>
          );
        })}
      </View>

      {inLadder && (
        <View style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, padding: space.s16, flexDirection: 'row', alignItems: 'center', gap: space.s8 }}>
          <Ajuste unit={peso} dir="down" onPress={() => setWeight(refId, w == null ? null : Math.max(0, w - STEP_KG) || null)} />
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: space.s4 }} accessibilityLabel={w == null ? 'Barra sola' : `${kgLabel(w, peso)} ${unitName(peso)}`}>
            <KText size={cifra.c55} weight={300} tabular lineHeight={cifra.c55}>
              {w == null ? 'barra' : kgLabel(w, peso)}
            </KText>
            {w != null && (
              <KText size={RUN} tint={color.texto2}>
                {peso}
              </KText>
            )}
          </View>
          <Ajuste unit={peso} dir="up" onPress={() => setWeight(refId, (w ?? 20) + STEP_KG)} />
        </View>
      )}
      {/* Sin ese peso en el gimnasio (KC8): el más cercano, u otro ejercicio antes. */}
      {inLadder && w != null && (
        <Pulsable
          onPress={() => router.push({ pathname: '/sesion/peso', params: { ref: String(refId) } })}
          accessibilityRole="link"
          scaleTo={0.98}
          style={{ height: touch.dedo, alignItems: 'center', justifyContent: 'center' }}
        >
          <KText size={RUN} tint={color.texto2} style={{ textDecorationLine: 'underline' }}>
            {`¿No hay ${kgLabel(w, peso)} ${peso}?`}
          </KText>
        </Pulsable>
      )}

      <View accessibilityLabel="Después" style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, paddingVertical: space.s8, paddingHorizontal: space.s16 }}>
        {after.map((a) => {
          const done = isDone(a.ref);
          const now = a.ref === refId;
          return (
            <View key={a.ref} style={{ height: touch.dedo, flexDirection: 'row', alignItems: 'center', gap: space.s12 }}>
              <Animated.View
                style={{
                  ...transicionPunto,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: done ? color.tinta : now ? color.naranja : 'transparent',
                  borderWidth: done || now ? 0 : 2,
                  borderColor: color.tinta,
                }}
              />
              <KText size={RUN} style={{ flex: 1 }} weight={now ? 500 : 400}>
                {a.label}
              </KText>
              {a.detail && (
                <KText size={RUN} tint={color.texto2}>
                  {a.detail}
                </KText>
              )}
            </View>
          );
        })}
      </View>

      {/* El central es ✓: pausar (y desde ahí, parar guardando) es mantenerlo pulsado. */}
      <KText size={RUN} tint={color.texto2} style={{ textAlign: 'center', paddingTop: space.s8 }}>
        Mantén pulsado el centro para pausar
      </KText>
    </ScrollView>
  );
}

function Ajuste({ dir, onPress, unit }: { dir: 'up' | 'down'; onPress: () => void; unit: Unidad }) {
  const pad = space.s16;
  return (
    <Pulsable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${dir === 'up' ? 'Más' : 'Menos'} ${kgLabel(STEP_KG, unit)} ${unitName(unit)}`}
      haptic="selection"
      style={{
        width: touch.tecla + space.s16,
        height: touch.tecla + space.s16,
        borderRadius: inner(radius.lg, pad),
        backgroundColor: color.fondo,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={28} height={20} viewBox="0 0 28 20">
        <Path d={dir === 'up' ? 'M3 17L14 4l11 13z' : 'M3 3l11 13L25 3z'} fill={color.tinta} stroke={color.tinta} strokeWidth={2} strokeLinejoin="round" />
      </Svg>
    </Pulsable>
  );
}
