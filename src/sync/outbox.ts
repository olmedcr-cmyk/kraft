/**
 * Cola de envíos (sin red primero). Lo que haces se apunta aquí y se manda cuando hay red.
 * Lógica pura: el tiempo llega de fuera y el envío es una función que se pasa.
 *
 * - En orden: si el primero no puede salir aún, espera todo lo de detrás (reservar y luego cancelar).
 * - Cada trabajo lleva su `id` (el `client_id` del servidor): reenviarlo no duplica.
 * - Fallo de red o del servidor → reintento con espera creciente (2 s, 4 s… hasta 5 min).
 * - El servidor dice que no (regla de negocio) → sale de la cola y queda en `failed` para avisar.
 */

export type JobKind = 'workout' | 'profile' | 'book' | 'autojoin' | 'cancel' | 'move' | 'arrive' | 'pay' | 'deletion' | 'unlink';

export interface Job {
  id: string;
  kind: JobKind;
  payload: Record<string, unknown>;
  tries: number;
  nextAt: number;
  error?: string;
}

export interface Outbox {
  jobs: Job[];
  failed: Job[];
}

export const EMPTY: Outbox = { jobs: [], failed: [] };
export const BASE_DELAY = 2_000;
export const MAX_DELAY = 5 * 60_000;
/** Lo rechazado se guarda para avisar, pero no para siempre. */
export const MAX_FAILED = 20;

export type SendResult = 'ok' | 'retry' | { reject: string };

/** Apunta un trabajo. El perfil se fusiona con el que aún no ha salido (solo cuenta el último valor). */
export function enqueue(o: Outbox, job: { id: string; kind: JobKind; payload: Record<string, unknown> }, now: number): Outbox {
  if (o.jobs.some((j) => j.id === job.id)) return o;
  if (job.kind === 'profile') {
    const i = o.jobs.findIndex((j) => j.kind === 'profile');
    if (i >= 0) {
      const merged = { ...o.jobs[i], payload: { ...o.jobs[i].payload, ...job.payload } };
      return { ...o, jobs: o.jobs.map((j, k) => (k === i ? merged : j)) };
    }
  }
  return { ...o, jobs: [...o.jobs, { ...job, tries: 0, nextAt: now }] };
}

/** El siguiente que toca, si ya puede salir. */
export const due = (o: Outbox, now: number): Job | undefined => (o.jobs[0] && o.jobs[0].nextAt <= now ? o.jobs[0] : undefined);

export const delayFor = (tries: number) => Math.min(MAX_DELAY, BASE_DELAY * 2 ** Math.max(0, tries - 1));

export function apply(o: Outbox, id: string, result: SendResult, now: number): Outbox {
  const job = o.jobs.find((j) => j.id === id);
  if (!job) return o;
  const rest = o.jobs.filter((j) => j.id !== id);
  if (result === 'ok') return { ...o, jobs: rest };
  if (result === 'retry') {
    const tries = job.tries + 1;
    return { ...o, jobs: o.jobs.map((j) => (j.id === id ? { ...j, tries, nextAt: now + delayFor(tries) } : j)) };
  }
  return { jobs: rest, failed: [...o.failed, { ...job, error: result.reject }].slice(-MAX_FAILED) };
}

/** El atleta ya vio el aviso de un trabajo rechazado. */
export const dismissFailed = (o: Outbox, id: string): Outbox => ({ ...o, failed: o.failed.filter((j) => j.id !== id) });

/** Manda todo lo que pueda salir ya, en orden. Para en el primer reintento. */
export async function flush(o: Outbox, send: (job: Job) => Promise<SendResult>, now: () => number): Promise<Outbox> {
  let cur = o;
  for (let job = due(cur, now()); job; job = due(cur, now())) {
    let r: SendResult;
    try {
      r = await send(job);
    } catch {
      r = 'retry';
    }
    cur = apply(cur, job.id, r, now());
    if (r === 'retry') break;
  }
  return cur;
}

/** Lo guardado puede venir de otra versión: se queda solo lo que tiene forma de trabajo. */
export function restoreOutbox(raw: unknown): Outbox {
  if (!raw || typeof raw !== 'object') return EMPTY;
  const r = raw as Partial<Outbox>;
  const ok = (j: unknown): j is Job =>
    !!j && typeof j === 'object' && typeof (j as Job).id === 'string' && typeof (j as Job).kind === 'string' && typeof (j as Job).nextAt === 'number';
  return { jobs: Array.isArray(r.jobs) ? r.jobs.filter(ok) : [], failed: Array.isArray(r.failed) ? r.failed.filter(ok) : [] };
}
