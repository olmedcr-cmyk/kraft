/**
 * La línea bajo el título de un formulario: la ayuda, o el error.
 * El error va en tinta (se lee al sol: el naranja sobre fondo no llega al contraste) con un punto naranja
 * delante (actuar), y se dice al lector de pantalla al aparecer.
 */
import { useEffect } from 'react';
import { View } from 'react-native';

import { anunciar } from '@/platform/anunciar';
import { color, radius, space, texto } from '@/theme';
import { KText } from './KText';

export function Nota({ text, error }: { text: string; error?: boolean }) {
  useEffect(() => {
    if (error) anunciar(text);
  }, [error, text]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s8 }}>
      {error && <View style={{ width: space.s8, height: space.s8, borderRadius: radius.pill, backgroundColor: color.naranja }} />}
      <KText size={texto.texto} tint={error ? color.tinta : color.texto2} weight={error ? 500 : 400} style={{ flexShrink: 1 }}>
        {text}
      </KText>
    </View>
  );
}
