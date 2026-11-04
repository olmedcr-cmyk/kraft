import { COUNTDOWN, type Plan, type Segment } from '@/timer/engine';
import type { Block, Session } from './types';

/** Lo que la pantalla necesita saber de cada tramo, más allá del reloj. */
export interface StepInfo {
  block: number;
  blockKind: Block['kind'];
  label: string;
  exercise?: string;
  hold?: boolean;
  /** Tramo dentro del bloque (0…) y total de tramos del bloque. */
  tramo: number;
  tramos: number;
  // tabata
  set?: number;
  sets?: number;
  round?: number;
  rounds?: number;
  side?: 'A' | 'B';
  weight?: number | null;
  // escalera
  reps?: number;
  ladder?: number;
  after?: number;
  detail?: string;
}

export interface CompiledSession {
  plan: Plan;
  steps: StepInfo[];
  /** Índice del plan donde empieza cada bloque. */
  blockStart: number[];
}

export interface CompileOptions {
  /** Segundos de cuenta atrás; 0 = sin 3·2·1. */
  countdown?: number;
  /** 'auto': sin espera manual entre tramos y bloques; sigue solo con su cuenta atrás. */
  descanso?: 'manual' | 'auto';
}

export function compileSession(session: Session, { countdown = COUNTDOWN, descanso = 'manual' }: CompileOptions = {}): CompiledSession {
  const plan: Plan = [];
  const steps: StepInfo[] = [];
  const blockStart: number[] = [];
  const add = (info: StepInfo) => steps.push(info) - 1;
  const seg = (kind: Segment['kind'], duration: number, round: number, ref: number) => {
    if (kind === 'countdown' && duration <= 0) return;
    if (kind === 'wait' && descanso === 'auto') return;
    plan.push({ kind, duration, round, ref });
  };

  session.blocks.forEach((b, bi) => {
    blockStart.push(plan.length);
    const lastBlock = bi === session.blocks.length - 1;
    let lastRef = -1;

    if (b.kind === 'interval') {
      b.steps.forEach((st, i) => {
        const ref = add({ block: bi, blockKind: 'interval', label: st.label, exercise: st.exercise, hold: st.hold, tramo: i, tramos: b.steps.length });
        seg('countdown', countdown, i + 1, ref);
        seg('work', st.seconds, i + 1, ref);
        if (i < b.steps.length - 1) {
          if (st.rest > 0) seg('rest', st.rest, i + 1, ref);
          else seg('wait', Infinity, i + 1, ref);
        }
        lastRef = ref;
      });
    } else if (b.kind === 'tabata') {
      const total = b.sets * b.rounds;
      for (let s = 0; s < b.sets; s++) {
        let first = true;
        for (let r = 0; r < b.rounds; r++) {
          const side = r % 2 === 1 && b.b ? 'B' : 'A';
          const ex = side === 'B' && b.b ? b.b : b.a;
          const ref = add({
            block: bi,
            blockKind: 'tabata',
            label: ex.label,
            exercise: ex.exercise,
            hold: ex.hold,
            weight: ex.weight ?? null,
            side,
            set: s + 1,
            sets: b.sets,
            round: r + 1,
            rounds: b.rounds,
            tramo: s * b.rounds + r,
            tramos: total,
          });
          if (first) seg('countdown', countdown, r + 1, ref);
          first = false;
          seg('work', b.work, r + 1, ref);
          if (r < b.rounds - 1) seg('rest', b.rest, r + 1, ref);
          else if (s < b.sets - 1) seg('rest', b.setRest, r + 1, ref);
          lastRef = ref;
        }
      }
    } else {
      const n = b.steps.length + b.after.length;
      b.steps.forEach((st, i) => {
        const ref = add({
          block: bi,
          blockKind: 'ladder',
          label: b.exercise.label,
          exercise: b.exercise.id,
          reps: st.reps,
          weight: st.weight,
          ladder: i,
          tramo: i,
          tramos: n,
        });
        seg('reps', Infinity, i + 1, ref);
        lastRef = ref;
      });
      b.after.forEach((a, i) => {
        const ref = add({ block: bi, blockKind: 'ladder', label: a.label, detail: a.detail, after: i, tramo: b.steps.length + i, tramos: n });
        seg('reps', Infinity, b.steps.length + i + 1, ref);
        lastRef = ref;
      });
    }

    // Entre bloques: espera manual («tú decides»).
    if (!lastBlock) seg('wait', Infinity, 1, lastRef);
  });

  return { plan, steps, blockStart };
}

/** Primer paso con tiempo que viene después del índice dado (para «a continuación»). */
export function upcoming(c: CompiledSession, index: number): StepInfo | undefined {
  const cur = c.plan[index]?.ref;
  for (let i = index + 1; i < c.plan.length; i++) {
    const ref = c.plan[i].ref;
    if (ref !== undefined && ref !== cur) return c.steps[ref];
  }
  return undefined;
}

/** Segundos totales previstos de un paso (para «Izquierda · 30"»). */
export function stepSeconds(c: CompiledSession, ref: number): number | undefined {
  const s = c.plan.find((p) => p.ref === ref && p.kind === 'work');
  return s?.duration;
}
