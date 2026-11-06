import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, layout, radius, space, texto, cifra, arriba } from '@/theme';
import { KText } from './KText';

/** Pantalla aún sin construir: título y estado vacío de K1Components (H). */
export function Vacio({ title, note }: { title: string; note: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color.fondo,
        paddingTop: arriba(insets.top, layout.pantallaArriba),
        paddingHorizontal: layout.pantallaLado,
        paddingBottom: space.s12,
        gap: space.s16,
      }}
    >
      <View style={{ paddingHorizontal: space.s8 }}>
        <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34}>
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
