/** Créditos de ilustración: obligatorio por la licencia CC BY-SA 4.0. */
import { View } from 'react-native';

import { KText } from '@/components/KText';
import { ILLUSTRATION_CREDIT } from '@/data/exercises';
import { color, radius, space, texto } from '@/theme';
import { PantallaTu } from './piezas';

export function CreditosScreen() {
  return (
    <PantallaTu back="Tú" title="Créditos" sub="Ilustraciones de los ejercicios">
      <View style={{ backgroundColor: color.tarjeta, borderRadius: radius.lg, padding: space.s16, gap: space.s12 }}>
        <KText size={texto.lista} lineHeight={22}>
          {ILLUSTRATION_CREDIT}
        </KText>
        <KText size={texto.texto} tint={color.texto2} lineHeight={20}>
          Las ilustraciones de los ejercicios en tres fases se usan bajo la licencia Creative Commons Atribución-CompartirIgual 4.0 (CC BY-SA 4.0).
        </KText>
        <KText size={texto.texto} tint={color.texto2}>
          creativecommons.org/licenses/by-sa/4.0
        </KText>
      </View>
    </PantallaTu>
  );
}
