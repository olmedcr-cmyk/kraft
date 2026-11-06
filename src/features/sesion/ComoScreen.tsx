/** ¿Cómo se hace? (J4How). El tiempo sigue arriba; volver con la barra naranja. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KText } from '@/components/KText';
import { ILLUSTRATION_CREDIT, exercise } from '@/data/exercises';
import { useSession } from '@/session/store';
import { cifra, color, radius, space, texto, touch, arriba } from '@/theme';
import { mmss, useFase } from './piezas';
import { Pulsable } from '@/components/Pulsable';

export function ComoScreen() {
  const insets = useSafeAreaInsets();
  const { ex: id } = useLocalSearchParams<{ ex: string }>();
  const ex = exercise(id);
  const t = useSession();
  const s = t.snap;
  const auto = useFase();
  const [picked, setPicked] = useState<number | null>(null);
  const phase = picked ?? auto;
  const timed = s.phase === 'work' || s.phase === 'rest' || s.phase === 'countdown';
  const back = () => (router.canGoBack() ? router.back() : router.replace('/sesion'));

  return (
    <View style={{ flex: 1, backgroundColor: color.klein, paddingTop: arriba(insets.top, 56) }}>
      <View style={{ paddingHorizontal: space.s24, paddingBottom: space.s16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: space.s4 }} accessibilityLabel="El tiempo sigue">
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: i === phase ? color.naranja : color.tarjeta }} />
          ))}
        </View>
        {timed && (
          <KText size={cifra.c34} weight={300} title tint={color.tarjeta} tabular>
            {mmss(s.n)}
          </KText>
        )}
      </View>

      <View style={{ flex: 1, backgroundColor: color.tarjeta, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: space.s24, paddingHorizontal: space.s16, paddingBottom: space.s16, gap: space.s16 }}>
        <KText size={cifra.c34} title lineHeight={cifra.c34} style={{ paddingHorizontal: space.s8 }} accessibilityRole="header">
          {ex?.name ?? 'Ejercicio'}
        </KText>
        {ex ? (
          <>
            <View style={{ flex: 1, minHeight: 0, backgroundColor: color.fondo, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }}>
              <Image source={ex.phases[phase]} accessibilityLabel={`${ex.alt}, en 3 fases`} style={{ width: '90%', height: '90%', maxWidth: 300, maxHeight: 300 }} resizeMode="contain" />
            </View>
            <View style={{ flexDirection: 'row', gap: space.s8 }}>
              {ex.phases.map((src, i) => (
                <Pulsable
                  key={i}
                  onPress={() => setPicked(picked === i ? null : i)}
                  accessibilityRole="button"
                  accessibilityLabel={`Fase ${i + 1}`}
                  accessibilityState={{ selected: i === phase }}
                  style={{ flex: 1, height: 80, borderRadius: radius.md, borderWidth: 2, borderColor: i === phase ? color.klein : 'transparent', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Image source={src} style={{ width: 72, height: 72 }} resizeMode="contain" />
                </Pulsable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: space.s8, flexWrap: 'wrap' }}>
              {ex.cues.map((c) => (
                <View key={c} style={{ height: 40, paddingHorizontal: space.s16, borderRadius: radius.pill, backgroundColor: color.tinteKlein, justifyContent: 'center' }}>
                  <KText size={texto.texto} tint={color.klein}>
                    {c}
                  </KText>
                </View>
              ))}
            </View>
            <KText size={texto.etiqueta} tint={color.texto2}>
              {ILLUSTRATION_CREDIT}
            </KText>
          </>
        ) : (
          <KText size={texto.lista} tint={color.texto2}>
            Aún no tenemos este ejercicio dibujado.
          </KText>
        )}
      </View>

      <Pulsable
        onPress={back}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        style={{ height: touch.accion + insets.bottom, paddingBottom: insets.bottom, backgroundColor: color.naranja, alignItems: 'center', justifyContent: 'center' }}
      >
        <Svg width={32} height={32} viewBox="0 0 32 32">
          <Path d="M26 16H7M14 8l-8 8 8 8" stroke={color.tinta} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      </Pulsable>
    </View>
  );
}
