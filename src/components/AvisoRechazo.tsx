/**
 * Aviso cuando el servidor rechaza algo que hiciste sin red (la clase se llenó, ya empezó…).
 * La pantalla ya se corrigió sola al releer del servidor; esto dice qué pasó. «Vale» lo quita.
 */
import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getSlot, hhmm, longDay } from '@/agenda/model';
import { dismissRejected, useRejected } from '@/backend/sync';
import { rejectText } from '@/sync/rechazo';
import { color, layout, motion, radius, space, texto, touch } from '@/theme';
import { KText } from './KText';
import { Pulsable } from './Pulsable';

const slotName = (id: string) => {
  const s = getSlot(id);
  return s ? `${s.name} del ${longDay(s.start).split(' ')[0].toLowerCase()} ${hhmm(s.start)}` : undefined;
};

export function AvisoRechazo() {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const failed = useRejected();
  const job = failed[0];
  if (!job) return null;

  return (
    <Animated.View
      key={job.id}
      entering={reduced ? undefined : FadeInUp.duration(motion.pantalla)}
      exiting={reduced ? undefined : FadeOutUp.duration(motion.pantalla)}
      pointerEvents="box-none"
      style={{ position: 'absolute', top: insets.top + space.s8, left: layout.pantallaLado, right: layout.pantallaLado }}
    >
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
        style={{ borderRadius: radius.lg, backgroundColor: color.tinta, padding: space.s12, paddingLeft: space.s16, flexDirection: 'row', alignItems: 'center', gap: space.s12 }}
      >
        <View style={{ width: space.s24, height: space.s24, borderRadius: space.s12, backgroundColor: color.naranja, alignItems: 'center', justifyContent: 'center' }}>
          <KText size={texto.texto} weight={500} lineHeight={texto.texto}>
            !
          </KText>
        </View>
        <KText size={texto.texto} tint={color.tarjeta} lineHeight={texto.texto * 1.5} style={{ flex: 1 }}>
          {rejectText(job, slotName)}
        </KText>
        <Pulsable
          onPress={() => dismissRejected(job.id)}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel="Vale, entendido"
          style={{ height: touch.dedo, paddingHorizontal: space.s16, borderRadius: radius.pill, backgroundColor: color.naranja, alignItems: 'center', justifyContent: 'center' }}
        >
          <KText size={texto.texto}>Vale</KText>
        </Pulsable>
      </View>
    </Animated.View>
  );
}
