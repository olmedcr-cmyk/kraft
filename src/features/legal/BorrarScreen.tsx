/** Borrar cuenta (KL4Delete): qué se borra, qué se guarda, lo pendiente y un botón que pide confirmar. */
import { router } from 'expo-router';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { useDiary } from '@/diario/store';
import { DELETE_DAYS, deletionDate, fechaCorta, pendingPayments } from '@/legal/model';
import { updateSettings, useSettings } from '@/state/settings';
import { color, motion, ms, radius, space, texto, touch } from '@/theme';
import { PantallaTu, useConfirmar } from '@/features/tu/piezas';
import { Aviso, Circulo, Punto, Tarjeta } from './piezas';

export function BorrarScreen() {
  const s = useSettings();
  const diary = useDiary();
  const coach = s.coach?.name;
  const debt = pendingPayments(diary, Date.now());
  const confirm = useConfirmar(4000);

  const borrar = () =>
    confirm.press(() => {
      // Sin servidor aún: se apunta la petición y se vuelve al principio. Si vuelve antes de 30 días, se anula.
      updateSettings({ borradoPedido: Date.now(), onboarded: false });
      if (router.canDismiss()) router.dismissAll();
      router.replace('/alta');
    });

  return (
    <PantallaTu
      back="Mis datos"
      backHref="/legal/datos"
      title="Borrar cuenta"
      sub="Antes de irte"
      footer={
        <View style={{ gap: space.s8 }}>
          <KText size={texto.texto} tint={color.texto2} style={{ textAlign: 'center', paddingHorizontal: space.s8 }} accessibilityLiveRegion="polite">
            {confirm.armed ? 'Toca otra vez para borrar' : `Se borra el ${fechaCorta(deletionDate(Date.now()))}. Si vuelves a entrar antes, se anula.`}
          </KText>
          <Pulsable
            onPress={borrar}
            haptic={confirm.armed ? 'medium' : 'light'}
            accessibilityRole="button"
            accessibilityLabel={confirm.armed ? 'Confirmar: borrar en 30 días' : `Borrar en ${DELETE_DAYS} días`}
            style={{ height: touch.fila, borderRadius: radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.s16 }}
          >
            {/* Armado, el botón se vuelve naranja: actuar. */}
            <Animated.View
              style={{
                ...{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
                borderRadius: radius.xl,
                backgroundColor: confirm.armed ? color.naranja : color.tinta,
                transitionProperty: 'backgroundColor',
                transitionDuration: ms(motion.pantalla),
                transitionTimingFunction: motion.easing,
              }}
            />
            <View style={{ width: 20, height: 20, borderRadius: radius.xs, backgroundColor: confirm.armed ? color.tinta : color.tarjeta }} />
            <KText size={texto.bloque} tint={confirm.armed ? color.tinta : color.tarjeta}>
              {`Borrar en ${DELETE_DAYS} días`}
            </KText>
          </Pulsable>
        </View>
      }
    >
      <Tarjeta etiqueta="Se borra">
        <Punto dot={color.tinta} title="Entrenos, notas y perfil" sub={`En ${DELETE_DAYS} días. Puedes volver antes.`} />
        {coach && <Punto dot={color.tinta} title={`El vínculo con ${coach}`} sub="Deja de ver tus datos" />}
      </Tarjeta>
      <Tarjeta etiqueta="Se guarda">
        <Punto dot={color.linea} title="Recibos de pago" sub="El tiempo que pide la ley" />
      </Tarjeta>

      {debt.amount > 0 && (
        <Aviso bg={color.tinteNaranja} icon={<Circulo size={40} bg={color.naranja}><KText size={texto.bloque}>!</KText></Circulo>}>
          <KText size={texto.texto} lineHeight={texto.texto * 1.5}>
            {`Tienes ${debt.amount} € pendientes${coach ? ` con ${coach}` : ''}.`}
          </KText>
          <KText
            size={texto.texto}
            lineHeight={texto.texto * 1.5}
            style={{ textDecorationLine: 'underline', alignSelf: 'flex-start' }}
            accessibilityRole="link"
            onPress={() => router.push({ pathname: '/pago/[mes]', params: { mes: debt.months[0] } })}
          >
            Pagar antes
          </KText>
        </Aviso>
      )}
    </PantallaTu>
  );
}
