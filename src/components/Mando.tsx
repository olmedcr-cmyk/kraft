import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, radius, touch } from '@/theme';
import { CheckIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon, StopIcon } from './icons';
import { Pulsable } from './Pulsable';

type Props = {
  /** Anterior, o parar (solo en pausa, ocupa su sitio). */
  left: 'prev' | 'stop';
  /** Central: pausa trabajando, play en espera, ✓ en repeticiones. */
  central: 'pause' | 'play' | 'check';
  onLeft: () => void;
  onCentral: () => void;
  onRight: () => void;
  /** En marcha: barra a sangre de 144. En reposo: tarjeta de 112 con radio 24. */
  bleed?: boolean;
  rightLabel?: string;
  centralLabel?: string;
};

/** En marcha, un solo mando: anterior · central naranja 104 · siguiente. */
export function Mando({ left, central, onLeft, onCentral, onRight, bleed = true, rightLabel = 'Siguiente tramo', centralLabel }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="toolbar"
      accessibilityLabel="Mando"
      style={[
        styles.bar,
        bleed
          ? { height: touch.mando + insets.bottom, paddingBottom: insets.bottom }
          : { height: 112, borderRadius: radius.lg },
      ]}
    >
      <Pulsable
        onPress={onLeft}
        accessibilityRole="button"
        accessibilityLabel={left === 'stop' ? 'Parar y guardar lo hecho' : 'Anterior · un toque reinicia el tramo, dos van al anterior'}
        style={styles.side}
      >
        {left === 'stop' ? <StopIcon /> : <PrevIcon />}
      </Pulsable>
      <Pulsable
        onPress={onCentral}
        haptic="light"
        accessibilityRole="button"
        accessibilityLabel={centralLabel ?? (central === 'pause' ? 'Pausa' : central === 'check' ? 'Hecho' : 'Seguir')}
        style={styles.central}
      >
        {central === 'pause' ? <PauseIcon /> : central === 'check' ? <CheckIcon /> : <PlayIcon size={44} />}
      </Pulsable>
      <Pulsable onPress={onRight} accessibilityRole="button" accessibilityLabel={rightLabel} style={styles.side}>
        <NextIcon />
      </Pulsable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: color.tinta,
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  central: {
    width: touch.accion,
    height: touch.accion,
    marginHorizontal: 8,
    borderRadius: touch.accion / 2,
    backgroundColor: color.naranja,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
