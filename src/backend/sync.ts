/**
 * Sincronización: la cola de envíos (src/sync/outbox.ts) guardada en el dispositivo y conectada a Supabase.
 * Lo que haces se apunta al momento; sale cuando hay red y sesión. Sin servidor, no se apunta nada.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

import type { Settings } from '@/alta/model';
import { EMPTY, dismissFailed, due, enqueue, flush, restoreOutbox, type Job, type JobKind, type Outbox, type SendResult } from '@/sync/outbox';
import { getSettings, subscribeSettings } from '@/state/settings';
import { useSyncExternalStore } from 'react';

import { getAuthSession } from './auth';
import { isNetworkError, onOnline, setOnline } from './red';
import { backend } from './client';

const KEY = 'kraft.outbox.v1';
let box: Outbox = EMPTY;
let loaded = false;
let running = false;
let timer: ReturnType<typeof setTimeout> | null = null;

/** Identificador único para el servidor (`client_id`): reenviar no duplica. */
export function newId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  // Respaldo (RFC 4122 v4) para motores sin crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const boxSubs = new Set<() => void>();
const save = () => {
  boxSubs.forEach((f) => f());
  return AsyncStorage.setItem(KEY, JSON.stringify(box)).catch(() => {});
};

/** Lo que queda por enviar (para «sale al volver», KC4). */
export const usePending = () =>
  useSyncExternalStore(
    (f) => {
      boxSubs.add(f);
      return () => {
        boxSubs.delete(f);
      };
    },
    () => box.jobs,
    () => box.jobs,
  );

/** Errores de regla de negocio o de permiso: el servidor dice que no, no sirve reintentar. */
const REJECT = /^(P0001|P0002|22|23|42501|PGRST1)/;

async function send(job: Job): Promise<SendResult> {
  if (!backend) return { reject: 'sin servidor' };
  const me = getAuthSession()?.user.id;
  if (!me) return 'retry';
  const p = job.payload;
  let res: { error: { code?: string; message: string } | null };
  switch (job.kind) {
    case 'profile':
      res = await backend.from('profiles').update(p).eq('id', me);
      break;
    case 'workout':
      res = await backend.from('workouts').upsert({ ...p, client_id: job.id }, { onConflict: 'athlete_id,client_id', ignoreDuplicates: true });
      break;
    case 'deletion':
      res = await backend.rpc(p.on ? 'request_deletion' : 'cancel_deletion');
      break;
    // Reservas: por clase (la reserva puede haberse hecho sin red y aún no tener id en el servidor).
    case 'book':
      res = await backend.rpc('book_slot', { p_slot: p.slot, p_auto_join: p.auto_join });
      break;
    case 'autojoin':
      res = await backend.rpc('set_auto_join', { p_slot: p.slot, p_auto: p.auto });
      break;
    case 'cancel':
      res = await backend.rpc('cancel_slot', { p_slot: p.slot });
      break;
    case 'move':
      res = await backend.rpc('move_slot', { p_from: p.from, p_to: p.to });
      break;
    case 'arrive':
      res = await backend.rpc('arrive_slot', { p_slot: p.slot, p_arrived: p.on });
      break;
    case 'pay':
      res = await backend.rpc('simulate_payment', { p_month: p.month, p_method: p.method });
      break;
    case 'unlink':
      res = await backend.rpc('unlink_coach');
      break;
    default:
      return { reject: `tipo ${job.kind} aún no se envía` };
  }
  if (!res.error) {
    setOnline(true);
    return 'ok';
  }
  if (isNetworkError(res.error)) {
    setOnline(false);
    return 'retry';
  }
  setOnline(true);
  return REJECT.test(res.error.code ?? '') ? { reject: res.error.message } : 'retry';
}

/** Al quedar la cola vacía (todo enviado): quien lo necesite vuelve a leer del servidor. */
const drained = new Set<() => void>();
export const onDrained = (f: () => void) => {
  drained.add(f);
  return () => drained.delete(f);
};

/** Manda lo pendiente; si queda algo, vuelve a probar cuando toque. */
export async function syncNow() {
  if (!backend || !loaded || running) return;
  running = true;
  if (timer) clearTimeout(timer);
  const had = box.jobs.length;
  try {
    box = await flush(box, send, Date.now);
    await save();
  } finally {
    running = false;
  }
  const next = box.jobs[0];
  if (next) timer = setTimeout(syncNow, Math.max(1000, next.nextAt - Date.now()));
  else if (had > 0) drained.forEach((f) => f());
}

export function queue(kind: JobKind, payload: Record<string, unknown>, id = newId()) {
  if (!backend) return;
  box = enqueue(box, { id, kind, payload }, Date.now());
  save();
  if (due(box, Date.now())) syncNow();
}

/** Dejar de entrenar con tu entrenador: deja de ver tus entrenos (también si lo haces sin red). */
export const queueUnlink = () => queue('unlink', {});

export const pendingCount = () => box.jobs.length;
export const failedJobs = () => box.failed;

/** Lo que el servidor rechazó y aún no has visto (para avisar). */
export const useRejected = () =>
  useSyncExternalStore(
    (f) => {
      boxSubs.add(f);
      return () => {
        boxSubs.delete(f);
      };
    },
    () => box.failed,
    () => box.failed,
  );

export function dismissRejected(id: string) {
  box = dismissFailed(box, id);
  save();
}

// ─── Qué se manda ───────────────────────────────────────────────────────────

/** Ajustes que viven en el servidor (el resto se queda en el móvil). */
export function profilePatch(prev: Settings, next: Settings): Record<string, unknown> | null {
  const out: Record<string, unknown> = {};
  if (prev.nombre !== next.nombre) out.name = next.nombre;
  if (prev.acceptedAt !== next.acceptedAt && next.acceptedAt) out.accepted_at = new Date(next.acceptedAt).toISOString();
  if (prev.compartir !== next.compartir) out.share_effort = next.compartir;
  if (prev.analitica !== next.analitica) out.analytics = next.analitica;
  if (prev.emails !== next.emails) out.emails = next.emails;
  if (prev.salud !== next.salud) out.health = next.salud;
  return Object.keys(out).length ? out : null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Un entreno terminado (sesión o tiempo libre). El esfuerzo solo va si el atleta lo envió. */
export function queueWorkout(w: { at: number; minutes: number; tabatas: number; sessionId?: string; effort?: number | null; note?: string }) {
  const d = new Date(w.at);
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  queue('workout', {
    day,
    minutes: w.minutes,
    tabatas: w.tabatas,
    session_id: w.sessionId && UUID.test(w.sessionId) ? w.sessionId : null,
    effort: w.effort ?? null,
    note: w.note ?? null,
  });
}

/** Arranca: carga la cola guardada, sigue los ajustes y reintenta al volver a la app. */
export async function startSync() {
  if (!backend || loaded) return;
  try {
    box = restoreOutbox(JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null'));
  } catch {
    box = EMPTY;
  }
  loaded = true;

  let prev = getSettings();
  subscribeSettings(() => {
    const next = getSettings();
    const patch = profilePatch(prev, next);
    if (next.borradoPedido !== prev.borradoPedido) queue('deletion', { on: !!next.borradoPedido });
    prev = next;
    if (patch) queue('profile', patch);
  });

  AppState.addEventListener('change', (s) => s === 'active' && syncNow());
  onOnline(syncNow);
  backend.auth.onAuthStateChange((event, s) => {
    // Al salir, lo pendiente no puede mandarse luego con la cuenta de otra persona.
    if (event === 'SIGNED_OUT') {
      box = EMPTY;
      save();
      return;
    }
    if (s) syncNow();
  });
  syncNow();
}
