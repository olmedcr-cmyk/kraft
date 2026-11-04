/** Pagado (KR6Receipt): verde = todo bien. Recibo y vuelta al diario. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraAccion } from '@/components/BarraAccion';
import { CheckIcon } from '@/components/icons';
import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { Vacio } from '@/components/Vacio';
import { bill, monthName } from '@/diario/model';
import { resendReceipt, useDiary } from '@/diario/store';
import { session } from '@/session/store';
import { alpha, cifra, color, layout, motion, ms, radius, space, texto, touch } from '@/theme';
import { PuntoModo, modeLabel } from './piezas';

const APARECE = { from: { opacity: 0 }, to: { opacity: 1 } };
const APARECE_CRECE = { from: { opacity: 0, transform: [{ scale: 0.9 }] }, to: { opacity: 1, transform: [{ scale: 1 }] } };

export function ReciboScreen() {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { mes } = useLocalSearchParams<{ mes: string }>();
  const diary = useDiary();
  const [again, setAgain] = useState(false);
  const p = mes ? diary.payments[mes] : undefined;
  if (!mes || !p) return <Vacio title="Recibo" note="Este mes aún no está pagado" />;

  const lines = bill(diary, mes).lines;
  const toDiary = () => (router.canDismiss() ? router.dismissAll() : router.replace('/diario'));

  return (
    <View style={{ flex: 1, backgroundColor: color.verde, paddingTop: Math.max(insets.top, layout.pantallaArriba), paddingHorizontal: layout.pantallaLado, paddingBottom: space.s16 + insets.bottom, gap: layout.entreTarjetas }}>
      {/* El ✓ es el momento: entra una vez, sin rebote (animación CSS: no saca el círculo del flujo). */}
      <Animated.View
        style={{
          animationName: reduced ? APARECE : APARECE_CRECE,
          animationDuration: ms(motion.punto),
          animationTimingFunction: motion.salida,
          width: touch.accion, height: touch.accion, borderRadius: touch.accion / 2, backgroundColor: color.tarjeta, marginHorizontal: space.s8, marginBottom: space.s24, alignItems: 'center', justifyContent: 'center' }}
      >
        <CheckIcon size={48} tint={color.verde} />
      </Animated.View>

      <View style={{ paddingHorizontal: space.s8, paddingBottom: space.s16, gap: space.s8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }} accessibilityRole="header" accessibilityLabel={`Pagado: ${p.amount} euros`}>
          <KText size={cifra.c89} weight={300} title tabular tint={color.tarjeta} lineHeight={Math.round(cifra.c89 * 0.9)}>
            {String(p.amount)}
          </KText>
          <KText size={cifra.c34} weight={300} tint={color.tarjeta}> €</KText>
        </View>
        <KText size={texto.texto} tint={color.tarjeta}>{`Pagado a ${session.coach.name} · ${monthName(mes)}`}</KText>
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: alpha.sobreColor, paddingTop: space.s8, paddingHorizontal: space.s8 }}>
        {lines.map((l) => (
          <View key={l.mode} style={{ height: 40, flexDirection: 'row', alignItems: 'center', gap: space.s12 }}>
            <PuntoModo mode={l.mode} ring={color.tarjeta} size={12} />
            <KText size={texto.texto} tint={color.tarjeta} style={{ flex: 1 }}>{`${l.count} ${modeLabel(l.mode).toLowerCase()}`}</KText>
            <KText size={texto.texto} tint={color.tarjeta}>{`${l.total} €`}</KText>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <Pulsable
        onPress={() => {
          resendReceipt(mes);
          setAgain(true);
        }}
        disabled={again}
        haptic="light"
        scaleTo={0.98}
        accessibilityRole="button"
        style={{ height: touch.tecla, borderRadius: radius.md, backgroundColor: alpha.tarjetaSobreColor, alignItems: 'center', justifyContent: 'center' }}
      >
        <KText size={texto.lista} tint={color.tarjeta}>
          {again ? 'Enviado otra vez' : 'Enviar recibo por email'}
        </KText>
      </Pulsable>
      <BarraAccion label="Al diario" light knob={color.verde} icon={<CheckIcon size={28} tint={color.tarjeta} />} onPress={toDiary} />
    </View>
  );
}
