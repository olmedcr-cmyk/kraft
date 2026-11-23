/**
 * Lo que se lee del servidor: clases, reservas, diario, pagos y la sesión del día.
 * Se guarda en el dispositivo para arrancar sin red con lo último que llegó.
 *
 * Mientras haya cambios tuyos sin enviar no se pisa lo que ves: se vuelve a leer al vaciarse la cola.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { dayStart, isoDay, setSlotSource, type Mode, type Slot } from '@/agenda/model';
import { getAgenda, replaceAgenda } from '@/agenda/store';
import { replaceDiary } from '@/diario/store';
import { validateSession } from '@/session/validate';
import { setTodaySession } from '@/session/store';
import { updateSettings, getSettings } from '@/state/settings';
import { getAuthSession } from './auth';
import { backend } from './client';
import { toAgenda, toDiary, toSlot, type AvailabilityRow, type BookingRow, type PaymentRow, type SlotRow, type WorkoutRow } from './mappers';
import { isNetworkError, isOnline, onOnline, setOnline } from './red';
import { onDrained, pendingCount } from './sync';
import { noteSession } from '@/session/vista';

const KEY = 'kraft.server.v1';

/**
 * Cómo va la carga, para no enseñar «Cerrado» o un círculo vacío cuando en realidad no ha llegado nada:
 * loading (primera vez), ok (hay datos, del servidor o guardados), offline (sin red y sin nada guardado),
 * error (el servidor dijo que no). `coach`: si el servidor te tiene con un entrenador.
 */
export type DataStatus = { state: 'loading' | 'ok' | 'offline' | 'error'; coach: boolean };
// Sin servidor (modo demo) todo está ya en el móvil.
let status: DataStatus = { state: backend ? 'loading' : 'ok', coach: true };
/** Volver a intentarlo (botón «Reintentar»). */
export const retryData = () => {
  if (status.state !== 'ok') setStatus({ state: 'loading' });
  return pull();
};
const statusSubs = new Set<() => void>();
function setStatus(s: Partial<DataStatus>) {
  status = { ...status, ...s };
  statusSubs.forEach((f) => f());
}
export const useDataStatus = () =>
  useSyncExternalStore(
    (f) => {
      statusSubs.add(f);
      return () => {
        statusSubs.delete(f);
      };
    },
    () => status,
    () => status,
  );
const DAY = 86_400_000;
/** Clases que se traen: de ayer a dentro de 2 semanas. Historial para el diario: 13 meses. */
const AHEAD_DAYS = 15;
const HISTORY_DAYS = 400;

export interface Snapshot {
  at: number;
  coach: { name: string } | null;
  slots: SlotRow[];
  availability: AvailabilityRow[];
  bookings: BookingRow[];
  workouts: WorkoutRow[];
  payments: PaymentRow[];
  /** Sesión de hoy (la propia gana a la de grupo) y su día. */
  session: Record<string, unknown> | null;
}

let slots = new Map<string, Slot>();

function apply(snap: Snapshot) {
  const mine = new Map(snap.bookings.filter((b) => b.status === 'confirmed' || b.status === 'waitlist').map((b) => [b.slot_id, b]));
  const avail = new Map(snap.availability.map((a) => [a.slot_id, a]));
  slots = new Map(snap.slots.map((r) => [r.id, toSlot(r, avail.get(r.id), mine.get(r.id))]));
  setSlotSource({
    slotsFor: (day: number, mode: Mode) =>
      [...slots.values()].filter((s) => s.mode === mode && dayStart(s.start) === dayStart(day)).sort((a, b) => a.start - b.start),
    getSlot: (id: string) => slots.get(id),
  });

  // Lo tuyo sin enviar manda sobre lo que dice el servidor hasta que salga.
  if (pendingCount() === 0) {
    replaceAgenda(toAgenda(snap.bookings));
    replaceDiary(toDiary(snap.bookings, snap.workouts, snap.payments));
  } else {
    // Las clases sí cambian: que la agenda se vuelva a pintar con ellas.
    replaceAgenda({ ...getAgenda() });
  }

  const coachName = snap.coach?.name ?? getSettings().coach?.name ?? 'Tu entrenador';
  const coach = { name: coachName, initial: coachName[0].toUpperCase() };
  const row = snap.session;
  const today = isoDay(Date.now());
  const v = row && row.day === today ? validateSession(row, coach) : null;
  // Una sesión que no pasa la validación se trata como «sin sesión»: mejor eso que romperse a mitad.
  setTodaySession(v && v.ok ? v.session : null, coach);
  if (v && v.ok) noteSession(v.session);
}

async function fetchSnapshot(): Promise<Snapshot | null> {
  if (!backend || !getAuthSession()) return null;
  const now = Date.now();
  const from = new Date(dayStart(now) - DAY).toISOString();
  const to = new Date(dayStart(now) + AHEAD_DAYS * DAY).toISOString();
  const since = new Date(now - HISTORY_DAYS * DAY);
  const today = isoDay(now);

  const [coach, sl, av, bk, wk, py, ses] = await Promise.all([
    backend.from('my_coach').select('name').maybeSingle(),
    backend.from('slots').select('id, mode, starts_at, minutes, name, room, floor, directions, capacity, bring').gte('starts_at', from).lt('starts_at', to).order('starts_at'),
    backend.from('slot_availability').select('slot_id, taken, queue'),
    backend.from('bookings').select('id, slot_id, status, position, auto_join, arrived_at, booked_at, slots(mode, starts_at, minutes)').gte('booked_at', since.toISOString()),
    backend.from('workouts').select('day, minutes, tabatas').gte('day', isoDay(since.getTime())),
    backend.from('payments').select('month, amount_cents, method, paid_at, receipt_sent_at'),
    backend.from('sessions').select('id, day, minutes, schema_version, body, athlete_id').eq('day', today).order('athlete_id', { ascending: true, nullsFirst: false }).limit(1),
  ]);
  const err = [coach, sl, av, bk, wk, py, ses].find((r) => r.error)?.error;
  if (err) throw err;
  return {
    at: now,
    coach: (coach.data as { name: string } | null) ?? null,
    slots: (sl.data ?? []) as SlotRow[],
    availability: (av.data ?? []) as AvailabilityRow[],
    bookings: (bk.data ?? []) as unknown as BookingRow[],
    workouts: (wk.data ?? []) as WorkoutRow[],
    payments: (py.data ?? []) as PaymentRow[],
    session: ((ses.data ?? [])[0] as Record<string, unknown>) ?? null,
  };
}

let pulling: Promise<void> | null = null;

/** Lee todo del servidor y lo aplica. Sin red, se queda con lo último guardado. */
export function pull(): Promise<void> {
  if (pulling) return pulling;
  pulling = (async () => {
    try {
      const snap = await fetchSnapshot();
      if (!snap) return;
      setOnline(true);
      apply(snap);
      setStatus({ state: 'ok', coach: !!snap.coach });
      // El nombre del entrenador también en los ajustes (lo usan Tú y legal).
      if (snap.coach && getSettings().coach?.name !== snap.coach.name) {
        const c = getSettings().coach;
        if (c) updateSettings({ coach: { ...c, name: snap.coach.name } });
      }
      await AsyncStorage.setItem(KEY, JSON.stringify(snap)).catch(() => {});
    } catch (e) {
      // Sin red o servidor caído: se sigue con lo que hay (y si no hay nada, se dice).
      const net = isNetworkError(e);
      if (net) setOnline(false);
      if (status.state !== 'ok') setStatus({ state: net ? 'offline' : 'error' });
    } finally {
      pulling = null;
    }
  })();
  return pulling;
}

let started = false;

/** Arranca: primero lo guardado (al instante, sin red), luego el servidor. */
export async function startData() {
  if (!backend || started) return;
  started = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const snap = JSON.parse(raw) as Snapshot;
      apply(snap);
      setStatus({ state: 'ok', coach: !!snap.coach });
    }
  } catch {
    // Caché rota: se ignora.
  }
  onDrained(pull);
  onOnline(pull);
  // Sin red y sin nada que enviar, nadie más lo intentaría: se prueba cada 20 s.
  setInterval(() => {
    if (!isOnline()) pull();
  }, 20_000);
  AppState.addEventListener('change', (s) => s === 'active' && pull());
  backend.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') pull();
    if (event === 'SIGNED_OUT') AsyncStorage.removeItem(KEY).catch(() => {});
  });
  pull();
}
