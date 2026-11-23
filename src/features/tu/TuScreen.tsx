/** Tú (KT1You): quién eres, tu entrenador y los ajustes. */
import { router } from 'expo-router';
import { View } from 'react-native';

import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { monthKey, trainedDays } from '@/diario/model';
import { useDiary } from '@/diario/store';
import { useSettings } from '@/state/settings';
import { cifra, color, radius, space, texto, touch } from '@/theme';
import { Avatar, Chevron, Fila, Grupo, PantallaTu } from './piezas';
import { countdownLabel } from './textos';

/** Puntos del mes: 16 = 4 días por semana. Si entrenas más, crecen. */
const MONTH_DOTS = 16;

export function TuScreen() {
  const s = useSettings();
  const diary = useDiary();
  const days = trainedDays(diary, monthKey(Date.now()));
  const dots = Math.max(MONTH_DOTS, days);
  const name = s.nombre || 'Tú';

  return (
    <PantallaTu back="Hoy">
      <View style={{ paddingHorizontal: space.s8, paddingBottom: space.s16, flexDirection: 'row', alignItems: 'center', gap: space.s16 }}>
        <Avatar initial={name[0]} size={touch.fila} />
        <View style={{ flex: 1, gap: space.s8 }}>
          <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
            {name}
          </KText>
          <View accessibilityLabel={`${days} ${days === 1 ? 'día' : 'días'} este mes`} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s4 }}>
            {Array.from({ length: dots }, (_, i) => (
              <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i < days ? color.verde : color.hundido }} />
            ))}
          </View>
        </View>
      </View>

      {s.coach ? (
        <Pulsable
          onPress={() => router.push('/tu/entrenador')}
          accessibilityRole="button"
          accessibilityLabel={`${s.coach.name}, te entrena`}
          scaleTo={0.98}
          style={{ height: touch.fila, backgroundColor: color.tarjeta, borderRadius: radius.xl, padding: space.s16, flexDirection: 'row', alignItems: 'center', gap: space.s16 }}
        >
          <Avatar initial={s.coach.initial} size={56} />
          <View style={{ flex: 1, gap: space.s4 }}>
            <KText size={texto.bloque}>{s.coach.name}</KText>
            <KText size={texto.texto} tint={color.texto2}>
              Te entrena
            </KText>
          </View>
          <Chevron />
        </Pulsable>
      ) : (
        <Pulsable
          onPress={() => router.push({ pathname: '/alta/entrenador', params: { desde: 'tu' } })}
          accessibilityRole="button"
          scaleTo={0.98}
          style={{ height: touch.fila, borderRadius: radius.xl, borderWidth: 2, borderStyle: 'dashed', borderColor: color.linea, padding: space.s16, flexDirection: 'row', alignItems: 'center', gap: space.s16 }}
        >
          <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: color.linea }} />
          <KText size={texto.bloque} style={{ flex: 1 }}>
            Vincular entrenador
          </KText>
          <Chevron />
        </Pulsable>
      )}

      <Grupo>
        <Fila label="Entreno" value={`${countdownLabel(s.cuentaAtras)} · ${s.descanso}`} onPress={() => router.push('/tu/entreno')} />
        <Fila label="Sonido · voz · vibra" onPress={() => router.push('/tu/sonido')} />
        <Fila label="Avisos" onPress={() => router.push('/tu/avisos')} />
      </Grupo>
      <Grupo>
        <Fila label="Cuenta y pagos" onPress={() => router.push('/tu/cuenta')} />
      </Grupo>
    </PantallaTu>
  );
}
