/**
 * Tema de KRAFT. Única fuente: design/tokens/tokens.json.
 * Si un valor no está aquí, es un error (CLAUDE.md · «Un número, una regla»).
 */
import tokens from '../../design/tokens/tokens.json';

export const color = tokens.color;
export type ColorName = keyof typeof color;

/** Color = estado. */
export const estado = Object.fromEntries(
  Object.entries(tokens.estado).map(([k, v]) => [k, color[v as ColorName]]),
) as Record<keyof typeof tokens.estado, string>;

const [s4, s8, s12, s16, s24, s32, s48, s64] = tokens.space;
export const space = { s4, s8, s12, s16, s24, s32, s48, s64 } as const;

export const layout = tokens.layout;

export const radius = {
  xs: tokens.radius.xs,
  sm: tokens.radius.sm,
  md: tokens.radius.md,
  lg: tokens.radius.lg,
  xl: tokens.radius.xl,
  pill: tokens.radius.pill,
} as const;

/** Interior = exterior − padding. */
export const inner = (outer: number, padding: number) => outer - padding;

export const touch = tokens.touch;

const [c233, c144, c89, c55, c34] = tokens.font.cifra;
/** Cifras (Fibonacci, ×1,618), siempre peso 300. */
export const cifra = { c233, c144, c89, c55, c34 } as const;
/** Texto. En marcha, nada bajo 18. */
export const texto = tokens.font.texto;

/** Tracking en em → px para React Native. */
export const tracking = {
  titulo: (size: number) => size * -0.04,
  etiqueta: (size: number) => size * 0.08,
};

export const fontFamily = {
  300: 'RobotoMono_300Light',
  400: 'RobotoMono_400Regular',
  500: 'RobotoMono_500Medium',
} as const;
export type Weight = keyof typeof fontFamily;

export const motion = tokens.motion;

/** Transparencias sobre fondos de estado (puntos gastados, base de barras). */
export const alpha = {
  sobreColor: 'rgba(255,255,255,0.25)',
  sobreClaro: 'rgba(20,20,20,0.18)',
};
