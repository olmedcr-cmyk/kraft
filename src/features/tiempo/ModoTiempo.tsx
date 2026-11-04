import { router } from 'expo-router';

import { Segmentado } from '@/components/Segmentado';

type Modo = 'series' | 'tabata' | 'mios';
const HREF = { series: '/tiempo', tabata: '/tiempo/tabata', mios: '/tiempo/mios' } as const;

/** Series · Tabata · Míos (cabecera de la pestaña Tiempo). */
export function ModoTiempo({ value }: { value: Modo }) {
  return (
    <Segmentado<Modo>
      label="Tipo de tiempo"
      value={value}
      onChange={(v) => v !== value && router.replace(HREF[v])}
      options={[
        { value: 'series', label: 'Series' },
        { value: 'tabata', label: 'Tabata' },
        { value: 'mios', label: 'Míos' },
      ]}
    />
  );
}
