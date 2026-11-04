import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { KText } from '@/components/KText';
import { Vacio } from '@/components/Vacio';
import { ILLUSTRATION_CREDIT } from '@/data/exercises';
import { color, space, texto, touch } from '@/theme';

/** Tú (KT1You) · de momento solo créditos y volver. */
export default function Tu() {
  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <Vacio title="Tú" note="Perfil y ajustes, muy pronto" />
      <View style={{ paddingHorizontal: space.s24, paddingBottom: space.s32, gap: space.s16 }}>
        <KText size={texto.etiqueta} tint={color.texto2}>
          {ILLUSTRATION_CREDIT}
        </KText>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={{ height: touch.dedo, justifyContent: 'center' }}>
          <KText size={texto.lista}>‹ Volver</KText>
        </Pressable>
      </View>
    </View>
  );
}
