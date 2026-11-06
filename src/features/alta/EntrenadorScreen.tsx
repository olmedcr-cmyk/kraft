/** Tu entrenador (K7Coach): su código de 6 cifras (o su enlace) y vincular. */
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraAccion } from '@/components/BarraAccion';
import { CheckIcon } from '@/components/icons';
import { KText } from '@/components/KText';
import { Casillas, Teclado, type Tecla } from '@/components/Teclado';
import { CODE_LEN, backspace, findCoach, pasteCode, typeDigit, type Coach } from '@/alta/model';
import { linkCoach } from '@/backend/coach';
import { hasBackend } from '@/backend/client';
import { updateSettings } from '@/state/settings';
import { MODE_TINT } from '@/features/agenda/piezas';
import { cifra, color, layout, motion, radius, space, texto, touch, arriba } from '@/theme';

type Check = { state: 'idle' | 'checking' } | { state: 'found'; coach: Coach } | { state: 'wrong' | 'limit' | 'offline' };

const NOTE: Record<string, string> = {
  wrong: 'Ese código no es de ningún entrenador',
  limit: 'Demasiados intentos. Espera un rato',
  offline: 'Sin conexión. Prueba otra vez',
  miss: 'No hay un código para pegar',
};

export function EntrenadorScreen() {
  const insets = useSafeAreaInsets();
  // Llega con código si se abrió desde el enlace del entrenador (kraft://alta/entrenador?codigo=…).
  const { codigo, desde } = useLocalSearchParams<{ codigo?: string; desde?: string }>();
  const [code, setCode] = useState(() => (codigo && pasteCode(codigo)) || '');
  const [miss, setMiss] = useState(false);
  const [check, setCheck] = useState<Check>({ state: 'idle' });

  // Con 6 cifras se busca: en el servidor (que ya vincula) o en el directorio de ejemplo.
  useEffect(() => {
    if (code.length < CODE_LEN) return setCheck({ state: 'idle' });
    if (!hasBackend) {
      const c = findCoach(code);
      return setCheck(c ? { state: 'found', coach: c } : { state: 'wrong' });
    }
    let live = true;
    setCheck({ state: 'checking' });
    linkCoach(code).then((r) => live && setCheck(r.ok ? { state: 'found', coach: r.coach } : { state: r.reason }));
    return () => {
      live = false;
    };
  }, [code]);

  const press = async (k: Tecla) => {
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

  const coach = check.state === 'found' ? check.coach : undefined;
  const bad = check.state === 'wrong' || check.state === 'limit' || check.state === 'offline';

  const link = () => {
    if (!coach) return;
    updateSettings({ coach });
    // Desde Tú (cambiar de entrenador) se vuelve atrás; en el alta se sigue a permisos.
    if (desde === 'tu') router.canGoBack() ? router.back() : router.replace('/tu');
    else router.push('/alta/permisos');
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo, paddingTop: arriba(insets.top, layout.pantallaArriba), paddingHorizontal: layout.pantallaLado, paddingBottom: space.s16 + insets.bottom, gap: layout.entreTarjetas }}>
      <View style={{ paddingHorizontal: space.s8, paddingBottom: space.s16, gap: space.s8 }}>
        <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
          Tu entrenador
        </KText>
        <KText size={texto.texto} tint={bad || miss ? color.naranja : color.texto2} accessibilityLiveRegion="polite">
          {miss ? NOTE.miss : bad ? NOTE[check.state] : check.state === 'checking' ? 'Buscando…' : 'Su código o su enlace'}
        </KText>
      </View>

      <Casillas value={code} length={CODE_LEN} wrong={bad} />

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
      <Teclado onKey={press} disabled={check.state === 'checking'} />
      <BarraAccion label="Vincular" onPress={link} disabled={!coach} />
    </View>
  );
}
