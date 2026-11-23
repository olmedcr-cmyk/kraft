import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, layout, radius, space, texto, touch, cifra, arriba } from '@/theme';
import { KText } from './KText';
import { Pulsable } from './Pulsable';

/**
 * Pantalla sin contenido (una reserva que ya no está, algo pendiente): título, estado vacío de
 * K1Components (H) y siempre una salida. Se puede llegar desde un aviso, sin pantalla anterior.
 */
export function Vacio({ title, note }: { title: string; note: string }) {
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color.fondo,
        // La vuelta (48) sube 24 sobre el margen de 64, como en Tú.
        paddingTop: arriba(insets.top, layout.pantallaArriba - space.s24),
        paddingHorizontal: layout.pantallaLado,
        paddingBottom: space.s12,
        gap: space.s16,
      }}
    >
      <Pulsable onPress={back} accessibilityRole="link" accessibilityLabel="Volver" scaleTo={0.98} style={{ height: touch.dedo, paddingHorizontal: space.s8, justifyContent: 'center', alignSelf: 'flex-start' }}>
        <KText size={texto.texto} tint={color.texto2}>
          ‹ Volver
        </KText>
      </Pulsable>
      <View style={{ paddingHorizontal: space.s8 }}>
        <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
          {title}
        </KText>
      </View>
      <View
        style={{
          flex: 1,
          borderRadius: radius.lg,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: color.linea,
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.s16,
        }}
      >
        <View style={{ width: space.s32, height: space.s32, borderRadius: space.s16, borderWidth: 2, borderColor: color.linea }} />
        <KText size={texto.texto} tint={color.texto2}>
          {note}
        </KText>
      </View>
    </View>
  );
}
