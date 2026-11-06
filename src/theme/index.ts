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

/**
 * Movimiento. punto (300) y pantalla (240) y la curva vienen de tokens.json; sin rebote.
 * `toque` (120) y `marco` (200) no están en tokens.json: propuesta para añadirlos.
 */
import { cubicBezier } from 'react-native-reanimated';

/**
 * Curva propia para transiciones CSS de Reanimated. En el móvil solo vale el objeto de `cubicBezier()`
 * (el texto «cubic-bezier(…)» rompe), pero sus tipos de estilo no lo admiten: se anuncia como curva
 * predefinida para TypeScript y en ejecución va el objeto, que funciona en iOS, Android y web.
 */
const curva = (x1: number, y1: number, x2: number, y2: number) => cubicBezier(x1, y1, x2, y2) as unknown as 'ease-out';

export const motion = {
  ...tokens.motion,
  /** Respuesta al pulsar: casi imperceptible, se toca decenas de veces. */
  toque: 120,
  /** Intervalo del reloj: las barras se deslizan de un marco al siguiente sin saltos. */
  marco: 200,
  /** Curva de salida fuerte para la pulsación. */
  salida: curva(0.23, 1, 0.32, 1),
  /** Movimiento sobre la pantalla (indicador del selector). */
  mover: curva(0.77, 0, 0.175, 1),
} as const;
export const ms = (n: number) => `${n}ms`;

/** Cambio de estado de fondo (trabajo ↔ descanso ↔ pausa): color, a ritmo de pantalla. */
export const transicionFondo = {
  transitionProperty: 'backgroundColor',
  transitionDuration: ms(motion.pantalla),
  transitionTimingFunction: motion.easing,
} as const;

/** Un punto que cambia de estado (gastado, actual, pendiente). */
export const transicionPunto = {
  transitionProperty: ['backgroundColor', 'borderColor'] as ('backgroundColor' | 'borderColor')[],
  transitionDuration: ms(motion.punto),
  transitionTimingFunction: motion.easing,
};

/** Transparencias sobre fondos de estado (puntos gastados, base de barras). */
export const alpha = {
  sobreColor: 'rgba(255,255,255,0.25)',
  /** Punto a medias sobre color (paso siguiente del arranque). */
  mitadSobreColor: 'rgba(255,255,255,0.5)',
  sobreClaro: 'rgba(20,20,20,0.18)',
  /** Tarjetas sobre fondo de estado (J8Finish). */
  tarjetaSobreColor: 'rgba(255,255,255,0.14)',
};

/**
 * Sombra (propuesta: no está en tokens.json). Solo para lo que flota sobre el contenido
 * (menú, acción principal). Las tarjetas siguen planas: blanco sobre fondo.
 */
export const sombra = {
  flotante: '0 8px 24px rgba(20,20,20,0.08), 0 1px 2px rgba(20,20,20,0.06)',
} as const;

/** Alto del fundido donde el contenido se desvanece bajo los bordes al desplazar. */
export const fundido = 24;

