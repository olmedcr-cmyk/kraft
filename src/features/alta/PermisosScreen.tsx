/** Tres cosas (K8Permissions): avisos, sonar en silencio, pantalla encendida. */
import { router } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraAccion } from '@/components/BarraAccion';
import { Interruptor } from '@/components/Interruptor';
import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import type { Settings } from '@/alta/model';
import { requestNotifications } from '@/platform/reminders';
import { updateSettings, useSettings } from '@/state/settings';
import { cifra, color, layout, radius, space, texto, touch } from '@/theme';

const ROWS: { key: 'avisos' | 'silencio' | 'pantalla'; title: string; note: string }[] = [
  { key: 'avisos', title: 'Avisos', note: 'Cuando llega tu sesión' },
  { key: 'silencio', title: 'Sonar en silencio', note: 'El 3·2·1 se oye siempre' },
  { key: 'pantalla', title: 'Pantalla encendida', note: 'Solo mientras entrenas' },
];

export function PermisosScreen() {
  const insets = useSafeAreaInsets();
  const s = useSettings();

  /** El permiso del sistema se pide aquí, al seguir, y solo si quiere avisos. Si lo niega, queda apagado. */
  const next = async () => {
    if (s.avisos) {
      const ok = await requestNotifications();
      // En web no hay avisos: se respeta la elección para cuando use el móvil.
      if (!ok && Platform.OS !== 'web') updateSettings({ avisos: false });
    }
    router.push('/alta/palma');
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo, paddingTop: Math.max(insets.top, layout.pantallaArriba), paddingHorizontal: layout.pantallaLado, paddingBottom: space.s16 + insets.bottom, gap: layout.entreTarjetas }}>
      <View style={{ paddingHorizontal: space.s8, paddingBottom: space.s16, gap: space.s8 }}>
        <KText size={cifra.c34} weight={300} title lineHeight={cifra.c34} accessibilityRole="header">
          Tres cosas
        </KText>
        <KText size={texto.texto} tint={color.texto2}>
          Para no mirar el móvil
        </KText>
      </View>

      {ROWS.map((r) => (
        <Fila key={r.key} title={r.title} note={r.note} on={s[r.key]} onToggle={() => updateSettings({ [r.key]: !s[r.key] } as Partial<Settings>)} />
      ))}

      <View style={{ flex: 1 }} />
      <KText size={texto.texto} tint={color.texto2} style={{ paddingHorizontal: space.s8, paddingBottom: space.s8 }}>
        Se cambian luego en Tú · Ajustes.
      </KText>
      <BarraAccion label="Seguir" onPress={next} />
    </View>
  );
}

function Fila({ title, note, on, onToggle }: { title: string; note: string; on: boolean; onToggle: () => void }) {
  return (
    <Pulsable
      onPress={onToggle}
      haptic="selection"
      scaleTo={0.99}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${title}. ${note}`}
      style={{ height: touch.accion, backgroundColor: color.tarjeta, borderRadius: radius.lg, paddingVertical: space.s16, paddingRight: space.s16, paddingLeft: space.s24, flexDirection: 'row', alignItems: 'center', gap: space.s16 }}
    >
      <View style={{ flex: 1, gap: space.s8 }}>
        <KText size={texto.bloque}>{title}</KText>
        <KText size={texto.texto} tint={color.texto2}>
          {note}
        </KText>
      </View>
      <Interruptor on={on} />
    </Pulsable>
  );
}
