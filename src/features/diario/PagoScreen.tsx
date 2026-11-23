/** Pagar (KR6Pay): lo que debes del mes, cómo pagas y un solo botón. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraAccion } from '@/components/BarraAccion';
import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { Vacio } from '@/components/Vacio';
import { bill, euros, monthName, monthStatus, type Method } from '@/diario/model';
import { pay, useDiary } from '@/diario/store';
import { hasBackend } from '@/backend/client';
import { session } from '@/session/store';
import { cifra, color, layout, radius, space, texto, transicionPunto, arriba } from '@/theme';
import { CabeceraDiario, PuntoModo, modeLabel } from './piezas';

/** Tarjeta guardada de ejemplo: la pondrá la pasarela de pago. */
const CARD_LAST4 = '4242';

export function PagoScreen() {
  const insets = useSafeAreaInsets();
  const { mes } = useLocalSearchParams<{ mes: string }>();
  const diary = useDiary();
  const [method, setMethod] = useState<Method>('tarjeta');
  if (!mes || monthStatus(diary, mes, Date.now()) !== 'a-pagar') return <Vacio title="Pagar" note="No hay nada pendiente de este mes" />;

  const b = bill(diary, mes);
  const name = monthName(mes);
  const go = () => {
    const r = pay(mes, method);
    if (r.ok) router.replace({ pathname: '/pago/[mes]/recibo', params: { mes } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo, paddingTop: arriba(insets.top, layout.pantallaArriba), paddingHorizontal: layout.pantallaLado, paddingBottom: space.s16 + insets.bottom, gap: layout.entreTarjetas }}>
      <View style={{ paddingHorizontal: space.s8, paddingBottom: space.s16, gap: space.s8 }}>
        <CabeceraDiario label={`${name[0].toUpperCase()}${name.slice(1)} · a ${session.coach.name}`} back />
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }} accessibilityRole="header" accessibilityLabel={`${euros(b.amount)} euros`}>
          <KText size={cifra.c89} weight={300} title tabular lineHeight={Math.round(cifra.c89 * 0.9)}>
            {euros(b.amount)}
          </KText>
          <KText size={cifra.c34} weight={300}> €</KText>
        </View>
      </View>

      <View style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, paddingVertical: space.s8, paddingHorizontal: space.s16 }}>
        {b.lines.map((l) => (
          <View key={l.mode} style={{ height: 48, flexDirection: 'row', alignItems: 'center', gap: space.s12 }}>
            <PuntoModo mode={l.mode} size={12} />
            <KText size={texto.lista} style={{ flex: 1 }}>
              {modeLabel(l.mode)}
            </KText>
            <KText size={texto.lista} tint={color.texto2}>{`${l.count} × ${euros(l.price)} €`}</KText>
            <KText size={texto.lista} style={{ width: 56, textAlign: 'right' }}>{`${euros(l.total)} €`}</KText>
          </View>
        ))}
      </View>

      <View accessibilityRole="radiogroup" accessibilityLabel="Cómo pagas" style={{ flexDirection: 'row', gap: space.s8 }}>
        <Metodo on={method === 'tarjeta'} onPress={() => setMethod('tarjeta')} label={hasBackend ? 'Tarjeta' : `Tarjeta ···· ${CARD_LAST4}`} a11y={hasBackend ? 'Tarjeta' : `Tarjeta acabada en ${CARD_LAST4}`}>
          <View style={{ width: 40, height: 24, borderRadius: radius.xs, backgroundColor: color.klein }} />
        </Metodo>
        <Metodo on={method === 'bizum'} onPress={() => setMethod('bizum')} label="Bizum" a11y="Bizum">
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: method === 'bizum' ? color.tinta : color.hundido }} />
        </Metodo>
      </View>

      <View style={{ flex: 1 }} />
      <BarraAccion label={`Pagar ${euros(b.amount)} €`} onPress={go} />
    </View>
  );
}

function Metodo({ on, onPress, label, a11y, children }: { on: boolean; onPress: () => void; label: string; a11y: string; children: React.ReactNode }) {
  return (
    <Pulsable
      onPress={onPress}
      haptic={on ? undefined : 'selection'}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={a11y}
      style={{ flex: 1 }}
    >
      <Animated.View style={{ ...transicionPunto, height: 88, borderRadius: radius.xl, backgroundColor: color.tarjeta, borderWidth: 2, borderColor: on ? color.tinta : color.tarjeta, padding: space.s16, justifyContent: 'space-between' }}>
        {children}
        <KText size={texto.texto} tint={on ? color.tinta : color.texto2}>
          {label}
        </KText>
      </Animated.View>
    </Pulsable>
  );
}
