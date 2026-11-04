/**
 * Motor del temporizador de KRAFT.
 *
 * Puro y basado en marcas de tiempo: nunca cuenta ticks, siempre calcula a partir de `now`.
 * Así sobrevive a segundo plano, a pantallas bloqueadas y a ticks perdidos: al volver,
 * `tick(state, now)` se pone al día de golpe.
 *
 * Estados: elegir → 3·2·1 → trabajo → (descanso fijo | espera manual) → 3·2·1 … → hecho.
 * Pausa desde cualquier estado en marcha; parar solo desde pausa (y guarda lo hecho).
 */

/** reps: lo marca el atleta con ✓ (no hay tiempo). */
export type SegmentKind = 'countdown' | 'work' | 'rest' | 'wait' | 'reps';
export type Phase = 'select' | SegmentKind | 'done';

export interface Segment {
  kind: SegmentKind;
  /** Segundos. `Infinity` para la espera manual. */
  duration: number;
  /** Serie o ronda a la que pertenece (empieza en 1). */
  round: number;
  /** Referencia libre al paso de la sesión que lo generó. */
  ref?: number;
}

export type Plan = Segment[];

export interface TimerState {
  plan: Plan;
  status: 'select' | 'running' | 'done';
  index: number;
  /** Instante (ms) en que empezó el tramo actual, ya corregido por pausas. */
  segStart: number;
  pausedAt: number | null;
  /** 3·2·1 de reenganche tras una llamada. */
  leadUntil: number | null;
  /** La pausa actual la puso el sistema (llamada), no el usuario. */
  interrupted: boolean;
  lastPrevAt: number | null;
  stopped: boolean;
  roundsDone: number;
}

export interface Snapshot {
  phase: Phase;
  /** Segundos que quedan del tramo (lo que se pinta en la palma). */
  n: number;
  /** Segundos transcurridos del tramo. */
  elapsed: number;
  /** Duración del tramo en segundos (0 en espera, elegir y hecho). */
  duration: number;
  /** 0 → 1 dentro del tramo. */
  progress: number;
  round: number;
  rounds: number;
  index: number;
  paused: boolean;
  /** Segundos en espera manual. */
  waited: number;
  roundsDone: number;
  stopped: boolean;
  /** Icono del mando central: pausa trabajando, play en espera, ✓ en repeticiones. */
  central: 'pause' | 'play' | 'check';
  /** Tecla izquierda del mando. */
  left: 'prev' | 'stop';
  ref?: number;
}

export const COUNTDOWN = 3;
export const DOUBLE_TAP_MS = 400;
const SEC = 1000;

// ─── Planes ────────────────────────────────────────────────────────────────

export interface IntervalConfig {
  work: number;
  /** 0 = manual (espera hasta que el atleta toca). */
  rest: number;
  rounds: number;
  /** Segundos de cuenta atrás (Tú · Entreno); 0 = sin 3·2·1. */
  countdown?: number;
}

/** Libre por series: 3·2·1 antes de cada serie; descanso fijo o espera manual entre series. */
export function seriesPlan({ work, rest, rounds, countdown = COUNTDOWN }: IntervalConfig): Plan {
  const plan: Plan = [];
  for (let r = 1; r <= rounds; r++) {
    if (countdown > 0) plan.push({ kind: 'countdown', duration: countdown, round: r });
    plan.push({ kind: 'work', duration: work, round: r });
    if (r < rounds) {
      plan.push(rest > 0 ? { kind: 'rest', duration: rest, round: r } : { kind: 'wait', duration: Infinity, round: r });
    }
  }
  return plan;
}

/** Tabata: un solo 3·2·1 y rondas trabajo/descanso seguidas. */
export function tabataPlan({ work, rest, rounds, countdown = COUNTDOWN }: IntervalConfig): Plan {
  const plan: Plan = countdown > 0 ? [{ kind: 'countdown', duration: countdown, round: 1 }] : [];
  for (let r = 1; r <= rounds; r++) {
    plan.push({ kind: 'work', duration: work, round: r });
    if (r < rounds) plan.push({ kind: 'rest', duration: rest, round: r });
  }
  return plan;
}

// ─── Estado ────────────────────────────────────────────────────────────────

export function createTimer(plan: Plan): TimerState {
  return {
    plan,
    status: 'select',
    index: 0,
    segStart: 0,
    pausedAt: null,
    leadUntil: null,
    interrupted: false,
    lastPrevAt: null,
    stopped: false,
    roundsDone: 0,
  };
}

export function start(state: TimerState, now: number): TimerState {
  return { ...createTimer(state.plan), status: 'running', segStart: now };
}

const isManual = (k: SegmentKind) => k === 'wait' || k === 'reps';
const isTramo = (k: SegmentKind) => k === 'work' || k === 'rest' || k === 'reps';

function worksBefore(plan: Plan, index: number) {
  let n = 0;
  for (let i = 0; i < Math.min(index, plan.length); i++) if (plan[i].kind === 'work' || plan[i].kind === 'reps') n++;
  return n;
}

function finish(state: TimerState, stopped: boolean, index = state.index): TimerState {
  return {
    ...state,
    status: 'done',
    index: Math.min(index, state.plan.length),
    pausedAt: null,
    leadUntil: null,
    interrupted: false,
    stopped,
    roundsDone: worksBefore(state.plan, index),
  };
}

function goTo(state: TimerState, index: number, now: number): TimerState {
  if (index >= state.plan.length) return finish(state, false, state.plan.length);
  return {
    ...state,
    index,
    segStart: now,
    leadUntil: null,
    pausedAt: state.pausedAt === null ? null : now,
  };
}

/** Avanza los tramos que hayan vencido hasta `now`. No hace nada en pausa. */
export function tick(state: TimerState, now: number): TimerState {
  if (state.status !== 'running' || state.pausedAt !== null) return state;
  if (state.leadUntil !== null && now < state.leadUntil) return state;

  let { index, segStart } = state;
  const { plan } = state;
  while (index < plan.length) {
    const ms = plan[index].duration * SEC;
    if (now - segStart < ms) break;
    segStart += ms;
    index++;
  }
  if (index >= plan.length) return finish(state, false, plan.length);
  if (index === state.index && segStart === state.segStart && state.leadUntil === null) return state;
  return { ...state, index, segStart, leadUntil: null };
}

export function pauseToggle(state: TimerState, now: number): TimerState {
  const s = tick(state, now);
  if (s.status !== 'running') return s;
  if (s.pausedAt !== null) {
    const frozen = now - s.pausedAt;
    return {
      ...s,
      segStart: s.segStart + frozen,
      leadUntil: s.leadUntil === null ? null : s.leadUntil + frozen,
      pausedAt: null,
      interrupted: false,
    };
  }
  if (isManual(s.plan[s.index].kind)) return s;
  return { ...s, pausedAt: now };
}

/** Mando central: pausa trabajando, play en espera/pausa, otra vez al acabar. */
export function primary(state: TimerState, now: number): TimerState {
  if (state.status === 'select' || state.status === 'done') return start(state, now);
  const s = tick(state, now);
  if (s.status !== 'running') return s;
  if (s.pausedAt === null && isManual(s.plan[s.index].kind)) return goTo(s, s.index + 1, now);
  return pauseToggle(s, now);
}

/** Parar: solo desde pausa. Guarda las series hechas. */
export function stop(state: TimerState, _now: number): TimerState {
  if (state.status !== 'running' || state.pausedAt === null) return state;
  return finish(state, true);
}

/** 1 toque reinicia el tramo; 2 toques en < 400 ms van al tramo anterior. */
export function prev(state: TimerState, now: number): TimerState {
  const s = tick(state, now);
  if (s.status !== 'running' || s.pausedAt !== null) return s;
  const double = s.lastPrevAt !== null && now - s.lastPrevAt < DOUBLE_TAP_MS;
  let index = s.index;
  if (double) {
    for (let i = s.index - 1; i >= 0; i--) {
      if (isTramo(s.plan[i].kind)) {
        index = i;
        break;
      }
    }
  }
  return { ...goTo(s, index, now), lastPrevAt: now };
}

export function next(state: TimerState, now: number): TimerState {
  const s = tick(state, now);
  if (s.status !== 'running') return s;
  return goTo(s, s.index + 1, now);
}

/** Llamada entrante (o cualquier interrupción del sistema): congela. */
export function interrupt(state: TimerState, now: number): TimerState {
  const s = tick(state, now);
  if (s.status !== 'running' || s.pausedAt !== null) return s;
  if (isManual(s.plan[s.index].kind)) return s;
  return { ...s, pausedAt: now, interrupted: true };
}

/** Vuelta de la llamada: 3·2·1 y sigue donde estaba. Si el usuario había pausado, sigue en pausa. */
export function resume(state: TimerState, now: number): TimerState {
  if (state.status !== 'running' || state.pausedAt === null || !state.interrupted) return state;
  const kind = state.plan[state.index].kind;
  if (kind === 'countdown') {
    return { ...state, segStart: now, pausedAt: null, interrupted: false };
  }
  const lead = COUNTDOWN * SEC;
  return {
    ...state,
    segStart: state.segStart + (now - state.pausedAt) + lead,
    leadUntil: now + lead,
    pausedAt: null,
    interrupted: false,
  };
}

// ─── Lectura ───────────────────────────────────────────────────────────────

function totalRounds(plan: Plan) {
  return plan.reduce((m, s) => Math.max(m, s.round), 0);
}

export function snapshot(state: TimerState, now: number): Snapshot {
  const rounds = totalRounds(state.plan);
  const base = {
    rounds,
    index: state.index,
    roundsDone: state.roundsDone,
    stopped: state.stopped,
    waited: 0,
    paused: false,
  };

  if (state.status === 'select') {
    return { ...base, phase: 'select', n: 0, elapsed: 0, duration: 0, progress: 0, round: 1, central: 'play', left: 'prev' };
  }
  if (state.status === 'done') {
    return {
      ...base,
      phase: 'done',
      n: 0,
      elapsed: 0,
      duration: 0,
      progress: 1,
      round: rounds,
      roundsDone: state.roundsDone,
      central: 'play',
      left: 'stop',
    };
  }

  const seg = state.plan[state.index];
  const paused = state.pausedAt !== null;
  const t = paused ? (state.pausedAt as number) : now;
  const left = paused ? 'stop' : 'prev';

  if (state.leadUntil !== null && t < state.leadUntil) {
    const n = Math.ceil((state.leadUntil - t) / SEC);
    return {
      ...base,
      phase: 'countdown',
      n,
      elapsed: COUNTDOWN - n,
      duration: COUNTDOWN,
      progress: 1 - (state.leadUntil - t) / (COUNTDOWN * SEC),
      round: seg.round,
      paused,
      central: paused ? 'play' : 'pause',
      left,
      ref: seg.ref,
      roundsDone: worksBefore(state.plan, state.index),
    };
  }

  const elapsedMs = Math.max(0, t - state.segStart);
  if (seg.kind === 'reps') {
    return {
      ...base,
      phase: 'reps',
      n: 0,
      elapsed: Math.floor(elapsedMs / SEC),
      duration: 0,
      progress: 0,
      round: seg.round,
      central: 'check',
      left,
      ref: seg.ref,
      roundsDone: worksBefore(state.plan, state.index),
    };
  }
  if (seg.kind === 'wait') {
    return {
      ...base,
      phase: 'wait',
      n: 0,
      elapsed: 0,
      duration: 0,
      progress: 1,
      round: seg.round,
      waited: Math.floor(elapsedMs / SEC),
      central: 'play',
      left,
      ref: seg.ref,
      roundsDone: worksBefore(state.plan, state.index),
    };
  }

  const durMs = seg.duration * SEC;
  const n = Math.max(0, Math.ceil((durMs - elapsedMs) / SEC));
  return {
    ...base,
    phase: seg.kind,
    n,
    elapsed: seg.duration - n,
    duration: seg.duration,
    progress: Math.min(1, elapsedMs / durMs),
    round: seg.round,
    paused,
    central: paused ? 'play' : 'pause',
    left,
    ref: seg.ref,
    roundsDone: worksBefore(state.plan, state.index),
  };
}

// ─── Señales (sonido y vibración) ──────────────────────────────────────────

/**
 * count  → pitido corto + vibración corta (cada número del 3·2·1)
 * start  → pitido largo + vibración larga (empieza tramo de trabajo o descanso)
 * end    → pitido largo + vibración larga (acaba tramo y queda en espera)
 * finish → pitido largo + vibración doble (hecho)
 */
export type Cue = 'count' | 'start' | 'end' | 'finish';

export function cues(prev: Snapshot, next: Snapshot): Cue[] {
  if (next.paused) return [];
  const out: Cue[] = [];
  const moved = prev.phase !== next.phase || prev.index !== next.index;
  // Pitido corto solo en el 3·2·1, aunque la cuenta atrás sea más larga.
  if (next.phase === 'countdown' && next.n <= COUNTDOWN && (moved || prev.n !== next.n)) out.push('count');
  if ((next.phase === 'work' || next.phase === 'rest') && moved) out.push('start');
  if (next.phase === 'wait' && moved) out.push('end');
  if (next.phase === 'done' && prev.phase !== 'done' && !next.stopped) out.push('finish');
  return out;
}
