import { Platform, Text, type TextProps, type TextStyle } from 'react-native';

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

/** Desde aquí es una cifra (escala Fibonacci 34 · 55 · 89 · 144 · 233). */
const CIFRA_MIN = 34;

/** Alto real de la letra en Roboto Mono (ascendente + descendente), en em. */
const GLYPH = 1.32;

/**
 * Las cifras grandes llevan una línea más baja que la letra (233 → 198) para no ocupar más de lo que se ve.
 * En web la letra sobresale de la línea; iOS y Android la recortan (se comía el palo del «1»).
 * En el móvil, la línea pasa a medir lo que la letra y unos márgenes negativos devuelven el hueco de antes:
 * ocupa lo mismo y no se corta.
 */
export function tightLine(size: number, lineHeight: number): TextStyle {
  const natural = Math.ceil(size * GLYPH);
  if (Platform.OS === 'web' || lineHeight >= natural) return { lineHeight };
  const m = (lineHeight - natural) / 2;
  return { lineHeight: natural, marginTop: m, marginBottom: m };
}

/** Tipografía única: Roboto Mono 300/400/500. */
export function KText({ size, weight = 400, tint = color.tinta, caps, title, tabular, lineHeight, style, ...rest }: Props) {
  const s: TextStyle = {
    fontFamily: fontFamily[weight],
    fontSize: size,
    color: tint,
    // Solo las cifras (una línea, muy ajustada): en un título de varias líneas separaría las líneas.
    ...(tabular ? tightLine(size, lineHeight ?? Math.round(size * 1.25)) : { lineHeight: lineHeight ?? Math.round(size * 1.25) }),
    ...(caps && { textTransform: 'uppercase', letterSpacing: tracking.etiqueta(size) }),
    ...(title && { letterSpacing: tracking.titulo(size) }),
    ...(tabular && { fontVariant: ['tabular-nums'] }),
  };
  // Texto grande del sistema: las cifras (34 o más) ya son enormes y llenan la palma, no crecen;
  // el resto crece hasta ×1,5 (más rompería filas y mando). Se puede cambiar pieza a pieza.
  return <Text maxFontSizeMultiplier={size >= CIFRA_MIN ? 1 : 1.5} {...rest} style={[s, style]} />;
}
