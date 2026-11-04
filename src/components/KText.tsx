import { Text, type TextProps, type TextStyle } from 'react-native';

import { color, fontFamily, tracking, type Weight } from '@/theme';

type Props = TextProps & {
  size: number;
  weight?: Weight;
  tint?: string;
  /** Etiqueta: mayúsculas con tracking 0.08em. */
  caps?: boolean;
  /** Título: tracking −0.04em. */
  title?: boolean;
  /** Cifras de ancho fijo. */
  tabular?: boolean;
  lineHeight?: number;
};

/** Tipografía única: Roboto Mono 300/400/500. */
export function KText({ size, weight = 400, tint = color.tinta, caps, title, tabular, lineHeight, style, ...rest }: Props) {
  const s: TextStyle = {
    fontFamily: fontFamily[weight],
    fontSize: size,
    color: tint,
    lineHeight: lineHeight ?? Math.round(size * 1.25),
    ...(caps && { textTransform: 'uppercase', letterSpacing: tracking.etiqueta(size) }),
    ...(title && { letterSpacing: tracking.titulo(size) }),
    ...(tabular && { fontVariant: ['tabular-nums'] }),
  };
  return <Text {...rest} style={[s, style]} />;
}
