import { useSyncExternalStore } from 'react';

import { SAMPLE_SESSION } from '@/data/sampleSession';
import { getSettings, subscribeSettings } from '@/state/settings';
import { Runner } from '@/timer/runner';
import { useRunner } from '@/timer/useTimer';
import { compileSession } from './compile';
import type { Session } from './types';

/** Sesión del día: una sola a la vez, y su temporizador vive fuera de las pantallas. */
export const session: Session = SAMPLE_SESSION;
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
  refreshSessionPlan();
}

export function useSession() {
  return useRunner(sessionRunner);
}

/** Pesos cambiados por el atleta en la escalera (ref → kg). Y su esfuerzo al acabar. */
type Extra = { weights: Record<number, number | null>; rpe: number | null; sent: boolean };
let extra: Extra = { weights: {}, rpe: null, sent: false };
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
export const resetExtra = () => set({ weights: {}, rpe: null, sent: false });
