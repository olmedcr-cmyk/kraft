/** Privacidad (KL1Privacy): quién ve qué, tres permisos y los documentos. */
import { router } from 'expo-router';

import { updateSettings, useSettings } from '@/state/settings';
import { color } from '@/theme';
import { Fila, FilaSi, Grupo, PantallaTu } from '@/features/tu/piezas';
import { FILA_CORTA, Punto, Tarjeta } from './piezas';

export function PrivacidadScreen() {
  const s = useSettings();
  const coach = s.coach?.name ?? 'Tu entrenador';
  const doc = (d: 'privacidad' | 'terminos' | 'aviso') => router.push({ pathname: '/legal/[doc]', params: { doc: d } });

  return (
    <PantallaTu back="Cuenta" backHref="/tu/cuenta" title="Privacidad" sub="Tus datos, en corto">
      <Tarjeta etiqueta="Quién ve qué">
        <Punto dot={color.tinta} title={coach} sub={s.compartir ? 'Sesiones, esfuerzo, notas y pagos' : 'Sesiones y pagos'} />
        <Punto dot={color.klein} title="KRAFT" sub="Lo justo para que funcione. No vendemos datos." />
        <Punto dot={color.linea} title="Nadie más" sub="Salvo que tú lo actives" />
      </Tarjeta>

      {/* Analítica y emails, apagados por defecto (RGPD). */}
      <Grupo>
        <FilaSi alto={FILA_CORTA} label={`Esfuerzo y notas a ${s.coach?.name ?? 'tu entrenador'}`} on={s.compartir} onChange={(v) => updateSettings({ compartir: v })} />
        <FilaSi alto={FILA_CORTA} label="Analítica anónima" on={s.analitica} onChange={(v) => updateSettings({ analitica: v })} />
        <FilaSi alto={FILA_CORTA} label="Novedades por email" on={s.emails} onChange={(v) => updateSettings({ emails: v })} />
      </Grupo>

      <Grupo>
        <Fila alto={FILA_CORTA} label="Mis datos" onPress={() => router.push('/legal/datos')} />
        <Fila alto={FILA_CORTA} label="Política de privacidad" onPress={() => doc('privacidad')} />
        <Fila alto={FILA_CORTA} label="Términos" onPress={() => doc('terminos')} />
        <Fila alto={FILA_CORTA} label="Aviso legal · licencias" onPress={() => doc('aviso')} />
      </Grupo>
    </PantallaTu>
  );
}
