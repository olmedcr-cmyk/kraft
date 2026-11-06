import { useSyncExternalStore } from 'react';

import { hasBackend } from '@/backend/client';
import { queue } from '@/backend/sync';

import { logClass, unlogClass } from '@/diario/store';
import { cancelClassReminder, scheduleClassReminder } from '@/platform/reminders';
import {
  addDays,
  arrive as arriveM,
  book as bookM,
  cancel as cancelM,
  dayStart,
  joinWaitlist as joinM,
  move as moveM,
  slotsFor,
  type AgendaState,
  type Slot,
} from './model';

/**
 * Reservas del atleta. En modo demo empieza con una de ejemplo (mañana, 09:30).
 * Con servidor empieza vacía y se rellena con lo que llega (replaceAgenda); cada cambio va a la cola.
 */
function seed(): AgendaState {
  if (hasBackend) return { bookings: {} };
  const tomorrow = addDays(dayStart(Date.now()), 1);
  const s = slotsFor(tomorrow, 'grupo')[1] ?? slotsFor(addDays(tomorrow, 1), 'grupo')[1];
  return s ? { bookings: { [s.id]: { slotId: s.id, status: 'confirmed', bookedAt: Date.now() - 2 * 86_400_000 } } } : { bookings: {} };
}

let state: AgendaState = seed();
const subs = new Set<() => void>();
const set = (s: AgendaState) => {
  state = s;
  subs.forEach((f) => f());
};

export function useAgenda() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => {
        subs.delete(f);
      };
    },
    () => state,
    () => state,
  );
}

export const getAgenda = () => state;

/** Lo que dice el servidor (o cambió la lista de clases): las pantallas se vuelven a pintar. */
export const replaceAgenda = (s: AgendaState) => set(s);

export function book(slot: Slot) {
  const r = bookM(state, slot, Date.now());
  if (r.ok) {
    set(r.state);
    scheduleClassReminder(slot);
    queue('book', { slot: slot.id, auto_join: false });
  }
  return r;
}

export function joinWaitlist(slot: Slot, autoJoin: boolean) {
  const r = joinM(state, slot, Date.now(), autoJoin);
  if (r.ok) {
    set(r.state);
    queue('book', { slot: slot.id, auto_join: autoJoin });
  }
  return r;
}

export function setAutoJoin(slot: Slot, autoJoin: boolean) {
  const b = state.bookings[slot.id];
  if (b) {
    set({ bookings: { ...state.bookings, [slot.id]: { ...b, autoJoin } } });
    queue('autojoin', { slot: slot.id, auto: autoJoin });
  }
}

export function cancel(slot: Slot) {
  const r = cancelM(state, slot, Date.now());
  if (r.ok) {
    set(r.state);
    cancelClassReminder(slot.id);
    queue('cancel', { slot: slot.id });
    // Fuera de plazo cuenta como clase: va al diario y se cobra.
    if (r.late) logClass(slot.start, slot.mode, slot.minutes, true);
  }
  return r;
}

export function move(from: Slot, to: Slot) {
  const r = moveM(state, from, to, Date.now());
  if (r.ok) {
    set(r.state);
    cancelClassReminder(from.id);
    scheduleClassReminder(to);
    queue('move', { from: from.id, to: to.id });
  }
  return r;
}

export function arrive(slot: Slot) {
  const r = arriveM(state, slot);
  if (r.ok) {
    set(r.state);
    queue('arrive', { slot: slot.id, on: !!r.state.bookings[slot.id]?.arrived });
    if (r.state.bookings[slot.id]?.arrived) logClass(slot.start, slot.mode, slot.minutes);
    else unlogClass(slot.start);
  }
  return r;
}
