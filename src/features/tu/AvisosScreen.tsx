/** Avisos (KT4Alerts): pocos y útiles. */
import { View } from 'react-native';

import { KText } from '@/components/KText';
import { requestNotifications } from '@/platform/reminders';
import { updateSettings, useSettings } from '@/state/settings';
import { color, radius, space, texto } from '@/theme';
import { FilaOpciones, FilaSi, Grupo, PantallaTu } from './piezas';

export function AvisosScreen() {
  const s = useSettings();
  const coach = s.coach?.name ?? 'Tu entrenador';

  /** Encender avisos pide el permiso del sistema si aún no lo hay. */
  const setAvisos = async (v: boolean) => {
    updateSettings({ avisos: v });
    if (v) await requestNotifications();
  };

  return (
    <PantallaTu back="Tú" title="Avisos" sub="Pocos y útiles">
      <Grupo>
        <FilaSi label="Llega tu sesión" on={s.avisos} onChange={setAvisos} />
        <FilaOpciones
          label="Antes de clase"
          options={[
            { value: 1, label: '1 h' },
            { value: 3, label: '3 h' },
          ]}
          value={s.avisoAntes}
          onChange={(v) => updateSettings({ avisoAntes: v as 1 | 3 })}
        />
        <FilaSi label="Sitio en lista de espera" on={s.avisoEspera} onChange={(v) => updateSettings({ avisoEspera: v })} />
        <FilaSi label="Pago del mes" on={s.avisoPago} onChange={(v) => updateSettings({ avisoPago: v })} />
        <FilaSi label="Resumen semanal" on={s.resumen} onChange={(v) => updateSettings({ resumen: v })} />
      </Grupo>

      {/* Así llega un aviso. */}
      <View accessibilityLabel={`Ejemplo de aviso: ${coach} te ha enviado la sesión`} style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, padding: space.s16, flexDirection: 'row', alignItems: 'center', gap: space.s12 }}>
        <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: color.klein, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.naranja }} />
        </View>
        <KText size={texto.texto} style={{ flex: 1 }}>{`${coach} te ha enviado la sesión`}</KText>
        <KText size={texto.texto} tint={color.texto2}>
          ejemplo
        </KText>
      </View>
    </PantallaTu>
  );
}
