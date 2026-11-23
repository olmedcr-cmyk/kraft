/**
 * Cierre de la sesión (J8Finish). El entreno se apunta en cuanto la marcha acaba, no al tocar ✓ en Hecho:
 * si la app se cierra o el móvil se bloquea en Hecho, queda guardado y se envía al volver a abrirla.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { queueWorkout } from '@/backend/sync';
import { logOwn } from '@/diario/store';
import { compiled, getSessionExtra, session, sessionRunner } from './store';

const KEY = 'kraft.cierre.v1';
const DEFAULT_RPE = 4;

export type Resumen = { minutes: number; tabatas: number; series: number };
type Cierre = Resumen & { v: 1; at: number; sessionId: string; effort: number | null; note?: string };

let current: Cierre | null = null;

/** Minutos, tabatas completos y series hechas de la marcha actual. */
export function resumen(): Resumen {
  const st = sessionRunner.getState();
  const doneUpTo = st.status === 'done' && !st.stopped ? st.plan.length : st.index;
  let series = 0;
  const seenSets = new Set<string>();
  // Desde donde empezó: si se empezó por un bloque, los de antes no se hicieron.
  for (let i = sessionRunner.firstIndex; i < doneUpTo; i++) {
    const p = st.plan[i];
    if (p.ref === undefined || (p.kind !== 'work' && p.kind !== 'reps')) continue;
    const info = compiled.steps[p.ref];
    if (info.blockKind === 'tabata') {
      if (info.round === info.rounds) seenSets.add(`${info.block}-${info.set}`);
    } else series++;
  }
  const ms = (sessionRunner.endedAt ?? Date.now()) - (sessionRunner.startedAt ?? Date.now());
  return { minutes: Math.max(1, Math.round(ms / 60000)), tabatas: seenSets.size, series };
}

/** Esfuerzo y nota tal como están ahora (el esfuerzo solo si se envió al entrenador). */
function fromExtra() {
  const e = getSessionExtra();
  return { effort: e.sent ? (e.rpe ?? DEFAULT_RPE) : null, note: e.notes.join('. ') || undefined };
}

function persist() {
  if (current) AsyncStorage.setItem(KEY, JSON.stringify(current)).catch(() => {});
}

/** Al acabar la marcha: lo apunta en el diario y lo guarda hasta enviarlo. Una sola vez por sesión. */
export function recordFinish(): Resumen | null {
  if (current) return current;
  // Solo una marcha acabada (tras recargar en Hecho, el runner está vacío: no hay nada que apuntar).
  if (sessionRunner.getState().status !== 'done') return null;
  const r = resumen();
  current = { v: 1, ...r, at: Date.now(), sessionId: session.id, ...fromExtra() };
  logOwn(current.at, r.minutes, r.tabatas);
  persist();
  return current;
}

/** Lo apuntado (para pintar Hecho), sin efectos. */
export const finishSummary = (): Resumen => current ?? resumen();

/** Tras «Enviar» o cambiar el esfuerzo en Hecho: guarda el esfuerzo por si la app se cierra antes de tocar ✓. */
export function updateFinish() {
  if (!current) return;
  current = { ...current, ...fromExtra() };
  persist();
}

function send(c: Cierre) {
  queueWorkout({ at: c.at, minutes: c.minutes, tabatas: c.tabatas, sessionId: c.sessionId, effort: c.effort, note: c.note });
}

/** ✓ en Hecho: a la cola del servidor (si lo hay) y se olvida. */
export function sendFinish() {
  if (!current) return;
  send({ ...current, ...fromExtra() });
  current = null;
  AsyncStorage.removeItem(KEY).catch(() => {});
}

/** Al abrir la app: si quedó un entreno sin enviar (se cerró en Hecho), se envía ahora. */
export async function recoverFinish() {
  const raw = await AsyncStorage.getItem(KEY).catch(() => null);
  if (!raw) return;
  AsyncStorage.removeItem(KEY).catch(() => {});
  try {
    const c = JSON.parse(raw) as Cierre;
    if (c?.v === 1 && Number.isFinite(c.at) && Number.isFinite(c.minutes)) send(c);
  } catch {
    // Guardado roto: no hay nada que enviar.
  }
}
