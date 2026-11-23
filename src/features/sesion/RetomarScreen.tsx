/** Te quedaste a medias (KC3): la app se cerró con la sesión en marcha. Seguir, desde cero o terminar ahí. */
import { StatusBar } from 'expo-status-bar';
import { Redirect, router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnilloPuntos } from '@/components/AnilloPuntos';
import { BarraAccion } from '@/components/BarraAccion';
import { PlayIcon } from '@/components/icons';
import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { hhmm } from '@/agenda/model';
import { compileSession } from '@/session/compile';
import { discardUnfinished, finishUnfinished, resumeUnfinished, useUnfinished } from '@/session/marcha';
import { compiled, resetSession, sessionRunner } from '@/session/store';
import { alpha, cifra, color, layout, radius, space, texto, touch, arriba } from '@/theme';

const RING = 280;
const SUN = 180;
const DOTS = 24;
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/** «Hoy · 19:40», «Ayer · 19:40», «Martes · 19:40». */
function when(t: number, now = Date.now()) {
  const d0 = new Date(now);
  d0.setHours(0, 0, 0, 0);
  const days = Math.floor((d0.getTime() - t) / 86_400_000) + 1;
  const day = t >= d0.getTime() ? 'Hoy' : days <= 1 ? 'Ayer' : DAYS[new Date(t).getDay()];
  return `${day} · ${hhmm(t)}`;
}

export function RetomarScreen() {
  const insets = useSafeAreaInsets();
  const u = useUnfinished();

  // Dónde se quedó: bloque y tramo («3/6 Tabata»), y cuánto de la sesión llevaba.
  const info = useMemo(() => {
    if (!u) return null;
    const steps = compileSession(u.session, { countdown: 0, descanso: 'manual' }).steps;
    const seg = u.state.plan[u.state.index];
    const step = seg?.ref !== undefined ? steps[seg.ref] : undefined;
    const block = u.session.blocks[step?.block ?? 0];
    const frac = step?.blockKind === 'tabata' ? `${step.set ?? 1}/${step.sets ?? 1}` : `${(step?.tramo ?? 0) + 1}/${step?.tramos ?? 1}`;
    const light = block.tint === 'tinteNaranja';
    return {
      frac,
      name: block.name,
      bg: light ? color.tinteNaranja : color[block.tint],
      fg: block.tint === 'naranja' || light ? color.tinta : color.tarjeta,
      done: Math.round((u.state.index / Math.max(1, u.state.plan.length)) * DOTS),
    };
  }, [u]);

  if (!u || !info) return <Redirect href="/" />;

  const seguir = () => {
    resumeUnfinished();
    sessionRunner.primary(); // 3·2·1 y donde estaba
    router.replace('/sesion');
  };
  const desdeCero = () => {
    discardUnfinished();
    resetSession();
    sessionRunner.startAt(compiled.blockStart[0] ?? 0);
    router.replace('/sesion');
  };
  const terminar = () => {
    finishUnfinished();
    router.replace('/sesion/hecho');
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.tinta, paddingTop: arriba(insets.top, layout.pantallaArriba), paddingHorizontal: layout.pantallaLado, paddingBottom: space.s16 + insets.bottom, gap: layout.entreTarjetas }}>
      <StatusBar style="light" />
      <View style={{ paddingHorizontal: space.s8, gap: space.s8 }}>
        <KText size={texto.texto} tint={color.linea}>
          {when(u.savedAt)}
        </KText>
        <KText size={cifra.c34} weight={300} title tint={color.tarjeta} lineHeight={cifra.c34} accessibilityRole="header">
          {'Te quedaste\na medias'}
        </KText>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View accessible accessibilityLabel={`${info.name}, ${info.frac.replace('/', ' de ')}`} style={{ width: RING, height: RING }}>
          <AnilloPuntos count={DOTS} elapsed={info.done} size={RING} ring={RING / 2 - 12} live={alpha.sobreColor} gone={color.tarjeta} />
          <View
            style={{
              position: 'absolute',
              left: (RING - SUN) / 2,
              top: (RING - SUN) / 2,
              width: SUN,
              height: SUN,
              borderRadius: SUN / 2,
              backgroundColor: info.bg,
              alignItems: 'center',
              justifyContent: 'center',
              gap: space.s4,
            }}
          >
            <KText size={cifra.c55} weight={300} tint={info.fg} lineHeight={cifra.c55} tabular>
              {info.frac}
            </KText>
            <KText size={texto.etiqueta} caps tint={info.fg}>
              {info.name}
            </KText>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: space.s8 }}>
        <Secundario label="Desde cero" onPress={desdeCero} />
        <Secundario label="Terminar aquí" onPress={terminar} a11y="Terminar aquí y guardar lo hecho" />
      </View>
      <BarraAccion label="Seguir" onPress={seguir} bg={color.naranja} fg={color.tinta} knob={color.tinta} icon={<PlayIcon tint={color.naranja} />} />
    </View>
  );
}

function Secundario({ label, onPress, a11y }: { label: string; onPress: () => void; a11y?: string }) {
  return (
    <Pulsable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y ?? label}
      style={{ flex: 1, height: touch.tecla, borderRadius: radius.md, backgroundColor: alpha.tarjetaSobreColor, alignItems: 'center', justifyContent: 'center' }}
    >
      <KText size={texto.texto} tint={color.tarjeta}>
        {label}
      </KText>
    </Pulsable>
  );
}
