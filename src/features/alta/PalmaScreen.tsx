/** Prueba (K9Palm): se aprende el gesto antes de la primera sesión. Toca = pausa; otro toque, sigue. */
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraAccion } from '@/components/BarraAccion';
import { PlayIcon } from '@/components/icons';
import { KText } from '@/components/KText';
import { Palma } from '@/components/Palma';
import { updateSettings } from '@/state/settings';
import { cifra, color, layout, motion, radius, space, texto, touch, transicionFondo, arriba } from '@/theme';

export function PalmaScreen() {
  const insets = useSafeAreaInsets();
  const [paused, setPaused] = useState(false);
  const bg = paused ? color.tinta : color.klein;

  const done = () => {
    // Volver antes de 30 días anula el borrado pedido.
    updateSettings({ onboarded: true, borradoPedido: undefined });
    router.dismissAll();
    router.replace('/');
  };

  return (
    <Animated.View style={{ ...transicionFondo, flex: 1, backgroundColor: bg, paddingTop: arriba(insets.top, layout.pantallaArriba), paddingHorizontal: layout.pantallaLado, paddingBottom: space.s16 + insets.bottom, gap: layout.entreTarjetas }}>
      <StatusBar style="light" />
      <View style={{ paddingHorizontal: space.s8, gap: space.s8 }}>
        <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} tint={color.tarjeta} accessibilityRole="header" accessibilityLiveRegion="polite">
          {paused ? 'Eso es' : 'Prueba'}
        </KText>
        <KText size={texto.texto} tint={color.tarjeta} style={{ opacity: 0.75 }}>
          {paused ? 'Otro toque y sigue' : 'Toca con la palma'}
        </KText>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Palma bg={paused ? color.klein : color.tarjeta} label={paused ? 'Reanudar' : 'Pausar'} onPress={() => setPaused(!paused)}>
          {paused && (
            <View style={{ flexDirection: 'row', gap: space.s12, marginBottom: space.s8 }} accessibilityElementsHidden>
              <View style={{ width: space.s16, height: touch.tecla, borderRadius: radius.pill, backgroundColor: color.tarjeta }} />
              <View style={{ width: space.s16, height: touch.tecla, borderRadius: radius.pill, backgroundColor: color.tarjeta }} />
            </View>
          )}
          <KText size={texto.lista} caps tint={paused ? color.tarjeta : color.klein}>
            {paused ? 'Pausa' : 'Toca'}
          </KText>
        </Palma>
      </View>

      {paused ? (
        <Animated.View entering={FadeIn.duration(motion.pantalla)}>
          <BarraAccion label="Ir a Hoy" bg={color.naranja} fg={color.tinta} knob={color.tinta} icon={<PlayIcon tint={color.naranja} />} onPress={done} />
        </Animated.View>
      ) : (
        <View style={{ height: touch.accion, alignItems: 'center', justifyContent: 'center' }}>
          <KText size={texto.texto} tint={color.tarjeta} style={{ opacity: 0.6 }}>
            El móvil en el suelo. La mano encima.
          </KText>
        </View>
      )}
    </Animated.View>
  );
}
