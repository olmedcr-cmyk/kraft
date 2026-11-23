import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { motion, ms } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type Haptic = 'selection' | 'light' | 'medium' | 'success';

function fire(h: Haptic) {
  if (Platform.OS === 'web') return;
  const p =
    h === 'selection'
      ? Haptics.selectionAsync()
      : h === 'success'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(h === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  p.catch(() => {});
}

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Una vibración por acción, en el mismo instante que se ve. Nunca la única señal. */
  haptic?: Haptic;
  /** Cuánto encoge al pulsar (0,97 por defecto; las piezas grandes, 0,98). */
  scaleTo?: number;
};

/**
 * Todo lo que se toca. Responde al apretar (no al soltar): encoge un 3 % en 120 ms.
 * En web, al pasar el ratón, baja un poco la opacidad. Con «reducir movimiento», sin escala.
 */
export function Pulsable({ style, haptic, scaleTo = 0.97, onPress, onLongPress, onPressIn, onPressOut, onHoverIn, onHoverOut, disabled, ...rest }: Props) {
  const [pressed, setPressed] = useState(false);
  const [hover, setHover] = useState(false);
  const reduced = useReducedMotion();
  const scale = pressed && !reduced && !disabled ? scaleTo : 1;
  const opacity = disabled ? 0.4 : hover && !pressed ? 0.88 : 1;
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      pressRetentionOffset={16}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      onHoverIn={(e) => {
        setHover(true);
        onHoverIn?.(e);
      }}
      onHoverOut={(e) => {
        setHover(false);
        onHoverOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) fire(haptic);
        onPress?.(e);
      }}
      onLongPress={
        onLongPress &&
        ((e) => {
          fire('medium');
          onLongPress(e);
        })
      }
      style={[
        style,
        {
          transform: [{ scale }],
          opacity,
          // Pulsación rápida; los cambios de color (estado) a ritmo de pantalla.
          transitionProperty: ['transform', 'opacity', 'backgroundColor', 'borderColor'],
          transitionDuration: [ms(motion.toque), ms(motion.toque), ms(motion.pantalla), ms(motion.pantalla)],
          transitionTimingFunction: [motion.salida, motion.salida, motion.easing, motion.easing],
        },
      ]}
    />
  );
}
