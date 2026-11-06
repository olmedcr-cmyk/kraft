/** Salud (KL2Health): consentimiento propio para escribir en Salud. Hoja sobre tinta; tocar arriba es «Ahora no». */
import { router } from 'expo-router';
import { View } from 'react-native';
import Animated, { Easing, SlideInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { updateSettings } from '@/state/settings';
import { cifra, color, radius, space, texto, touch } from '@/theme';
import { Punto, Tarjeta } from './piezas';

const SHEET = SlideInDown.duration(300).easing(Easing.bezier(0.32, 0.72, 0, 1));
const close = () => (router.canGoBack() ? router.back() : router.replace('/tu/cuenta'));

export function SaludScreen() {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  // TODO(nativo): pedir aquí el permiso de HealthKit / Health Connect (solo escritura: entrenos y calorías).
  const allow = () => {
    updateSettings({ salud: true });
    close();
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.tinta, justifyContent: 'flex-end' }}>
      <Pulsable onPress={close} scaleTo={1} accessibilityRole="button" accessibilityLabel="Ahora no" style={{ flex: 1 }} />
      <Animated.View
        entering={reduced ? undefined : SHEET}
        accessibilityViewIsModal
        style={{ backgroundColor: color.fondo, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: space.s8, paddingHorizontal: space.s16, paddingBottom: space.s16 + insets.bottom, gap: space.s8 }}
      >
        <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: radius.pill, backgroundColor: color.linea, marginBottom: space.s16 }} />
        <View style={{ paddingHorizontal: space.s8, paddingBottom: space.s16, gap: space.s8 }}>
          <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
            Salud
          </KText>
          <KText size={texto.texto} tint={color.texto2}>
            Es un dato sensible: decides tú
          </KText>
        </View>

        <Tarjeta etiqueta="KRAFT escribe">
          <Punto dot={color.klein} title="Entrenos" sub="Minutos y tipo" />
          <Punto dot={color.klein} title="Calorías activas" sub="Estimadas" />
        </Tarjeta>
        <Tarjeta etiqueta="KRAFT no lee">
          <KText size={texto.texto} tint={color.texto2} lineHeight={texto.texto * 1.5}>
            Ni pulso, ni peso, ni nada más de Salud.
          </KText>
        </Tarjeta>
        <KText size={texto.texto} tint={color.texto2} style={{ paddingHorizontal: space.s8 }}>
          Lo quitas cuando quieras en Tú · Cuenta.
        </KText>

        <View style={{ flexDirection: 'row', gap: space.s8 }}>
          <Pulsable onPress={close} accessibilityRole="button" style={{ flex: 1, height: touch.tecla, borderRadius: radius.md, backgroundColor: color.hundido, alignItems: 'center', justifyContent: 'center' }}>
            <KText size={texto.lista}>Ahora no</KText>
          </Pulsable>
          <Pulsable onPress={allow} haptic="success" accessibilityRole="button" style={{ flex: 2, height: touch.tecla, borderRadius: radius.md, backgroundColor: color.tinta, alignItems: 'center', justifyContent: 'center' }}>
            <KText size={texto.lista} tint={color.tarjeta}>
              Permitir
            </KText>
          </Pulsable>
        </View>
      </Animated.View>
    </View>
  );
}
