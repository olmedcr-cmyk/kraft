/** ¿No hay ese peso? (KC8): el más cercano, u otro ejercicio antes y luego se vuelve. Elena lo ve en la nota. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraAccion } from '@/components/BarraAccion';
import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { Vacio } from '@/components/Vacio';
import { Volver } from '@/features/tu/piezas';
import { addNote, compiled, session, sessionRunner, setWeight, useSessionExtra } from '@/session/store';
import { useSettings } from '@/state/settings';
import { cifra, color, layout, radius, space, texto, touch, arriba } from '@/theme';
import { STEP_KG, kgLabel } from './Escalera';

export function PesoScreen() {
  const insets = useSafeAreaInsets();
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const { peso } = useSettings();
  const extra = useSessionExtra();
  const refId = Number(ref);
  const step = compiled.steps[refId];
  const base = step ? (refId in extra.weights ? extra.weights[refId] : (step.weight ?? null)) : null;
  const [pick, setPick] = useState(base == null ? null : Math.max(STEP_KG, base - STEP_KG));
  if (!step || base == null || pick == null) return <Vacio title="Peso" note="Este tramo no lleva peso" />;

  const coach = session.coach.name;
  const unit = peso;
  const label = (w: number) => kgLabel(w, unit);
  const name = compiled.steps.find((x) => x.block === step.block && x.ladder !== undefined)?.label ?? step.label;

  // Otro ejercicio antes: el primer accesorio del bloque que aún no se ha hecho.
  const st = sessionRunner.getState();
  const other = compiled.steps
    .map((x, i) => ({ ...x, ref: i }))
    .find((x) => x.block === step.block && x.after !== undefined && st.plan.findIndex((p) => p.ref === x.ref) > st.index);

  const choose = () => {
    setWeight(refId, pick);
    addNote(`${name}: ${label(pick)} ${unit} en vez de ${label(base)}`);
    router.back();
  };
  const swap = () => {
    if (!other) return;
    sessionRunner.bringForward(other.ref);
    addNote(`${other.label} antes que ${name} (no había ${label(base)} ${unit})`);
    router.back();
  };

  const options = [base - STEP_KG, base, base + STEP_KG].filter((w) => w > 0);

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo, paddingTop: arriba(insets.top, layout.pantallaArriba - space.s24), paddingHorizontal: layout.pantallaLado, paddingBottom: space.s16 + insets.bottom, gap: layout.entreTarjetas }}>
      <Volver to="Escalera" href="/sesion" />
      <View style={{ paddingHorizontal: space.s8, paddingBottom: space.s16, gap: space.s8 }}>
        <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
          {`¿No hay ${label(base)} ${unit}?`}
        </KText>
        <KText size={texto.texto} tint={color.texto2}>
          Elige el más cercano
        </KText>
      </View>

      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: space.s8 }}>
        {options.map((w) => {
          const missing = w === base;
          const on = w === pick;
          return (
            <Pulsable
              key={w}
              onPress={() => setPick(w)}
              disabled={missing}
              haptic="selection"
              accessibilityRole="radio"
              accessibilityState={{ checked: on, disabled: missing }}
              accessibilityLabel={missing ? `${label(w)} ${unit}, no hay` : `${label(w)} ${unit}`}
              style={{
                flex: 1,
                height: touch.tecla,
                borderRadius: radius.md,
                backgroundColor: missing ? color.hundido : color.tarjeta,
                borderWidth: 2,
                borderColor: on ? color.tinta : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <KText size={texto.bloque} tint={missing ? color.texto2 : color.tinta} style={missing ? { textDecorationLine: 'line-through' } : undefined}>
                {label(w)}
              </KText>
            </Pulsable>
          );
        })}
      </View>

      {other && (
        <Pulsable
          onPress={swap}
          accessibilityRole="button"
          accessibilityLabel={`Haz antes ${other.label} y vuelve`}
          scaleTo={0.98}
          style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, padding: space.s16, flexDirection: 'row', alignItems: 'center', gap: space.s16 }}
        >
          <View style={{ width: 56, height: 56, borderRadius: radius.md, backgroundColor: color.tinteNaranja, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: color.naranja }} />
          </View>
          <View style={{ flex: 1, gap: space.s4 }}>
            <KText size={texto.texto} lineHeight={texto.texto * 1.5}>
              O haz otro ejercicio y vuelve:
            </KText>
            <KText size={texto.lista}>{`${other.label} primero`}</KText>
          </View>
          <KText size={texto.bloque} tint={color.texto2}>
            ›
          </KText>
        </Pulsable>
      )}

      <View style={{ flex: 1 }} />
      <KText size={texto.texto} tint={color.texto2} style={{ paddingHorizontal: space.s8, paddingBottom: space.s8 }}>
        {`${coach} verá el cambio en tu nota.`}
      </KText>
      <BarraAccion label={`${label(pick)} ${unit}`} onPress={choose} />
    </View>
  );
}
