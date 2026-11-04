/** Tu entrenador (KT5Coach): quién te entrena, cuánto cuesta y su código. */
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { MODES, type Mode } from '@/agenda/model';
import { KText } from '@/components/KText';
import { Vacio } from '@/components/Vacio';
import { PRICES } from '@/diario/model';
import { MODE_TINT } from '@/features/agenda/piezas';
import { updateSettings, useSettings } from '@/state/settings';
import { cifra, color, radius, space, texto, touch } from '@/theme';
import { Avatar, Fila, Grupo, PantallaTu, Seccion, useConfirmar } from './piezas';

/** Dónde entrena (de ejemplo hasta que el entrenador lo rellene). */
const STUDIO = 'Estudio · Sala 1, 2, 3';

export function EntrenadorTuScreen() {
  const s = useSettings();
  const [copied, setCopied] = useState(false);
  const dejar = useConfirmar();
  const coach = s.coach;
  if (!coach) return <Vacio title="Tu entrenador" note="Aún no entrenas con nadie" />;

  const copy = async () => {
    await Clipboard.setStringAsync(coach.code).catch(() => {});
    setCopied(true);
  };

  return (
    <PantallaTu back="Tú">
      <View style={{ paddingHorizontal: space.s8, paddingBottom: space.s16, flexDirection: 'row', alignItems: 'center', gap: space.s16 }}>
        <Avatar initial={coach.initial} size={touch.fila} />
        <View style={{ flex: 1, gap: space.s8 }}>
          <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
            {coach.name}
          </KText>
          <KText size={texto.texto} tint={color.texto2}>
            {STUDIO}
          </KText>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: space.s8 }}>
        {(coach.modes.length ? coach.modes : (Object.keys(MODES) as Mode[])).map((m) => (
          <View key={m} accessibilityLabel={`${MODES[m].label}: ${PRICES[m]} euros`} style={{ flex: 1, height: touch.accion, backgroundColor: color.tarjeta, borderRadius: radius.lg, padding: space.s16, justifyContent: 'space-between' }}>
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: MODE_TINT[m].bg }} />
            <View style={{ gap: space.s4 }}>
              <KText size={texto.boton} weight={300}>{`${PRICES[m]} €`}</KText>
              <KText size={texto.etiqueta} tint={color.texto2}>
                {MODES[m].label}
              </KText>
            </View>
          </View>
        ))}
      </View>

      <Grupo>
        <Fila label={`Escribir a ${coach.name}`} onPress={() => router.push({ pathname: '/tu/pronto', params: { t: `Escribir a ${coach.name}` } })} />
        <Fila label="Código" value={copied ? 'Copiado' : coach.code} onPress={copy} right={<View />} a11y={`Código ${coach.code.split('').join(' ')}. Toca para copiarlo`} />
      </Grupo>

      <Seccion>Más</Seccion>
      <Grupo>
        <Fila label="Cambiar de entrenador" onPress={() => router.push({ pathname: '/alta/entrenador', params: { desde: 'tu' } })} />
        <Fila
          label={dejar.armed ? 'Toca otra vez para dejarlo' : `Dejar de entrenar con ${coach.name}`}
          tint={dejar.armed ? color.naranja : color.tinta}
          onPress={() =>
            dejar.press(() => {
              updateSettings({ coach: undefined });
              router.canGoBack() ? router.back() : router.replace('/tu');
            })
          }
        />
      </Grupo>
    </PantallaTu>
  );
}
