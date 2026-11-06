import { useSyncExternalStore } from 'react';

import { hasBackend } from '@/backend/client';
import { SAMPLE_SESSION } from '@/data/sampleSession';
import { getSettings, subscribeSettings } from '@/state/settings';
import { Runner } from '@/timer/runner';
import { useRunner } from '@/timer/useTimer';
import { compileSession } from './compile';
import type { Session } from './types';

/**
 * Sesión del día: una sola a la vez, y su temporizador vive fuera de las pantallas.
 * En modo demo es la de ejemplo; con servidor llega de Supabase (setTodaySession).
 */
export let session: Session = SAMPLE_SESSION;

/** ¿Hay sesión hoy? `loading` solo la primera vez con servidor, antes de la caché o la red. */
export type TodayStatus = 'loading' | 'ready' | 'none';
let today: TodayStatus = hasBackend ? 'loading' : 'ready';
/** Llegó otra sesión con la de ahora en marcha: se cambia al acabar (resetSession). */
let pending: { s: Session | null; coach: Session['coach'] } | null = null;
/** La de hoy, para volver a ella tras retomar una sesión de otro día (KC3). */
let todays: { s: Session | null; coach: Session['coach'] } | null = null;
const todaySubs = new Set<() => void>();
const options = () => {
  const s = getSettings();
  return { countdown: s.cuentaAtras, descanso: s.descanso };
};
let compiledWith = JSON.stringify(options());
export const compiled = compileSession(session, options());
export const sessionRunner = new Runner(compiled.plan);

/**
 * Cuenta atrás y descanso (Tú · Entreno) cambian el plan. Solo se rehace sin la sesión en marcha;
 * si cambia a mitad, se aplica al volver a empezar (`resetSession`).
 */
export function refreshSessionPlan() {
  const o = options();
  const key = JSON.stringify(o);
  if (key === compiledWith || sessionRunner.getState().status !== 'select') return;
  compiledWith = key;
  Object.assign(compiled, compileSession(session, o));
  sessionRunner.setPlan(compiled.plan);
}
subscribeSettings(refreshSessionPlan);

export function resetSession() {
  sessionRunner.reset();
  const back = pending ?? todays;
  pending = null;
  if (back) setTodaySession(back.s, back.coach);
  refreshSessionPlan();
}

/** La sesión de hoy (o ninguna). Con una en marcha no se toca: se aplica al acabar. */
export function setTodaySession(s: Session | null, coach: Session['coach']) {
  todays = { s, coach };
  if (sessionRunner.getState().status !== 'select') {
    pending = { s, coach };
    return;
  }
  const same = s && today === 'ready' && JSON.stringify(s) === JSON.stringify(session);
  if (!same) {
    session = s ?? { ...session, coach };
    if (s) {
      Object.assign(compiled, compileSession(s, options()));
      compiledWith = JSON.stringify(options());
      sessionRunner.setPlan(compiled.plan);
    }
  }
  today = s ? 'ready' : 'none';
  todaySubs.forEach((f) => f());
}

export const getTodayStatus = () => today;

/** Poner una sesión concreta (la que quedó a medias) sin tocar la de hoy guardada. */
export function useSessionForResume(s: Session) {
  sessionRunner.reset();
  session = s;
  Object.assign(compiled, compileSession(s, options()));
  compiledWith = JSON.stringify(options());
  sessionRunner.setPlan(compiled.plan);
  today = 'ready';
  todaySubs.forEach((f) => f());
}
export function useToday() {
  return useSyncExternalStore(
    (f) => {
      todaySubs.add(f);
      return () => {
        todaySubs.delete(f);
      };
    },
    () => today,
    () => today,
  );
}

export function useSession() {
  return useRunner(sessionRunner);
}

/** Pesos cambiados por el atleta en la escalera (ref → kg). Y su esfuerzo al acabar. */
/** `notes`: cambios que el entrenador verá en la nota (peso distinto, orden cambiado: KC8). */
type Extra = { weights: Record<number, number | null>; rpe: number | null; sent: boolean; notes: string[] };
let extra: Extra = { weights: {}, rpe: null, sent: false, notes: [] };
const subs = new Set<() => void>();
const set = (e: Partial<Extra>) => {
  extra = { ...extra, ...e };
  subs.forEach((f) => f());
};

export function useSessionExtra() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => {
        subs.delete(f);
      };
    },
    () => extra,
    () => extra,
  );
}

export const setWeight = (ref: number, kg: number | null) => set({ weights: { ...extra.weights, [ref]: kg } });
export const setRpe = (rpe: number) => set({ rpe, sent: false });
export const markSent = () => set({ sent: true });
export const addNote = (n: string) => set({ notes: [...extra.notes.filter((x) => x !== n), n] });
export const resetExtra = () => set({ weights: {}, rpe: null, sent: false, notes: [] });
