/** Cuenta (KT6Account): pago, salud, idioma, tus datos y salir. */
import { router } from 'expo-router';

import { updateSettings, useSettings } from '@/state/settings';
import { color } from '@/theme';
import { Fila, FilaSi, Grupo, PantallaTu, useConfirmar } from './piezas';

/** Tarjeta guardada de ejemplo: la pondrá la pasarela de pago. */
const CARD_LAST4 = '4242';

export function CuentaScreen() {
  const s = useSettings();
  const salir = useConfirmar();
  const doc = (d: string) => router.push({ pathname: '/legal/[doc]', params: { doc: d } });

  return (
    <PantallaTu back="Tú" title="Cuenta">
      <Grupo>
        <Fila label="Pago" value={`···· ${CARD_LAST4}`} onPress={() => router.push('/diario')} />
        {/* Salud: consentimiento propio y explícito (RGPD). Solo escribe entrenos y calorías. */}
        <FilaSi label="Salud" on={s.salud} onChange={(v) => updateSettings({ salud: v })} />
        <Fila label="Idioma" value="Español" />
        {/* Solo hay tema claro diseñado. */}
        <Fila label="Tema" value="Claro" />
      </Grupo>
      <Grupo>
        <Fila label="Mis datos · descargar" onPress={() => doc('datos')} />
        <Fila label="Privacidad" onPress={() => doc('privacidad')} />
        <Fila label="Créditos de ilustración" value="CC BY-SA" onPress={() => router.push('/tu/creditos')} />
      </Grupo>
      <Grupo>
        <Fila
          label={salir.armed ? 'Toca otra vez para salir' : 'Cerrar sesión'}
          tint={salir.armed ? color.naranja : color.tinta}
          onPress={() =>
            salir.press(() => {
              // Sin cuentas aún: salir = volver al alta. Los datos se quedan en el móvil.
              updateSettings({ onboarded: false });
              if (router.canDismiss()) router.dismissAll();
              router.replace('/alta');
            })
          }
        />
        <Fila label="Borrar cuenta" onPress={() => doc('borrar')} />
      </Grupo>
    </PantallaTu>
  );
}
