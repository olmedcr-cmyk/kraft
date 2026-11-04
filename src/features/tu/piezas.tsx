/** Piezas de «Tú» (KT1–KT6): cabecera con vuelta, grupos de filas, selector pequeño, confirmar con doble toque. */
import { router } from 'expo-router';
import { Children, Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fundido } from '@/components/Fundido';
import { Interruptor } from '@/components/Interruptor';
import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { cifra, color, fundido, layout, radius, space, texto, touch } from '@/theme';

/** Alto de fila de ajustes (KT*: min-height 64). */
const ROW = touch.tecla;
/** Selector pequeño: 36 de alto dentro de un carril de 2 (40 en total); el toque se amplía a 48. */
const OPT_H = 36;

/** «‹ Tú» que vuelve; si se entró por enlace, a donde toca. */
export function Volver({ to }: { to: 'Hoy' | 'Tú' }) {
  const go = () => (router.canGoBack() ? router.back() : router.replace(to === 'Hoy' ? '/' : '/tu'));
  return (
    <Pulsable onPress={go} accessibilityRole="link" accessibilityLabel={`Volver a ${to}`} scaleTo={0.98} style={{ height: touch.dedo, paddingHorizontal: space.s8, justifyContent: 'center', alignSelf: 'flex-start' }}>
      <KText size={texto.texto} tint={color.texto2}>{`‹ ${to}`}</KText>
    </Pulsable>
  );
}

/** Pantalla de Tú: vuelta, título, subtítulo, contenido que se desplaza y pie fijo opcional. */
export function PantallaTu({ back, title, sub, children, footer }: { back: 'Hoy' | 'Tú'; title?: string; sub?: string; children: ReactNode; footer?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    // La vuelta (48) ocupa de 40 a 88: sube 24 sobre el margen de 64 (KT*).
    <View style={{ flex: 1, backgroundColor: color.fondo, paddingTop: Math.max(insets.top, layout.pantallaArriba - space.s24) }}>
      <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: layout.pantallaLado, gap: layout.entreTarjetas, paddingBottom: fundido + (footer ? 0 : insets.bottom), flexGrow: 1 }}>
        <Volver to={back} />
        {title && (
          <View style={{ paddingHorizontal: space.s8, paddingBottom: space.s16, gap: space.s8 }}>
            <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
              {title}
            </KText>
            {sub && (
              <KText size={texto.texto} tint={color.texto2}>
                {sub}
              </KText>
            )}
          </View>
        )}
        {children}
      </ScrollView>
      {/* Al desplazar, el contenido se desvanece en los bordes en vez de cortarse. */}
      <Fundido lado="arriba" />
      <Fundido lado="abajo" />
      </View>
      {footer && <View style={{ paddingHorizontal: layout.pantallaLado, paddingBottom: space.s16 + insets.bottom }}>{footer}</View>}
    </View>
  );
}

/** Tarjeta blanca con filas separadas por una línea. */
export function Grupo({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, paddingHorizontal: space.s16 }}>
      {items.map((c, i) => (
        <Fragment key={i}>
          {i > 0 && <View style={{ height: 1, backgroundColor: color.hundido }} />}
          {c}
        </Fragment>
      ))}
    </View>
  );
}

export function Chevron() {
  return (
    <KText size={texto.bloque} tint={color.texto2}>
      ›
    </KText>
  );
}

/** Fila de ajustes: etiqueta, valor y › si lleva a otra pantalla. */
export function Fila({ label, value, onPress, right, tint = color.tinta, a11y }: { label: string; value?: string; onPress?: () => void; right?: ReactNode; tint?: string; a11y?: string }) {
  const body = (
    <>
      <KText size={texto.lista} tint={tint} style={{ flex: 1 }}>
        {label}
      </KText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s8 }}>
        {value && (
          <KText size={texto.texto} tint={color.texto2}>
            {value}
          </KText>
        )}
        {right ?? (onPress ? <Chevron /> : null)}
      </View>
    </>
  );
  const style = { minHeight: ROW, flexDirection: 'row', alignItems: 'center', gap: space.s16 } as const;
  return onPress ? (
    <Pulsable onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y ?? (value ? `${label}, ${value}` : label)} scaleTo={0.99} style={style}>
      {body}
    </Pulsable>
  ) : (
    <View style={style} accessibilityLabel={a11y ?? (value ? `${label}, ${value}` : label)}>
      {body}
    </View>
  );
}

/** Fila con interruptor: toda la fila lo cambia. */
export function FilaSi({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pulsable
      onPress={() => onChange(!on)}
      haptic="selection"
      scaleTo={0.99}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      style={{ minHeight: ROW, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s16 }}
    >
      <KText size={texto.lista} style={{ flex: 1 }}>
        {label}
      </KText>
      <Interruptor on={on} small />
    </Pulsable>
  );
}

/** Fila con selector pequeño (No · 3 · 5 · 10, kg · lb…). */
export function FilaOpciones<T extends string | number>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={{ minHeight: ROW, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s16 }}>
      <KText size={texto.lista} style={{ flexShrink: 1 }}>
        {label}
      </KText>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', gap: 2, padding: 2, borderRadius: radius.pill, backgroundColor: color.hundido }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pulsable
              key={String(o.value)}
              onPress={() => !on && onChange(o.value)}
              haptic={on ? undefined : 'selection'}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${label}: ${o.label}`}
              hitSlop={(touch.dedo - OPT_H) / 2}
              style={{ minWidth: 40, height: OPT_H, paddingHorizontal: space.s12, borderRadius: radius.pill, backgroundColor: on ? color.tinta : 'transparent', alignItems: 'center', justifyContent: 'center' }}
            >
              <KText size={texto.texto} tint={on ? color.tarjeta : color.tinta}>
                {o.label}
              </KText>
            </Pulsable>
          );
        })}
      </View>
    </View>
  );
}

/** Etiqueta de sección en mayúsculas («Más»). */
export function Seccion({ children }: { children: string }) {
  return (
    <KText size={texto.etiqueta} caps tint={color.texto2} style={{ paddingTop: space.s8, paddingHorizontal: space.s8 }}>
      {children}
    </KText>
  );
}

/** Círculo con inicial (atleta, entrenador). */
export function Avatar({ initial, size }: { initial: string; size: number }) {
  const font = size >= 88 ? cifra.c34 : size >= 64 ? texto.boton : texto.bloque;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color.tinta, alignItems: 'center', justifyContent: 'center' }}>
      <KText size={font} tint={color.tarjeta}>
        {initial.toUpperCase()}
      </KText>
    </View>
  );
}

/** Acción delicada (cerrar sesión, dejar al entrenador): el primer toque arma, el segundo hace. Se desarma sola. */
export function useConfirmar(ms = 3000) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const press = (fn: () => void) => {
    if (armed) {
      if (timer.current) clearTimeout(timer.current);
      setArmed(false);
      fn();
      return;
    }
    setArmed(true);
    timer.current = setTimeout(() => setArmed(false), ms);
  };
  return { armed, press };
}
