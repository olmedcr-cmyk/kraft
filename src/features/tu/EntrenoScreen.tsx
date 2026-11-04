/** Entreno (KT2Training): cómo cuenta KRAFT. */
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { COUNTDOWNS, type Countdown } from '@/alta/model';
import { KText } from '@/components/KText';
import { updateSettings, useSettings } from '@/state/settings';
import { color, motion, ms, radius, space, texto, touch } from '@/theme';
import { FilaOpciones, FilaSi, Grupo, PantallaTu } from './piezas';

export function EntrenoScreen() {
  const s = useSettings();
  const countdown = s.cuentaAtras > 0;
  const note =
    s.descanso === 'manual'
      ? 'Manual: al acabar, tocas para seguir.'
      : countdown
        ? 'Auto: al acabar, sigue solo tras la cuenta atrás.'
        : 'Auto: al acabar, sigue solo.';

  return (
    <PantallaTu back="Tú" title="Entreno" sub="Cómo cuenta KRAFT">
      <Grupo>
        <FilaOpciones<Countdown>
          label="Cuenta atrás"
          options={COUNTDOWNS.map((n) => ({ value: n, label: n === 0 ? 'No' : String(n) }))}
          value={s.cuentaAtras}
          onChange={(v) => updateSettings({ cuentaAtras: v })}
        />
        <FilaOpciones
          label="Descanso"
          options={[
            { value: 'manual', label: 'Manual' },
            { value: 'auto', label: 'Auto' },
          ]}
          value={s.descanso}
          onChange={(v) => updateSettings({ descanso: v })}
        />
        <FilaSi label="Pausa con la palma" on={s.palmaPausa} onChange={(v) => updateSettings({ palmaPausa: v })} />
        <FilaSi label="Pantalla encendida" on={s.pantalla} onChange={(v) => updateSettings({ pantalla: v })} />
        <FilaOpciones
          label="Peso"
          options={[
            { value: 'kg', label: 'kg' },
            { value: 'lb', label: 'lb' },
          ]}
          value={s.peso}
          onChange={(v) => updateSettings({ peso: v })}
        />
      </Grupo>

      {/* Cómo se verá: el 3·2·1 en naranja (o nada) y qué pasa al acabar. */}
      <View accessibilityLabel={note} style={{ backgroundColor: color.tinta, borderRadius: radius.lg, padding: space.s16, flexDirection: 'row', alignItems: 'center', gap: space.s16 }}>
        <View style={{ flexDirection: 'row', gap: space.s8 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {[3, 2, 1].map((n, i) => (
            <Animated.View
              key={n}
              style={{
                width: touch.dedo,
                height: touch.dedo,
                borderRadius: touch.dedo / 2,
                backgroundColor: countdown ? color.naranja : 'transparent',
                borderWidth: 2,
                borderColor: countdown ? color.naranja : color.texto2,
                opacity: countdown ? [1, 0.6, 0.3][i] : 1,
                alignItems: 'center',
                justifyContent: 'center',
                transitionProperty: ['backgroundColor', 'borderColor', 'opacity'],
                transitionDuration: ms(motion.punto),
                transitionTimingFunction: motion.easing,
              }}
            >
              <KText size={texto.bloque} tint={countdown ? color.tinta : color.texto2}>
                {String(n)}
              </KText>
            </Animated.View>
          ))}
        </View>
        <KText size={texto.texto} tint={color.linea} lineHeight={20} style={{ flex: 1 }}>
          {note}
        </KText>
      </View>
    </PantallaTu>
  );
}
