/** Hoy (J2Today): la sesión que mandó el entrenador, por bloques. Un toque y a entrenar. */
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraAccion } from '@/components/BarraAccion';
import { FilaBloque, Marcas } from '@/components/FilaBloque';
import { KText } from '@/components/KText';
import { compiled, session, sessionRunner, useSession } from '@/session/store';
import type { Block } from '@/session/types';
import { cifra, color, layout, radius, space, texto, touch } from '@/theme';

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const USER_INITIAL = 'C';

const tintOf = (b: Block) => color[b.tint];
const markTint = (b: Block) => (b.tint === 'tinteNaranja' ? color.naranja : color[b.tint]);

/** Marcas: píldora = tramo largo, círculo = serie/segundos, cuadrado = tabata/ronda. */
function marcas(b: Block) {
  const t = markTint(b);
  if (b.kind === 'tabata') return <Marcas count={b.sets} tint={t} shape="square" />;
  if (b.kind === 'ladder') return <Marcas count={b.steps.length} tint={t} shape="circle" />;
  if (b.tint === 'tinteNaranja') return <Marcas count={b.steps.length} tint={t} shape="square" />;
  return (
    <View style={{ flexDirection: 'row', gap: space.s4, alignItems: 'center' }}>
      {b.steps.map((st, i) =>
        st.seconds >= 120 ? (
          <View key={i} style={{ width: 28, height: 10, borderRadius: radius.pill, backgroundColor: t }} />
        ) : (
          <View key={i} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t }} />
        ),
      )}
    </View>
  );
}

export function HoyScreen() {
  const insets = useSafeAreaInsets();
  const t = useSession();
  const running = t.running;
  const day = WEEKDAYS[new Date(session.date + 'T12:00:00').getDay()];

  const go = (block = 0) => {
    if (!running) sessionRunner.startAt(compiled.blockStart[block]);
    router.push('/sesion');
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo, paddingTop: Math.max(insets.top, layout.pantallaArriba) }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: layout.pantallaLado, gap: layout.entreTarjetas, paddingBottom: space.s8 }}>
        <View style={{ paddingHorizontal: space.s8, paddingBottom: space.s16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View style={{ gap: space.s4 }}>
            <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
              {day}
            </KText>
            <KText size={texto.texto} tint={color.texto2}>{`${session.minutes}' · de ${session.coach.name}`}</KText>
          </View>
          <Pressable
            onPress={() => router.push('/tu')}
            accessibilityRole="button"
            accessibilityLabel="Tú"
            style={{ width: touch.dedo, height: touch.dedo, borderRadius: touch.dedo / 2, backgroundColor: color.tinta, alignItems: 'center', justifyContent: 'center' }}
          >
            <KText size={texto.lista} tint={color.tarjeta}>
              {USER_INITIAL}
            </KText>
          </Pressable>
        </View>

        {session.blocks.map((b, i) => (
          <FilaBloque
            key={b.id}
            title={b.name}
            tint={tintOf(b)}
            onPress={() => go(i)}
            badge={b.isNew}
            marks={marcas(b)}
            aside={
              <KText size={texto.texto} tint={color.texto2}>
                {`${b.minutes}'`}
              </KText>
            }
          />
        ))}
      </ScrollView>
      <View style={{ paddingHorizontal: layout.pantallaLado, paddingBottom: space.s12, paddingTop: space.s8 }}>
        <BarraAccion label={running ? 'Seguir' : 'Empezar'} onPress={() => go(0)} />
      </View>
    </View>
  );
}
