/** Tu código: las 6 cifras que llegaron por email. Con la sexta, se comprueba solo. */
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KText } from '@/components/KText';
import { Nota } from '@/components/Nota';
import { Pulsable } from '@/components/Pulsable';
import { Casillas, Teclado, type Tecla } from '@/components/Teclado';
import { backspace, pasteCode, typeDigit } from '@/alta/model';
import { sendEmailCode, verifyEmailCode } from '@/backend/auth';
import { OTP_LEN, RESEND_S } from '@/backend/email';
import { getSettings, updateSettings } from '@/state/settings';
import { myCoach } from '@/backend/coach';
import { Volver } from '@/features/tu/piezas';
import { cifra, color, layout, space, texto, touch, arriba } from '@/theme';

export function CodigoScreen() {
  const insets = useSafeAreaInsets();
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(RESEND_S);

  // Cuenta atrás para poder pedir otro código.
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  useEffect(() => {
    if (code.length < OTP_LEN) return;
    let live = true;
    setBusy(true);
    verifyEmailCode(email, code).then(async (r) => {
      if (!live) return;
      if (!r.ok) {
        setBusy(false);
        return setError(r.error);
      }
      // Entrar = aceptar términos y privacidad (14 años o más), como dice la bienvenida.
      updateSettings({ acceptedAt: Date.now() });
      // Volver a entrar no repite el alta: el entrenador viene del servidor.
      const linked = await myCoach();
      if (linked !== undefined) updateSettings({ coach: linked ?? undefined });
      const coach = linked === undefined ? getSettings().coach : linked;
      if (!live) return;
      setBusy(false);
      if (getSettings().onboarded) router.replace('/');
      else router.replace(coach ? '/alta/permisos' : '/alta/entrenador');
    });
    return () => {
      live = false;
    };
  }, [code, email]);

  const press = async (k: Tecla) => {
    setError(null);
    if (k === 'borrar') return setCode(backspace);
    if (k === 'pegar') {
      const got = pasteCode(await Clipboard.getStringAsync().catch(() => ''));
      if (got) setCode(got.slice(0, OTP_LEN));
      return;
    }
    // Tras un código que no vale, la siguiente cifra empieza uno nuevo (antes había que borrar las 6).
    setCode((c) => (c.length < OTP_LEN ? typeDigit(c, k) : error ? typeDigit('', k) : c));
  };

  const resend = async () => {
    setWait(RESEND_S);
    setCode('');
    const r = await sendEmailCode(email);
    setError(r.ok ? null : r.error);
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo, paddingTop: arriba(insets.top, layout.pantallaArriba - space.s24), paddingHorizontal: layout.pantallaLado, paddingBottom: space.s16 + insets.bottom, gap: layout.entreTarjetas }}>
      <Volver to="Email" href="/alta/correo" />
      <View style={{ paddingHorizontal: space.s8, paddingBottom: space.s16, gap: space.s8 }}>
        <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
          Tu código
        </KText>
        {/* El email entero (no enmascarado): así se ve si hay una errata y se puede cambiar. */}
        <Nota error={!!error} text={error ?? (busy ? 'Comprobando…' : `Lo hemos mandado a ${email}`)} />
      </View>

      <Casillas value={code} length={OTP_LEN} wrong={!!error && code.length === OTP_LEN} />

      <Pulsable
        onPress={resend}
        disabled={wait > 0}
        accessibilityRole="button"
        scaleTo={0.98}
        style={{ height: touch.dedo, alignItems: 'center', justifyContent: 'center' }}
      >
        <KText size={texto.texto} tint={color.texto2}>
          {wait > 0 ? `Otro código en ${wait} s` : 'Mandar otro código'}
        </KText>
      </Pulsable>
      <Pulsable
        onPress={() => router.replace({ pathname: '/alta/correo', params: { email } })}
        accessibilityRole="link"
        scaleTo={0.98}
        style={{ height: touch.dedo, alignItems: 'center', justifyContent: 'center' }}
      >
        <KText size={texto.texto} tint={color.texto2} style={{ textDecorationLine: 'underline' }}>
          ¿No es tu email? Cámbialo
        </KText>
      </Pulsable>

      <View style={{ flex: 1 }} />
      <Teclado onKey={press} disabled={busy} />
    </View>
  );
}
