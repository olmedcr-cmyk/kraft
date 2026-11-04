import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilaBloque, Marcas } from '@/components/FilaBloque';
import { KText } from '@/components/KText';
import { describe, saveCurrent, useSaved, type SavedTimer } from '@/state/saved';
import { cifra, color, layout, radius, space, texto, touch } from '@/theme';
import { MODES } from './TabataScreen';
import { ModoTiempo } from './ModoTiempo';
import { Pulsable } from '@/components/Pulsable';

function open(t: SavedTimer) {
  if (t.kind === 'tabata') {
    const mode = MODES.findIndex((m) => m.work === t.work && m.rest === t.rest);
    router.replace({ pathname: '/tiempo/tabata', params: { mode: String(Math.max(0, mode)) } });
  } else {
    router.replace({ pathname: '/tiempo', params: { work: String(t.work), rest: String(t.rest), rounds: String(t.rounds) } });
  }
}

/** Mis tiempos: los que repites. Tabata = cuadrado naranja, serie = círculo Klein. */
export function MiosScreen() {
  const insets = useSafeAreaInsets();
  const items = useSaved();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.fondo }}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, space.s48),
        paddingHorizontal: layout.pantallaLado,
        paddingBottom: space.s12,
        gap: layout.entreTarjetas,
      }}
    >
      <ModoTiempo value="mios" />
      <View style={{ paddingHorizontal: space.s8, paddingTop: space.s16, paddingBottom: space.s16, gap: space.s8 }}>
        <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
          Mis tiempos
        </KText>
        <KText size={texto.texto} tint={color.texto2}>
          Los que repites
        </KText>
      </View>
      {items.map((t) => {
        const tabata = t.kind === 'tabata';
        const tint = tabata ? color.naranja : color.klein;
        return (
          <FilaBloque
            key={t.id}
            title={describe(t)}
            tint={tint}
            play
            onPress={() => open(t)}
            marks={<Marcas count={t.rounds} tint={tint} shape={tabata ? 'square' : 'circle'} size={t.rounds > 8 ? 8 : 10} />}
          />
        );
      })}
      <Pulsable
        onPress={saveCurrent}
        accessibilityRole="button"
        style={{
          height: touch.tecla,
          borderRadius: radius.lg,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: color.linea,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <KText size={texto.texto} tint={color.texto2}>
          + Guardar el actual
        </KText>
      </Pulsable>
    </ScrollView>
  );
}
