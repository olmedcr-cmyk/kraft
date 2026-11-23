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
import { Nota } from '@/components/Nota';
import { Casillas, Teclado, type Tecla } from '@/components/Teclado';
import { CODE_LEN, backspace, findCoach, pasteCode, typeDigit, type Coach } from '@/alta/model';
import { findCoach as buscarEnServidor, linkCoach } from '@/backend/coach';
import { Volver } from '@/features/tu/piezas';
import { hasBackend } from '@/backend/client';
import { updateSettings } from '@/state/settings';
import { MODE_TINT } from '@/features/agenda/piezas';
import { cifra, color, layout, motion, radius, space, texto, touch, arriba, pieza } from '@/theme';

type Check = { state: 'idle' | 'checking' | 'linking' } | { state: 'found'; coach: Coach } | { state: 'wrong' | 'limit' | 'offline' };

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

  // Con 6 cifras se busca (sin vincular): en el servidor o en el directorio de ejemplo. Vincula solo el botón.
  useEffect(() => {
    if (code.length < CODE_LEN) return setCheck({ state: 'idle' });
    if (!hasBackend) {
      const c = findCoach(code);
      return setCheck(c ? { state: 'found', coach: c } : { state: 'wrong' });
    }
    let live = true;
    setCheck({ state: 'checking' });
    buscarEnServidor(code).then((r) => live && setCheck(r.ok ? { state: 'found', coach: r.coach } : { state: r.reason }));
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

  const fromTu = desde === 'tu';
  // Mientras vincula sigue enseñando la ficha encontrada.
  const [shown, setShown] = useState<Coach | undefined>();
  useEffect(() => {
    if (check.state === 'found') setShown(check.coach);
    else if (check.state !== 'linking') setShown(undefined);
  }, [check]);
  const coach = check.state === 'found' ? check.coach : check.state === 'linking' ? shown : undefined;
  const bad = check.state === 'wrong' || check.state === 'limit' || check.state === 'offline';

  const link = async () => {
    if (!coach || check.state === 'linking') return;
    if (hasBackend) {
      setCheck({ state: 'linking' });
      const r = await linkCoach(coach.code);
      if (!r.ok) return setCheck({ state: r.reason });
    }
    updateSettings({ coach });
    // Desde Tú (cambiar de entrenador) se vuelve atrás; en el alta se sigue a permisos.
    if (desde === 'tu') router.canGoBack() ? router.back() : router.replace('/tu');
    else router.push('/alta/permisos');
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo, paddingTop: arriba(insets.top, fromTu ? layout.pantallaArriba - space.s24 : layout.pantallaArriba), paddingHorizontal: layout.pantallaLado, paddingBottom: space.s16 + insets.bottom, gap: layout.entreTarjetas }}>
      {/* Desde Tú se puede volver sin cambiar nada. En el alta, el entrenador es el paso obligado. */}
      {fromTu && <Volver to="Tu entrenador" href="/tu/entrenador" />}
      <View style={{ paddingHorizontal: space.s8, paddingBottom: space.s16, gap: space.s8 }}>
        <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
          Tu entrenador
        </KText>
        <Nota error={bad || miss} text={miss ? NOTE.miss : bad ? NOTE[check.state] : check.state === 'checking' ? 'Buscando…' : check.state === 'linking' ? 'Vinculando…' : 'Su código o su enlace'} />
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
                <View key={m} style={{ width: pieza.punto, height: pieza.punto, borderRadius: pieza.punto / 2, backgroundColor: MODE_TINT[m].bg }} />
              ))}
            </View>
          </View>
          <View accessibilityLabel="Encontrado" style={{ width: space.s32, height: space.s32, borderRadius: space.s16, backgroundColor: color.verde, alignItems: 'center', justifyContent: 'center' }}>
            <CheckIcon size={16} tint={color.tarjeta} />
          </View>
        </Animated.View>
      )}

      <View style={{ flex: 1 }} />
      <Teclado onKey={press} disabled={check.state === 'checking' || check.state === 'linking'} />
      <BarraAccion label={check.state === 'linking' ? 'Vinculando…' : 'Vincular'} onPress={link} disabled={!coach || check.state === 'linking'} />
    </View>
  );
}
