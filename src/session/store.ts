import { useSyncExternalStore } from 'react';

import { SAMPLE_SESSION } from '@/data/sampleSession';
import { Runner } from '@/timer/runner';
import { useRunner } from '@/timer/useTimer';
import { compileSession } from './compile';
import type { Session } from './types';

/** Sesión del día: una sola a la vez, y su temporizador vive fuera de las pantallas. */
export const session: Session = SAMPLE_SESSION;
export const compiled = compileSession(session);
export const sessionRunner = new Runner(compiled.plan);

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
