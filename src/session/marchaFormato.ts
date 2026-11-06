/** Formato guardado de una sesión a medias (KC3). Lógica pura. */
import type { TimerState } from '@/timer/engine';
import type { Session } from './types';

export interface Unfinished {
  v: 1;
  savedAt: number;
  startedAt: number | null;
  session: Session;
  state: TimerState;
}

/** JSON no guarda Infinity (duración de las repeticiones): se escribe como texto y se recupera. */
const INF = '∞';
export const encode = (u: Unfinished) => JSON.stringify(u, (_k, v) => (v === Infinity ? INF : v));
export function decode(raw: string | null): Unfinished | null {
  if (!raw) return null;
  try {
    const u = JSON.parse(raw, (_k, v) => (v === INF ? Infinity : v)) as Unfinished;
    if (u?.v !== 1 || u.state?.status !== 'running' || !Array.isArray(u.state.plan) || !u.session?.blocks) return null;
    return u;
  } catch {
    return null;
  }
}

