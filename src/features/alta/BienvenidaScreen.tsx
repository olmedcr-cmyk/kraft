/** Bienvenida (K6Welcome): la idea en una frase, entrar y aceptar (14 años o más). */
import { router } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { updateSettings } from '@/state/settings';
import { alpha, cifra, color, layout, radius, space, texto, touch } from '@/theme';

const HERO_H = 340;
const RING_R = 140;
const DOTS = 60;
/** Tres cuartos del anillo encendidos: un minuto que ya va por el segundo 45. */
const LIT = 45;
const SUN = 180;

type Via = 'apple' | 'google' | 'email';

export function BienvenidaScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const heroW = Math.min(width, 600) - layout.pantallaLado * 2;

  /** Sin backend de cuentas todavía: entrar = aceptar y seguir. */
  const enter = (_via: Via) => {
    updateSettings({ acceptedAt: Date.now() });
    router.push('/alta/entrenador');
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo, paddingTop: Math.max(insets.top, layout.pantallaArriba), paddingHorizontal: layout.pantallaLado, paddingBottom: space.s16 + insets.bottom, gap: layout.entreTarjetas }}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height: HERO_H, borderRadius: radius.lg, backgroundColor: color.klein, overflow: 'hidden' }}>
        {Array.from({ length: DOTS }, (_, i) => {
          const a = (2 * Math.PI * i) / DOTS;
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: heroW / 2 + RING_R * Math.sin(a) - 5,
                top: HERO_H / 2 - RING_R * Math.cos(a) - 5,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: i < LIT ? color.tarjeta : alpha.sobreColor,
              }}
            />
          );
        })}
        <View style={{ position: 'absolute', left: heroW / 2 - SUN / 2, top: HERO_H / 2 - SUN / 2, width: SUN, height: SUN, borderRadius: SUN / 2, backgroundColor: color.naranja }} />
      </View>

      <View style={{ paddingVertical: space.s16, paddingHorizontal: space.s8 }}>
        <KText size={cifra.c34} weight={300} title lineHeight={Math.round(cifra.c34 * 1.1)} accessibilityRole="header">
          {'Tu entrenador manda.\nTú solo tocas.'}
        </KText>
      </View>

      <View style={{ flex: 1 }} />

      <Boton label="Seguir con Apple" bg={color.tinta} fg={color.tarjeta} onPress={() => enter('apple')} />
      <Boton label="Seguir con Google" bg={color.tarjeta} fg={color.tinta} onPress={() => enter('google')} />
      <Pulsable onPress={() => enter('email')} accessibilityRole="button" style={{ height: touch.dedo, alignItems: 'center', justifyContent: 'center' }}>
        <KText size={texto.texto} tint={color.texto2}>
          Con email
        </KText>
      </Pulsable>

      <KText size={texto.texto} tint={color.texto2} lineHeight={20} style={{ paddingHorizontal: space.s8, textAlign: 'center' }}>
        {'Al seguir aceptas los '}
        <KText size={texto.texto} tint={color.texto2} style={{ textDecorationLine: 'underline' }} accessibilityRole="link" onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'terminos' } })}>
          términos
        </KText>
        {' y la '}
        <KText size={texto.texto} tint={color.texto2} style={{ textDecorationLine: 'underline' }} accessibilityRole="link" onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'privacidad' } })}>
          privacidad
        </KText>
        {', y confirmas que tienes 14 años o más.'}
      </KText>
    </View>
  );
}

function Boton({ label, bg, fg, onPress }: { label: string; bg: string; fg: string; onPress: () => void }) {
  return (
    <Pulsable onPress={onPress} haptic="light" scaleTo={0.98} accessibilityRole="button" style={{ height: touch.tecla, borderRadius: radius.md, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <KText size={texto.lista} tint={fg}>
        {label}
      </KText>
    </Pulsable>
  );
}
