/**
 * Formato de la sesión que envía el entrenador (propuesta v1, pendiente de backend).
 *
 * Sesión → bloques → pasos. El atleta no edita nada: solo toca.
 * - interval: tramos con tiempo (calentar, mantener, bici, estirar). Entre pasos, descanso fijo o espera manual.
 * - tabata: rondas trabajo/descanso, alternando ejercicios A/B, repetido `sets` veces.
 * - ladder: series por repeticiones con peso (escalera), y después una lista de accesorios.
 */

export type BlockTint = 'klein' | 'naranja' | 'tinteNaranja' | 'verde';

export interface Session {
  id: string;
  /** ISO yyyy-mm-dd */
  date: string;
  coach: { name: string; initial: string };
  /** Duración prevista que fija el entrenador. */
  minutes: number;
  blocks: Block[];
}

interface BlockBase {
  id: string;
  name: string;
  tint: BlockTint;
  minutes: number;
  /** Trae un ejercicio que el atleta no ha hecho nunca (píldora «?»). */
  isNew?: boolean;
}

/** Un tramo con tiempo. `rest`: 0 = espera manual antes del siguiente; >0 descanso fijo. */
export interface TimedStep {
  exercise?: string;
  label: string;
  seconds: number;
  rest: number;
  /** Mantener (iso) o moverse. */
  hold?: boolean;
}

export interface IntervalBlock extends BlockBase {
  kind: 'interval';
  steps: TimedStep[];
}

export interface TabataBlock extends BlockBase {
  kind: 'tabata';
  work: number;
  rest: number;
  rounds: number;
  /** Cuántos tabatas seguidos. */
  sets: number;
  /** Descanso entre tabatas (s). */
  setRest: number;
  /** A en rondas impares, B en pares. */
  a: { exercise: string; label: string; weight?: number; hold?: boolean };
  b?: { exercise: string; label: string; weight?: number; hold?: boolean };
}

export interface LadderStep {
  reps: number;
  /** kg; null = barra / sin carga. */
  weight: number | null;
}

export interface LadderBlock extends BlockBase {
  kind: 'ladder';
  exercise: { id?: string; label: string };
  steps: LadderStep[];
  /** Después de la escalera: accesorios marcados con ✓. */
  after: { label: string; detail?: string }[];
}

export type Block = IntervalBlock | TabataBlock | LadderBlock;
