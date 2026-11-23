/** Piezas compartidas por las pantallas en marcha de la sesión. */
import { quedan } from '@/timer/hablado';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Image, View, type ImageSourcePropType } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KText } from '@/components/KText';
import { alpha, cifra, color, layout, radius, space, texto, touch, transicionFondo, transicionPunto, arriba } from '@/theme';
import { Pulsable } from '@/components/Pulsable';
import Animated from 'react-native-reanimated';

/** En marcha, nada bajo 18. */
export const RUN = texto.bloque;

export const pad2 = (v: number) => String(v).padStart(2, '0');
export const mmss = (sec: number) => `${Math.floor(sec / 60)}:${pad2(sec % 60)}`;

export { quedan };

/** Etiqueta de la palma: fase, lo que queda y qué hace tocarla (sin acción, solo lo primero). */
export const palmaLabel = (fase: string, sec: number, accion?: string) => `${fase}, ${quedan(sec)}.${accion ? ` ${accion}` : ''}`;

/** Fondo a sangre con el hueco de arriba. */
export function Lienzo({ bg, children }: { bg: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Animated.View style={{ ...transicionFondo, flex: 1, backgroundColor: bg, paddingTop: arriba(insets.top, layout.pantallaArriba) }}>{children}</Animated.View>
  );
}

/** Cabecera en marcha: nombre del ejercicio y sus tramos; a la derecha, lo que toque. */
export function CabeceraMarcha({ title, fg, below, right }: { title: string; fg: string; below?: ReactNode; right?: ReactNode }) {
  return (
    <View style={{ paddingHorizontal: space.s24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.s16 }}>
      <View style={{ gap: space.s8, flexShrink: 1 }}>
        <KText size={texto.boton} tint={fg} accessibilityRole="header" numberOfLines={1}>
          {title}
        </KText>
        {below}
      </View>
      {right}
    </View>
  );
}

/** Tramos del ejercicio: hecho (color), actual (naranja), pendiente (aro). */
export function PuntosTramo({ total, current, fg, done = color.naranja, now = color.naranja }: { total: number; current: number; fg: string; done?: string; now?: string }) {
  if (total < 2 || total > 12) return null;
  return (
    <View style={{ flexDirection: 'row', gap: space.s4 }} accessibilityLabel={`Tramo ${current + 1} de ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <Animated.View
          key={i}
          style={{
            ...transicionPunto,
            width: space.s12,
            height: space.s12,
            borderRadius: space.s12 / 2,
            backgroundColor: i < current ? done : i === current ? now : 'transparent',
            borderWidth: i > current ? 2 : 0,
            borderColor: fg,
          }}
        />
      ))}
    </View>
  );
}

/** Píldora de fase en marcha: punto + palabra (nunca solo color). */
export function PildoraMarcha({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <Animated.View
      accessibilityLabel={label}
      style={{ ...transicionFondo, height: touch.dedo, paddingHorizontal: space.s16, borderRadius: radius.pill, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', gap: space.s8, alignSelf: 'center' }}
    >
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: fg }} />
      <KText size={RUN} tint={fg}>
        {label}
      </KText>
    </Animated.View>
  );
}

/** Un punto = un segundo, en filas de 10. */
export function PuntosSegundos({ total, elapsed, size = 18, live = color.tarjeta, gone = alpha.sobreColor }: { total: number; elapsed: number; size?: number; live?: string; gone?: string }) {
  const cols = 10;
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Quedan ${total - elapsed} de ${total} segundos`}
      style={{ width: cols * size + (cols - 1) * space.s8, flexDirection: 'row', flexWrap: 'wrap', gap: space.s8 }}
    >
      {Array.from({ length: total }, (_, i) => (
        <Animated.View
          key={i}
          style={{ ...transicionPunto, width: size, height: size, borderRadius: size / 2, backgroundColor: i < elapsed ? gone : i === elapsed ? color.naranja : live }}
        />
      ))}
    </View>
  );
}

/** Un círculo = un minuto; el actual se va llenando en naranja. */
export function CirculosMinuto({ seconds, elapsed }: { seconds: number; elapsed: number }) {
  const n = Math.ceil(seconds / 60);
  const cur = Math.floor(elapsed / 60);
  const frac = (elapsed % 60) / 60;
  const d = touch.dedo;
  const r = d / 2;
  const a = frac * 2 * Math.PI;
  const x = r + r * Math.sin(a);
  const y = r - r * Math.cos(a);
  const arc = `M${r} ${r}L${r} 0A${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${x} ${y}Z`;
  const dim = alpha.sobreColor;
  return (
    <View accessibilityRole="image" accessibilityLabel={`Minuto ${Math.min(cur + 1, n)} de ${n}`} style={{ flexDirection: 'row', gap: space.s8, flexWrap: 'wrap' }}>
      {Array.from({ length: n }, (_, i) => (
        <Svg key={i} width={d} height={d}>
          <Circle cx={r} cy={r} r={r} fill={i < cur ? dim : i === cur ? dim : color.tarjeta} />
          {i === cur && frac > 0 && <Path d={arc} fill={color.naranja} />}
        </Svg>
      ))}
    </View>
  );
}

/** Las 3 fases del ejercicio, en bucle (estático si el sistema pide menos movimiento). */
export function useFase(active = true) {
  const [phase, setPhase] = useState(0);
  const [still, setStill] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
  }, []);
  useEffect(() => {
    if (!active || still) return;
    const id = setInterval(() => setPhase((p) => (p + 1) % 3), 800);
    return () => clearInterval(id);
  }, [active, still]);
  return still ? 0 : phase;
}

export function Ilustracion({ phases, size, active = true, label }: { phases: ImageSourcePropType[]; size: number; active?: boolean; label?: string }) {
  const p = useFase(active);
  return (
    <Image
      source={phases[p]}
      accessibilityLabel={label}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

/** Botón «?» → cómo se hace. El tiempo sigue. */
export function BotonComo({ exerciseId, size = touch.tecla, label, bg = color.klein, fg = color.tarjeta }: { exerciseId: string; size?: number; label: string; bg?: string; fg?: string }) {
  return (
    <Pulsable
      onPress={() => router.push({ pathname: '/sesion/como', params: { ex: exerciseId } })}
      accessibilityRole="button"
      accessibilityLabel={`¿Cómo se hace ${label}?`}
      hitSlop={8}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}
    >
      <KText size={size >= touch.tecla ? cifra.c34 : RUN} weight={500} tint={fg} lineHeight={size >= touch.tecla ? cifra.c34 : RUN}>
        ?
      </KText>
    </Pulsable>
  );
}
