import { useLocalSearchParams } from 'expo-router';

import { Vacio } from '@/components/Vacio';

const TITLES: Record<string, string> = { terminos: 'Términos', privacidad: 'Privacidad', datos: 'Mis datos', borrar: 'Borrar cuenta', salud: 'Salud' };

/** Documentos legales (KL5Doc). El texto final lo da el abogado. */
export default function LegalDoc() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  return <Vacio title={TITLES[doc] ?? 'Legal'} note="Texto final pendiente de abogado" />;
}
