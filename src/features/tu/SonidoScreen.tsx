/** Sonido (KT3Sound): para no mirar la pantalla. */
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BarraAccion } from '@/components/BarraAccion';
import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { setupFeedback, signal } from '@/platform/feedback';
import { updateSettings, useSettings } from '@/state/settings';
import { color, motion, ms, radius, space, texto, touch } from '@/theme';
import { FilaSi, Grupo, PantallaTu } from './piezas';

const BARS = 10;

export function SonidoScreen() {
  const s = useSettings();
  const [playing, setPlaying] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /** Lo mismo que en marcha: 3 pitidos cortos (y voz si está) y el largo al empezar. */
  const probar = async () => {
    if (playing) return;
    setPlaying(true);
    await setupFeedback();
    [3, 2, 1].forEach((n, i) => timers.current.push(setTimeout(() => signal('count', n), i * 1000)));
    timers.current.push(
      setTimeout(() => {
        signal('start');
        setPlaying(false);
      }, 3000),
    );
  };

  /** Tocar una barra fija el volumen; tocar la más alta encendida la apaga (hasta 0 = sin pitidos). */
  const setVol = (i: number) => updateSettings({ volumen: s.volumen === i + 1 ? i : i + 1 });

  return (
    <PantallaTu
      back="Tú"
      title="Sonido"
      sub="Para no mirar la pantalla"
      footer={<BarraAccion label={playing ? 'Escucha…' : 'Probar 3·2·1'} onPress={probar} />}
    >
      <View style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, padding: space.s16, gap: space.s16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <KText size={texto.etiqueta} caps tint={color.texto2}>
            Pitidos
          </KText>
          <KText size={texto.etiqueta} tint={color.texto2}>
            {s.volumen === 0 ? 'sin pitidos' : `${s.volumen} de ${BARS}`}
          </KText>
        </View>
        <View accessibilityRole="adjustable" accessibilityLabel={`Volumen ${s.volumen} de ${BARS}`} style={{ flexDirection: 'row', gap: space.s4, alignItems: 'flex-end', height: touch.dedo }}>
          {Array.from({ length: BARS }, (_, i) => (
            <Pulsable
              key={i}
              onPress={() => setVol(i)}
              haptic="selection"
              scaleTo={1}
              accessibilityRole="button"
              accessibilityLabel={`Volumen ${i + 1}`}
              style={{ flex: 1, height: touch.dedo, justifyContent: 'flex-end' }}
            >
              <Animated.View
                style={{
                  height: 12 + i * 4,
                  borderRadius: radius.pill,
                  backgroundColor: i < s.volumen ? color.klein : color.hundido,
                  transitionProperty: 'backgroundColor',
                  transitionDuration: ms(motion.punto),
                  transitionTimingFunction: motion.easing,
                }}
              />
            </Pulsable>
          ))}
        </View>
      </View>

      <Grupo>
        <FilaSi label={'Voz: «tres, dos, uno»'} on={s.voz} onChange={(v) => updateSettings({ voz: v })} />
        <FilaSi label="Vibrar en cada tramo" on={s.vibrar} onChange={(v) => updateSettings({ vibrar: v })} />
        <FilaSi label="Bajar la música" on={s.bajarMusica} onChange={(v) => updateSettings({ bajarMusica: v })} />
        <FilaSi label="Sonar en silencio" on={s.silencio} onChange={(v) => updateSettings({ silencio: v })} />
      </Grupo>
    </PantallaTu>
  );
}
