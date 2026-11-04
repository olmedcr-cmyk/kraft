import { useLocalSearchParams } from 'expo-router';

import { Vacio } from '@/components/Vacio';

/** Pantallas sin diseñar aún (Ayuda, escribir al entrenador). */
export default function Pronto() {
  const { t } = useLocalSearchParams<{ t?: string }>();
  return <Vacio title={t ?? 'Pronto'} note="Aún no está diseñado" />;
}
