/** Con email: escribir la dirección y pedir el código. Sin diseño propio: piezas de K7Coach. */
import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraAccion } from '@/components/BarraAccion';
import { KText } from '@/components/KText';
import { sendEmailCode } from '@/backend/auth';
import { isEmail, normalizeEmail } from '@/backend/email';
import { Volver } from '@/features/tu/piezas';
import { cifra, color, fontFamily, layout, radius, space, texto, touch } from '@/theme';

export function CorreoScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ok = isEmail(email);

  const send = async () => {
    if (!ok || busy) return;
    setBusy(true);
    setError(null);
    const r = await sendEmailCode(email);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    router.push({ pathname: '/alta/codigo', params: { email: normalizeEmail(email) } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo, paddingTop: Math.max(insets.top, layout.pantallaArriba - space.s24), paddingHorizontal: layout.pantallaLado, paddingBottom: space.s16 + insets.bottom, gap: layout.entreTarjetas }}>
      <Volver to="Bienvenida" href="/alta/bienvenida" />
      <View style={{ paddingHorizontal: space.s8, paddingBottom: space.s16, gap: space.s8 }}>
        <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
          Con email
        </KText>
        <KText size={texto.texto} tint={error ? color.naranja : color.texto2} accessibilityLiveRegion="polite">
          {error ?? 'Te mandamos un código de 6 cifras'}
        </KText>
      </View>

      <View style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, paddingHorizontal: space.s16 }}>
        <TextInput
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setError(null);
          }}
          onSubmitEditing={send}
          placeholder="tu@email.com"
          placeholderTextColor={color.linea}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          inputMode="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="send"
          accessibilityLabel="Tu email"
          style={{ height: touch.tecla, fontFamily: fontFamily[400], fontSize: texto.bloque, color: color.tinta, outlineStyle: 'none' } as object}
        />
      </View>

      <View style={{ flex: 1 }} />
      <BarraAccion label={busy ? 'Mandando…' : 'Mandar código'} onPress={send} disabled={!ok || busy} />
    </View>
  );
}
