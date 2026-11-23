/** Mis datos (KL3Data): cuánto tienes, descargarlo todo en CSV, corregir y borrar. */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { KText } from '@/components/KText';
import { Pulsable } from '@/components/Pulsable';
import { getDiary, useDiary } from '@/diario/store';
import { backend } from '@/backend/client';
import { dataCounts, exportCsv, serverCsv } from '@/legal/model';
import { exportText } from '@/platform/exportar';
import { getSettings } from '@/state/settings';
import { cifra, color, space, texto, touch } from '@/theme';
import { Fila, Grupo, PantallaTu } from '@/features/tu/piezas';
import { Aviso, Circulo, Tarjeta } from './piezas';

export function DatosScreen() {
  const diary = useDiary();
  const n = dataCounts(diary);
  const [done, setDone] = useState<'ok' | 'fallo' | null>(null);

  // Con servidor, todo lo que guarda (también reservas, notas y perfil). Sin servidor o sin red, lo del móvil.
  const download = async () => {
    const now = Date.now();
    const name = `kraft-datos-${new Date(now).toISOString().slice(0, 10)}.csv`;
    let csv = exportCsv(getDiary(), getSettings(), now);
    if (backend) {
      const { data, error } = await backend.rpc('export_my_data').then(
        (r) => r,
        () => ({ data: null, error: true }),
      );
      if (!error && data && typeof data === 'object') csv = serverCsv(data as Record<string, unknown>, now);
    }
    const ok = await exportText(name, csv);
    setDone(ok ? 'ok' : 'fallo');
  };

  return (
    <PantallaTu back="Privacidad" backHref="/legal" title="Mis datos" sub="Son tuyos">
      <Tarjeta etiqueta="Tienes">
        <View style={{ flexDirection: 'row', gap: space.s8 }}>
          {(
            [
              [n.sesiones, n.sesiones === 1 ? 'sesión' : 'sesiones'],
              [n.clases, n.clases === 1 ? 'clase' : 'clases'],
              [n.pagos, n.pagos === 1 ? 'pago' : 'pagos'],
            ] as const
          ).map(([v, l]) => (
            <View key={l} style={{ flex: 1, gap: space.s4 }} accessible accessibilityLabel={`${v} ${l}`}>
              <KText size={cifra.c34} weight={300} lineHeight={cifra.c34 + space.s8} tabular>
                {String(v)}
              </KText>
              <KText size={texto.texto} tint={color.texto2}>
                {l}
              </KText>
            </View>
          ))}
        </View>
      </Tarjeta>

      <Grupo>
        <Fila label="Descargar todo" value="CSV" onPress={download} a11y="Descargar todos tus datos en CSV" />
        <Fila label="Corregir un dato" onPress={() => router.push('/tu')} a11y="Corregir un dato en tu perfil" />
        <Fila label="Ver qué guardamos" onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'privacidad', abre: '0' } })} />
      </Grupo>

      {done === 'ok' && (
        <Aviso bg={color.tinteVerde} icon={<Circulo size={space.s32} bg={color.verde}><CheckIcon size={16} tint={color.tarjeta} /></Circulo>}>
          <KText size={texto.texto} lineHeight={texto.texto * 1.5}>
            Listo. Ya tienes tu CSV.
          </KText>
        </Aviso>
      )}
      {done === 'fallo' && (
        <Aviso bg={color.tinteNaranja} icon={<Circulo size={space.s32} bg={color.naranja}><KText size={texto.bloque}>!</KText></Circulo>}>
          <KText size={texto.texto} lineHeight={texto.texto * 1.5}>
            No se ha podido descargar. Prueba otra vez.
          </KText>
        </Aviso>
      )}

      <View style={{ flex: 1 }} />
      <Pulsable onPress={() => router.push('/legal/borrar')} accessibilityRole="link" scaleTo={0.98} style={{ height: touch.dedo + space.s8, alignItems: 'center', justifyContent: 'center' }}>
        <KText size={texto.texto} tint={color.texto2}>
          Borrar mi cuenta
        </KText>
      </Pulsable>
    </PantallaTu>
  );
}
