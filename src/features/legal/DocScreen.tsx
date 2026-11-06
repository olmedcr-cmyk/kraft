/** Documento legal (KL5Doc): resumen en corto y apartados que se abren. El texto completo lo da el abogado. */
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';

import { KText } from '@/components/KText';
import { Vacio } from '@/components/Vacio';
import { PENDING, RESPONSIBLE, VERSION, isDocId, legalDoc } from '@/legal/model';
import { useSettings } from '@/state/settings';
import { color, motion, ms, radius, space, texto, touch } from '@/theme';
import { Chevron, Fila, Grupo, PantallaTu } from '@/features/tu/piezas';
import { router } from 'expo-router';

export function DocScreen() {
  const { doc, abre } = useLocalSearchParams<{ doc: string; abre?: string }>();
  const s = useSettings();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<number | null>(abre !== undefined && /^\d$/.test(abre) ? Number(abre) : null);
  if (!isDocId(doc)) return <Vacio title="Legal" note="Este documento no existe" />;

  const d = legalDoc(doc, s.coach?.name);
  // Desde el alta (sin cuenta aún) se vuelve a la bienvenida; desde Tú, a Privacidad.
  const back = s.onboarded ? 'Privacidad' : 'Volver';

  return (
    <PantallaTu back={back} backHref={s.onboarded ? '/legal' : '/alta/bienvenida'} title={d.title} sub={VERSION}>
      <View style={{ backgroundColor: color.klein, borderRadius: radius.lg, padding: space.s16, gap: space.s12 }}>
        <KText size={texto.etiqueta} caps tint={color.tarjeta} style={{ opacity: 0.75 }}>
          En corto
        </KText>
        <KText size={texto.lista} tint={color.tarjeta} lineHeight={Math.round(texto.lista * 1.6)}>
          {d.short}
        </KText>
      </View>

      <Grupo>
        {d.sections.map((sec, i) => {
          const on = open === i;
          const num = String(i + 1).padStart(2, '0');
          return (
            <View key={sec.title}>
              <Fila
                alto={touch.tecla}
                label={sec.title}
                lead={
                  <KText size={texto.lista} tint={color.texto2} tabular>
                    {num}
                  </KText>
                }
                a11y={`${num}, ${sec.title}`}
                onPress={() => setOpen(on ? null : i)}
                right={
                  // El › gira hacia abajo al abrir.
                  <Animated.View style={{ transform: [{ rotate: on ? '90deg' : '0deg' }], transitionProperty: 'transform', transitionDuration: ms(reduced ? 0 : motion.toque * 2), transitionTimingFunction: motion.easing }}>
                    <Chevron />
                  </Animated.View>
                }
              />
              {on && (
                <Animated.View entering={reduced ? undefined : FadeIn.duration(motion.pantalla)} style={{ paddingLeft: space.s32 - space.s4, paddingBottom: space.s16 }}>
                  <KText size={texto.texto} tint={color.texto2} lineHeight={texto.texto * 1.5}>
                    {sec.body}
                  </KText>
                </Animated.View>
              )}
            </View>
          );
        })}
        {doc === 'aviso' && <Fila alto={touch.tecla} label="Créditos de ilustración" value="CC BY-SA" onPress={() => router.push('/tu/creditos')} />}
      </Grupo>

      <View style={{ flex: 1 }} />
      <KText size={texto.texto} tint={color.texto2} lineHeight={texto.texto * 1.5} style={{ paddingHorizontal: space.s8, paddingTop: space.s16 }}>
        {`Texto legal completo: ${PENDING}. Responsable: ${RESPONSIBLE}.`}
      </KText>
    </PantallaTu>
  );
}
