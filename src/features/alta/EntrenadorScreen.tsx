/** Tu entrenador (K7Coach): su código de 6 cifras (o su enlace) y vincular. */
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraAccion } from '@/components/BarraAccion';
import { CheckIcon } from '@/components/icons';
import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { CODE_LEN, backspace, findCoach, pasteCode, typeDigit } from '@/alta/model';
import { updateSettings } from '@/state/settings';
import { MODE_TINT } from '@/features/agenda/piezas';
import { cifra, color, layout, motion, radius, space, texto, transicionPunto, touch } from '@/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'pegar', '0', 'borrar'] as const;

export function EntrenadorScreen() {
  const insets = useSafeAreaInsets();
  // Llega con código si se abrió desde el enlace del entrenador (kraft://alta/entrenador?codigo=…).
  const { codigo, desde } = useLocalSearchParams<{ codigo?: string; desde?: string }>();
  const [code, setCode] = useState(() => (codigo && pasteCode(codigo)) || '');
  const [miss, setMiss] = useState(false);
  const coach = findCoach(code);
  const wrong = code.length === CODE_LEN && !coach;

  const press = async (k: (typeof KEYS)[number]) => {
    setMiss(false);
    if (k === 'borrar') return setCode(backspace);
    if (k === 'pegar') {
      const got = pasteCode(await Clipboard.getStringAsync().catch(() => ''));
      if (got) setCode(got);
      else setMiss(true);
      return;
    }
    setCode((c) => typeDigit(c, k));
  };

  const link = () => {
    if (!coach) return;
    updateSettings({ coach });
    // Desde Tú (cambiar de entrenador) se vuelve atrás; en el alta se sigue a permisos.
    if (desde === 'tu') router.canGoBack() ? router.back() : router.replace('/tu');
    else router.push('/alta/permisos');
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo, paddingTop: Math.max(insets.top, layout.pantallaArriba), paddingHorizontal: layout.pantallaLado, paddingBottom: space.s16 + insets.bottom, gap: layout.entreTarjetas }}>
      <View style={{ paddingHorizontal: space.s8, paddingBottom: space.s16, gap: space.s8 }}>
        <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
          Tu entrenador
        </KText>
        <KText size={texto.texto} tint={wrong || miss ? color.naranja : color.texto2} accessibilityLiveRegion="polite">
          {wrong ? 'Ese código no es de ningún entrenador' : miss ? 'No hay un código para pegar' : 'Su código o su enlace'}
        </KText>
      </View>

      <View
        accessibilityLabel={`Código: ${code.split('').join(' ') || 'vacío'}${code.length < CODE_LEN ? `, faltan ${CODE_LEN - code.length}` : ''}`}
        style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, paddingVertical: space.s24, paddingHorizontal: space.s16, flexDirection: 'row', justifyContent: 'space-between' }}
      >
        {Array.from({ length: CODE_LEN }, (_, i) => {
          const d = code[i];
          return (
            <Animated.View
              key={i}
              style={{ ...transicionPunto, width: touch.dedo, height: touch.dedo, borderRadius: touch.dedo / 2, borderWidth: 2, borderColor: d ? (wrong ? color.naranja : color.klein) : color.linea, backgroundColor: d ? (wrong ? color.naranja : color.klein) : 'transparent', alignItems: 'center', justifyContent: 'center' }}
            >
              {d && (
                <KText size={texto.bloque} tint={wrong ? color.tinta : color.tarjeta}>
                  {d}
                </KText>
              )}
            </Animated.View>
          );
        })}
      </View>

      {coach && (
        <Animated.View entering={FadeIn.duration(motion.pantalla)} style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, padding: space.s16, flexDirection: 'row', alignItems: 'center', gap: space.s16 }}>
          <View style={{ width: touch.tecla, height: touch.tecla, borderRadius: touch.tecla / 2, backgroundColor: color.tinta, alignItems: 'center', justifyContent: 'center' }}>
            <KText size={texto.boton} tint={color.tarjeta}>
              {coach.initial}
            </KText>
          </View>
          <View style={{ flex: 1, gap: space.s8 }}>
            <KText size={texto.bloque}>{coach.name}</KText>
            <View style={{ flexDirection: 'row', gap: space.s4 }} accessibilityLabel={coach.modes.join(', ')}>
              {coach.modes.map((m) => (
                <View key={m} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: MODE_TINT[m].bg }} />
              ))}
            </View>
          </View>
          <View accessibilityLabel="Encontrado" style={{ width: space.s32, height: space.s32, borderRadius: space.s16, backgroundColor: color.verde, alignItems: 'center', justifyContent: 'center' }}>
            <CheckIcon size={16} tint={color.tarjeta} />
          </View>
        </Animated.View>
      )}

      <View style={{ flex: 1 }} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s8 }}>
        {KEYS.map((k) => {
          const digit = k !== 'pegar' && k !== 'borrar';
          return (
            <Pulsable
              key={k}
              onPress={() => press(k)}
              haptic="selection"
              accessibilityRole="button"
              accessibilityLabel={k === 'pegar' ? 'Pegar código o enlace' : k === 'borrar' ? 'Borrar' : k}
              style={{ width: '31.5%', flexGrow: 1, height: 56, borderRadius: radius.md, backgroundColor: digit ? color.tarjeta : 'transparent', alignItems: 'center', justifyContent: 'center' }}
            >
              {k === 'pegar' ? (
                <KText size={texto.etiqueta} caps tint={color.texto2}>
                  Pegar
                </KText>
              ) : (
                <KText size={k === 'borrar' ? texto.bloque : texto.boton} weight={k === 'borrar' ? 400 : 300}>
                  {k === 'borrar' ? '‹' : k}
                </KText>
              )}
            </Pulsable>
          );
        })}
      </View>

      <BarraAccion label="Vincular" onPress={link} disabled={!coach} />
    </View>
  );
}
